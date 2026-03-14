-- Create table gs_vst
CREATE TABLE IF NOT EXISTS public.gs_vst (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    ngay_giam_sat DATE NOT NULL,
    nguoi_giam_sat TEXT NOT NULL,
    khoa_duoc_giam_sat TEXT NOT NULL,
    doi_tuong TEXT NOT NULL, -- Bác sỹ, Điều dưỡng, ...
    nguoi_duoc_giam_sat TEXT,
    checklist_data JSONB NOT NULL, -- Detailed 5 moments data
    tong_co_hoi INTEGER DEFAULT 0,
    so_lan_tuan_thu INTEGER DEFAULT 0,
    so_lan_dung_ky_thuat INTEGER DEFAULT 0,
    hinh_anh_minh_chung TEXT[] DEFAULT '{}'::TEXT[],
    ghi_chu_chung TEXT
);

-- Enable Row Level Security
ALTER TABLE public.gs_vst ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all" ON public.gs_vst
    FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert for all" ON public.gs_vst
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Enable update for all" ON public.gs_vst
    FOR UPDATE TO public USING (true);

CREATE POLICY "Enable delete for all" ON public.gs_vst
    FOR DELETE TO public USING (true);

-- Create Storage Bucket for evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('vst', 'vst', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'vst' bucket
-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'vst');

-- Allow public users to upload
CREATE POLICY "Public Upload" ON storage.objects
    FOR INSERT TO public WITH CHECK (bucket_id = 'vst');

-- Allow public users to update/delete
CREATE POLICY "Public Update" ON storage.objects
    FOR UPDATE TO public USING (bucket_id = 'vst');

CREATE POLICY "Public Delete" ON storage.objects
    FOR DELETE TO public USING (bucket_id = 'vst');
