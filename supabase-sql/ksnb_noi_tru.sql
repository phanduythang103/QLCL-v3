-- Inpatient Satisfaction Survey 2026 Table
-- Table name: ksnb_noi_tru
-- Generated from ks-nb-noi-tru.json

CREATE TABLE IF NOT EXISTS public.ksnb_noi_tru (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Thông tin chung
    full_name TEXT,
    phone TEXT,
    department TEXT,
    hospital_days INTEGER,
    respondent TEXT, -- patient | relative
    
    -- Đánh giá dịch vụ (Q1 - Q12)
    -- 1: Rất kém, 5: Rất tốt, 0: Không áp dụng
    q1 INTEGER,
    q2 INTEGER,
    q3 INTEGER,
    q4 INTEGER,
    q5 INTEGER,
    q6 INTEGER,
    q7 INTEGER,
    q8 INTEGER,
    q9 INTEGER,
    q10 INTEGER,
    q11 INTEGER,
    q12 INTEGER,
    
    -- Đánh giá chung
    satisfaction_percent INTEGER,
    return_intent TEXT, -- no | maybe | yes
    feedback TEXT,
    
    -- Metadata
    ngay_khao_sat TIMESTAMP WITH TIME ZONE DEFAULT timezone('ict'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('ict'::text, now())
);

-- RLS and Permissions
ALTER TABLE public.ksnb_noi_tru ENABLE ROW LEVEL SECURITY;

-- Grant permissions to public (anon) as requested
GRANT ALL ON TABLE public.ksnb_noi_tru TO anon;
GRANT ALL ON TABLE public.ksnb_noi_tru TO authenticated;
GRANT ALL ON TABLE public.ksnb_noi_tru TO service_role;

-- Policies (Simplified as per "full permissions" request)
CREATE POLICY "Enable all access for everyone" ON public.ksnb_noi_tru
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Comments
COMMENT ON TABLE public.ksnb_noi_tru IS 'Bảng lưu trữ kết quả khảo sát hài lòng người bệnh nội trú 2026';
COMMENT ON COLUMN public.ksnb_noi_tru.ngay_khao_sat IS 'Ngày điền phiếu (Múi giờ Việt Nam)';
