-- SQL Migration to add missing phan_loai column to thu_vien_vb table
-- Run this in your Supabase SQL Editor

ALTER TABLE thu_vien_vb ADD COLUMN IF NOT EXISTS phan_loai text;

-- Optional: Update existing records to a default value if needed
-- UPDATE thu_vien_vb SET phan_loai = 'BYT' WHERE phan_loai IS NULL;

-- If the error persists, you can try refreshing the PostgREST cache by
-- running this command (though Supabase usually does this automatically):
NOTIFY pgrst, 'reload schema';
