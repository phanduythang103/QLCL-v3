-- Nhật ký xem video và dữ liệu xem lại từng lượt kiểm tra
alter table public.dtlt_ket_qua_kiem_tra
  add column if not exists ten_bai_kiem_tra text,
  add column if not exists chi_tiet_bai_lam jsonb not null default '[]'::jsonb;

create table if not exists public.dtlt_lich_su_video (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  video_name text not null,
  user_id text not null,
  user_name text,
  bat_dau_luc timestamptz not null default now(),
  ket_thuc_luc timestamptz,
  thoi_gian_giay integer not null default 0
);

create index if not exists dtlt_video_user_idx
  on public.dtlt_lich_su_video(user_id, bat_dau_luc desc);

alter table public.dtlt_lich_su_video enable row level security;
create policy "dtlt_lich_su_video_all"
  on public.dtlt_lich_su_video for all using (true) with check (true);
