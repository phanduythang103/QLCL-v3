-- Create table for Patient Identification Monitoring by Technique/Time
CREATE TABLE giam_sat_ndnb_theokt (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    ngay_giam_sat DATE NOT NULL DEFAULT CURRENT_DATE,
    nguoi_giam_sat TEXT NOT NULL,
    khoa_duoc_giam_sat TEXT NOT NULL,
    doi_tuong_giam_sat TEXT NOT NULL,
    
    -- Noi dung kiem tra (6 tieu chi)
    -- STT 1: Truoc khi dung thuoc/ Truyen dich
    c1_thuoc_truyen_dich BOOLEAN DEFAULT true,
    c1_ghi_chu TEXT,
    
    -- STT 2: Truoc khi lay mau xet nghiem
    c2_lay_mau_xn BOOLEAN DEFAULT true,
    c2_ghi_chu TEXT,
    
    -- STT 3: Truoc khi thuc hien Thu thuat/Phau thuat
    c3_thu_thuat_pt BOOLEAN DEFAULT true,
    c3_ghi_chu TEXT,
    
    -- STT 4: Truoc khi ban giao nguoi benh
    c4_ban_giao_nb BOOLEAN DEFAULT true,
    c4_ghi_chu TEXT,
    
    -- STT 5: Truoc khi thuc hien chan doan hinh anh
    c5_chan_doan_ha BOOLEAN DEFAULT true,
    c5_ghi_chu TEXT,
    
    -- STT 6: Truoc khi cap phat thuoc tai nha thuoc
    c6_cap_phat_thuoc BOOLEAN DEFAULT true,
    c6_ghi_chu TEXT,

    nhan_xet TEXT,
    hinh_anh_minh_chung TEXT[],
    
    -- Tong hop
    tong_dat INTEGER DEFAULT 6,
    tong_tieu_chi INTEGER DEFAULT 6,
    ty_le_tuan_thu NUMERIC(5,2) DEFAULT 100.00
);

-- Enable RLS
ALTER TABLE giam_sat_ndnb_theokt ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (consistent with other modules in this project)
CREATE POLICY "Public Access" ON giam_sat_ndnb_theokt
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_ndnb_theokt
    BEFORE UPDATE ON giam_sat_ndnb_theokt
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_ndnb_theokt_ngay ON giam_sat_ndnb_theokt(ngay_giam_sat DESC);
CREATE INDEX idx_ndnb_theokt_khoa ON giam_sat_ndnb_theokt(khoa_duoc_giam_sat);
