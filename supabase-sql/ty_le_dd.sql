-- Create ty_le_dd table
CREATE TABLE IF NOT EXISTS ty_le_dd (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  ngay_bao_cao DATE NOT NULL,
  nguoi_bao_cao TEXT NOT NULL,
  khoa TEXT NOT NULL,
  so_nb_noi_tru INTEGER NOT NULL DEFAULT 0,
  so_dd_chuyen_mon INTEGER NOT NULL DEFAULT 0,
  ty_so_dd_nb NUMERIC(10, 2) NOT NULL DEFAULT 0,
  so_dd_khong_chuyen_mon INTEGER NOT NULL DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE public.ty_le_dd ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all access for authenticated" ON public.ty_le_dd;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.ty_le_dd;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.ty_le_dd;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.ty_le_dd;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.ty_le_dd;

-- Create explicit policies for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON public.ty_le_dd
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON public.ty_le_dd
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.ty_le_dd
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON public.ty_le_dd
    FOR DELETE USING (auth.role() = 'authenticated');
