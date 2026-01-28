-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chia_se_file', 'chia_se_file', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up policies for the bucket (use unique names to avoid conflicts)
-- Allow public access to read files
CREATE POLICY "chia_se_file_Public_Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'chia_se_file');

-- Allow authenticated users to upload files
CREATE POLICY "chia_se_file_Allow_Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chia_se_file');

-- Allow update
CREATE POLICY "chia_se_file_Allow_Update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'chia_se_file');

-- Allow delete
CREATE POLICY "chia_se_file_Allow_Delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'chia_se_file');
