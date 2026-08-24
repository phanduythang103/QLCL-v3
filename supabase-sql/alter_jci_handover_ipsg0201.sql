-- =====================================================================================
-- IPSG.02.01 / QPS.03.04 - SỰ CỐ LIÊN QUAN ĐẾN BÀN GIAO THÔNG TIN NGƯỜI BỆNH
-- Bổ sung cấu trúc theo bản mẫu "BẢNG THU THẬP DỮ LIỆU SỰ CỐ LIÊN QUAN ĐẾN BÀN GIAO".
-- Chạy script này trên giao diện SQL Editor của Supabase.
-- =====================================================================================

-- 1) Tách "Khoa/Phòng liên quan" thành khoa bàn giao và khoa tiếp nhận.
--    Cột khoa_lien_quan (NOT NULL, đã có) vẫn giữ chuỗi hiển thị "Khoa A -> Khoa B".
ALTER TABLE jci_handover_incidents
ADD COLUMN IF NOT EXISTS khoa_ban_giao TEXT,
ADD COLUMN IF NOT EXISTS khoa_tiep_nhan TEXT;

-- 2) Mẫu số của chỉ số: tổng lượt khám, điều trị (nội trú + ngoại trú) theo từng tháng.
--    Số liệu lấy từ Phòng Kế hoạch tổng hợp, nhập tay theo từng năm/tháng.
CREATE TABLE IF NOT EXISTS jci_handover_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nam INTEGER NOT NULL,
  thang INTEGER NOT NULL CHECK (thang BETWEEN 1 AND 12),
  so_luot_kham INTEGER NOT NULL DEFAULT 0 CHECK (so_luot_kham >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT jci_handover_visits_nam_thang_key UNIQUE (nam, thang)
);

ALTER TABLE jci_handover_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on jci_handover_visits" ON jci_handover_visits;
CREATE POLICY "Allow all operations on jci_handover_visits"
  ON jci_handover_visits FOR ALL USING (true) WITH CHECK (true);
