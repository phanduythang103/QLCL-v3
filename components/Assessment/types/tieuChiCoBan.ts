export interface TieuChiCoBan {
  id?: string;
  created_at?: string;
  updated_at?: string;
  
  // Metadata
  ngay_danh_gia: string;
  nguoi_danh_gia: string;
  don_vi_danh_gia: string;
  
  // I. Cơ sở vật chất
  c_1_1: boolean;
  c_1_2: boolean;
  c_1_3_1: boolean;
  c_1_3_2: boolean;
  c_1_4: boolean;
  c_1_5: boolean;
  c_1_6_1: boolean;
  c_1_6_2: boolean;
  c_1_7_1: boolean;
  c_1_7_2: boolean;
  c_1_7_3: boolean;
  c_1_7_4: boolean;
  c_1_8: boolean;

  // II. Quy mô & Tổ chức
  c_2_1: boolean;
  c_2_2: boolean;
  c_2_3: boolean;
  c_2_4: boolean;
  c_2_5: boolean;
  c_2_6: boolean;
  c_2_7: boolean;
  c_2_8: boolean;
  c_2_9: boolean;

  // III. Nhân sự
  c_3_1: boolean;
  c_3_2: boolean;

  // IV. Thiết bị y tế
  c_4_1: boolean;
  c_4_2: boolean;
  c_4_3: boolean;
  c_4_4: boolean;
  c_4_5: boolean;

  // V. Chuyên môn
  c_5_1: boolean;
  c_5_2: boolean;
  c_5_3_1: boolean;
  c_5_3_2: boolean;
  c_5_3_3: boolean;
  c_5_3_4: boolean;
  c_5_3_5: boolean;
  c_5_4_1: boolean;
  c_5_4_2: boolean;
  c_5_4_3: boolean;
  c_5_4_4: boolean;
  c_5_4_5: boolean;
  c_5_4_6: boolean;
  c_5_5: boolean;

  ghi_chu: string;
  trang_thai: string;
}
