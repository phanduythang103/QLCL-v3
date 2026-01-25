CREATE TABLE public.data83 (
  id serial not null,
  phan text null,
  chuong text null,
  tieu_chi text null,
  muc text null,
  ma_tieu_muc text null,
  tieu_muc text null,
  nhom text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint data83_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_data83_phan on public.data83 using btree (phan) TABLESPACE pg_default;
create index IF not exists idx_data83_nhom on public.data83 using btree (nhom) TABLESPACE pg_default;
create index IF not exists idx_data83_ma_tieu_muc on public.data83 using btree (ma_tieu_muc) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE data83 ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON data83
    FOR ALL
    USING (true)
    WITH CHECK (true);
