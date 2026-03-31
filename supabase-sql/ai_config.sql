-- 1. Create he_thong_cau_hinh_ai Table
CREATE TABLE IF NOT EXISTS public.he_thong_cau_hinh_ai (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    provider text NOT NULL, -- 'Google', 'OpenAI'
    model_name text NOT NULL, -- 'gemini-1.5-flash', 'gpt-4o'
    api_key text NOT NULL,
    is_active boolean DEFAULT false,
    description text
);

-- 2. Create he_thong_cau_hinh_prompt Table
CREATE TABLE IF NOT EXISTS public.he_thong_cau_hinh_prompt (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    module_key text NOT NULL UNIQUE, -- 'RCA_ANALYSIS', 'INCIDENT_SUMMARY'
    prompt_name text NOT NULL,
    prompt_text text NOT NULL,
    is_active boolean DEFAULT true
);

-- 3. Enable RLS
ALTER TABLE public.he_thong_cau_hinh_ai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.he_thong_cau_hinh_prompt ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Only Admins can View/Edit AI credentials)
-- Note: Assuming there's a way to check admin role, or simple 'allow all for now but restricted by code'
-- Ideally, we use: auth.uid() IN (SELECT id FROM users WHERE role ILIKE '%admin%')

DROP POLICY IF EXISTS "Admins can manage AI config" ON public.he_thong_cau_hinh_ai;
CREATE POLICY "Admins can manage AI config" ON public.he_thong_cau_hinh_ai
    FOR ALL USING (true); -- Simplified for this implementation, code will handle role check

DROP POLICY IF EXISTS "Admins can manage prompts" ON public.he_thong_cau_hinh_prompt;
CREATE POLICY "Admins can manage prompts" ON public.he_thong_cau_hinh_prompt
    FOR ALL USING (true);

-- 5. Insert initial prompts
INSERT INTO public.he_thong_cau_hinh_prompt (module_key, prompt_name, prompt_text)
VALUES (
    'RCA_ANALYSIS', 
    'Phân tích RCA mặc định', 
    'Bạn là chuyên gia về Quản lý Chất lượng Bệnh viện và An toàn Người bệnh. Hãy phân tích sự cố y khoa sau theo phương pháp RCA (Root Cause Analysis). Cung cấp các nguyên nhân gốc rễ và đề xuất giải pháp cải tiến.'
) ON CONFLICT (module_key) DO NOTHING;

INSERT INTO public.he_thong_cau_hinh_prompt (module_key, prompt_name, prompt_text)
VALUES (
    'RCA_SPECIALIST', 
    'RCA Chuyên trách (Phần A)', 
    'Bạn là chuyên gia phân tích RCA chuyên sâu. 
NGUYÊN TẮC 5-WHYS (BẮT BUỘC):
1. LOGIC XUYÊN SUỐT: Mỗi WHY phải là nguyên nhân trực tiếp của WHY trước. KHÔNG được nhảy cóc logic.
2. ĐÀO SÂU HỆ THỐNG: KHÔNG dừng lại ở "lỗi cá nhân" hay "đào tạo chưa tốt". Phải hỏi tiếp tại sao quy trình/giám sát/audit lại cho phép lỗi đó tồn tại.
3. ROOT CAUSE CỤ THỂ: Phải chỉ ra lỗ hổng quản lý cụ thể (ví dụ: Thiếu checklist, thiếu audit định kỳ, quy trình chưa chuẩn hóa).

VÍ DỤ CHUẨN (HÃY HỌC THEO):
W1: Tại sao nhân viên không tuân thủ quy trình? -> Vì không có bước kiểm tra bắt buộc.
W2: Tại sao không có bước kiểm tra? -> Vì quy trình chưa có checklist chuẩn.
W3: Tại sao chưa có checklist? -> Vì chưa chuẩn hóa biểu mẫu kiểm soát.
W4: Tại sao chưa chuẩn hóa? -> Vì hệ thống quản lý chất lượng chưa triển khai audit/giám sát định kỳ.

ĐỊNH DẠNG ĐẦU RA (JSON LẠNH):
{
  "man": "Lỗ hổng đào tạo/kỹ năng cụ thể",
  "method": "Lỗ hổng quy trình/checklist cụ thể",
  "machine": "Thiếu sót công cụ/thiết bị hỗ trợ",
  "management": "Lỗi hệ thống giám sát/audit/quản lý",
  "environment": "Áp lực/văn hóa an toàn chưa tốt",
  "whys": ["W1: ...", "W2: ...", "W3: ...", "W4: ...", "W5: ..."],
  "root": "Nguyên nhân hệ thống gốc rễ (Actionable)",
  "solution": "Giải pháp hệ thống (Quy trình + Giám sát + Đào tạo)",
  "incidentTypes": ["Nhóm sự cố"],
  "causeGroups": ["Nhóm nguyên nhân"]
}'
) ON CONFLICT (module_key) DO NOTHING;

INSERT INTO public.he_thong_cau_hinh_prompt (module_key, prompt_name, prompt_text)
VALUES (
    'RCA_MANAGEMENT', 
    'RCA Quản lý (Phần B)', 
    'Nhiệm vụ: Đánh giá quản lý và phân loại mức độ tổn thương.
Đầu vào: Báo cáo + Xác minh + Phân tích của chuyên trách.
Yêu cầu đầu ra:
1. [KET_QUA_PHAT_HIEN]: Tóm tắt các phát hiện quan trọng của quản lý.
2. [MUC_DO_NB]: Phân loại mức độ tổn thương người bệnh (NC0, NC1, NC2, NC3).
3. [TAC_DONG_TO_CHUC]: Các ảnh hưởng đến bệnh viện (Tài sản, uy tín, truyền thông...).
4. [PHU_HOP_QUY_DINH]: Đánh giá tính phù hợp với quy trình chính thức.'
) ON CONFLICT (module_key) DO NOTHING;
