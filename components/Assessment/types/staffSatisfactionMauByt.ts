import { SurveySection } from './patientSatisfactionMauByt';

/**
 * Phiếu khảo sát ý kiến nhân viên y tế theo mẫu Bộ Y tế (Mẫu số 3).
 * Điểm từng câu lưu ở cột trùng mã câu (a1..e7), thang 1-5.
 * Phiếu mẫu cũ (trước khi áp dụng mẫu BYT) lưu ở cột q1..q13 và vẫn xem lại được.
 */

export const STAFF_INTRO =
  'Nhằm mục tiêu nâng cao chất lượng khám, chữa bệnh và cải tiến môi trường làm việc của nhân viên y tế, Bộ Y tế và bệnh viện tổ chức khảo sát để tìm hiểu ý kiến, nguyện vọng của nhân viên y tế. Bộ Y tế bảo đảm giữ bí mật thông tin. Rất mong Quý đồng nghiệp trả lời đầy đủ, khách quan, chính xác. Xin trân trọng cảm ơn!';

export interface ChoiceOption {
  value: string;
  label: string;
  /** Lựa chọn "Khác (ghi rõ)" - cần ô ghi rõ */
  other?: boolean;
}

export const STAFF_CHUYEN_MON: ChoiceOption[] = [
  { value: '1', label: '1. Bác sỹ' },
  { value: '2', label: '2. Dược sỹ' },
  { value: '3', label: '3. Điều dưỡng, hộ sinh' },
  { value: '4', label: '4. Kỹ thuật viên' },
  { value: '5', label: '5. Khác (ghi rõ)', other: true },
];

export const STAFF_BANG_CAP: ChoiceOption[] = [
  { value: '1', label: 'Trung cấp' },
  { value: '2', label: 'Cao đẳng' },
  { value: '3', label: 'Đại học' },
  { value: '4', label: 'Cao học, CKI' },
  { value: '5', label: 'Tiến sỹ, CKII' },
  { value: '6', label: 'Khác (ghi rõ)', other: true },
];

export const STAFF_VI_TRI: ChoiceOption[] = [
  { value: '1', label: '1. Lãnh đạo bệnh viện' },
  { value: '2', label: '2. Trưởng khoa/phòng/ trung tâm' },
  { value: '3', label: '3. Phó khoa/phòng' },
  { value: '4', label: '4. NV biên chế/hợp đồng dài hạn' },
  { value: '5', label: '5. Hợp đồng ngắn hạn' },
  { value: '6', label: '6. Khác (ghi rõ)', other: true },
];

export const STAFF_PHAM_VI: ChoiceOption[] = [
  { value: '1', label: 'Khối hành chính' },
  { value: '2', label: 'Cận lâm sàng' },
  { value: '3', label: 'Nội' },
  { value: '4', label: 'Ngoại' },
  { value: '5', label: 'Sản' },
  { value: '6', label: 'Nhi' },
  { value: '7', label: 'Truyền nhiễm' },
  { value: '8', label: 'Chuyên khoa lẻ (mắt, TMH, RHM…)' },
  { value: '9', label: 'Các khoa không trực tiếp KCB' },
  { value: '10', label: 'Dược' },
  { value: '11', label: 'Dự phòng' },
  { value: '12', label: 'Khác (ghi rõ)', other: true },
];

export const STAFF_KIEM_NHIEM: ChoiceOption[] = [
  { value: '1', label: 'Không kiêm nhiệm' },
  { value: '2', label: 'Kiêm nhiệm 2 công việc' },
  { value: '3', label: 'Kiêm nhiệm từ 3 công việc trở lên' },
];

export const choiceLabel = (options: ChoiceOption[], value?: string | null, other?: string | null) => {
  if (!value) return '';
  const opt = options.find(o => o.value === value);
  const label = (opt?.label || value).replace(/^\d+\.\s*/, '').replace(' (ghi rõ)', '');
  return opt?.other && other ? `${label}: ${other}` : label;
};

export const STAFF_SECTIONS: SurveySection[] = [
  {
    stt: 'A',
    name: 'Sự hài lòng về môi trường làm việc',
    questions: [
      { code: 'a1', text: 'Phòng làm việc khang trang, sạch sẽ, thoáng mát.' },
      { code: 'a2', text: 'Trang thiết bị văn phòng, bàn ghế làm việc... đầy đủ, các thiết bị cũ, lạc hậu được thay thế kịp thời.' },
      { code: 'a3', text: 'Có bố trí phòng trực cho NVYT.' },
      { code: 'a4', text: 'Phân chia thời gian trực và làm việc ngoài giờ hành chính hợp lý.' },
      { code: 'a5', text: 'Các trang bị bảo hộ cho NVYT (quần áo, khẩu trang, găng tay..) đầy đủ, không bị cũ, nhàu nát, không bị hạn chế sử dụng.' },
      { code: 'a6', text: 'Môi trường học tập tạo điều kiện cho NVYT cập nhật kiến thức, nâng cao trình độ: thư viện, phòng đọc, tra cứu thông tin, truy cập internet...' },
      { code: 'a7', text: 'Môi trường làm việc bảo đảm an toàn cho NVYT.' },
      { code: 'a8', text: 'Bệnh viện bảo đảm an ninh, trật tự cho NVYT làm việc.' },
      { code: 'a9', text: 'Người bệnh và người nhà có thái độ tôn trọng, hợp tác với NVYT trong quá trình điều trị.' },
    ],
  },
  {
    stt: 'B',
    name: 'Sự hài lòng về lãnh đạo trực tiếp, đồng nghiệp',
    questions: [
      { code: 'b1', text: 'Lãnh đạo có năng lực xử lý, điều hành, giải quyết công việc hiệu quả.' },
      { code: 'b2', text: 'Lãnh đạo phân công công việc phù hợp với chuyên môn đào tạo của nhân viên.' },
      { code: 'b3', text: 'Lãnh đạo quan tâm, tôn trọng, đối xử bình đẳng với các NVYT.' },
      { code: 'b4', text: 'Lãnh đạo lắng nghe và tiếp thu ý kiến đóng góp NVYT.' },
      { code: 'b5', text: 'Lãnh đạo động viên, khích lệ nhân viên khi hoàn thành tốt nhiệm vụ, có tiến bộ trong công việc.' },
      { code: 'b6', text: 'Đồng nghiệp có ý thức hợp tác để hoàn thành nhiệm vụ chung.' },
      { code: 'b7', text: 'Môi trường làm việc thân thiện, đoàn kết.' },
      { code: 'b8', text: 'Đồng nghiệp chia sẻ kinh nghiệm, giúp đỡ nhau trong công việc.' },
      { code: 'b9', text: 'Đồng nghiệp quan tâm, giúp đỡ nhau trong cuộc sống.' },
    ],
  },
  {
    stt: 'C',
    name: 'Sự hài lòng về quy chế nội bộ, tiền lương, phúc lợi',
    questions: [
      { code: 'c1', text: 'Các quy định, quy chế làm việc nội bộ của bệnh viện rõ ràng, thực tế và công khai.' },
      { code: 'c2', text: 'Môi trường làm việc tại khoa/phòng và bệnh viện dân chủ.' },
      { code: 'c3', text: 'Quy chế chi tiêu nội bộ công bằng, hợp lý, công khai.' },
      { code: 'c4', text: 'Việc phân phối quỹ phúc lợi công bằng, công khai.' },
      { code: 'c5', text: 'Mức lương tương xứng so với năng lực và cống hiến.' },
      { code: 'c6', text: 'Chế độ phụ cấp nghề và độc hại xứng đáng so với cống hiến.' },
      { code: 'c7', text: 'Thưởng và thu nhập tăng thêm ABC xứng đáng so với cống hiến.' },
      { code: 'c8', text: 'Cách phân chia thu nhập tăng thêm công bằng, khuyến khích nhân viên làm việc tích cực.' },
      { code: 'c9', text: 'Bảo đảm đóng BHXH, BHYT, khám sức khỏe định kỳ và các hình thức hỗ trợ ốm đau, thai sản đầy đủ.' },
      { code: 'c10', text: 'Tổ chức tham quan, nghỉ dưỡng đầy đủ.' },
      { code: 'c11', text: 'Có phong trào thể thao, văn nghệ tích cực.' },
      { code: 'c12', text: 'Công đoàn bệnh viện hoạt động tích cực.' },
    ],
  },
  {
    stt: 'D',
    name: 'Sự hài lòng về công việc, cơ hội học tập và thăng tiến',
    questions: [
      { code: 'd1', text: 'Khối lượng công việc được giao phù hợp.' },
      { code: 'd2', text: 'Công việc chuyên môn đáp ứng nguyện vọng bản thân.' },
      { code: 'd3', text: 'Bệnh viện tạo điều kiện cho NVYT nâng cao trình độ chuyên môn.' },
      { code: 'd4', text: 'Bệnh viện tạo điều kiện cho NVYT học tiếp các bậc cao hơn.' },
      { code: 'd5', text: 'Công khai các tiêu chuẩn cho các chức danh lãnh đạo.' },
      { code: 'd6', text: 'Bổ nhiệm các chức danh lãnh đạo dân chủ, công bằng.' },
      { code: 'd7', text: 'Có cơ hội thăng tiến khi nỗ lực làm việc.' },
    ],
  },
  {
    stt: 'E',
    name: 'Sự hài lòng chung về bệnh viện',
    questions: [
      { code: 'e1', text: 'Cảm thấy tự hào khi được làm việc tại bệnh viện.' },
      { code: 'e2', text: 'Đạt được những thành công cá nhân khi làm việc tại bệnh viện.' },
      { code: 'e3', text: 'Tin tưởng vào sự phát triển của bệnh viện trong tương lai.' },
      { code: 'e4', text: 'Sẽ gắn bó làm việc tại khoa, phòng hiện tại lâu dài.' },
      { code: 'e5', text: 'Sẽ gắn bó làm việc tại bệnh viện lâu dài.' },
      { code: 'e6', text: 'Mức độ hài lòng nói chung về lãnh đạo bệnh viện.' },
      { code: 'e7', text: 'Tự đánh giá về mức độ hoàn thành công việc tại bệnh viện.' },
    ],
  },
];

export const STAFF_CODES = STAFF_SECTIONS.flatMap(s => s.questions.map(q => q.code));

export const isStaffMauByt = (s: any) => STAFF_CODES.some(c => s?.[c] != null);

/**
 * % hài lòng của phiếu NVYT = điểm trung bình các câu chấm điểm × 20.
 * Phiếu mẫu BYT tính trên a1..e7, phiếu mẫu cũ tính trên q1..q13.
 */
export const staffPercent = (s: any): number => {
  const codes = isStaffMauByt(s) ? STAFF_CODES : Array.from({ length: 13 }, (_, i) => `q${i + 1}`);
  let sum = 0;
  let count = 0;
  for (const c of codes) {
    const v = s?.[c];
    if (v != null && v > 0) { sum += v; count++; }
  }
  return count ? Math.round((sum / count) * 20) : 0;
};
