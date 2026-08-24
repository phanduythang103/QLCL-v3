-- =====================================================================================
-- AOP.02.00 - TỶ SUẤT NGƯỜI BỆNH NGÃ
-- Bổ sung cấu trúc theo bản mẫu "BẢNG GHI NHẬN VÀ PHÂN TÍCH SỰ CỐ NGƯỜI BỆNH NGÃ"
-- Chạy script này trên giao diện SQL Editor của Supabase.
-- =====================================================================================

-- 1) Tách "Mức nguy cơ ngã tại lần đánh giá gần nhất" thành 2 trường riêng:
--    - thang_diem_ap_dung : Morse / Humpty Dumpty / OFRAS-M / EPFRAT
--    - muc_nguy_co        : Thấp / Trung bình / Cao   (cột đã có sẵn)
ALTER TABLE jci_fall_incidents
ADD COLUMN IF NOT EXISTS thang_diem_ap_dung TEXT;

-- 2) Mẫu số của chỉ số: tổng số ngày nằm viện (nội trú) theo từng tháng.
--    Số liệu lấy từ Phòng Kế hoạch tổng hợp, nhập tay theo từng năm/tháng.
CREATE TABLE IF NOT EXISTS jci_fall_patient_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nam INTEGER NOT NULL,
  thang INTEGER NOT NULL CHECK (thang BETWEEN 1 AND 12),
  so_ngay_nam_vien INTEGER NOT NULL DEFAULT 0 CHECK (so_ngay_nam_vien >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT jci_fall_patient_days_nam_thang_key UNIQUE (nam, thang)
);

ALTER TABLE jci_fall_patient_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on jci_fall_patient_days" ON jci_fall_patient_days;
CREATE POLICY "Allow all operations on jci_fall_patient_days"
  ON jci_fall_patient_days FOR ALL USING (true) WITH CHECK (true);
