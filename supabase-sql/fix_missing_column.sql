-- Thêm các cột thiếu vào bảng bao_cao_scyk
DO $$ 
BEGIN 
    -- Thêm cột trang_thai
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bao_cao_scyk' AND column_name = 'trang_thai') THEN
        ALTER TABLE bao_cao_scyk ADD COLUMN trang_thai text DEFAULT 'Mới' CHECK (trang_thai IN ('Mới', 'Đang phân tích', 'Đã kết luận'));
    END IF;

    -- Thêm cột vaitro_nguoi_bc
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bao_cao_scyk' AND column_name = 'vaitro_nguoi_bc') THEN
        ALTER TABLE bao_cao_scyk ADD COLUMN vaitro_nguoi_bc text;
    END IF;

    -- Thêm cột phan_loai cho bảng chia_se
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chia_se' AND column_name = 'phan_loai') THEN
        ALTER TABLE chia_se ADD COLUMN phan_loai text;
    END IF;
END $$;

-- Đảm bảo bảng chia_se tồn tại với đầy đủ các cột cơ bản
CREATE TABLE IF NOT EXISTS chia_se (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tieu_de text NOT NULL,
  noi_dung text NOT NULL,
  phan_loai text,
  hinh_anh text,
  video text,
  file_tai_lieu text,
  luot_thich integer DEFAULT 0,
  ngay_dang date DEFAULT CURRENT_DATE,
  nguoi_dang text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Kiểm tra lại các cột quan trọng của chia_se (phòng trường hợp bảng đã tồn tại nhưng thiếu cột hoặc dùng tên cũ)
DO $$ 
BEGIN 
    -- Nếu có cột chu_de (tên cũ) mà chưa có tieu_de (tên mới) -> Đổi tên
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chia_se' AND column_name = 'chu_de') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chia_se' AND column_name = 'tieu_de') THEN
        ALTER TABLE chia_se RENAME COLUMN chu_de TO tieu_de;
    END IF;

    -- Nếu cột chu_de vẫn tồn tại (song song) -> Bỏ ràng buộc NOT NULL để không gây lỗi khi insert tieu_de
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chia_se' AND column_name = 'chu_de') THEN
        ALTER TABLE chia_se ALTER COLUMN chu_de DROP NOT NULL;
    END IF;

    -- Đảm bảo có tieu_de
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chia_se' AND column_name = 'tieu_de') THEN
        ALTER TABLE chia_se ADD COLUMN tieu_de text NOT NULL DEFAULT '';
    END IF;

    -- Đảm bảo có noi_dung
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chia_se' AND column_name = 'noi_dung') THEN
        ALTER TABLE chia_se ADD COLUMN noi_dung text NOT NULL DEFAULT '';
    END IF;

    -- Đảm bảo ngay_dang có giá trị mặc định (để tránh lỗi NOT NULL constraint)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chia_se' AND column_name = 'ngay_dang') THEN
        ALTER TABLE chia_se ALTER COLUMN ngay_dang SET DEFAULT CURRENT_DATE;
        -- Cập nhật các hàng cũ đang bị null nếu có (nếu cột này không có ràng buộc NOT NULL từ trước)
        UPDATE chia_se SET ngay_dang = CURRENT_DATE WHERE ngay_dang IS NULL;
    ELSE
        ALTER TABLE chia_se ADD COLUMN ngay_dang date DEFAULT CURRENT_DATE;
    END IF;

    -- Đảm bảo luot_thich có giá trị mặc định
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chia_se' AND column_name = 'luot_thich') THEN
        ALTER TABLE chia_se ALTER COLUMN luot_thich SET DEFAULT 0;
    END IF;
END $$;

