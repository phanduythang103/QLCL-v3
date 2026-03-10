import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const record = {
  id: 'f9b3bd08-8e68-466d-ad02-601b1b116345',
  hinh_thuc_bao_cao: 'Tự nguyện',
  so_bc_ma_scyk: 'SCYK-006',
  ngay_bao_cao: '2026-03-10',
  don_vi_bao_cao: 'Khoa Ngoại Bụng',
  ho_ten_nb: 'Trần sỹ Viên',
  so_benh_an: '',
  ngay_sinh: '2000-01-01',
  gioi: 'Nam',
  khoa_phong: 'Khoa Ngoại Bụng',
  doi_tuong_xay_ra_sc: 'Người bệnh',
  noi_xay_ra_sc: 'Khoa phòng khác',
  vi_tri_cu_the: '',
  ngay_xay_ra_sc: '2026-03-09',
  thoi_gian: '09:20',
  mo_ta_su_co: 'Phiếu công khai thuốc cho BN Trần sỹ Viên (bs Đức kê) kháng sinh bacsulfo 1g pha dịch truyền NaCl 0.9% x 100ml truyền TM 40 giọt/phút, tuy nhiên thời điểm ghi nhận điều dưỡng Thủy pha thuốc bacsulfo vào bơm tiêm 10ml dùng cho NB (không ghi tên thuốc, hàm lượng, giờ pha)',
  de_xuat_giai_phap_ban_dau: 'Tập huấn lại quy trình công khai sử dụng thuốc cho tất cả điều dưỡng khoa\nKhi phát hiện y lệnh khác trong phiếu công khai phải báo lại bs yêu cầu xem lại hoặc cập nhật y lệnh phù hợp\nChỉ sử dụng thuốc cho NB khi có y lệnh\nKhông pha thuốc khi chưa sử dụng cho NB\nNếu vì lý do bất khả kháng thuốc đã pha phải ghi tên thuốc, hàm lượng, thời gian pha lên bơm tiêm/chai dịch',
  dieu_tri_xy_ly_ban_dau_da_thuc_hien: 'Yêu cầu điều dưỡng báo bác sĩ cập nhật y lệnh phiếu công khai sử dụng thuốc\nYêu cầu điều dưỡng thảo cập nhật tên thuốc, giờ pha, hàm lượng lên bơm tiêm khi chưa sử dụng cho BN\nYêu cầu Đ DT tổ chức sinh hoạt rút kinh nghiệm và phổ biến lại quy trình công khai sử dụng thuốc cho NB',
  thong_bao_bs_npt: 'Không ghi nhận',
  ghi_nhan_vao_hsba: 'Không ghi nhận',
  thong_bao_nn: 'Không ghi nhận',
  thong_bao_nb: 'Không ghi nhận',
  phan_loai_sc: 'Có nguy cơ',
  phan_loai_ban_dau: 'Nhẹ',
  ho_ten_nguoi_bc: 'La Quang Hổ',
  sdt: '0985938115',
  email: '',
  dieu_duong: null,
  bac_sy: null,
  nb_nn: null,
  chung_kien1: '',
  chung_kien2: '',
  created_at: '2026-03-10T03:23:26.917412+00:00',
  trang_thai: 'Đã tiếp nhận',
  vaitro_nguoi_bc: 'Nhân viên y tế',
  tien_do_xu_ly: null
};

async function restore() {
  console.log('Restoring record SCYK-006...');
  const { data, error } = await supabase.from('bao_cao_scyk').insert([record]).select();
  if (error) {
    console.error('Error restoring:', error);
  } else {
    console.log('Restoration success:', data);
  }
}

restore();
