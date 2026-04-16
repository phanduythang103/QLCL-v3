-- Add overall_satisfaction column to ks_me_sinh_con
ALTER TABLE public.ks_me_sinh_con
ADD COLUMN IF NOT EXISTS overall_satisfaction smallint DEFAULT 5;

-- Update existing records to default 5 (Very Satisfied)
UPDATE public.ks_me_sinh_con SET overall_satisfaction = 5 WHERE overall_satisfaction IS NULL;
