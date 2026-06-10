-- Tao bang va bucket cho menu Dao tao.
-- Luu y: Viec nen file can thuc hien o webapp truoc khi upload len bucket dao_tao.

CREATE TABLE IF NOT EXISTS public.dao_tao (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tieu_de text NOT NULL,
    noi_dung text NOT NULL,
    link text,
    link_embed text,
    file_dinh_kem text,
    file_ten_goc text,
    file_ten_nen text,
    file_mime_type text DEFAULT 'application/gzip',
    file_kich_thu_goc bigint,
    file_kich_thu_nen bigint,
    nguoi_tao_id uuid,
    nguoi_tao_name text,
    ngay_tao timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.dao_tao IS 'Du lieu menu Dao tao';
COMMENT ON COLUMN public.dao_tao.tieu_de IS 'Tieu de noi dung dao tao';
COMMENT ON COLUMN public.dao_tao.noi_dung IS 'Noi dung dao tao';
COMMENT ON COLUMN public.dao_tao.link IS 'Link ngoai, vi du Google Drive';
COMMENT ON COLUMN public.dao_tao.link_embed IS 'Link che do xem/preview de hien thi trong webapp';
COMMENT ON COLUMN public.dao_tao.file_dinh_kem IS 'URL hoac path file da nen trong bucket dao_tao';
COMMENT ON COLUMN public.dao_tao.file_ten_goc IS 'Ten file truoc khi nen';
COMMENT ON COLUMN public.dao_tao.file_ten_nen IS 'Ten file sau khi nen';
COMMENT ON COLUMN public.dao_tao.file_kich_thu_goc IS 'Dung luong file truoc khi nen, tinh bang byte';
COMMENT ON COLUMN public.dao_tao.file_kich_thu_nen IS 'Dung luong file sau khi nen, tinh bang byte';

ALTER TABLE public.dao_tao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dao_tao_select_public" ON public.dao_tao;
DROP POLICY IF EXISTS "dao_tao_insert_public" ON public.dao_tao;
DROP POLICY IF EXISTS "dao_tao_update_public" ON public.dao_tao;
DROP POLICY IF EXISTS "dao_tao_delete_public" ON public.dao_tao;

CREATE POLICY "dao_tao_select_public" ON public.dao_tao
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "dao_tao_insert_public" ON public.dao_tao
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "dao_tao_update_public" ON public.dao_tao
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "dao_tao_delete_public" ON public.dao_tao
    FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dao_tao TO anon, authenticated;

CREATE INDEX IF NOT EXISTS dao_tao_ngay_tao_idx ON public.dao_tao (ngay_tao DESC);
CREATE INDEX IF NOT EXISTS dao_tao_tieu_de_idx ON public.dao_tao USING gin (to_tsvector('simple', coalesce(tieu_de, '')));

INSERT INTO storage.buckets (id, name, public)
VALUES ('dao_tao', 'dao_tao', true)
ON CONFLICT (id) DO UPDATE
SET public = excluded.public;

DROP POLICY IF EXISTS "dao_tao_storage_select_public" ON storage.objects;
DROP POLICY IF EXISTS "dao_tao_storage_insert_public" ON storage.objects;
DROP POLICY IF EXISTS "dao_tao_storage_update_public" ON storage.objects;
DROP POLICY IF EXISTS "dao_tao_storage_delete_public" ON storage.objects;

CREATE POLICY "dao_tao_storage_select_public" ON storage.objects
    FOR SELECT TO anon, authenticated USING (bucket_id = 'dao_tao');

CREATE POLICY "dao_tao_storage_insert_public" ON storage.objects
    FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'dao_tao');

CREATE POLICY "dao_tao_storage_update_public" ON storage.objects
    FOR UPDATE TO anon, authenticated
    USING (bucket_id = 'dao_tao')
    WITH CHECK (bucket_id = 'dao_tao');

CREATE POLICY "dao_tao_storage_delete_public" ON storage.objects
    FOR DELETE TO anon, authenticated USING (bucket_id = 'dao_tao');
