-- Kiểm tra xem bảng thu_vien_vb có cột ngay_hieu_luc không. Nếu không, thêm vào dạng date
ALTER TABLE thu_vien_vb
ADD COLUMN IF NOT EXISTS ngay_hieu_luc date;

-- Xóa cột hieu_luc thừa nếu nó tồn tại (do code cũ có thể tạo nhầm)
ALTER TABLE thu_vien_vb
DROP COLUMN IF EXISTS hieu_luc;
