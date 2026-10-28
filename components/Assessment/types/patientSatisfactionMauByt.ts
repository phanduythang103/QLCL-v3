/**
 * Bộ câu hỏi khảo sát hài lòng người bệnh theo mẫu Bộ Y tế
 * (Mẫu số 1 - Nội trú, Mẫu số 2 - Ngoại trú).
 *
 * Điểm từng câu lưu ở cột trùng mã câu (a1, b3, ...) - thang 1-5.
 * Phiếu theo mẫu cũ (trước khi áp dụng mẫu BYT) lưu ở cột q1..q15 và vẫn được giữ để xem lại.
 */

export interface SurveyQuestion {
  code: string; // mã câu, đồng thời là tên cột: a1, b2...
  text: string;
}

export interface SurveySection {
  stt: string;
  name: string;
  questions: SurveyQuestion[];
}

export const HOSPITAL_NAME = 'Bệnh viện Quân y 103';

export const SURVEY_INTRO =
  'Nhằm mục tiêu nâng cao chất lượng khám, chữa bệnh, đáp ứng sự hài lòng người bệnh, Bộ Y tế và bệnh viện tổ chức khảo sát để tìm hiểu nguyện vọng người bệnh. Các ý kiến quý báu này sẽ giúp ngành y tế khắc phục khó khăn, từng bước cải tiến chất lượng để phục vụ người dân tốt hơn. Bộ Y tế bảo đảm giữ bí mật thông tin và không ảnh hưởng đến việc điều trị. Xin trân trọng cảm ơn!';

export const SCALE_OPTIONS = [
  { value: 1, label: 'Rất không hài lòng', alt: 'Rất kém' },
  { value: 2, label: 'Không hài lòng', alt: 'Kém' },
  { value: 3, label: 'Bình thường', alt: 'Trung bình' },
  { value: 4, label: 'Hài lòng', alt: 'Tốt' },
  { value: 5, label: 'Rất hài lòng', alt: 'Rất tốt' },
];

export const GENDER_OPTIONS = [
  { value: 'nam', label: '1. Nam' },
  { value: 'nu', label: '2. Nữ' },
];

export const INPATIENT_SECTIONS: SurveySection[] = [
  {
    stt: 'A',
    name: 'Khả năng tiếp cận',
    questions: [
      { code: 'a1', text: 'Các sơ đồ, biển báo chỉ dẫn đường đến các khoa, phòng trong bệnh viện rõ ràng, dễ hiểu, dễ tìm.' },
      { code: 'a2', text: 'Thời gian vào thăm người bệnh được thông báo rõ ràng.' },
      { code: 'a3', text: 'Các khối nhà, cầu thang, buồng bệnh được đánh số rõ ràng, dễ tìm.' },
      { code: 'a4', text: 'Các lối đi trong bệnh viện, hành lang bằng phẳng, dễ đi.' },
      { code: 'a5', text: 'Người bệnh hỏi và gọi được nhân viên y tế khi cần thiết.' },
    ],
  },
  {
    stt: 'B',
    name: 'Sự minh bạch thông tin và thủ tục khám bệnh, điều trị',
    questions: [
      { code: 'b1', text: 'Quy trình, thủ tục nhập viện rõ ràng, công khai, thuận tiện.' },
      { code: 'b2', text: 'Được phổ biến về nội quy và những thông tin cần thiết khi nằm viện rõ ràng, đầy đủ.' },
      { code: 'b3', text: 'Được giải thích về tình trạng bệnh, phương pháp và thời gian dự kiến điều trị rõ ràng, đầy đủ.' },
      { code: 'b4', text: 'Được giải thích, tư vấn trước khi yêu cầu làm các xét nghiệm, thăm dò, kỹ thuật cao rõ ràng, đầy đủ.' },
      { code: 'b5', text: 'Được công khai và cập nhật thông tin về dùng thuốc và chi phí điều trị.' },
    ],
  },
  {
    stt: 'C',
    name: 'Cơ sở vật chất và phương tiện phục vụ người bệnh',
    questions: [
      { code: 'c1', text: 'Buồng bệnh nằm điều trị khang trang, sạch sẽ, có đầy đủ các thiết bị điều chỉnh nhiệt độ phù hợp như quạt, máy sưởi, hoặc điều hòa.' },
      { code: 'c2', text: 'Giường bệnh, ga, gối đầy đủ cho mỗi người một giường, an toàn, chắc chắn, sử dụng tốt.' },
      { code: 'c3', text: 'Nhà vệ sinh, nhà tắm thuận tiện, sạch sẽ, sử dụng tốt.' },
      { code: 'c4', text: 'Được bảo đảm an toàn, an ninh, trật tự, phòng ngừa trộm cắp, yên tâm khi nằm viện.' },
      { code: 'c5', text: 'Được cung cấp quần áo đầy đủ, sạch sẽ.' },
      { code: 'c6', text: 'Được cung cấp đầy đủ nước uống nóng, lạnh.' },
      { code: 'c7', text: 'Được bảo đảm sự riêng tư khi nằm viện như thay quần áo, khám bệnh, đi vệ sinh tại giường... có rèm che, vách ngăn hoặc nằm riêng.' },
      { code: 'c8', text: 'Căng-tin bệnh viện phục vụ ăn uống và nhu cầu sinh hoạt thiết yếu đầy đủ và chất lượng.' },
      { code: 'c9', text: 'Môi trường trong khuôn viên bệnh viện xanh, sạch, đẹp.' },
    ],
  },
  {
    stt: 'D',
    name: 'Thái độ ứng xử, năng lực chuyên môn của nhân viên y tế',
    questions: [
      { code: 'd1', text: 'Bác sỹ, điều dưỡng có lời nói, thái độ, giao tiếp đúng mực.' },
      { code: 'd2', text: 'Nhân viên phục vụ (hộ lý, bảo vệ, kế toán...) có lời nói, thái độ, giao tiếp đúng mực.' },
      { code: 'd3', text: 'Được nhân viên y tế tôn trọng, đối xử công bằng, quan tâm, giúp đỡ.' },
      { code: 'd4', text: 'Bác sỹ, điều dưỡng hợp tác tốt và xử lý công việc thành thạo, kịp thời.' },
      { code: 'd5', text: 'Được bác sỹ thăm khám, động viên tại phòng điều trị.' },
      { code: 'd6', text: 'Được tư vấn chế độ ăn, vận động, theo dõi và phòng ngừa biến chứng.' },
      { code: 'd7', text: 'Nhân viên y tế không có biểu hiện gợi ý bồi dưỡng.' },
    ],
  },
  {
    stt: 'E',
    name: 'Kết quả cung cấp dịch vụ',
    questions: [
      { code: 'e1', text: 'Cấp phát thuốc và hướng dẫn sử dụng thuốc đầy đủ, chất lượng.' },
      { code: 'e2', text: 'Trang thiết bị, vật tư y tế đầy đủ, hiện đại, đáp ứng nguyện vọng.' },
      { code: 'e3', text: 'Kết quả điều trị đáp ứng được nguyện vọng.' },
      { code: 'e4', text: 'Ông/Bà đánh giá mức độ tin tưởng về chất lượng dịch vụ y tế.' },
      { code: 'e5', text: 'Ông/Bà đánh giá mức độ hài lòng về giá cả dịch vụ y tế.' },
    ],
  },
];

export const OUTPATIENT_SECTIONS: SurveySection[] = [
  {
    stt: 'A',
    name: 'Khả năng tiếp cận',
    questions: [
      { code: 'a1', text: 'Các biển báo, chỉ dẫn đường đến bệnh viện rõ ràng, dễ nhìn, dễ tìm.' },
      { code: 'a2', text: 'Các sơ đồ, biển báo chỉ dẫn đường đến các khoa, phòng trong bệnh viện rõ ràng, dễ hiểu, dễ tìm.' },
      { code: 'a3', text: 'Các khối nhà, cầu thang được đánh số rõ ràng, dễ tìm.' },
      { code: 'a4', text: 'Các lối đi trong bệnh viện, hành lang bằng phẳng, dễ đi.' },
      { code: 'a5', text: 'Có thể tìm hiểu các thông tin và đăng ký khám qua điện thoại, trang tin điện tử của bệnh viện (website) thuận tiện.' },
    ],
  },
  {
    stt: 'B',
    name: 'Sự minh bạch thông tin và thủ tục khám bệnh, điều trị',
    questions: [
      { code: 'b1', text: 'Quy trình khám bệnh được niêm yết rõ ràng, công khai, dễ hiểu.' },
      { code: 'b2', text: 'Các quy trình, thủ tục khám bệnh được cải cách đơn giản, thuận tiện.' },
      { code: 'b3', text: 'Giá dịch vụ y tế niêm yết rõ ràng, công khai.' },
      { code: 'b4', text: 'Nhân viên y tế tiếp đón, hướng dẫn người bệnh làm các thủ tục niềm nở, tận tình.' },
      { code: 'b5', text: 'Được xếp hàng theo thứ tự trước sau khi làm các thủ tục đăng ký, nộp tiền, khám bệnh, xét nghiệm, chiếu chụp.' },
      { code: 'b6', text: 'Đánh giá thời gian chờ đợi làm thủ tục đăng ký khám.' },
      { code: 'b7', text: 'Đánh giá thời gian chờ tới lượt bác sỹ khám.' },
      { code: 'b8', text: 'Đánh giá thời gian được bác sỹ khám và tư vấn.' },
      { code: 'b9', text: 'Đánh giá thời gian chờ làm xét nghiệm, chiếu chụp.' },
      { code: 'b10', text: 'Đánh giá thời gian chờ nhận kết quả xét nghiệm, chiếu chụp.' },
    ],
  },
  {
    stt: 'C',
    name: 'Cơ sở vật chất và phương tiện phục vụ người bệnh',
    questions: [
      { code: 'c1', text: 'Có phòng/sảnh chờ khám sạch sẽ, thoáng mát vào mùa hè; kín gió và ấm áp vào mùa đông.' },
      { code: 'c2', text: 'Phòng chờ có đủ ghế ngồi cho người bệnh và sử dụng tốt.' },
      { code: 'c3', text: 'Phòng chờ có quạt (điều hòa) đầy đủ, hoạt động thường xuyên.' },
      { code: 'c4', text: 'Phòng chờ có các phương tiện giúp người bệnh có tâm lý thoải mái như ti-vi, tranh ảnh, tờ rơi, nước uống...' },
      { code: 'c5', text: 'Được bảo đảm sự riêng tư khi khám bệnh, chiếu chụp, làm thủ thuật.' },
      { code: 'c6', text: 'Nhà vệ sinh thuận tiện, sử dụng tốt, sạch sẽ.' },
      { code: 'c7', text: 'Môi trường trong khuôn viên bệnh viện xanh, sạch, đẹp.' },
      { code: 'c8', text: 'Khu khám bệnh bảo đảm an ninh, trật tự, phòng ngừa trộm cắp cho người dân.' },
    ],
  },
  {
    stt: 'D',
    name: 'Thái độ ứng xử, năng lực chuyên môn của nhân viên y tế',
    questions: [
      { code: 'd1', text: 'Nhân viên y tế (bác sỹ, điều dưỡng) có lời nói, thái độ, giao tiếp đúng mực.' },
      { code: 'd2', text: 'Nhân viên phục vụ (hộ lý, bảo vệ, kế toán…) có lời nói, thái độ, giao tiếp đúng mực.' },
      { code: 'd3', text: 'Được nhân viên y tế tôn trọng, đối xử công bằng, quan tâm, giúp đỡ.' },
      { code: 'd4', text: 'Năng lực chuyên môn của bác sỹ, điều dưỡng đáp ứng mong đợi.' },
    ],
  },
  {
    stt: 'E',
    name: 'Kết quả cung cấp dịch vụ',
    questions: [
      { code: 'e1', text: 'Kết quả khám bệnh đã đáp ứng được nguyện vọng của Ông/Bà.' },
      { code: 'e2', text: 'Các hóa đơn, phiếu thu, đơn thuốc và kết quả khám bệnh được cung cấp đầy đủ, rõ ràng, minh bạch và được giải thích nếu có thắc mắc.' },
      { code: 'e3', text: 'Đánh giá mức độ tin tưởng về chất lượng dịch vụ y tế.' },
      { code: 'e4', text: 'Đánh giá mức độ hài lòng về giá cả dịch vụ y tế.' },
    ],
  },
];

/** G2 (nội trú) - mã "6" là Khác (ghi rõ) */
export const INPATIENT_RETURN_OPTIONS = [
  { value: '1', label: 'Chắc chắn không bao giờ quay lại' },
  { value: '2', label: 'Không muốn quay lại nhưng có ít lựa chọn khác' },
  { value: '3', label: 'Muốn chuyển tuyến sang bệnh viện khác' },
  { value: '4', label: 'Có thể sẽ quay lại' },
  { value: '5', label: 'Chắc chắn sẽ quay lại hoặc giới thiệu cho người khác' },
  { value: '6', label: 'Khác (ghi rõ)' },
];
export const INPATIENT_RETURN_OTHER = '6';

/** G (ngoại trú) - mã "5" là Khác (ghi rõ) */
export const OUTPATIENT_RETURN_OPTIONS = [
  { value: '1', label: 'Chắc chắn không bao giờ quay lại' },
  { value: '2', label: 'Không muốn quay lại nhưng có ít lựa chọn khác' },
  { value: '3', label: 'Có thể sẽ quay lại' },
  { value: '4', label: 'Chắc chắn sẽ quay lại hoặc giới thiệu cho người khác' },
  { value: '5', label: 'Khác (ghi rõ)' },
];
export const OUTPATIENT_RETURN_OTHER = '5';

/** Nhãn dự định quay lại, gồm cả mã của mẫu cũ (no/maybe/yes) */
export const returnIntentLabel = (
  value: string | null | undefined,
  options: { value: string; label: string }[],
  other?: string | null,
) => {
  if (!value) return '';
  const legacy: Record<string, string> = { no: 'Chắc chắn không', maybe: 'Có thể', yes: 'Chắc chắn' };
  if (legacy[value]) return legacy[value];
  const label = options.find(o => o.value === value)?.label || value;
  return other ? `${label}: ${other}` : label;
};

export const allQuestions = (sections: SurveySection[]) => sections.flatMap(s => s.questions);

/** Phiếu theo mẫu BYT khi có ít nhất một câu a..e được chấm */
export const isMauByt = (record: any, sections: SurveySection[]) =>
  allQuestions(sections).some(q => record?.[q.code] != null);

// ── Mẫu cũ (chỉ dùng để hiển thị lại các phiếu đã thu trước khi đổi mẫu) ──

export const LEGACY_INPATIENT_QUESTIONS: SurveyQuestion[] = [
  { code: 'q1', text: 'Thời gian chờ đợi và mật độ sử dụng thang máy' },
  { code: 'q2', text: 'Sự hỗ trợ di chuyển bệnh nhân giữa các khu vực' },
  { code: 'q3', text: 'Thời gian thực hiện thủ tục ra viện' },
  { code: 'q4', text: 'Bác sĩ giải thích tình trạng bệnh rõ ràng' },
  { code: 'q5', text: 'Wifi/Internet tại buồng bệnh' },
  { code: 'q6', text: 'Vệ sinh buồng bệnh và nhà vệ sinh' },
  { code: 'q7', text: 'Đảm bảo sự riêng tư' },
  { code: 'q8', text: 'Tình trạng giường bệnh' },
  { code: 'q9', text: 'Nhân viên không sử dụng điện thoại khi làm việc' },
  { code: 'q10', text: 'Thái độ bảo vệ, hành chính, phát cơm' },
  { code: 'q11', text: 'Cung ứng thuốc/vật tư' },
  { code: 'q12', text: 'Chất lượng chế độ ăn' },
];

export const LEGACY_OUTPATIENT_QUESTIONS: SurveyQuestion[] = [
  { code: 'q1', text: 'Sự thuận tiện tại khu vực gửi xe' },
  { code: 'q2', text: 'Phân luồng Quân - Dân rõ ràng' },
  { code: 'q3', text: 'Biển báo và hướng dẫn tại sảnh' },
  { code: 'q4', text: 'Thời gian đăng ký và thanh toán' },
  { code: 'q5', text: 'Chờ siêu âm, chiếu chụp' },
  { code: 'q6', text: 'Thời gian trả kết quả xét nghiệm' },
  { code: 'q7', text: 'Ghế ngồi chờ' },
  { code: 'q8', text: 'Nhà vệ sinh' },
  { code: 'q9', text: 'Wifi' },
  { code: 'q10', text: 'Thái độ nhân viên hành chính' },
  { code: 'q11', text: 'Bác sĩ tư vấn, lắng nghe' },
  { code: 'q12', text: 'Thực hiện kỹ thuật của học viên' },
  { code: 'q13', text: 'Không dùng điện thoại khi làm việc' },
  { code: 'q14', text: 'Tin tưởng kết quả chẩn đoán' },
  { code: 'q15', text: 'Minh bạch chi phí' },
];

/**
 * % hài lòng của phiếu ngoại trú: mẫu BYT dùng câu F (% đáp ứng mong đợi);
 * phiếu mẫu cũ không có câu này nên quy đổi từ điểm trung bình q1..q15.
 */
export const outpatientPercent = (s: any): number => {
  if (s?.satisfaction_percent != null) return Number(s.satisfaction_percent) || 0;
  let total = 0;
  let count = 0;
  for (let i = 1; i <= 15; i++) {
    const val = s?.[`q${i}`];
    if (val && val > 0) { total += val; count++; }
  }
  return count ? Math.round((total / (count * 5)) * 100) : 0;
};
