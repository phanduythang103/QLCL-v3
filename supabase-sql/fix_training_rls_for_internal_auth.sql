-- Fix RLS for Continuous Training module when the app uses internal users table auth.
-- Run this in Supabase SQL Editor after trainning.sql / training_elearning_flow_patch.sql.
-- This is permissive for the current app architecture: frontend uses anon key + internal users table, not Supabase Auth sessions.

begin;

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.training_courses to anon, authenticated;
grant select, insert, update, delete on public.training_materials to anon, authenticated;
grant select, insert, update, delete on public.training_lessons to anon, authenticated;
grant select, insert, update, delete on public.training_questions to anon, authenticated;
grant select, insert, update, delete on public.training_practice_checklists to anon, authenticated;
grant select, insert, update, delete on public.training_assignments to anon, authenticated;
grant select, insert, update, delete on public.training_learning_progress to anon, authenticated;
grant select, insert, update, delete on public.training_test_attempts to anon, authenticated;
grant select, insert, update, delete on public.training_test_answers to anon, authenticated;

alter table public.training_courses enable row level security;
alter table public.training_materials enable row level security;
alter table public.training_lessons enable row level security;
alter table public.training_questions enable row level security;
alter table public.training_practice_checklists enable row level security;
alter table public.training_assignments enable row level security;
alter table public.training_learning_progress enable row level security;
alter table public.training_test_attempts enable row level security;
alter table public.training_test_answers enable row level security;

drop policy if exists "training_courses_all_test" on public.training_courses;
drop policy if exists "training_materials_all_test" on public.training_materials;
drop policy if exists "training_lessons_all_test" on public.training_lessons;
drop policy if exists "training_questions_all_test" on public.training_questions;
drop policy if exists "training_practice_checklists_all_test" on public.training_practice_checklists;
drop policy if exists "training_assignments_all_test" on public.training_assignments;
drop policy if exists "training_learning_progress_all_test" on public.training_learning_progress;
drop policy if exists "training_test_attempts_all_test" on public.training_test_attempts;
drop policy if exists "training_test_answers_all_test" on public.training_test_answers;

create policy "training_courses_all_test" on public.training_courses
for all to anon, authenticated using (true) with check (true);

create policy "training_materials_all_test" on public.training_materials
for all to anon, authenticated using (true) with check (true);

create policy "training_lessons_all_test" on public.training_lessons
for all to anon, authenticated using (true) with check (true);

create policy "training_questions_all_test" on public.training_questions
for all to anon, authenticated using (true) with check (true);

create policy "training_practice_checklists_all_test" on public.training_practice_checklists
for all to anon, authenticated using (true) with check (true);

create policy "training_assignments_all_test" on public.training_assignments
for all to anon, authenticated using (true) with check (true);

create policy "training_learning_progress_all_test" on public.training_learning_progress
for all to anon, authenticated using (true) with check (true);

create policy "training_test_attempts_all_test" on public.training_test_attempts
for all to anon, authenticated using (true) with check (true);

create policy "training_test_answers_all_test" on public.training_test_answers
for all to anon, authenticated using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('training-materials', 'training-materials', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "training_materials_storage_select" on storage.objects;
drop policy if exists "training_materials_storage_insert" on storage.objects;
drop policy if exists "training_materials_storage_update" on storage.objects;
drop policy if exists "training_materials_storage_delete" on storage.objects;

create policy "training_materials_storage_select" on storage.objects
for select to anon, authenticated using (bucket_id = 'training-materials');

create policy "training_materials_storage_insert" on storage.objects
for insert to anon, authenticated with check (bucket_id = 'training-materials');

create policy "training_materials_storage_update" on storage.objects
for update to anon, authenticated using (bucket_id = 'training-materials') with check (bucket_id = 'training-materials');

create policy "training_materials_storage_delete" on storage.objects
for delete to anon, authenticated using (bucket_id = 'training-materials');

commit;