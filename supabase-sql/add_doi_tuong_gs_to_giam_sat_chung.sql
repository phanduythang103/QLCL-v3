-- Add monitored target to General Monitoring records
ALTER TABLE public.giam_sat_chung
ADD COLUMN IF NOT EXISTS doi_tuong_gs TEXT;

COMMENT ON COLUMN public.giam_sat_chung.doi_tuong_gs IS 'Monitored target for general monitoring records';