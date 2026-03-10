-- Script cấp quyền truy cập module KTCM cho tất cả các Role cơ bản có sẵn trong hệ thống
-- Tránh việc module mới tạo không được hiển thị trên Sidebar do bảng phan_quyen chưa có dòng cho KTCM

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Lấy danh sách các role (hoặc user id) đang có trong bảng phan_quyen nhưng chưa có quyền cho KTCM
    FOR r IN (SELECT DISTINCT role_id FROM phan_quyen)
    LOOP
        IF NOT EXISTS (SELECT 1 FROM phan_quyen WHERE role_id = r.role_id AND module = 'KTCM') THEN
            INSERT INTO phan_quyen (role_id, module, sub_module, can_view, can_create, can_update, can_delete, created_at, updated_at)
            VALUES (r.role_id, 'KTCM', NULL, true, true, true, true, NOW(), NOW());
        END IF;
    END LOOP;
END $$;
