from pathlib import Path

sql = r"""-- =========================================================
-- MODULE ĐÀO TẠO TRỰC TUYẾN / AI CHUYỂN QUY TRÌNH THÀNH BÀI GIẢNG
-- Supabase PostgreSQL
-- Gồm 9 bảng:
-- 1. training_courses
-- 2. training_materials
-- 3. training_lessons
-- 4. training_questions
-- 5. training_practice_checklists
-- 6. training_assignments
-- 7. training_learning_progress
-- 8. training_test_attempts
-- 9. training_test_answers
-- =========================================================


-- =========================================================
-- 0. EXTENSION CẦN THIẾT
-- =========================================================

create extension if not exists pgcrypto;


-- =========================================================
-- 1. BẢNG KHÓA HỌC
-- =========================================================

create table if not exists public.training_courses (
  id uuid default gen_random_uuid() primary key,

  title text not null,
  code text,
  description text,

  document_type text default 'quy_trinh',
  target_learners text,

  pass_score numeric default 80,
  max_attempts int default 3,
  duration_minutes int default 15,

  status text default 'draft',

  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.training_courses is 'Danh sách khóa học/chuyên đề đào tạo trực tuyến';
comment on column public.training_courses.status is 'draft, published, closed';


-- =========================================================
-- 2. BẢNG TÀI LIỆU GỐC UPLOAD
-- =========================================================

create table if not exists public.training_materials (
  id uuid default gen_random_uuid() primary key,

  course_id uuid references public.training_courses(id) on delete cascade,

  title text not null,
  file_name text,
  file_type text,

  file_url text,
  storage_path text,

  extracted_text text,
  convert_status text default 'not_converted',
  ai_raw_json jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.training_materials is 'Tài liệu gốc upload: Word, PDF, PowerPoint';
comment on column public.training_materials.convert_status is 'not_converted, uploaded, uploaded_no_text, converting, converted, error';


-- =========================================================
-- 3. BẢNG SECTION / BÀI HỌC ĐIỆN TỬ
-- =========================================================

create table if not exists public.training_lessons (
  id uuid default gen_random_uuid() primary key,

  course_id uuid references public.training_courses(id) on delete cascade,
  material_id uuid references public.training_materials(id) on delete cascade,

  lesson_order int default 1,
  title text not null,

  objective text,

  content_html text,
  content_text text,

  ai_summary text,
  ai_key_points jsonb default '[]'::jsonb,
  ai_memory_points jsonb default '[]'::jsonb,
  ai_warning_points jsonb default '[]'::jsonb,
  ai_practice_scenario text,

  estimated_minutes int default 5,
  is_required boolean default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.training_lessons is 'Các section/bài học điện tử được AI tách từ tài liệu gốc';


-- =========================================================
-- 4. BẢNG NGÂN HÀNG CÂU HỎI
-- =========================================================

create table if not exists public.training_questions (
  id uuid default gen_random_uuid() primary key,

  course_id uuid references public.training_courses(id) on delete cascade,
  lesson_id uuid references public.training_lessons(id) on delete set null,

  question_text text not null,

  option_a text,
  option_b text,
  option_c text,
  option_d text,

  correct_answer text not null,
  explanation text,

  difficulty text default 'medium',
  source text default 'manual',

  created_at timestamptz default now()
);

comment on table public.training_questions is 'Ngân hàng câu hỏi trắc nghiệm theo khóa học/section';
comment on column public.training_questions.source is 'manual, import_excel, ai_quick_quiz, ai_final_test';


-- =========================================================
-- 5. BẢNG CHECKLIST THỰC HÀNH / GIÁM SÁT
-- =========================================================

create table if not exists public.training_practice_checklists (
  id uuid default gen_random_uuid() primary key,

  course_id uuid references public.training_courses(id) on delete cascade,
  material_id uuid references public.training_materials(id) on delete cascade,

  item_order int default 1,
  item_text text not null,
  standard text,

  answer_type text default 'dat_khong_dat_khong_ap_dung',

  created_at timestamptz default now()
);

comment on table public.training_practice_checklists is 'Checklist thực hành/bảng kiểm giám sát được tách từ phụ lục tài liệu';


-- =========================================================
-- 6. BẢNG GÁN NGƯỜI HỌC
-- =========================================================

create table if not exists public.training_assignments (
  id uuid default gen_random_uuid() primary key,

  course_id uuid references public.training_courses(id) on delete cascade,

  user_id uuid not null,
  assigned_by uuid,

  due_date date,
  status text default 'assigned',

  created_at timestamptz default now(),

  unique(course_id, user_id)
);

comment on table public.training_assignments is 'Gán khóa học cho người học';
comment on column public.training_assignments.status is 'assigned, in_progress, completed, overdue';


-- =========================================================
-- 7. BẢNG LỊCH SỬ HỌC
-- =========================================================

create table if not exists public.training_learning_progress (
  id uuid default gen_random_uuid() primary key,

  course_id uuid references public.training_courses(id) on delete cascade,
  lesson_id uuid references public.training_lessons(id) on delete cascade,

  user_id uuid not null,

  started_at timestamptz,
  completed_at timestamptz,

  total_seconds int default 0,
  is_completed boolean default false,

  created_at timestamptz default now(),

  unique(course_id, lesson_id, user_id)
);

comment on table public.training_learning_progress is 'Lịch sử học từng section/bài học của người học';


-- =========================================================
-- 8. BẢNG PHIÊN LÀM BÀI KIỂM TRA
-- =========================================================

create table if not exists public.training_test_attempts (
  id uuid default gen_random_uuid() primary key,

  course_id uuid references public.training_courses(id) on delete cascade,

  user_id uuid not null,

  started_at timestamptz default now(),
  submitted_at timestamptz,

  total_questions int default 0,
  correct_count int default 0,

  score numeric default 0,
  result text,

  duration_seconds int default 0,
  status text default 'in_progress',

  created_at timestamptz default now()
);

comment on table public.training_test_attempts is 'Mỗi lần người học làm bài kiểm tra sau học';
comment on column public.training_test_attempts.result is 'passed, failed';
comment on column public.training_test_attempts.status is 'in_progress, submitted, expired';


-- =========================================================
-- 9. BẢNG CHI TIẾT CÂU TRẢ LỜI
-- =========================================================

create table if not exists public.training_test_answers (
  id uuid default gen_random_uuid() primary key,

  attempt_id uuid references public.training_test_attempts(id) on delete cascade,
  question_id uuid references public.training_questions(id) on delete cascade,

  selected_answer text,
  is_correct boolean,

  created_at timestamptz default now()
);

comment on table public.training_test_answers is 'Chi tiết đáp án từng câu trong một phiên làm bài';


-- =========================================================
-- 10. INDEX TỐI ƯU TRUY VẤN
-- =========================================================

create index if not exists idx_training_materials_course_id
on public.training_materials(course_id);

create index if not exists idx_training_lessons_course_id
on public.training_lessons(course_id);

create index if not exists idx_training_lessons_material_id
on public.training_lessons(material_id);

create index if not exists idx_training_questions_course_id
on public.training_questions(course_id);

create index if not exists idx_training_questions_lesson_id
on public.training_questions(lesson_id);

create index if not exists idx_training_practice_checklists_course_id
on public.training_practice_checklists(course_id);

create index if not exists idx_training_assignments_course_id
on public.training_assignments(course_id);

create index if not exists idx_training_assignments_user_id
on public.training_assignments(user_id);

create index if not exists idx_training_learning_progress_course_user
on public.training_learning_progress(course_id, user_id);

create index if not exists idx_training_test_attempts_course_user
on public.training_test_attempts(course_id, user_id);

create index if not exists idx_training_test_answers_attempt_id
on public.training_test_answers(attempt_id);


-- =========================================================
-- 11. TRIGGER TỰ CẬP NHẬT updated_at
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_training_courses_updated_at on public.training_courses;
create trigger trg_training_courses_updated_at
before update on public.training_courses
for each row
execute function public.set_updated_at();

drop trigger if exists trg_training_materials_updated_at on public.training_materials;
create trigger trg_training_materials_updated_at
before update on public.training_materials
for each row
execute function public.set_updated_at();

drop trigger if exists trg_training_lessons_updated_at on public.training_lessons;
create trigger trg_training_lessons_updated_at
before update on public.training_lessons
for each row
execute function public.set_updated_at();


-- =========================================================
-- 12. RLS POLICY BẢN TEST
-- Cho phép anon + authenticated thao tác để test nhanh.
-- Khi chạy chính thức nên siết lại theo role Admin / Người học.
-- =========================================================

alter table public.training_courses enable row level security;
alter table public.training_materials enable row level security;
alter table public.training_lessons enable row level security;
alter table public.training_questions enable row level security;
alter table public.training_practice_checklists enable row level security;
alter table public.training_assignments enable row level security;
alter table public.training_learning_progress enable row level security;
alter table public.training_test_attempts enable row level security;
alter table public.training_test_answers enable row level security;


-- Xóa policy cũ nếu có

drop policy if exists "training_courses_all_test" on public.training_courses;
drop policy if exists "training_materials_all_test" on public.training_materials;
drop policy if exists "training_lessons_all_test" on public.training_lessons;
drop policy if exists "training_questions_all_test" on public.training_questions;
drop policy if exists "training_practice_checklists_all_test" on public.training_practice_checklists;
drop policy if exists "training_assignments_all_test" on public.training_assignments;
drop policy if exists "training_learning_progress_all_test" on public.training_learning_progress;
drop policy if exists "training_test_attempts_all_test" on public.training_test_attempts;
drop policy if exists "training_test_answers_all_test" on public.training_test_answers;


-- Tạo policy test

create policy "training_courses_all_test"
on public.training_courses
for all
to anon, authenticated
using (true)
with check (true);

create policy "training_materials_all_test"
on public.training_materials
for all
to anon, authenticated
using (true)
with check (true);

create policy "training_lessons_all_test"
on public.training_lessons
for all
to anon, authenticated
using (true)
with check (true);

create policy "training_questions_all_test"
on public.training_questions
for all
to anon, authenticated
using (true)
with check (true);

create policy "training_practice_checklists_all_test"
on public.training_practice_checklists
for all
to anon, authenticated
using (true)
with check (true);

create policy "training_assignments_all_test"
on public.training_assignments
for all
to anon, authenticated
using (true)
with check (true);

create policy "training_learning_progress_all_test"
on public.training_learning_progress
for all
to anon, authenticated
using (true)
with check (true);

create policy "training_test_attempts_all_test"
on public.training_test_attempts
for all
to anon, authenticated
using (true)
with check (true);

create policy "training_test_answers_all_test"
on public.training_test_answers
for all
to anon, authenticated
using (true)
with check (true);


-- =========================================================
-- 13. STORAGE POLICY CHO BUCKET training-materials
-- Chạy sau khi đã tạo bucket training-materials trong Supabase Storage.
-- =========================================================

drop policy if exists "training_materials_storage_select" on storage.objects;
drop policy if exists "training_materials_storage_insert" on storage.objects;
drop policy if exists "training_materials_storage_update" on storage.objects;
drop policy if exists "training_materials_storage_delete" on storage.objects;

create policy "training_materials_storage_select"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'training-materials');

create policy "training_materials_storage_insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'training-materials');

create policy "training_materials_storage_update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'training-materials')
with check (bucket_id = 'training-materials');

create policy "training_materials_storage_delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'training-materials');


-- =========================================================
-- 14. DỮ LIỆU TEST MẪU
-- Có thể xóa nếu không cần.
-- =========================================================

insert into public.training_courses (
  title,
  code,
  description,
  document_type,
  target_learners,
  pass_score,
  max_attempts,
  duration_minutes,
  status
)
select
  'Nhận dạng đúng người bệnh',
  'QLCL.QĐ.15.V3',
  'Khóa học chuyển đổi từ quy trình nhận dạng đúng người bệnh thành bài giảng điện tử.',
  'quy_dinh',
  'Toàn bộ nhân viên y tế có tiếp xúc người bệnh',
  80,
  3,
  15,
  'draft'
where not exists (
  select 1
  from public.training_courses
  where code = 'QLCL.QĐ.15.V3'
);


-- =========================================================
-- 15. KIỂM TRA NHANH
-- =========================================================

-- select * from public.training_courses order by created_at desc;
-- select * from public.training_materials order by created_at desc;
-- select * from public.training_lessons order by lesson_order asc;
-- select * from public.training_questions order by created_at desc;
"""

path = Path("/mnt/data/training_module_schema_full.sql")
path.write_text(sql, encoding="utf-8")
print(f"Created: {path}")
