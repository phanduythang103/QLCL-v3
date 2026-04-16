# Hướng dẫn Sử dụng Hệ thống Quản lý Chất lượng QLCL-v3

Chào mừng bạn đến với hệ thống **QLCL-v3** - Giải pháp quản lý chất lượng bệnh viện toàn diện, xây dựng trên nền tảng React và Supabase. Hệ thống được thiết kế nhằm số hóa và tối ưu hóa các hoạt động Quản lý chất lượng theo các quy định hiện hành của Bộ Y tế.

---

## 1. Dashboard (Trang chủ & Tổng quan)
Dashboard cung cấp cái nhìn toàn cảnh về tình hình hoạt động của bệnh viện thông qua các dữ liệu trực quan:
- **Thống số tổng thể**: Theo dõi số lượng nhân sự, các sự cố y khoa mới ghi nhận và tiến độ hoàn thành các tiêu chí chất lượng.
- **Biểu đồ xu hướng**: 
    - **Sự cố y khoa**: Theo dõi diễn biến số lượng sự cố theo tháng.
    - **Xếp hạng đơn vị**: Hiển thị top các khoa/phòng có chỉ số tuân thủ cao hoặc nhiều hoạt động cải tiến.
- **Hoạt động gần đây**: Nhật ký thời gian thực của các thay đổi quan trọng trên hệ thống.
- **Thông báo**: Hệ thống nhắc việc về các kì báo cáo, lịch giám sát sắp tới.

## 2. Quản lý Nhân sự (HR)
Module quản lý vòng đời nhân viên và phân quyền trong hệ thống Quản lý chất lượng:
- **Hồ sơ nhân sự**: Quản lý thông tin chi tiết (Học hàm, học vị, cấp bậc, chức vụ, khen thưởng, kỷ luật).
- **Phân loại mạng lưới**: Gắn nhãn nhân sự thuộc "Hội đồng QLCL", "Mạng lưới QLCL" hoặc "Tổ chấm điểm".
- **Nhập/Xuất dữ liệu**: Hỗ trợ nhập liệu hàng loạt từ file Excel và xuất danh sách nhân sự chuyên nghiệp.
- **Quản lý quyền**: Phân quyền truy cập dựa trên vai trò (Admin, Trưởng khoa, Nhân viên QLCL) đến từng tính năng nhỏ nhất.

## 3. Văn bản & Đào tạo (Docs)
Hệ thống quản trị tri thức và nâng cao năng lực:
- **Thư viện văn bản**: Lưu trữ, phân loại các văn bản quy phạm pháp luật (Thông tư, Nghị định), quy trình kỹ thuật và hướng dẫn nội bộ. Có tính năng tìm kiếm nhanh và xem trực tuyến.
- **Trung tâm đào tạo**: 
    - Lập kế hoạch các khóa đào tạo định kỳ.
    - Quản lý danh sách học viên và theo dõi kết quả đào tạo.
    - Lưu trữ tài liệu giảng dạy.
- **Chia sẻ kiến thức (Wiki/Forum)**: Không gian thảo luận và chia sẻ kinh nghiệm thực tiễn về kiểm soát nhiễm khuẩn, an toàn người bệnh.

## 4. Đánh giá Chất lượng (83 Tiêu chí)
Module cốt lõi phục vụ đánh giá định kỳ theo Bộ tiêu chí chất lượng bệnh viện (Thông tư 19):
- **Cấu hình tiêu chí**: Thiết lập các mức độ đạt được cho từng tiểu mục trong 83 tiêu chí.
- **Đánh giá đa cấp**: 
    - **Khoa tự chấm**: Các khoa/phòng tự đánh giá năng lực theo quý.
    - **Bệnh viện chấm**: Đoàn kiểm tra của bệnh viện tiến hành thẩm định và chốt điểm chính thức.
- **Báo cáo so sánh**: Tự động tính toán điểm trung bình, vẽ biểu đồ hình nhện so sánh giữa các năm hoặc giữa kết quả tự chấm và bệnh viện chấm.

## 5. Quản lý Sự cố Y khoa (Incidents)
Quy trình báo cáo và phân tích sự cố chuyên nghiệp theo Thông tư 43/2018/TT-BYT:
- **Báo cáo sự cố**: Hỗ trợ cả báo cáo tự nguyện (ẩn danh/không ẩn danh) và báo cáo bắt buộc.
- **Phân loại mức độ**: Đánh giá tác động theo 8 mức độ từ 0 đến 7 (từ chưa xảy ra đến tử vong).
- **Phân tích RCA (Root Cause Analysis)**: Công cụ hỗ trợ tìm nguyên nhân gốc rễ và đề xuất giải pháp khắc phục.
- **Dòng thời gian (Timeline)**: Theo dõi trạng thái giải quyết sự cố từ lúc Tiếp nhận -> Xác minh -> Phân tích -> Kết luận.
- **Xuất báo cáo**: Tự động kết xuất mẫu báo cáo sự cố gửi Cục Quân y hoặc cơ quan quản lý.

## 6. Cải tiến Chất lượng (Improvement)
Không gian làm việc cho các sáng kiến và dự án cải tiến:
- **Kế hoạch Cải tiến (KHCTCL)**: 
    - Lập kế hoạch theo cấu trúc chuẩn: Đặt vấn đề, Mục tiêu SMART, Giải pháp thực hiện.
    - Xuất file Word (.docx) chuyên nghiệp chỉ với một click.
- **Theo dõi PDCA**: Quản lý các bước cải tiến nhỏ, linh hoạt.
- **Báo cáo tiến độ**: Cập nhật tình trạng thực hiện (Dự thảo, Đang thực hiện, Hoàn thành, Tạm dừng) kèm theo chứng cứ kết quả.

## 7. Chỉ số Chất lượng (Indicators)
Theo dõi các chỉ số lâm sàng và quản lý quan trọng:
- **Chỉ số Chuyên môn**: 
    - **Giám sát VAP**: Theo dõi số ca mắc và số ngày máy thở, tự động tính tỷ lệ trên 1000 ngày máy thở.
    - **Nhiễm khuẩn bệnh viện**: Theo dõi các loại nhiễm khuẩn khác (SSI, VST...).
- **Chỉ số Quản lý**: Tỷ lệ điều dưỡng/NB, thời gian nằm viện trung bình, tỷ lệ hài lòng người bệnh.
- **Biểu đồ xu hướng**: Theo dõi sự biến động của các chỉ số qua thời gian để kịp thời can thiệp.

## 8. Kiểm tra Giám sát (Supervision)
Công cụ hỗ trợ đi kiểm tra thực tế tại các khoa/phòng:
- **Lịch giám sát**: Thiết lập lịch kiểm tra định kỳ hoặc đột xuất cho từng tổ kiểm tra.
- **Bộ công cụ (Checklist)**: 
  - An toàn phẫu thuật, Vệ sinh tay, Vệ sinh môi trường.
  - Quản lý chất thải, Nhận diện người bệnh.
  - Giám sát hồ sơ bệnh án và sử dụng thuốc.
- **Chấm điểm trực tiếp**: Nhập kết quả ngay trên thiết bị cầm tay, tự động tính tỷ lệ đạt/không đạt.

## 9. Báo cáo & Cấu hình (Reports/Settings)
- **Báo cáo tổng hợp**: Tự động tổng hợp dữ liệu toàn viện để tạo báo cáo định kỳ Tháng, Quý, Năm.
- **Cấu hình hệ thống**: 
    - Danh mục Khoa/Phòng, Chức vụ, Cấp bậc.
    - **Cài đặt AI**: Tích hợp trí tuệ nhân tạo hỗ trợ phân tích dữ liệu và gợi ý chuyên môn.
    - **Phân quyền nâng cao**: Quản lý quyền truy cập chi tiết đến từng nút bấm cho từng người dùng.

---
*Tài liệu này được cập nhật định kỳ theo các phiên bản mới của phần mềm. Mọi thắc mắc vui lòng liên hệ Ban Quản lý Chất lượng.*
