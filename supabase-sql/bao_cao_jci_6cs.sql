-- =====================================================================================
-- BÁO CÁO TỔNG HỢP 06 CHỈ SỐ CHẤT LƯỢNG (JCI) - lưu báo cáo đã xuất từ màn hình
-- "Danh mục chỉ số" để tải lại file Word bất kỳ lúc nào.
-- Chạy script này trên giao diện SQL Editor của Supabase.
-- =====================================================================================

CREATE TABLE IF NOT EXISTS public.bao_cao_jci_6cs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ky_loai       TEXT NOT NULL CHECK (ky_loai IN ('thang', 'quy', 'nam')), -- Tháng / Quý / Năm
  ky_so         INTEGER NOT NULL DEFAULT 0,        -- Tháng 1-12, Quý 1-4, Năm = 0
  nam           INTEGER NOT NULL,
  cap_bao_cao   TEXT NOT NULL CHECK (cap_bao_cao IN ('khoa', 'co_quan', 'toan_vien')),
  don_vi        TEXT,                               -- Khoa/cơ quan lập báo cáo
  ten_bao_cao   TEXT NOT NULL,
  ten_file      TEXT NOT NULL,
  file_base64   TEXT NOT NULL,                      -- Nội dung file .docx (base64)
  so_lieu       JSONB DEFAULT '{}'::jsonb,          -- Số liệu 06 chỉ số tại thời điểm xuất
  nguoi_tao     TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bao_cao_jci_6cs_created_idx ON public.bao_cao_jci_6cs (created_at DESC);

ALTER TABLE public.bao_cao_jci_6cs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on bao_cao_jci_6cs" ON public.bao_cao_jci_6cs;
CREATE POLICY "Allow all operations on bao_cao_jci_6cs"
  ON public.bao_cao_jci_6cs FOR ALL USING (true) WITH CHECK (true);

-- Mỗi đơn vị chỉ có 1 báo cáo cho mỗi kỳ (Tháng/Quý/Năm) ở cùng cấp báo cáo
CREATE UNIQUE INDEX IF NOT EXISTS bao_cao_jci_6cs_unique_ky_idx
  ON public.bao_cao_jci_6cs (ky_loai, ky_so, nam, cap_bao_cao, don_vi);
