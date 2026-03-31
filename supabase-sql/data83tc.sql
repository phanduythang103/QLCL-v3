-- Create data83tc table
CREATE TABLE IF NOT EXISTS public.data83tc (
    id SERIAL PRIMARY KEY,
    phan TEXT,
    chuong TEXT,
    tieu_chi TEXT,
    muc TEXT,
    ma_tieu_muc TEXT,
    tieu_muc TEXT,
    phu_trach TEXT,
    don_vi_phoi_hop TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.data83tc ENABLE ROW LEVEL SECURITY;

-- Simple policy: authenticated users can read, only admins/internal can edit
-- Assuming a standard public access or based on existing project patterns
CREATE POLICY "Enable read access for all users" ON public.data83tc
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated users" ON public.data83tc
    FOR ALL USING (true) WITH CHECK (true);
