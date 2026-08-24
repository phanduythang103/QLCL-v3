-- =====================================================================================
-- IPSG.04.00 / 04.01 - AN TOÀN PHẪU THUẬT / THỦ THUẬT
-- Nâng bảng kiểm từ 13 tiêu chí lên 23 tiêu chí theo Phụ lục II, BVQY103.QLCL.QĐ.04.V3
-- (10 Sign-in + 8 Time-out + 5 Sign-out), mỗi tiêu chí Có / Không / Không áp dụng.
-- Các cột tc1..tc13 cũ được GIỮ NGUYÊN để không mất dữ liệu bản ghi cũ.
-- Chạy script này trên giao diện SQL Editor của Supabase.
-- =====================================================================================

ALTER TABLE public.giam_sat_atpt
-- Bảng kiểm 23 tiêu chí: { "SI1": "Có" | "Không" | "Không áp dụng", ... }
ADD COLUMN IF NOT EXISTS checklist_23 JSONB DEFAULT '{}'::jsonb,
-- Nhóm phẫu thuật/thủ thuật xâm lấn (Mục 2.1 Quy định)
ADD COLUMN IF NOT EXISTS loai_pt_tt TEXT,
-- Họ tên / PID người bệnh (bản mẫu gộp 1 cột)
ADD COLUMN IF NOT EXISTS pid_nguoi_benh TEXT,
-- Người thu thập dữ liệu giám sát
ADD COLUMN IF NOT EXISTS nguoi_thu_thap TEXT,
-- Các cột tự động tính từ 23 tiêu chí
ADD COLUMN IF NOT EXISTS tong_ap_dung INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ket_qua TEXT;

COMMENT ON COLUMN public.giam_sat_atpt.checklist_23 IS
  'Bảng kiểm 23 tiêu chí ATPT (SI1-SI10, TO1-TO8, SO1-SO5), giá trị: Có / Không / Không áp dụng';
COMMENT ON COLUMN public.giam_sat_atpt.ket_qua IS
  'Tự động: Đạt chỉ khi KHÔNG có tiêu chí áp dụng nào bị đánh "Không"';
