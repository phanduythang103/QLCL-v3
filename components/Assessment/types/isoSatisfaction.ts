/**
 * Khảo sát hài lòng khách hàng (lâm sàng) đối với dịch vụ xét nghiệm - phục vụ ISO 15189.
 * Mỗi khoa xét nghiệm có một mẫu phiếu riêng; câu trả lời lưu trong cột JSONB `answers`
 * theo mã câu (q1, q2... / a1, b3...), bảng `ks_hai_long_iso`.
 */

export interface IsoOption {
  value: string;
  label: string;
  /** Lựa chọn "Khác" - cần ô ghi rõ (lưu ở `${code}_other`) */
  other?: boolean;
}

export interface IsoScaleLevel {
  value: number;
  label: string;
  /** Dòng phụ dưới nhãn, VD "(4 điểm)" */
  sub?: string;
}

export type IsoQuestion =
  /** Câu chấm theo thang điểm của nhóm */
  | { type: 'rating'; code: string; text: string }
  /** Câu trả lời tự do */
  | { type: 'text'; code: string; text: string; multiline?: boolean; placeholder?: string }
  /** Chọn một đáp án */
  | { type: 'single'; code: string; text: string; options: IsoOption[]; inline?: boolean }
  /** Chọn nhiều đáp án */
  | { type: 'multi'; code: string; text: string; options: IsoOption[] };

export interface IsoGroup {
  title?: string;
  note?: string;
  /** Nhóm câu chấm điểm hiển thị dạng bảng (cột TT | Nội dung | các mức) */
  table?: boolean;
  /** Thang điểm của bảng (mặc định theo phiếu) */
  scale?: IsoScaleLevel[];
  /** Tiêu đề cột mức đánh giá */
  scaleTitle?: string;
  /** Không tính vào % hài lòng (VD bảng mức độ ưu tiên) */
  noScore?: boolean;
  questions: IsoQuestion[];
}

export interface IsoForm {
  key: string;
  /** Tên khoa xét nghiệm (dùng trong danh sách, bộ lọc) */
  khoa: string;
  subtitle: string;
  /** Tiêu đề phiếu (dòng in hoa) */
  title?: string;
  /** Hiển thị dòng "HỌC VIỆN QUÂN Y / BỆNH VIỆN QUÂN Y 103" */
  orgHeader?: boolean;
  intro?: string[];
  instruction?: string;
  scale: IsoScaleLevel[];
  groups: IsoGroup[];
  closing: string;
}

/** Thang 5 mức Rất tốt (4 điểm) ... Kém (0 điểm) */
const SCALE_4_0: IsoScaleLevel[] = [
  { value: 4, label: 'Rất tốt', sub: '(4 điểm)' },
  { value: 3, label: 'Tốt', sub: '(3 điểm)' },
  { value: 2, label: 'Khá', sub: '(2 điểm)' },
  { value: 1, label: 'Trung bình', sub: '(1 điểm)' },
  { value: 0, label: 'Kém', sub: '(0 điểm)' },
];

/** Thang hài lòng 5 mức, quy về điểm 4..0 để tính % như các phiếu khác */
const SCALE_HAI_LONG: IsoScaleLevel[] = [
  { value: 4, label: 'Rất hài lòng' },
  { value: 3, label: 'Hài lòng' },
  { value: 2, label: 'Bình thường' },
  { value: 1, label: 'Không hài lòng' },
  { value: 0, label: 'Hoàn toàn không hài lòng' },
];

/** Thang mức độ ưu tiên 1-5 (phiếu Sinh hóa, phần E) */
const SCALE_UU_TIEN: IsoScaleLevel[] = [
  { value: 1, label: '1', sub: 'Không cần thiết' },
  { value: 2, label: '2', sub: 'Ít cần thiết' },
  { value: 3, label: '3', sub: 'Bình thường' },
  { value: 4, label: '4', sub: 'Cần thiết' },
  { value: 5, label: '5', sub: 'Rất cần thiết' },
];

const thanks = (khoa: string) =>
  `Xin trân trọng cảm ơn quý đồng nghiệp đã tin tưởng, hợp tác với ${khoa} trong thời gian qua. Để ngày càng hoàn thiện việc đáp ứng yêu cầu của Lâm sàng và nâng cao chất lượng công tác xét nghiệm, xin quý đồng nghiệp vui lòng dành chút thời gian cho nhận xét và đánh giá theo bảng câu hỏi dưới đây.`;

const r = (code: string, text: string): IsoQuestion => ({ type: 'rating', code, text });
const t = (code: string, text: string, multiline = true): IsoQuestion => ({ type: 'text', code, text, multiline });
const opts = (...labels: string[]): IsoOption[] =>
  labels.map((label, i) => ({ value: String(i + 1), label: label.replace(/:$/, ''), other: label.endsWith(':') }));

export const ISO_FORMS: IsoForm[] = [
  {
    key: 'huyet_hoc',
    khoa: 'Huyết học – Truyền máu',
    subtitle: 'Bác sĩ và điều dưỡng lâm sàng sử dụng dịch vụ xét nghiệm của Trung tâm Huyết học – Truyền máu',
    orgHeader: true,
    intro: [thanks('Trung tâm Huyết học-Truyền máu')],
    instruction: 'Sử dụng dấu X để tích vào ô MỨC ĐỘ ĐÁNH GIÁ cho là phù hợp',
    scale: SCALE_4_0,
    groups: [
      {
        table: true,
        questions: [
          r('q1', 'Đánh giá chung về hoạt động cung cấp dịch vụ của Khoa Huyết học – Truyền máu?'),
          r('q2', 'Việc cung cấp thông tin liên quan đến các xét nghiệm của BMTT Huyết học – Truyền máu đã tốt chưa?'),
          r('q3', 'Quý đồng nghiệp đánh giá thế nào về khâu tiếp nhận bệnh phẩm tại BMTT Huyết học – Truyền máu?'),
          r('q4', 'Quý đồng nghiệp đánh giá thế nào về quy trình cấp, phát máu tại BMTT Huyết học – Truyền máu?'),
          r('q5', 'Kết quả xét nghiệm có chính xác, kịp thời, đáp ứng nhu cầu điều trị của khoa lâm sàng?'),
          r('q6', 'Thái độ ứng xử, giao tiếp của cán bộ nhân viên BMTT Huyết học – Truyền máu như thế nào?'),
          r('q7', 'Việc trao đổi thông tin hai chiều của BMTT Huyết học-Truyền máu với các Khoa lâm sàng có thường xuyên, kịp thời không?'),
        ],
      },
      {
        title: 'II. Xin Quý đồng nghiệp vui lòng dành chút thời gian trả lời những câu hỏi dưới đây:',
        questions: [
          t('y1', '1. Trong thời gian tới quý đồng nghiệp mong muốn Bộ môn Trung tâm Huyết học – Truyền máu triển khai thêm những xét nghiệm nào?'),
          t('y2', '2. Những vấn đề quý đồng nghiệp góp ý thêm về hoạt động xét nghiệm của Bộ môn khoa Huyết học – Truyền máu, Bệnh viện Quân y 103 hiện nay?'),
        ],
      },
    ],
    closing: 'Xin trân trọng cảm ơn!',
  },
  {
    key: 'sinh_hoa',
    khoa: 'Sinh hóa',
    subtitle: 'Bác sĩ và điều dưỡng lâm sàng sử dụng dịch vụ xét nghiệm của Khoa Sinh hóa',
    intro: [
      'Kính gửi đồng chí/anh/chị,',
      'Khảo sát nhằm tìm hiểu nhận thức, nhu cầu sử dụng và ý kiến của nhân viên y tế về giá trị báo động (critical values) và khoảng tham chiếu lâm sàng của các xét nghiệm sinh hóa tại Bệnh viện Quân y 103. Kết quả được tổng hợp phục vụ cải tiến chất lượng xét nghiệm và phối hợp lâm sàng. Vui lòng trả lời theo thực tế công tác; không ghi họ tên, mã bệnh nhân hoặc thông tin định danh người bệnh.',
      'Thời gian dự kiến: 5–8 phút. Việc tham gia là tự nguyện. Phiếu này không thay thế quy trình báo động, hướng dẫn chuyên môn hoặc quy định hiện hành của bệnh viện.',
    ],
    scale: SCALE_UU_TIEN,
    groups: [
      {
        title: 'PHẦN A. THÔNG TIN CHUNG',
        questions: [
          t('a1', 'A1. Đơn vị công tác:', false),
          { type: 'single', code: 'a2', text: 'A2. Chức danh/vị trí công tác (chọn một):', options: opts('Bác sĩ điều trị', 'Bác sĩ cấp cứu/hồi sức', 'Bác sĩ cận lâm sàng', 'Điều dưỡng', 'Kỹ thuật viên xét nghiệm', 'Dược sĩ', 'Khác:') },
          { type: 'single', code: 'a3', text: 'A3. Thâm niên công tác:', inline: true, options: opts('< 5 năm', '5–10 năm', '11–20 năm', '> 20 năm') },
          t('a4', 'A4. Khoa/phòng thường xuyên sử dụng kết quả xét nghiệm sinh hóa:', false),
          { type: 'single', code: 'a5', text: 'A5. Tần suất sử dụng/đọc kết quả xét nghiệm sinh hóa:', inline: true, options: opts('Hằng ngày', 'Hằng tuần', 'Ít hơn hằng tuần') },
        ],
      },
      {
        title: 'PHẦN B. NHẬN THỨC VÀ THỰC HÀNH VỀ GIÁ TRỊ BÁO ĐỘNG',
        questions: [
          { type: 'single', code: 'b1', text: 'B1. Anh/chị đã từng được phổ biến hoặc đào tạo về giá trị báo động của xét nghiệm sinh hóa chưa?', options: opts('Đào tạo chính thức', 'Được phổ biến tại đơn vị', 'Tự tìm hiểu', 'Chưa từng') },
          { type: 'single', code: 'b2', text: 'B2. Anh/chị có biết nơi tra cứu danh mục và ngưỡng giá trị báo động đang áp dụng tại bệnh viện không?', options: opts('Biết rõ và tra cứu được', 'Có biết nhưng khó tra cứu', 'Không biết') },
          { type: 'multi', code: 'b3', text: 'B3. Khi nhận được kết quả xét nghiệm có cảnh báo/giá trị báo động, anh/chị thường làm gì? (có thể chọn nhiều)', options: opts('Đọc/xác nhận kết quả và thông tin người bệnh', 'Liên hệ bộ phận xét nghiệm', 'Báo bác sĩ/điều dưỡng phụ trách', 'Đánh giá tình trạng lâm sàng và xử trí theo quy trình', 'Tra cứu hướng dẫn của bệnh viện', 'Khác:') },
          { type: 'single', code: 'b4', text: 'B4. Việc thông báo kết quả báo động hiện nay có thuận lợi không?', inline: true, options: opts('Rất thuận lợi', 'Thuận lợi', 'Bình thường', 'Chưa thuận lợi', 'Rất chưa thuận lợi') },
          { type: 'multi', code: 'b5', text: 'B5. Khó khăn thường gặp (có thể chọn nhiều):', options: opts('Chưa rõ ngưỡng báo động', 'Khó liên hệ người nhận', 'Chưa rõ thời hạn phản hồi', 'Quy trình giữa các đơn vị chưa thống nhất', 'Cảnh báo trên hệ thống chưa thuận tiện', 'Khác:') },
        ],
      },
      {
        title: 'PHẦN C. NHU CẦU VÀ Ý KIẾN VỀ GIÁ TRỊ BÁO ĐỘNG',
        questions: [
          { type: 'multi', code: 'c1', text: 'C1. Danh mục giá trị báo động nên được trình bày như thế nào? (có thể chọn nhiều)', options: opts('Bảng giấy tại khoa/phòng', 'Tài liệu điện tử trên mạng nội bộ', 'Hiển thị trên LIS/HIS', 'Cảnh báo trực tiếp trên kết quả', 'Ứng dụng/QR tra cứu', 'Khác:') },
          { type: 'multi', code: 'c2', text: 'C2. Thông tin cần có trong danh mục (có thể chọn nhiều):', options: opts('Tên xét nghiệm', 'Ngưỡng thấp/cao và đơn vị đo', 'Đối tượng áp dụng', 'Quy trình thông báo và xác nhận đã nhận tin', 'Thời gian yêu cầu thông báo', 'Hướng dẫn xử trí/đầu mối liên hệ', 'Ngày ban hành và phiên bản tài liệu') },
          t('c3', 'C3. Xét nghiệm sinh hóa nào cần bổ sung, xem xét hoặc điều chỉnh ngưỡng báo động?'),
          { type: 'single', code: 'c4', text: 'C4. Tần suất cần đào tạo/nhắc lại về giá trị báo động:', inline: true, options: opts('Khi nhận việc', 'Hằng năm', 'Khi quy trình thay đổi', 'Khác:') },
        ],
      },
      {
        title: 'PHẦN D. KHOẢNG THAM CHIẾU LÂM SÀNG',
        questions: [
          { type: 'single', code: 'd1', text: 'D1. Đánh giá mức độ phù hợp của các khoảng tham chiếu hiện đang áp dụng. Theo anh/chị, các khoảng tham chiếu đang hiển thị trên phiếu kết quả xét nghiệm sinh hóa hiện nay phù hợp ở mức độ nào với nhóm người bệnh mà đơn vị đang tiếp nhận?', inline: true, options: opts('Rất phù hợp', 'Khá phù hợp', 'Chỉ phù hợp một phần', 'Không phù hợp', 'Chưa đủ thông tin để đánh giá') },
          { type: 'single', code: 'd1a', text: 'D1a. Với các xét nghiệm thường sử dụng tại đơn vị, anh/chị có nhận thấy khoảng tham chiếu hiện tại cần được rà soát hoặc điều chỉnh không?', inline: true, options: opts('Không cần điều chỉnh', 'Cần rà soát một số xét nghiệm', 'Cần rà soát nhiều xét nghiệm', 'Chưa có ý kiến') },
          t('d1b_ten', 'D1b. Nếu cho rằng cần rà soát, vui lòng ghi: Tên xét nghiệm', false),
          t('d1b_don_vi', 'Đơn vị:', false),
          t('d1b_khoang', 'Khoảng tham chiếu hiện tại:', false),
          t('d1b_de_xuat', 'Đề xuất/ý kiến:', false),
          t('d1b_ly_do', 'Lý do (ví dụ: tuổi/giới/đối tượng người bệnh, phương pháp hoặc hệ thống xét nghiệm, đơn vị đo, nguồn tài liệu):'),
          { type: 'multi', code: 'd1c', text: 'D1c. Theo anh/chị, khoảng tham chiếu hiện tại có khác biệt hoặc gây khó khăn khi áp dụng cho nhóm người bệnh nào không? (có thể chọn nhiều)', options: opts('Trẻ em', 'Người cao tuổi', 'Nam/nữ', 'Phụ nữ có thai', 'Người bệnh nội trú', 'Người bệnh ngoại trú', 'Nhóm khác:', 'Không nhận thấy') },
          { type: 'single', code: 'd2', text: 'D2. Anh/chị có phân biệt được', inline: true, options: opts('Phân biệt rõ', 'Hiểu một phần', 'Chưa rõ') },
          { type: 'single', code: 'd3', text: 'D3. Khi đọc kết quả xét nghiệm', inline: true, options: opts('Luôn luôn', 'Thường xuyên', 'Thỉnh thoảng', 'Hiếm khi', 'Không bao giờ') },
          { type: 'single', code: 'd4', text: 'D4. Khoảng tham chiếu trên phiếu kết quả', inline: true, options: opts('Rất phù hợp', 'Khá phù hợp', 'Chưa rõ', 'Chưa phù hợp', 'Không có ý kiến') },
          { type: 'multi', code: 'd5', text: 'D5. Các yếu tố cần lưu ý', options: opts('Tuổi', 'Giới', 'Thai kỳ', 'Loại mẫu bệnh phẩm', 'Phương pháp/hệ thống xét nghiệm', 'Đơn vị đo', 'Nguồn tài liệu và ngày cập nhật', 'Khác:') },
          { type: 'single', code: 'd6', text: 'D6. Anh/chị từng gặp trường hợp', inline: true, options: opts('Có', 'Không', 'Không nhớ/không chắc') },
          t('d6_mo_ta', 'Nếu có, mô tả tình huống chung, không ghi thông tin định danh người bệnh:'),
        ],
      },
      {
        title: 'PHẦN E. ĐÁNH GIÁ MỨC ĐỘ ƯU TIÊN',
        note: 'Đánh dấu một mức độ: 1 = Không cần thiết; 2 = Ít cần thiết; 3 = Bình thường; 4 = Cần thiết; 5 = Rất cần thiết.',
        table: true,
        scale: SCALE_UU_TIEN,
        scaleTitle: 'Mức độ',
        noScore: true,
        questions: [
          r('e1', 'Chuẩn hóa, cập nhật danh mục giá trị báo động'),
          r('e2', 'Chuẩn hóa quy trình thông báo và xác nhận kết quả báo động'),
          r('e3', 'Công khai, dễ tra cứu khoảng tham chiếu đang áp dụng'),
          r('e4', 'Rà soát khoảng tham chiếu theo phương pháp/hệ thống xét nghiệm'),
          r('e5', 'Đào tạo liên khoa về diễn giải kết quả sinh hóa'),
          r('e6', 'Tích hợp cảnh báo và khoảng tham chiếu vào LIS/HIS'),
        ],
      },
      {
        title: 'PHẦN F. Ý KIẾN ĐỀ XUẤT',
        questions: [
          t('f1_1', 'F1. Ba vấn đề ưu tiên nhất cần cải thiện: 1.', false),
          t('f1_2', '2.', false),
          t('f1_3', '3.', false),
          t('f2', 'F2. Đề xuất khác về giá trị báo động hoặc khoảng tham chiếu lâm sàng:'),
        ],
      },
    ],
    closing: 'Xin cảm ơn anh/chị đã tham gia khảo sát.',
  },
  {
    key: 'vi_sinh',
    khoa: 'Vi sinh vật',
    subtitle: 'Bác sĩ và điều dưỡng lâm sàng sử dụng dịch vụ xét nghiệm của Khoa Vi sinh vật',
    orgHeader: true,
    intro: [thanks('Khoa Vi sinh vật')],
    instruction: '(Quý đồng nghiệp đánh dấu X vào các ô trống tương ứng với mức độ hài lòng)',
    scale: SCALE_4_0,
    groups: [
      {
        table: true,
        questions: [
          r('q1', 'Danh mục xét nghiệm đáp ứng yêu cầu của các khoa LS?'),
          t('q2', 'Nếu có nhu cầu, anh chị muốn triển khai thêm XN nào?'),
          r('q3', 'Công tác giới thiệu xét nghiệm của khoa đến lâm sàng?'),
          t('q4', 'Anh chị muốn được giới thiệu XN qua hình thức nào?'),
          r('q5', 'Công tác hướng dẫn cách lấy, bảo quản, vận chuyển bệnh phẩm?'),
          t('q6', 'Có nội dung nào về cách lấy, vận chuyển, bảo quản bệnh phẩm anh chị cần làm rõ thêm?'),
          r('q7', 'Việc cấp phát dụng cụ, vật tư xét nghiệm chuyên dụng từ khoa Vi sinh?'),
          r('q8', 'Chỉ định xét nghiệm trên hệ thống (dễ tìm, thuận tiện)?'),
          t('q9', 'Anh chị thấy có xét nghiệm nào khó tìm, khó chỉ định?'),
          r('q10', 'Chất lượng kết quả xét nghiệm phù hợp với lâm sàng và người bệnh ở mức độ nào?'),
          t('q11', 'Nếu có, anh chị cho biết xét nghiệm nào có kết quả chưa phù hợp với lâm sàng?'),
          r('q12', 'Thời gian, hình thức trả kết quả xét nghiệm qua hệ thống mạng bệnh viện nhanh chóng, thuận tiện?'),
          t('q13', 'Anh chị có phát hiện ra xét nghiệm nào mà kết quả trả qua mạng không phù hợp, đầy đủ như kết quả giấy?'),
          r('q14', 'Thời gian, hình thức trả kết quả xét nghiệm phiếu in, ký?'),
          r('q15', 'Nội dung trên phiếu trả kết quả có đầy đủ dễ hiểu?'),
          t('q16', 'Có nội dung nào trên phiếu trả kết quả anh chị cần làm rõ hơn hoặc bổ sung?'),
          r('q17', 'Việc trao đổi thông tin với khoa LS kịp thời, hiệu quả?'),
          r('q18', 'Thái độ ứng xử, giao tiếp của cán bộ nhân viên phù hợp?'),
        ],
      },
      {
        title: 'Xin anh/ chị vui lòng dành chút thời gian trả lời những câu hỏi dưới đây:',
        questions: [
          t('y1', 'Những vấn đề anh/ chị muốn góp ý thêm về công tác xét nghiệm của Khoa Vi sinh vật hiện nay?'),
        ],
      },
    ],
    closing: 'Xin trân trọng cảm ơn!',
  },
  {
    key: 'giai_phau_benh',
    khoa: 'Giải phẫu bệnh lý – Pháp y',
    subtitle: 'Bác sĩ và điều dưỡng lâm sàng sử dụng dịch vụ xét nghiệm của Khoa Giải phẫu bệnh lý – Pháp y',
    orgHeader: true,
    intro: [thanks('Khoa Giải phẫu bệnh lý, Pháp y')],
    instruction: '(Quý đồng nghiệp đánh dấu X vào các ô trống tương ứng với mức độ hài lòng)',
    scale: SCALE_4_0,
    groups: [
      {
        table: true,
        questions: [
          r('q1', 'Đánh giá về mức độ đầy đủ, rõ ràng, chi tiết của các nội dung các phiếu xét nghiệm chuyên ngành Giải phẫu bệnh (nói chung).'),
          r('q2', 'Đánh giá công tác hướng dẫn quy trình lấy bệnh phẩm, bảo quản và vận chuyển bệnh phẩm.'),
          r('q3', 'Đánh giá thế nào về khâu tiếp nhận bệnh phẩm.'),
          r('q4', 'Đánh giá sự phân chia thời gian trực ngoài giờ hành chính.'),
          r('q5', 'Đánh giá về thời gian trả kết quả xét nghiệm Giải phẫu bệnh.'),
          r('q6', 'Đánh giá về độ chính xác của kết quả xét nghiệm và nhu cầu của BMK lâm sàng của mình.'),
          r('q7', 'Đánh giá việc trao đổi thông tin hai chiều của BMK Giải phẫu bệnh lý với các BMK lâm sàng.'),
          r('q8', 'Đánh giá về biển chỉ dẫn đường đến BMK C6.'),
          r('q9', 'Đánh giá sự bố trí phòng trực, phòng tiếp nhận bệnh phẩm tại BMK.'),
          r('q10', 'Đánh giá về mức độ an toàn của môi trường làm việc tại BMK.'),
          r('q11', 'Đánh giá về trang phục bảo hộ khi làm việc của NVYT tại BMK.'),
        ],
      },
      {
        title: 'Xin Quý đồng nghiệp vui lòng dành chút thời gian trả lời thêm hai câu sau:',
        questions: [
          t('y1', 'Trong thời gian tới quý đồng nghiệp mong muốn Bộ môn - Khoa Giải phẫu bệnh lý, Pháp y triển khai thêm những xét nghiệm nào?'),
          t('y2', 'Những vấn đề quý đồng nghiệp muốn góp ý thêm về hoạt động xét nghiệm của Bộ môn - Khoa Giải phẫu bệnh lý, Pháp y; Bệnh viện Quân y 103 hiện nay là gì?'),
        ],
      },
    ],
    closing: 'Xin trân trọng cảm ơn!',
  },
  {
    key: 'sinh_hoc_phan_tu',
    khoa: 'Sinh học phân tử',
    subtitle: 'Bác sĩ và điều dưỡng lâm sàng sử dụng dịch vụ xét nghiệm của Khoa Sinh học phân tử',
    scale: SCALE_HAI_LONG,
    groups: [
      {
        table: true,
        scaleTitle: 'Kết quả',
        questions: [
          r('q1', 'Anh/chị có hài lòng về thông tin được giới thiệu về các xét nghiệm của Khoa Sinh học phân tử không?'),
          r('q2', 'Anh/chị đánh giá thế nào về việc chỉ định hoặc đăng ký xét nghiệm (có rõ ràng và thuận tiện không)?'),
          r('q3', 'Mức độ hài lòng của anh/chị về thông tin kết quả được in ra trên phiếu xét nghiệm?'),
          r('q4', 'Anh/chị có hài lòng thời gian trả kết quả xét nghiệm không?'),
          r('q5', 'Nếu kết quả cần xác nhận hoặc chạy lại, anh/chị có hài lòng về thời gian xử lý sự cố không?'),
          r('q6', 'Anh/chị có hài lòng về các biện pháp kiểm soát nhiễm khuẩn (sử dụng găng tay, khẩu trang,…) được nhân viên thực hiện không?'),
          r('q7', 'Kết quả xét nghiệm của Khoa Sinh học phân tử có phù hợp với lâm sàng hay không?'),
          r('q8', 'Anh/chị đánh giá thế nào về thái độ ứng xử, giao tiếp của cán bộ, nhân viên Khoa Sinh học phân tử?'),
          r('q9', 'Anh/chị đánh giá thế nào về việc trao đổi thông tin hai chiều của Khoa Sinh học phân tử với người sử dụng dịch vụ có được liên tục, chính xác, kịp thời?'),
        ],
      },
    ],
    closing: 'Xin trân trọng cảm ơn!',
  },
];

export const getIsoForm = (key?: string | null) => ISO_FORMS.find(f => f.key === key);

/** Các câu chấm điểm tính vào % hài lòng (bỏ qua bảng ưu tiên), kèm điểm tối đa */
export const isoScoredQuestions = (form: IsoForm) =>
  form.groups
    .filter(g => g.table && !g.noScore)
    .flatMap(g => {
      const max = Math.max(...(g.scale || form.scale).map(s => s.value));
      return g.questions.filter(q => q.type === 'rating').map(q => ({ code: q.code, max }));
    });

/**
 * % hài lòng = tổng điểm các câu chấm / tổng điểm tối đa của các câu đã chấm.
 * Trả về null nếu phiếu không có câu chấm điểm hài lòng (VD phiếu Sinh hóa).
 */
export const isoPercent = (form: IsoForm | undefined, answers: Record<string, any> | null | undefined): number | null => {
  if (!form) return null;
  let sum = 0;
  let max = 0;
  for (const q of isoScoredQuestions(form)) {
    const v = answers?.[q.code];
    if (typeof v === 'number') { sum += v; max += q.max; }
  }
  return max ? Math.round((sum / max) * 100) : null;
};

export interface IsoSurveyResponse {
  id?: string;
  mau: string;                     // khoá mẫu phiếu (khoa xét nghiệm)
  answers: Record<string, any>;    // câu trả lời theo mã câu
  satisfaction_percent?: number | null;
  ngay_khao_sat?: string;
  created_at?: string;
}
