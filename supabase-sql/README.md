# Hướng dẫn sử dụng thư viện SQL Supabase

## Cấu trúc thư mục
- `supabase-sql/users.sql`: Script tạo bảng và policy cho bảng users
- `supabase-sql/products.sql`: Script tạo bảng và policy cho bảng products
- `supabase-sql/orders.sql`: Script tạo bảng và policy cho bảng orders

## Cách sử dụng
1. Đăng nhập Supabase, vào mục SQL Editor.
2. Mở từng file SQL trong thư mục `supabase-sql`.
3. Copy nội dung file và dán vào SQL Editor, chạy từng script để tạo bảng và policy.
4. Kiểm tra lại các bảng và policy đã được tạo trong Supabase.

## Lưu ý về policy
- Policy được thiết lập để bảo vệ dữ liệu, chỉ cho phép owner truy cập/sửa/xóa dữ liệu của mình.
- Có thể chỉnh sửa policy cho phù hợp với nhu cầu thực tế.

## Thêm bảng mới
- Tạo file SQL mới trong thư mục `supabase-sql` với tên phù hợp.
- Viết script tạo bảng và policy tương tự các file mẫu.

## Hỗ trợ
Nếu gặp vấn đề khi khởi tạo bảng hoặc policy, hãy liên hệ qua email hoặc tạo issue trên repository.
