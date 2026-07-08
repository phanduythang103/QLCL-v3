create extension if not exists pgcrypto;
create table if not exists public.dtlt_bai_hoc (
 id uuid primary key default gen_random_uuid(), tieu_de text not null, mo_ta text, file_path text not null,
 file_name text not null, file_type text not null default '', trang_thai text not null default 'XUAT_BAN',
 nguoi_tao_id text, nguoi_tao_name text, created_at timestamptz not null default now()
);
create table if not exists public.dtlt_bai_kiem_tra (
 id uuid primary key default gen_random_uuid(), bai_hoc_id uuid not null unique references public.dtlt_bai_hoc(id) on delete cascade,
 tieu_de text not null, diem_dat numeric(5,2) not null default 80, thoi_gian_phut integer not null default 30,
 cau_hoi jsonb not null default '[]', created_at timestamptz not null default now()
);
create table if not exists public.dtlt_lich_su_hoc (
 id uuid primary key default gen_random_uuid(), bai_hoc_id uuid not null references public.dtlt_bai_hoc(id) on delete cascade,
 user_id text not null, user_name text, bat_dau_luc timestamptz not null default now(), ket_thuc_luc timestamptz,
 thoi_gian_giay integer not null default 0, hoan_thanh boolean not null default false
);
create table if not exists public.dtlt_ket_qua_kiem_tra (
 id uuid primary key default gen_random_uuid(), bai_kiem_tra_id uuid not null references public.dtlt_bai_kiem_tra(id) on delete cascade,
 bai_hoc_id uuid not null references public.dtlt_bai_hoc(id) on delete cascade, user_id text not null, user_name text,
 bat_dau_luc timestamptz not null, nop_bai_luc timestamptz not null default now(), thoi_gian_giay integer not null,
 so_cau_dung integer not null, tong_so_cau integer not null, diem numeric(5,2) not null, dat boolean not null,
 ten_bai_kiem_tra text, chi_tiet_bai_lam jsonb not null default '[]'::jsonb
);
create index if not exists dtlt_hoc_user_idx on public.dtlt_lich_su_hoc(user_id, bat_dau_luc desc);
create index if not exists dtlt_thi_user_idx on public.dtlt_ket_qua_kiem_tra(user_id, nop_bai_luc desc);
alter table public.dtlt_bai_hoc enable row level security;
alter table public.dtlt_bai_kiem_tra enable row level security;
alter table public.dtlt_lich_su_hoc enable row level security;
alter table public.dtlt_ket_qua_kiem_tra enable row level security;
drop policy if exists "dtlt_bai_hoc_all" on public.dtlt_bai_hoc;
create policy "dtlt_bai_hoc_all" on public.dtlt_bai_hoc for all using (true) with check (true);
drop policy if exists "dtlt_bai_kiem_tra_all" on public.dtlt_bai_kiem_tra;
create policy "dtlt_bai_kiem_tra_all" on public.dtlt_bai_kiem_tra for all using (true) with check (true);
drop policy if exists "dtlt_lich_su_hoc_all" on public.dtlt_lich_su_hoc;
create policy "dtlt_lich_su_hoc_all" on public.dtlt_lich_su_hoc for all using (true) with check (true);
drop policy if exists "dtlt_ket_qua_all" on public.dtlt_ket_qua_kiem_tra;
create policy "dtlt_ket_qua_all" on public.dtlt_ket_qua_kiem_tra for all using (true) with check (true);
insert into storage.buckets(id,name,public) values('dao_tao_lien_tuc','dao_tao_lien_tuc',true)
on conflict(id) do update set public=true;
drop policy if exists "dtlt_storage_read" on storage.objects;
create policy "dtlt_storage_read" on storage.objects for select using(bucket_id='dao_tao_lien_tuc');
drop policy if exists "dtlt_storage_insert" on storage.objects;
create policy "dtlt_storage_insert" on storage.objects for insert with check(bucket_id='dao_tao_lien_tuc');
drop policy if exists "dtlt_storage_delete" on storage.objects;
create policy "dtlt_storage_delete" on storage.objects for delete using(bucket_id='dao_tao_lien_tuc');
