-- SQL Migration: Add to_cham_diem column to data83tc
-- Run this in your Supabase SQL Editor

ALTER TABLE public.data83tc ADD COLUMN IF NOT EXISTS to_cham_diem TEXT;

-- Recommended: Add index for performance in team assessment view
CREATE INDEX IF NOT EXISTS idx_data83tc_to_cham_diem ON public.data83tc(to_cham_diem);
