-- Kế hoạch triển khai 3 Chỉ số JCI (Fall Incidents, Critical Results, Handover Incidents)
-- Lưu ý: Chạy các script này trong Supabase SQL Editor.

-- =====================================================================================
-- 1. TỶ SUẤT NGƯỜI BỆNH NGÃ (AOP.02.00)
-- =====================================================================================
CREATE TABLE jci_fall_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ma_bao_cao TEXT,
  thoi_gian_nga TIMESTAMP WITH TIME ZONE NOT NULL,
  khoa_dieu_tri TEXT NOT NULL,
  ho_ten_nb TEXT NOT NULL,
  nam_sinh TEXT,
  muc_nguy_co TEXT,
  hoan_canh TEXT,
  muc_do_ton_thuong TEXT,
  can_thiep_truoc_nga TEXT,
  da_tai_danh_gia BOOLEAN DEFAULT false,
  da_danh_gia_mt BOOLEAN DEFAULT false,
  nguoi_tong_hop TEXT,
  ghi_chu TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE jci_fall_incidents ENABLE ROW LEVEL SECURITY;
-- Cho phép mọi người truy cập (demo mục đích, nên tinh chỉnh theo roles thực tế)
CREATE POLICY "Allow all operations on jci_fall_incidents" ON jci_fall_incidents FOR ALL USING (true);


-- =====================================================================================
-- 2. THÔNG BÁO KQ BÁO ĐỘNG CẬN LÂM SÀNG (IPSG.02.00)
-- =====================================================================================
CREATE TABLE jci_critical_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thoi_gian_co_kq TIMESTAMP WITH TIME ZONE NOT NULL,
  thoi_gian_thong_bao TIMESTAMP WITH TIME ZONE,
  khoa_thong_bao TEXT NOT NULL,
  ho_ten_nb TEXT NOT NULL,
  nam_sinh TEXT,
  pid TEXT,
  khoa_dieu_tri TEXT NOT NULL,
  ten_kq_bao_dong TEXT NOT NULL,
  gia_tri_kq TEXT NOT NULL,
  nguoi_thong_bao TEXT,
  nguoi_nhan_thong_bao TEXT,
  xac_nhan_read_back TEXT,
  dat_khung_tg BOOLEAN DEFAULT false,
  ghi_chu TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE jci_critical_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on jci_critical_results" ON jci_critical_results FOR ALL USING (true);


-- =====================================================================================
-- 3. KQ SỰ CỐ LIÊN QUAN ĐẾN BÀN GIAO (IPSG.02.01)
-- =====================================================================================
CREATE TABLE jci_handover_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ma_bao_cao TEXT,
  thoi_gian_su_co TIMESTAMP WITH TIME ZONE NOT NULL,
  thoi_gian_bao_cao TIMESTAMP WITH TIME ZONE NOT NULL,
  khoa_lien_quan TEXT NOT NULL,
  loai_hinh_ban_giao TEXT NOT NULL,
  ho_ten_pid TEXT NOT NULL,
  phan_loai_su_co TEXT NOT NULL,
  muc_do_nghiem_trong TEXT,
  da_phan_tich_rca BOOLEAN DEFAULT false,
  hanh_dong_khac_phuc TEXT,
  nguoi_tong_hop TEXT,
  ghi_chu TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE jci_handover_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on jci_handover_incidents" ON jci_handover_incidents FOR ALL USING (true);
