-- RCA workflow for medical incident analysis
-- Based on RCA.md. This script is idempotent for Supabase/PostgreSQL.

-- Required extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure verification minutes can be linked to medical incident reports.
ALTER TABLE public.bien_ban_xac_minh_su_co
  ADD COLUMN IF NOT EXISTS scyk_id uuid REFERENCES public.bao_cao_scyk(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ma_baocao_scyk text;

CREATE INDEX IF NOT EXISTS idx_bien_ban_xac_minh_scyk_id
  ON public.bien_ban_xac_minh_su_co(scyk_id);

-- Main RCA analysis table.
CREATE TABLE IF NOT EXISTS public.rca_phan_tich_scyk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link and workflow state
  scyk_id uuid NOT NULL REFERENCES public.bao_cao_scyk(id) ON DELETE CASCADE,
  bien_ban_xac_minh_id bigint REFERENCES public.bien_ban_xac_minh_su_co(id) ON DELETE SET NULL,
  trang_thai text NOT NULL DEFAULT 'DRAFT' CHECK (trang_thai IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'CLOSED')),
  ngay_phan_tich date NOT NULL DEFAULT CURRENT_DATE,
  nguoi_phan_tich text,
  nhom_phan_tich jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Header in RCA.md
  ma_scyk text,
  so_benh_an text,
  ma_nguoi_benh text,
  gioi text,
  tuoi integer CHECK (tuoi IS NULL OR tuoi >= 0),
  thoi_gian_vao_vien text,
  khoa_xay_ra_su_co text,
  vao_khoa_luc text,
  khoa_tiep_nhan_sau text,
  khoa_tiep_nhan_luc text,
  thoi_diem_su_co text,
  tinh_bao_cao text,

  -- I. Mo ta su co
  tien_su_benh_su text,
  chan_doan_ban_dau text,
  dien_bien_su_co text,
  xu_tri_su_co text,
  dien_tien_sau_su_co text,

  -- II. Phan loai su co
  loai_su_co text,
  muc_do_ton_hai text,
  phan_loai_nguy_co text,
  kha_nang_phong_ngua text,

  -- IV. Phan tich lam sang - can lam sang va tinh phu hop xu tri
  phan_tich_chan_doan_tiep_nhan text,
  phan_tich_theo_doi_truoc_su_co text,
  phan_tich_cap_cuu_khi_su_co text,
  phan_tich_hoi_suc_sau_su_co text,
  ket_luan_phu_hop_xu_tri text,

  -- V. Phan tich nguyen nhan goc re theo 5 nhom yeu to
  yeu_to_nguoi_benh text,
  yeu_to_nhan_vien text,
  yeu_to_moi_truong_thiet_bi text,
  yeu_to_quy_trinh_nhiem_vu text,
  yeu_to_to_chuc_quan_ly text,
  nguyen_nhan_goc_re text,
  van_de_phat_hien_them text,

  -- VI. Bai hoc kinh nghiem
  bai_hoc_kinh_nghiem jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- VII. Khuyen nghi
  khuyen_nghi_he_thong text,
  khuyen_nghi_cong_cu_quy_trinh text,
  khuyen_nghi_phan_mem_cntt text,
  khuyen_nghi_kiem_tra_giam_sat text,
  xem_xet_trach_nhiem_hanh_chinh_hs text,
  xem_xet_trach_nhiem_chuyen_mon_theo_doi text,

  -- Source snapshots used for auto-fill and audit
  nguon_bao_cao jsonb NOT NULL DEFAULT '{}'::jsonb,
  nguon_bien_ban_xac_minh jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_by text,
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT rca_phan_tich_scyk_one_per_incident UNIQUE (scyk_id)
);

CREATE INDEX IF NOT EXISTS idx_rca_phan_tich_scyk_scyk_id
  ON public.rca_phan_tich_scyk(scyk_id);
CREATE INDEX IF NOT EXISTS idx_rca_phan_tich_scyk_trang_thai
  ON public.rca_phan_tich_scyk(trang_thai);
CREATE INDEX IF NOT EXISTS idx_rca_phan_tich_scyk_ngay_phan_tich
  ON public.rca_phan_tich_scyk(ngay_phan_tich DESC);

-- III. Dien bien theo dau chan nguoi benh.
CREATE TABLE IF NOT EXISTS public.rca_dau_chan_nguoi_benh (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rca_id uuid NOT NULL REFERENCES public.rca_phan_tich_scyk(id) ON DELETE CASCADE,
  thu_tu integer NOT NULL DEFAULT 1 CHECK (thu_tu > 0),
  thoi_diem text,
  vi_tri text,
  lam_sang text,
  can_lam_sang_xu_tri text,
  la_thoi_diem_su_co boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rca_dau_chan_unique_order UNIQUE (rca_id, thu_tu)
);

CREATE INDEX IF NOT EXISTS idx_rca_dau_chan_rca_id
  ON public.rca_dau_chan_nguoi_benh(rca_id, thu_tu);

-- Updated-at trigger shared by RCA tables.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rca_phan_tich_scyk_updated_at ON public.rca_phan_tich_scyk;
CREATE TRIGGER trg_rca_phan_tich_scyk_updated_at
BEFORE UPDATE ON public.rca_phan_tich_scyk
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_rca_dau_chan_updated_at ON public.rca_dau_chan_nguoi_benh;
CREATE TRIGGER trg_rca_dau_chan_updated_at
BEFORE UPDATE ON public.rca_dau_chan_nguoi_benh
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- View for UI auto-fill suggestions from report + latest verification minutes.
CREATE OR REPLACE VIEW public.rca_scyk_goi_y_tu_dien AS
WITH latest_verification AS (
  SELECT DISTINCT ON (bb.scyk_id)
    bb.*
  FROM public.bien_ban_xac_minh_su_co bb
  WHERE bb.scyk_id IS NOT NULL
  ORDER BY bb.scyk_id, bb.created_at DESC, bb.id DESC
)
SELECT
  bc.id AS scyk_id,
  lv.id AS bien_ban_xac_minh_id,
  bc.so_bc_ma_scyk AS ma_scyk,
  bc.so_benh_an,
  COALESCE(NULLIF(concat_ws(' - ', NULLIF(bc.ma_bn, ''), NULLIF(bc.ho_ten_nb, '')), ''), bc.ma_bn, bc.ho_ten_nb) AS ma_nguoi_benh,
  bc.thoi_gian_vao_vien::text AS thoi_gian_vao_vien,
  bc.gioi,
  CASE
    WHEN bc.ngay_sinh IS NULL THEN NULL
    ELSE EXTRACT(YEAR FROM age(CURRENT_DATE, bc.ngay_sinh))::integer
  END AS tuoi,
  COALESCE(bc.khoa_phong, bc.don_vi_bao_cao) AS khoa_xay_ra_su_co,
  CASE
    WHEN bc.ngay_xay_ra_sc IS NOT NULL AND NULLIF(bc.thoi_gian, '') IS NOT NULL
      THEN bc.ngay_xay_ra_sc::text || 'T' || left(bc.thoi_gian, 5)
    ELSE NULL
  END AS thoi_diem_su_co,
  bc.hinh_thuc_bao_cao AS tinh_bao_cao,
  bc.phan_loai_sc AS loai_su_co,
  bc.phan_loai_ban_dau AS muc_do_ton_hai,
  bc.mo_ta_su_co AS dien_bien_su_co,
  bc.dieu_tri_xy_ly_ban_dau_da_thuc_hien AS xu_tri_su_co,
  bc.de_xuat_giai_phap_ban_dau AS khuyen_nghi_he_thong,
  lv.noi_dung_xac_minh,
  lv.ket_qua_xac_minh AS dien_tien_sau_su_co,
  lv.y_kien_tham_gia,
  jsonb_strip_nulls(jsonb_build_object(
    'id', bc.id,
    'so_bc_ma_scyk', bc.so_bc_ma_scyk,
    'ma_bn', bc.ma_bn,
    'thoi_gian_vao_vien', bc.thoi_gian_vao_vien,
    'ngay_bao_cao', bc.ngay_bao_cao,
    'don_vi_bao_cao', bc.don_vi_bao_cao,
    'khoa_phong', bc.khoa_phong,
    'noi_xay_ra_sc', bc.noi_xay_ra_sc,
    'ngay_xay_ra_sc', bc.ngay_xay_ra_sc,
    'thoi_gian', bc.thoi_gian,
    'mo_ta_su_co', bc.mo_ta_su_co,
    'dieu_tri_xy_ly_ban_dau_da_thuc_hien', bc.dieu_tri_xy_ly_ban_dau_da_thuc_hien,
    'de_xuat_giai_phap_ban_dau', bc.de_xuat_giai_phap_ban_dau,
    'phan_loai_sc', bc.phan_loai_sc,
    'phan_loai_ban_dau', bc.phan_loai_ban_dau
  )) AS nguon_bao_cao,
  jsonb_strip_nulls(jsonb_build_object(
    'id', lv.id,
    'thoi_gian_bat_dau', lv.thoi_gian_bat_dau,
    'dia_diem', lv.dia_diem,
    'noi_dung_xac_minh', lv.noi_dung_xac_minh,
    'ket_qua_xac_minh', lv.ket_qua_xac_minh,
    'y_kien_tham_gia', lv.y_kien_tham_gia
  )) AS nguon_bien_ban_xac_minh
FROM public.bao_cao_scyk bc
LEFT JOIN latest_verification lv ON lv.scyk_id = bc.id;

-- Create or return an RCA record prefilled from report and latest verification minutes.
CREATE OR REPLACE FUNCTION public.tao_rca_tu_scyk(
  p_scyk_id uuid,
  p_nguoi_tao text DEFAULT NULL
)
RETURNS public.rca_phan_tich_scyk
LANGUAGE plpgsql
AS $$
DECLARE
  existing_record public.rca_phan_tich_scyk;
  suggestion public.rca_scyk_goi_y_tu_dien;
  created_record public.rca_phan_tich_scyk;
BEGIN
  SELECT * INTO existing_record
  FROM public.rca_phan_tich_scyk
  WHERE scyk_id = p_scyk_id;

  IF FOUND THEN
    RETURN existing_record;
  END IF;

  SELECT * INTO suggestion
  FROM public.rca_scyk_goi_y_tu_dien
  WHERE scyk_id = p_scyk_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Khong tim thay bao cao su co y khoa: %', p_scyk_id;
  END IF;

  INSERT INTO public.rca_phan_tich_scyk (
    scyk_id,
    bien_ban_xac_minh_id,
    nguoi_phan_tich,
    ma_scyk,
    so_benh_an,
    ma_nguoi_benh,
    gioi,
    tuoi,
    thoi_gian_vao_vien,
    khoa_xay_ra_su_co,
    thoi_diem_su_co,
    tinh_bao_cao,
    loai_su_co,
    muc_do_ton_hai,
    dien_bien_su_co,
    xu_tri_su_co,
    dien_tien_sau_su_co,
    khuyen_nghi_he_thong,
    nguon_bao_cao,
    nguon_bien_ban_xac_minh,
    created_by,
    updated_by
  ) VALUES (
    suggestion.scyk_id,
    suggestion.bien_ban_xac_minh_id,
    p_nguoi_tao,
    suggestion.ma_scyk,
    suggestion.so_benh_an,
    suggestion.ma_nguoi_benh,
    suggestion.gioi,
    suggestion.tuoi,
    suggestion.thoi_gian_vao_vien,
    suggestion.khoa_xay_ra_su_co,
    suggestion.thoi_diem_su_co,
    suggestion.tinh_bao_cao,
    suggestion.loai_su_co,
    suggestion.muc_do_ton_hai,
    suggestion.dien_bien_su_co,
    suggestion.xu_tri_su_co,
    suggestion.dien_tien_sau_su_co,
    suggestion.khuyen_nghi_he_thong,
    suggestion.nguon_bao_cao,
    suggestion.nguon_bien_ban_xac_minh,
    p_nguoi_tao,
    p_nguoi_tao
  )
  RETURNING * INTO created_record;

  IF suggestion.thoi_diem_su_co IS NOT NULL
     OR suggestion.khoa_xay_ra_su_co IS NOT NULL
     OR suggestion.dien_bien_su_co IS NOT NULL
     OR suggestion.xu_tri_su_co IS NOT NULL THEN
    INSERT INTO public.rca_dau_chan_nguoi_benh (
      rca_id,
      thu_tu,
      thoi_diem,
      vi_tri,
      lam_sang,
      can_lam_sang_xu_tri,
      la_thoi_diem_su_co
    ) VALUES (
      created_record.id,
      1,
      suggestion.thoi_diem_su_co,
      suggestion.khoa_xay_ra_su_co,
      suggestion.dien_bien_su_co,
      suggestion.xu_tri_su_co,
      true
    );
  END IF;

  RETURN created_record;
END;
$$;

-- RLS and permissive policies matching the existing project style.
ALTER TABLE public.rca_phan_tich_scyk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rca_dau_chan_nguoi_benh ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rca_phan_tich_scyk' AND policyname = 'rca_phan_tich_scyk: Select all') THEN
    CREATE POLICY "rca_phan_tich_scyk: Select all" ON public.rca_phan_tich_scyk FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rca_phan_tich_scyk' AND policyname = 'rca_phan_tich_scyk: Insert') THEN
    CREATE POLICY "rca_phan_tich_scyk: Insert" ON public.rca_phan_tich_scyk FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rca_phan_tich_scyk' AND policyname = 'rca_phan_tich_scyk: Update') THEN
    CREATE POLICY "rca_phan_tich_scyk: Update" ON public.rca_phan_tich_scyk FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rca_phan_tich_scyk' AND policyname = 'rca_phan_tich_scyk: Delete') THEN
    CREATE POLICY "rca_phan_tich_scyk: Delete" ON public.rca_phan_tich_scyk FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rca_dau_chan_nguoi_benh' AND policyname = 'rca_dau_chan_nguoi_benh: Select all') THEN
    CREATE POLICY "rca_dau_chan_nguoi_benh: Select all" ON public.rca_dau_chan_nguoi_benh FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rca_dau_chan_nguoi_benh' AND policyname = 'rca_dau_chan_nguoi_benh: Insert') THEN
    CREATE POLICY "rca_dau_chan_nguoi_benh: Insert" ON public.rca_dau_chan_nguoi_benh FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rca_dau_chan_nguoi_benh' AND policyname = 'rca_dau_chan_nguoi_benh: Update') THEN
    CREATE POLICY "rca_dau_chan_nguoi_benh: Update" ON public.rca_dau_chan_nguoi_benh FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rca_dau_chan_nguoi_benh' AND policyname = 'rca_dau_chan_nguoi_benh: Delete') THEN
    CREATE POLICY "rca_dau_chan_nguoi_benh: Delete" ON public.rca_dau_chan_nguoi_benh FOR DELETE USING (true);
  END IF;
END $$;

COMMENT ON TABLE public.rca_phan_tich_scyk IS 'RCA analysis report for medical incidents, based on RCA.md.';
COMMENT ON TABLE public.rca_dau_chan_nguoi_benh IS 'Patient journey/timeline rows for an RCA report.';
COMMENT ON VIEW public.rca_scyk_goi_y_tu_dien IS 'Auto-fill suggestions for RCA from bao_cao_scyk and latest bien_ban_xac_minh_su_co.';
COMMENT ON FUNCTION public.tao_rca_tu_scyk(uuid, text) IS 'Create or return an RCA record prefilled from a medical incident report and latest verification minutes.';