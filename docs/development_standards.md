# Hướng dẫn Tiêu chuẩn Phát triển Web: Ruler, CSS, UI/UX & App Structure

Tài liệu này tổng hợp các quy chuẩn thiết kế và kiến trúc phần mềm đang được áp dụng cho dự án **Hệ thống Quản lý Chất lượng (QLCL-v3)**.

---

## 1. Ruler & Layout (Quy chuẩn Căn chỉnh)

Trong thiết kế giao diện (UI), "Ruler" đại diện cho hệ thống lưới và quy tắc khoảng cách để tạo ra sự nhất quán.

*   **8pt Grid System**: Sử dụng bội số của 8 (8, 16, 24, 32, 40...) cho tất cả các khoảng cách (margin, padding) và kích thước thành phần.
*   **Visual Balance**: Căn lề nhất quán. Header thường căn giữa để tạo sự trang trọng, trong khi nội dung chi tiết căn trái để tối ưu khả năng đọc.
*   **Safe Areas (Mobile)**: Luôn chừa khoảng trống ít nhất 16px-24px ở hai bên mép màn hình để tránh bị che khuất bởi các thành phần của trình duyệt (Zalo/Safari/Chrome).

---

## 2. CSS Strategy (Chiến lược Styling)

Sử dụng **Tailwind CSS** theo phong cách hiện đại và có hệ thống.

*   **Design Tokens**: Định nghĩa các biến màu sắc và font chữ dùng chung.
    *   *Ví dụ:* `themeColor: #009900` cho các nút bấm và tiêu đề chính.
*   **Responsive Utilities**: Sử dụng các tiền tố `sm:`, `md:`, `lg:` để đảm bảo hiển thị hoàn hảo trên mọi thiết bị.
*   **Premium Aesthetics**:
    *   **Rounded Corners**: Sử dụng `rounded-2xl` hoặc `rounded-3xl` cho các Card và Input để tạo cảm giác hiện đại, thân thiện.
    *   **Soft Shadows**: Sử dụng `shadow-xl` hoặc `shadow-2xl` với độ mờ cao để tạo chiều sâu cho giao diện.
    *   **Glassmorphism**: Kết hợp `bg-white/80` và `backdrop-blur-md` cho các thành phần nổi (như Zalo Overlay).

---

## 3. UI/UX Principles (Nguyên tắc Trải nghiệm)

*   **Visual Hierarchy (Phân cấp thị giác)**: Sử dụng độ đậm nhạt của font chữ (`font-black` vs `font-medium`) và kích thước để dẫn dắt mắt người dùng đến các hành động quan trọng (nút Gửi, tiêu đề mục).
*   **Micro-interactions**: Thêm các hiệu ứng nhỏ nhưng tinh tế:
    *   `transition-all duration-300`: Giúp các thay đổi trạng thái mượt mà.
    *   `active:scale-95`: Tạo phản hồi vật lý khi người dùng chạm vào nút bấm trên điện thoại.
*   **Readability (Khả năng đọc)**: 
    *   Câu hỏi khảo sát: `17px` (text-lg).
    *   Mô tả phụ: `13px-14px` (text-sm).
    *   Ghi chú: `12px` (text-xs).

---

## 4. App Structure (Kiến trúc Ứng dụng)

Dự án sử dụng kiến trúc **Modular (Theo Module)** giúp dễ dàng quản lý và mở rộng.

### Sơ đồ cấu trúc:
```text
src/
├── components/          # Chứa các UI Components dùng chung
│   ├── Assessment/      # Module Khảo sát (Trọng tâm dự án)
│   │   ├── sub-components/ # Các Form khảo sát chi tiết (Staff, Inpatient...)
│   │   ├── services/    # Logic xử lý dữ liệu và gọi API cho từng form
│   │   └── types/       # Định nghĩa kiểu dữ liệu (TypeScript interfaces)
├── contexts/            # Quản lý trạng thái (Xác thực, Cấu hình)
├── supabaseClient.ts    # Cấu hình kết nối Database tập trung
└── AppRouter.tsx        # Quản lý luồng điều hướng của toàn bộ App
```

### Lợi ích:
1.  **Tính đóng gói (Encapsulation)**: Mỗi Form khảo sát là một thực thể độc lập.
2.  **Khả năng tái sử dụng**: Các thành phần như `Header`, `ZaloBrowserOverlay` có thể dùng lại ở mọi trang.
3.  **Bảo mật & Hiệu năng**: Tách biệt logic gọi API (Services) ra khỏi giao diện giúp code sạch hơn và dễ kiểm soát lỗi.

---

*Tài liệu này được biên soạn cho đội ngũ phát triển dự án QLCL-v3.*
