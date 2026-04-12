<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Te3uirMh_b_H51agy2fxtXv73FyJmu_l

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

[QLCL-v3]

Ứng dụng web quản lý chất lượng, sử dụng Supabase làm backend lưu trữ dữ liệu.

## Cấu hình Supabase & API
Project này sử dụng Supabase làm backend và Gemini AI. Để chạy được ứng dụng, bạn cần cấu hình các biến môi trường trong file `.env.local` ở thư mục gốc:

1. Tạo file `.env.local` nếu chưa có.
2. Thêm các nội dung sau vào file:
    ```env
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key
    GEMINI_API_KEY=your-gemini-api-key
    ```
3. Lưu ý: Không bao giờ commit file `.env.local` lên GitHub. File này đã được đưa vào `.gitignore`.

## Cài đặt
Chạy lệnh sau để cài đặt các thư viện cần thiết:
```bash
npm install
```

## Tích hợp Supabase
- Supabase client được khởi tạo trong file `supabaseClient.ts`.
- Sử dụng client này để thao tác với dữ liệu Supabase.

## Đọc dữ liệu các bảng
- Sử dụng hàm `readAllTables` trong file `readAllTables.ts` để đọc toàn bộ dữ liệu từ các bảng:
   ```ts
   import { readAllTables } from './readAllTables';
   const tables = ['users', 'products', 'orders'];
   readAllTables(tables).then(console.log);
   ```

## Kiểm tra kết nối Supabase
- Sử dụng hàm `testSupabaseConnection` trong file `testSupabase.ts` để kiểm tra kết nối và lưu dữ liệu mẫu:
   ```ts
   import { testSupabaseConnection } from './testSupabase';
   testSupabaseConnection();
   ```

## Thư mục chính
- `components/`: Chứa các module giao diện.
- `App.tsx`, `index.tsx`: File khởi tạo ứng dụng React.
- `supabaseConfig.ts`: Cấu hình Supabase.
- `supabaseClient.ts`: Khởi tạo client Supabase.
- `readAllTables.ts`: Hàm đọc dữ liệu các bảng.
- `testSupabase.ts`: Hàm kiểm tra kết nối Supabase.

## Liên hệ & hỗ trợ
Nếu gặp vấn đề hoặc cần hỗ trợ, hãy liên hệ qua email hoặc tạo issue trên repository.
