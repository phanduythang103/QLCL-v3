-- Create the General Monitoring table
CREATE TABLE IF NOT EXISTS giam_sat_chung (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- General Information
    ngay_giam_sat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    nguoi_gs TEXT NOT NULL,
    khoa_gs TEXT NOT NULL,

    -- Dynamic Monitoring Content (JSONB)
    -- Format: Array of objects [{ id: string, label: string, is_pass: boolean, note: string }]
    noi_dung_gs JSONB NOT NULL DEFAULT '[]',

    -- Summary fields
    ket_luan TEXT,
    hinh_anh TEXT[] DEFAULT '{}',
    tong_dat INTEGER DEFAULT 0,
    tong_muc INTEGER DEFAULT 0,
    ty_le DECIMAL(5,2) DEFAULT 0.00
);

-- Enable RLS
ALTER TABLE giam_sat_chung ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all authenticated users)
CREATE POLICY "Enable all for authenticated users giam_sat_chung" ON giam_sat_chung
    FOR ALL 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gs_chung_khoa ON giam_sat_chung(khoa_gs);
CREATE INDEX IF NOT EXISTS idx_gs_chung_ngay ON giam_sat_chung(ngay_giam_sat);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_giam_sat_chung()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gs_chung_updated_at
    BEFORE UPDATE ON giam_sat_chung
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_giam_sat_chung();

COMMENT ON TABLE giam_sat_chung IS 'Bảng giám sát chung với nội dung linh hoạt (dynamic checklist)';
