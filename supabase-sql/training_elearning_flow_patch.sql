-- Patch for end-to-end continuous training flow using existing training_* tables.
-- Safe to run multiple times.

alter table public.training_courses
  add column if not exists published_at timestamptz,
  add column if not exists published_by text,
  add column if not exists passing_score numeric(5,2) not null default 80;

alter table public.training_lessons
  add column if not exists content text,
  add column if not exists summary text,
  add column if not exists key_points jsonb not null default '[]'::jsonb,
  add column if not exists section_type text not null default 'lesson';

alter table public.training_questions
  add column if not exists question_type text not null default 'single_choice',
  add column if not exists options jsonb not null default '[]'::jsonb,
  add column if not exists correct_answer_index integer,
  add column if not exists sort_order integer not null default 0;

alter table public.training_practice_checklists
  add column if not exists lesson_id uuid,
  add column if not exists title text,
  add column if not exists items jsonb not null default '[]'::jsonb;

alter table public.training_assignments
  add column if not exists assigned_to_name text,
  add column if not exists due_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table public.training_learning_progress
  add column if not exists status text not null default 'in_progress',
  add column if not exists quick_answer text,
  add column if not exists quick_correct boolean,
  add column if not exists updated_at timestamptz not null default now();

alter table public.training_test_attempts
  add column if not exists passed boolean not null default false,
  add column if not exists passing_score numeric(5,2) not null default 80;

create index if not exists training_materials_course_idx on public.training_materials(course_id);
create index if not exists training_lessons_course_idx on public.training_lessons(course_id, lesson_order);
create index if not exists training_questions_lesson_idx on public.training_questions(lesson_id, sort_order);
create index if not exists training_questions_course_source_idx on public.training_questions(course_id, source);
create index if not exists training_assignments_user_idx on public.training_assignments(user_id, course_id);
create index if not exists training_progress_user_course_idx on public.training_learning_progress(user_id, course_id, lesson_id);
create index if not exists training_attempts_user_course_idx on public.training_test_attempts(user_id, course_id, started_at desc);