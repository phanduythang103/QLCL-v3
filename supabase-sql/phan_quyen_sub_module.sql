-- Migration: Add sub_module support to phan_quyen table
-- Run this in Supabase SQL Editor

-- 1. Add sub_module column
ALTER TABLE phan_quyen ADD COLUMN IF NOT EXISTS sub_module TEXT DEFAULT NULL;

-- 2. Drop old unique constraint if exists (role_id + module only)
ALTER TABLE phan_quyen DROP CONSTRAINT IF EXISTS phan_quyen_role_id_module_key;
ALTER TABLE phan_quyen DROP CONSTRAINT IF EXISTS phan_quyen_role_module_sub_key;

-- 3. Add new unique constraint (role_id + module + sub_module)
ALTER TABLE phan_quyen ADD CONSTRAINT phan_quyen_role_module_sub_key
  UNIQUE (role_id, module, sub_module);

-- 4. Seed default sub-module permissions for all existing users in phan_quyen
-- (optional: run after the migration to populate sub-permissions)

-- Sub-modules definition:
-- SUPERVISION: OVERVIEW, SURGERY, HAND_HYGIENE, 5S, RECORDS, DRUGS, PROFESSIONAL, GENERAL
-- IMPROVEMENT: PLAN, REPORT
-- INCIDENTS: OVERVIEW, LIST, STATS, VERIFY
-- HR: PERSONNEL, FAMILY, TRAINING, WORK_HISTORY
-- DOCS: DOCUMENTS, TRAINING
-- ASSESSMENT: SELF, EXTERNAL

-- Example: Insert sub-permissions for a user (replace 'USER_ID_HERE' with actual user id)
-- INSERT INTO phan_quyen (role_id, module, sub_module, can_view, can_create, can_update, can_delete)
-- VALUES 
--   ('USER_ID_HERE', 'SUPERVISION', 'SURGERY', true, false, false, false),
--   ('USER_ID_HERE', 'SUPERVISION', 'HAND_HYGIENE', true, false, false, false)
-- ON CONFLICT (role_id, module, sub_module) DO NOTHING;
