-- Alter ngay_kiem_tra to TIMESTAMP WITH TIME ZONE
ALTER TABLE giam_sat_cd_truc 
ALTER COLUMN ngay_kiem_tra TYPE TIMESTAMP WITH TIME ZONE 
USING ngay_kiem_tra::TIMESTAMP WITH TIME ZONE;

-- Update the default value to include the current timestamp
ALTER TABLE giam_sat_cd_truc 
ALTER COLUMN ngay_kiem_tra SET DEFAULT timezone('utc'::text, now());
