<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Báo Cáo Phân Tích Sự Cố Y Khoa (RCA)</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
            color: #333;
            max-width: 1000px;
            margin-left: auto;
            margin-right: auto;
        }
        h1 {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        h2 {
            text-align: center;
            color: #555;
            font-size: 1.2em;
            margin-top: 0;
            margin-bottom: 30px;
        }
        h3 {
            color: #2980b9;
            margin-top: 30px;
        }
        h4 {
            color: #34495e;
            margin-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #bdc3c7;
            padding: 10px;
            text-align: left;
        }
        th {
            background-color: #ecf0f1;
            font-weight: bold;
        }
        .highlight {
            font-weight: bold;
            color: #c0392b;
        }
        ul {
            margin-top: 0;
            padding-left: 20px;
        }
        li {
            margin-bottom: 8px;
        }
        .text-muted {
            font-size: 0.9em;
            color: #7f8c8d;
        }
    </style>
</head>
<body>

    <h1>BÁO CÁO PHÂN TÍCH SỰ CỐ Y KHOA</h1>
    <h2>(Phân tích nguyên nhân gốc rễ — RCA)</h2>

    <table>
        <tr>
            <th>Mã sự cố</th>
            <td>[Nhập mã sự cố]</td>
            <th>Ngày phân tích</th>
            <td>[dd/mm/yyyy]</td>
        </tr>
        <tr>
            <th>Người bệnh (mã)</th>
            <td>[Mã BN — Giới tính, Tuổi]</td>
            <th>Vào viện</th>
            <td>[Giờ, Ngày]</td>
        </tr>
        <tr>
            <th>Khoa xảy ra sự cố</th>
            <td>[Tên khoa] <br><span class="text-muted"><em>(Vào khoa lúc: [Giờ, Ngày])</em></span></td>
            <th>Khoa tiếp nhận sau</th>
            <td>[Tên khoa] <br><span class="text-muted"><em>(Lúc: [Giờ, Ngày])</em></span></td>
        </tr>
        <tr>
            <th>Thời điểm sự cố</th>
            <td>[Giờ, Ngày]</td>
            <th>Phân loại</th>
            <td>[Bắt buộc báo cáo / Tự nguyện / Khác]</td>
        </tr>
    </table>

    <h3>I. MÔ TẢ SỰ CỐ</h3>
    <ul>
        <li><strong>Tiền sử / Bệnh sử:</strong> [Mô tả ngắn gọn tiền sử bệnh nền, lý do vào viện và tình trạng lúc nhập viện]</li>
        <li><strong>Chẩn đoán ban đầu:</strong> [Ghi nhận chẩn đoán và tiên lượng ban đầu khi vào khoa]</li>
        <li><strong>Diễn biến sự cố:</strong> [Mô tả chi tiết thời điểm phát hiện sự cố, các dấu hiệu lâm sàng bất thường]</li>
        <li><strong>Xử trí sự cố:</strong> [Mô tả các bước cấp cứu, hồi sức và kết quả xử trí ban đầu]</li>
        <li><strong>Diễn tiến sau sự cố:</strong> [Mô tả tình trạng người bệnh sau khi được cấp cứu/chuyển khoa và các kết luận hội chẩn]</li>
    </ul>

    <h3>II. PHÂN LOẠI SỰ CỐ</h3>
    <table>
        <tr>
            <th>Tiêu chí</th>
            <th>Kết quả</th>
        </tr>
        <tr>
            <td><strong>Loại sự cố</strong></td>
            <td>[Nhập loại sự cố, VD: Sự cố liên quan theo dõi/chăm sóc và chẩn đoán...]</td>
        </tr>
        <tr>
            <td><strong>Mức độ tổn hại</strong></td>
            <td><span class="highlight">[Nhập mức độ, VD: NẶNG — Hôn mê, suy đa tạng (NC3 nhóm G–H)]</span></td>
        </tr>
        <tr>
            <td><strong>Phân loại Nguy cơ</strong></td>
            <td>[Nhập phân loại, VD: Hậu quả x Khả năng lặp lại]</td>
        </tr>
        <tr>
            <td><strong>Khả năng phòng ngừa</strong></td>
            <td>[Nhập đánh giá, VD: Có thể phòng ngừa một phần / Không thể phòng ngừa]</td>
        </tr>
        <tr>
            <td><strong>Tính báo cáo</strong></td>
            <td>[BẮT BUỘC báo cáo / Tự nguyện...]</td>
        </tr>
    </table>

    <h3>III. DIỄN BIẾN THEO DẤU CHÂN NGƯỜI BỆNH</h3>
    <table>
        <tr>
            <th>Thời điểm</th>
            <th>Vị trí</th>
            <th>Lâm sàng</th>
            <th>Cận lâm sàng / Xử trí</th>
        </tr>
        <tr>
            <td>[Giờ, Ngày]</td>
            <td>[Khoa/Phòng]</td>
            <td>[Mô tả sinh hiệu, triệu chứng, mức độ chăm sóc...]</td>
            <td>[Mô tả xét nghiệm, chẩn đoán, y lệnh, thuốc...]</td>
        </tr>
        <tr>
            <td>[Giờ, Ngày]</td>
            <td>[Khoa/Phòng]</td>
            <td>[Lưu ý ghi rõ các khoảng trống theo dõi nếu có]</td>
            <td>[...]</td>
        </tr>
        <tr>
            <td>[Giờ, Ngày]</td>
            <td>[Khoa/Phòng]</td>
            <td><span class="highlight">[Thời điểm xảy ra sự cố / Phát hiện sự cố]</span></td>
            <td>[Can thiệp cấp cứu]</td>
        </tr>
        <tr>
            <td>[Giờ, Ngày]</td>
            <td>[Khoa/Phòng]</td>
            <td>[Tình trạng sau cấp cứu / Chuyển khoa]</td>
            <td>[Cận lâm sàng chuyên sâu / Hội chẩn...]</td>
        </tr>
    </table>

    <h3>IV. PHÂN TÍCH LÂM SÀNG – CẬN LÂM SÀNG & TÍNH PHÙ HỢP CỦA XỬ TRÍ</h3>
    <ul>
        <li><strong>Thời điểm 1 — Giai đoạn chẩn đoán & tiếp nhận:</strong> [Đánh giá sự phù hợp của các chỉ định cận lâm sàng, thuốc. Chỉ ra các bất cập về hành chính, phân luồng hoặc đánh giá tiên lượng]</li>
        <li><strong>Thời điểm 2 — Giai đoạn theo dõi trước sự cố:</strong> [Đánh giá việc tuân thủ quy chế chuyên môn, phân cấp chăm sóc, và chỉ ra các thiếu sót/khoảng trống trong công tác theo dõi]</li>
        <li><strong>Thời điểm 3 — Cấp cứu khi xảy ra sự cố:</strong> [Đánh giá tính kịp thời và phác đồ cấp cứu. Lưu ý các tồn tại như không kích hoạt báo động đỏ...]</li>
        <li><strong>Thời điểm 4 — Hồi sức sau sự cố (nếu có):</strong> [Đánh giá tính phù hợp của các can thiệp hồi sức tích cực và hội chẩn]</li>
        <li><strong>Kết luận:</strong> <span class="highlight">[Tóm tắt về tính phù hợp của xử trí chuyên môn và liệt kê các điểm không phù hợp mang tính hệ thống]</span></li>
    </ul>

    <h3>V. PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ (5 nhóm yếu tố)</h3>
    <table>
        <tr>
            <th>Nhóm yếu tố</th>
            <th>Yếu tố đóng góp được nhận diện</th>
        </tr>
        <tr>
            <td><strong>① Người bệnh</strong></td>
            <td>[Các yếu tố từ phía bệnh nhân: bệnh nền nặng, diễn biến phức tạp, tuổi tác...]</td>
        </tr>
        <tr>
            <td><strong>② Nhân viên</strong></td>
            <td>[Các yếu tố từ nhân viên: thiếu sót ghi chép, sai sót nhập liệu, chưa đánh giá đúng mức độ...]</td>
        </tr>
        <tr>
            <td><strong>③ Môi trường/Thiết bị</strong></td>
            <td>[Các yếu tố môi trường/vật tư: thiếu monitor theo dõi, thiết bị hỏng, thiếu buồng cấp cứu...]</td>
        </tr>
        <tr>
            <td><strong>④ Quy trình/Nhiệm vụ</strong></td>
            <td>[Các yếu tố quy trình: thiếu quy định tần suất theo dõi cụ thể, lỗi phần mềm cho phép mâu thuẫn chẩn đoán...]</td>
        </tr>
        <tr>
            <td><strong>⑤ Tổ chức/Quản lý</strong></td>
            <td>[Các yếu tố quản lý: chưa áp dụng thang điểm cảnh báo sớm, giám sát tuân thủ chưa chặt chẽ...]</td>
        </tr>
    </table>
    <p><strong>→ Nguyên nhân gốc rễ xác định:</strong> <span class="highlight">[Đúc kết nguyên nhân cốt lõi nhất từ các yếu tố trên dẫn tới sự cố]</span></p>
    <p><strong>→ Các vấn đề phát hiện thêm:</strong> [Lỗi hồ sơ bệnh án, lỗi sao chép cần hiệu đính...]</p>

    <h3>VI. BÀI HỌC KINH NGHIỆM</h3>
    <ul>
        <li>[Bài học 1: Liên quan đến tuân thủ phân cấp chăm sóc và khoảng trống theo dõi]</li>
        <li>[Bài học 2: Tầm quan trọng của việc sử dụng công cụ cảnh báo sớm (EWS/MEWS)]</li>
        <li>[Bài học 3: Nhận diện và chuyển nhóm bệnh nhân nguy cơ cao đến khu vực hồi sức kịp thời]</li>
        <li>[Bài học 4: Tính nhất quán của hồ sơ bệnh án và thủ tục hành chính]</li>
    </ul>

    <h3>VII. KHUYẾN NGHỊ</h3>
    <h4>1. Giải pháp hệ thống (Ưu tiên)</h4>
    <ul>
        <li><strong>Công cụ & Quy trình:</strong> [Đề xuất thiết lập tiêu chuẩn nhận diện, áp dụng thang điểm cảnh báo, tiêu chí chuyển khoa ICU...]</li>
        <li><strong>Phần mềm / CNTT:</strong> [Đề xuất các tính năng phần mềm giúp ngăn chặn lỗi lặp lại, ràng buộc trường nhập liệu...]</li>
        <li><strong>Kiểm tra / Giám sát:</strong> [Kế hoạch audit định kỳ hồ sơ và tuân thủ quy chế]</li>
    </ul>
    
    <h4>2. Xem xét trách nhiệm cá nhân (Nếu có)</h4>
    <ul>
        <li><strong>Hành chính / Hồ sơ:</strong> [Xác minh nguồn nhập liệu sai sót để khắc phục quy trình hoặc nhắc nhở]</li>
        <li><strong>Chuyên môn / Theo dõi:</strong> [Đánh giá nguyên nhân thiếu sót dựa trên bối cảnh công việc để có phương án đào tạo lại hoặc rút kinh nghiệm]</li>
    </ul>

</body>
</html>