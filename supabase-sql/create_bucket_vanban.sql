-- Tạo bucket tên 'vanban' để lưu file văn bản
insert into storage.buckets (id, name, public)
values ('vanban', 'vanban', true)
on conflict (id) do nothing;