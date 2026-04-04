import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Edit2, Trash2, Eye, ArrowLeft, Save, X,
    BrainCircuit, FileText, User, ClipboardList, CheckCircle2,
    Calendar, Clock, LayoutGrid, ChevronRight, AlertCircle, Loader2,
    CheckCircle, ShieldCheck, AlertTriangle, Printer, Download, Sparkles
} from 'lucide-react';
import {
    fetchTimHieuPhanTichScyk,
    addTimHieuPhanTichScyk,
    updateTimHieuPhanTichScyk,
    deleteTimHieuPhanTichScyk
} from '../readTimHieuPhanTichScyk';
import { fetchBaoCaoScyk, BaoCaoScyk } from '../readBaoCaoScyk';
import { useAuth } from '../contexts/AuthContext';
import { analyzeWithAi } from '../aiClient';
import { fetchBienBanXacMinhByScykId, BienBanXacMinh } from '../readBienBanXacMinh';

export interface AnalysisRecord {
    id?: string;
    scyk_id?: string;
    a_danh_cho_nv_chuyen_trach?: string;
    i_mo_ta_chi_tiet?: string;
    ii_phan_loai_theo_nhom?: string;
    iii_dieu_tri_da_thuc_hien?: string;
    iiii_phan_loai_theo_nhom_nguyen_nhan?: string;
    iiiii_han_dong_khac_phuc?: string;
    iiiiii_de_xuat_khuyen_cao?: string;
    b_danh_cho_cap_quan_ly?: string;
    chuc_danh?: string;
    ngay?: string;
    gio?: string;
    created_at?: string;
}

// Data constants for selections based on template images
const INCIDENT_TYPES = [
    {
        id: 1, label: 'Thực hiện quy trình kỹ thuật, thủ thuật chuyên môn',
        options: ['Không có sự đồng ý của NB/Người nhà', 'Không thực hiện khi có chỉ định', 'Thực hiện sai người bệnh', 'Thực hiện sai thủ thuật/quy trình', 'Thực hiện sai vị trí phẫu thuật', 'Bỏ sót dụng cụ, vật tư tiêu hao', 'Tử vong thai kỳ', 'Tử vong khi sinh', 'Tử vong sơ sinh']
    },
    {
        id: 2, label: 'Nhiễm khuẩn bệnh viện',
        options: ['Nhiễm khuẩn huyết', 'Viêm phổi', 'Nhiễm khuẩn vết mổ', 'Nhiễm khuẩn tiết niệu', 'Các loại nhiễm khuẩn khác']
    },
    {
        id: 3, label: 'Thuốc và dịch truyền',
        options: ['Cấp phát sai thuốc/dịch truyền', 'Thiếu thuốc', 'Sai liều/hàm lượng', 'Sai thời gian', 'Sai y lệnh', 'Bỏ sót thuốc/liều thuốc', 'Sai thuốc', 'Sai người bệnh', 'Sai đường dùng']
    },
    {
        id: 4, label: 'Máu và các chế phẩm máu',
        options: ['Phản ứng phụ/tai biến khi truyền máu', 'Truyền nhầm máu, chế phẩm máu', 'Truyền sai liều, sai thời điểm']
    },
    {
        id: 5, label: 'Thiết bị y tế',
        options: ['Thiếu thông tin hướng dẫn sử dụng', 'Lỗi thiết bị', 'Thiết bị thiếu hoặc không phù hợp']
    },
    {
        id: 6, label: 'Hành vi',
        options: ['Khuynh hướng tự gây hại/tự tử', 'Trốn viện', 'Quấy rối tình dục', 'Xâm hại cơ thể', 'Có hành động tự tử']
    },
    { id: 7, label: 'Tai nạn đối với người bệnh', options: ['Té ngã'] },
    { id: 8, label: 'Hạ tầng cơ sở', options: ['Bị hư hỏng, bị lỗi', 'Thiếu hoặc không phù hợp'] },
    {
        id: 9, label: 'Quản lý nguồn lực, tổ chức',
        options: ['Tính phù hợp, đầy đủ của dịch vụ', 'Tính phù hợp, đầy đủ của nguồn lực', 'Tính phù hợp, đầy đủ của chính sách, quy định']
    },
    {
        id: 10, label: 'Hồ sơ, tài liệu, thủ tục hành chính',
        options: ['Tài liệu mất hoặc thiếu', 'Tài liệu không rõ ràng', 'Thời gian chờ đợi kéo dài', 'Cung cấp hồ sơ/tài liệu chậm', 'Nhầm hồ sơ tài liệu', 'Thủ tục hành chính phức tạp']
    },
    { id: 11, label: 'Khác', options: ['Các sự cố không đề cập trong các mục từ 1 đến 10'] }
];

const ROOT_CAUSE_GROUPS = [
    {
        label: '1. Nhân viên',
        options: ['Nhận thức (kiến thức, hiểu biết, quan niệm)', 'Thực hành (kỹ năng không đúng quy định)', 'Thái độ, hành vi, cảm xúc', 'Giao tiếp', 'Tâm sinh lý, thể chất, bệnh lý', 'Các yếu tố xã hội']
    },
    {
        label: '2. Người bệnh',
        options: ['Nhận thức', 'Thực hành', 'Thái độ, hành vi', 'Giao tiếp', 'Tâm sinh lý, bệnh lý', 'Các yếu tố xã hội']
    },
    { label: '3. Môi trường làm việc', options: ['Cơ sở vật chất, hạ tầng', 'Khoảng cách quá xa', 'Độ an toàn, rủi ro môi trường', 'Nội quy, quy định đặc tính kỹ thuật'] },
    { label: '4. Tổ chức/dịch vụ', options: ['Chính sách, quy trình', 'Tuân thủ quy trình chuẩn', 'Văn hoá tổ chức', 'Làm việc nhóm'] },
    { label: '5. Yếu tố bên ngoài', options: ['Môi trường tự nhiên', 'Sản phẩm, công nghệ', 'Quy trình, hệ thống dịch vụ'] },
    { label: '6. Khác', options: ['Các yếu tố không đề cập từ 1 đến 5'] }
];

const SEVERITY_PATIENT = [
    { cat: '1. Chưa xảy ra (NC0)', levels: ['A'] },
    { cat: '2. Tổn thương nhẹ (NC1)', levels: ['B', 'C', 'D'] },
    { cat: '3. Tổn thương trung bình (NC2)', levels: ['E', 'F'] },
    { cat: '4. Tổn thương nặng (NC3)', levels: ['G', 'H', 'I'] }
];

const SEVERITY_ORG = ['Tổn hại tài sản', 'Tăng nguồn lực phục vụ', 'Quan tâm của truyền thông', 'Khiếu nại của người bệnh', 'Tổn hại danh tiếng', 'Can thiệp của pháp luật', 'Khác'];

const IncidentAnalysis: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase().includes('quản trị') || user?.role?.toLowerCase().includes('admin');
    const uDept = user?.department?.trim().toLowerCase() || '';
    const [items, setItems] = useState<AnalysisRecord[]>([]);
    const [incidents, setIncidents] = useState<BaoCaoScyk[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'VIEW'>('LIST');
    const [editingItem, setEditingItem] = useState<AnalysisRecord | null>(null);
    const [viewingItem, setViewingItem] = useState<AnalysisRecord | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState<string | null>(null);
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiRole, setAiRole] = useState<'SPECIALIST' | 'MANAGEMENT' | null>(null);
    const [currentVerification, setCurrentVerification] = useState<BienBanXacMinh | null>(null);

    // Specialist Dashboard states
    const [showSpecialistDashboard, setShowSpecialistDashboard] = useState(false);
    const [activeAnalysisTab, setActiveAnalysisTab] = useState<'ishikawa' | 'whys'>('ishikawa');
    const [structuredData, setStructuredData] = useState<any>(null);

    // Management AI states
    const [showMgmtDashboard, setShowMgmtDashboard] = useState(false);
    const [mgmtStructuredData, setMgmtStructuredData] = useState<any>(null);

    const initialForm: AnalysisRecord = {
        scyk_id: '',
        a_danh_cho_nv_chuyen_trach: '',
        i_mo_ta_chi_tiet: '',
        ii_phan_loai_theo_nhom: '',
        iii_dieu_tri_da_thuc_hien: '',
        iiii_phan_loai_theo_nhom_nguyen_nhan: '',
        iiiii_han_dong_khac_phuc: '',
        iiiiii_de_xuat_khuyen_cao: '',
        b_danh_cho_cap_quan_ly: '',
        chuc_danh: '',
        ngay: new Date().toISOString().split('T')[0],
        gio: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    const [formData, setFormData] = useState<AnalysisRecord>(initialForm);

    // Parsing management data from text for Section B
    const [mgmtData, setMgmtData] = useState({
        findings: '',
        discussed: '',
        consistent: '',
        consistentDetails: '',
        severityPatient: '',
        severityOrg: [] as string[],
        severityOrgOther: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [analysisData, incidentData] = await Promise.all([
                fetchTimHieuPhanTichScyk(),
                fetchBaoCaoScyk()
            ]);
            setItems(analysisData || []);
            setIncidents(incidentData || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.scyk_id) {
            alert('Vui lòng chọn sự cố y khoa liên kết');
            return;
        }
        setIsSaving(true);

        // Process mgmtData into b_danh_cho_cap_quan_ly string
        const sevOrg = [...mgmtData.severityOrg];
        if (mgmtData.severityOrgOther) sevOrg.push(`Khác: ${mgmtData.severityOrgOther}`);

        const b_text = `Kết quả: ${mgmtData.findings}\nThảo luận khuyến cáo: ${mgmtData.discussed}\nPhù hợp khuyến cáo: ${mgmtData.consistent} (${mgmtData.consistentDetails})\nMức độ (NB): ${mgmtData.severityPatient}\nMức độ (Tổ chức): ${sevOrg.join(', ')}`;
        const finalData = { ...formData, b_danh_cho_cap_quan_ly: b_text };

        try {
            if (editingItem?.id) {
                await updateTimHieuPhanTichScyk(editingItem.id, finalData);
            } else {
                await addTimHieuPhanTichScyk(finalData);
            }
            loadData();
            setViewMode('LIST');
        } catch (error: any) {
            alert('Lỗi lưu dữ liệu: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bạn có chắc muốn xóa bản phân tích này?')) {
            try {
                await deleteTimHieuPhanTichScyk(id);
                loadData();
            } catch (error: any) {
                alert('Lỗi khi xóa: ' + error.message);
            }
        }
    };

    const filteredItems = items.filter(item => {
        const linkedInc = incidents.find(inc => inc.id === item.scyk_id);
        const searchStr = (linkedInc?.so_bc_ma_scyk || '') + (item.a_danh_cho_nv_chuyen_trach || '');
        const matchesSearch = searchStr.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (isAdmin || !uDept) return matchesSearch;
        
        if (!linkedInc) return false;
        const iDept1 = (linkedInc.khoa_phong || '').trim().toLowerCase();
        const iDept2 = (linkedInc.don_vi_bao_cao || '').trim().toLowerCase();
        const matchesUnit = (iDept1 !== '' && (uDept === iDept1 || iDept1.includes(uDept) || uDept.includes(iDept1))) ||
                           (iDept2 !== '' && (uDept === iDept2 || iDept2.includes(uDept) || uDept.includes(iDept2)));
        return matchesSearch && matchesUnit;
    });

    const handleIncidentSelect = async (scyk_id: string) => {
        setFormData(prev => ({ ...prev, scyk_id }));
        if (!scyk_id) {
            setCurrentVerification(null);
            return;
        }

        const incident = incidents.find(inc => inc.id === scyk_id);
        setLoading(true);
        try {
            const verification = await fetchBienBanXacMinhByScykId(scyk_id);
            setCurrentVerification(verification);

            // Populate initial fields from report and verification
            let description = `1. Báo cáo ban đầu: ${incident?.mo_ta_su_co || 'N/A'}`;
            if (verification) {
                description += `\n\n2. Kết quả xác minh: ${verification.ket_qua_xac_minh || 'N/A'}`;
            }

            setFormData(prev => ({
                ...prev,
                i_mo_ta_chi_tiet: description,
                iii_dieu_tri_da_thuc_hien: incident?.dieu_tri_xy_ly_ban_dau_da_thuc_hien || '',
                a_danh_cho_nv_chuyen_trach: incident?.ho_ten_nguoi_bc || user?.full_name || ''
            }));
        } catch (err) {
            console.error('Error fetching verification:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (field: keyof AnalysisRecord, value: string) => {
        const current = formData[field] || '';
        const items = current.split('\n').filter(i => i.trim() !== '');
        if (items.includes(value)) {
            setFormData({ ...formData, [field]: items.filter(i => i !== value).join('\n') });
        } else {
            setFormData({ ...formData, [field]: [...items, value].join('\n') });
        }
    };

    const handleAiAnalysis = async (role: 'SPECIALIST' | 'MANAGEMENT') => {
        if (!formData.scyk_id) {
            alert('Vui lòng chọn sự cố y khoa để phân tích');
            return;
        }

        const incident = incidents.find(inc => inc.id === formData.scyk_id);
        if (!incident) return;

        setIsAnalyzing(true);
        setAiRole(role);
        try {
            const prompt = role === 'SPECIALIST' 
                ? `LỆNH: Phân tích RCA (5-Whys và Ishikawa) cho sự cố: [${incident.so_bc_ma_scyk}].
DỮ LIỆU: ${incident.mo_ta_su_co}. ${currentVerification?.ket_qua_xac_minh || ''}.

QUY TẮC PHÂN TÍCH 5-WHYS (BẮT BUỘC):
1. Mỗi WHY phải gồm cặp { question, answer }.
2. Câu hỏi của W(n) phải kế thừa trực tiếp từ nội dung câu trả lời của W(n-1).
3. KHÔNG đổ lỗi cá nhân đơn thuần (như "do cẩu thả"). Phải tìm ra lỗ hổng hệ thống.

QUY TẮC KẾT LUẬN & GIẢI PHÁP (BẮT BUỘC):
1. Root Causes (Nguyên nhân gốc): Chia làm 3 nhóm: individual (Cá nhân), process (Quy trình), system (Hệ thống).
2. Solutions (Giải pháp): Chia làm 3 giai đoạn: shortTerm (Ngắn hạn), mediumTerm (Trung hạn), longTerm (Dài hạn).

YÊU CẦU TRẢ VỀ JSON:
{
  "man": "...", "method": "...", "machine": "...", "management": "...", "environment": "...",
  "whys": [ {"question": "...", "answer": "..."} ],
  "root": { "individual": "...", "process": "...", "system": "..." },
  "solution": { "shortTerm": "...", "mediumTerm": "...", "longTerm": "..." },
  "incidentTypes": ["..."],
  "causeGroups": ["..."]
}`
                : `LỆNH: Đánh giá quản lý cho sự cố y khoa: [${incident.so_bc_ma_scyk}].
DỮ LIỆU: ${incident.mo_ta_su_co}. ${currentVerification?.ket_qua_xac_minh || ''}.

YÊU CẦU CẤP QUẢN LÝ (BẮT BUỘC):
1. KHÔNG lặp lại mô tả sự cố đã có. 
2. PHÂN TÍCH: Tập trung vào các lỗ hổng quản lý, sai sót hệ thống dẫn đến sự cố.
3. ĐÁNH GIÁ MỨC ĐỘ TỔN THƯƠNG: 
   - Trên người bệnh: Gợi ý mã (A, B, C, D, E, F, G, H, I) theo tiêu chuẩn TT43/2018/TT-BYT.
   - Trên tổ chức: Gợi ý các hạng mục (Tổn hại tài sản, Quan tâm truyền thông, Khiếu nại, Danh tiếng, Pháp luật...).

YÊU CẦU TRẢ VỀ JSON:
{
  "managementFindings": "Mô tả kết quả phát hiện cấp quản lý (sai lệch quy trình, lỗ hổng giám sát...)",
  "severityPatient": "Mã chữ cái (VD: D)",
  "severityOrg": ["Hạng mục 1", "Hạng mục 2"],
  "recommendations": "Khuyến cáo hướng xử lý cho đơn vị",
  "isConsistent": "Có/Không"
}`;

            const result = await analyzeWithAi(prompt, { 
                moduleKey: role === 'SPECIALIST' ? 'RCA_SPECIALIST' : 'RCA_MANAGEMENT' 
            });
            
            console.log('AI Result Raw:', result);
            setAiResult(result);
            
            let data: any = null;
            
            // Helper to ensure we don't pass objects to React children
            const ensureString = (val: any): string => {
                if (!val) return '';
                if (typeof val === 'string') return val;
                if (typeof val === 'object') {
                    // Try to find a logical string property
                    return val.description || val.content || val.text || JSON.stringify(val);
                }
                return String(val);
            };

            let parsedJson: any = null;
            // Attempt JSON parsing
            try {
                const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
                parsedJson = JSON.parse(cleanJson);
                data = {
                    ishikawa: {
                        man: ensureString(parsedJson.man),
                        method: ensureString(parsedJson.method),
                        machine: ensureString(parsedJson.machine),
                        management: ensureString(parsedJson.management),
                        environment: ensureString(parsedJson.environment),
                    },
                    whys: Array.isArray(parsedJson.whys) ? parsedJson.whys.map((w: any) => ({
                        question: ensureString(w.question || w.q),
                        answer: ensureString(w.answer || w.a)
                    })) : [],
                    rootCause: {
                        individual: ensureString(parsedJson.root?.individual || parsedJson.root_individual),
                        process: ensureString(parsedJson.root?.process || parsedJson.root_process),
                        system: ensureString(parsedJson.root?.system || parsedJson.root_system)
                    },
                    solution: {
                        shortTerm: ensureString(parsedJson.solution?.shortTerm || parsedJson.sol_short),
                        mediumTerm: ensureString(parsedJson.solution?.mediumTerm || parsedJson.sol_medium),
                        longTerm: ensureString(parsedJson.solution?.longTerm || parsedJson.sol_long)
                    },
                    incidentTypes: Array.isArray(parsedJson.incidentTypes) ? parsedJson.incidentTypes.map((t: any) => ensureString(t)).join(', ') : ensureString(parsedJson.incidentTypes),
                    causeGroups: Array.isArray(parsedJson.causeGroups) ? parsedJson.causeGroups.map((c: any) => ensureString(c)).join(', ') : ensureString(parsedJson.causeGroups)
                };
            } catch (jsonErr) {
                console.warn('JSON Parse failed, falling back to Regex:', jsonErr);
                const parse = (tag: string) => {
                    const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
                    const match = result.match(regex);
                    if (match && match[1].trim()) return match[1].trim();

                    const fallbackRegex = new RegExp(`<${tag}>:?\\s*([\\s\\S]*?)(?=<|$)`, 'i');
                    const fallbackMatch = result.match(fallbackRegex);
                    return (fallbackMatch?.[1] || '').trim();
                };

                data = {
                    ishikawa: {
                        man: parse('MAN'),
                        method: parse('METHOD'),
                        machine: parse('MACHINE'),
                        management: parse('MANAGEMENT'),
                        environment: parse('ENVIRONMENT'),
                    },
                    whys: parse('WHYS').split(/W\d:/i).filter(l => l.trim() !== '').map(l => ({
                        question: "Tại sao?",
                        answer: l.trim()
                    })),
                    rootCause: {
                        individual: parse('ROOT_INDIVIDUAL') || parse('ROOT'),
                        process: parse('ROOT_PROCESS'),
                        system: parse('ROOT_SYSTEM')
                    },
                    solution: {
                        shortTerm: parse('SOL_SHORT') || parse('SOLUTION'),
                        mediumTerm: parse('SOL_MEDIUM'),
                        longTerm: parse('SOL_LONG')
                    },
                    incidentTypes: parse('TYPES'),
                    causeGroups: parse('CAUSES')
                };
            }

            if (role === 'SPECIALIST') {
                setStructuredData(data);
                setShowSpecialistDashboard(true);
            } else {
                setMgmtStructuredData(parsedJson || data); // Store parsed JSON for mgmt
                setShowMgmtDashboard(true);
            }

            // Scroll to dashboard
            setTimeout(() => {
                const el = document.getElementById(role === 'SPECIALIST' ? 'ai-dashboard' : 'mgmt-ai-dashboard');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);

        } catch (error: any) {
            alert('Lỗi khi phân tích AI: ' + error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const applyDashboardToForm = () => {
        if (aiRole === 'SPECIALIST') {
            if (!structuredData) return;
            // Map checkboxes for Incident Type
            const incidentTypeStr = structuredData.incidentTypes || '';
            const aiTypes = incidentTypeStr.split(/,|\n/).map((s: string) => s.trim().toLowerCase());
            const selectedTypes: string[] = [];
            INCIDENT_TYPES.forEach(cat => {
                cat.options.forEach(opt => {
                    if (aiTypes.includes(opt.toLowerCase())) {
                        selectedTypes.push(opt);
                    }
                });
            });

            // Map checkboxes for Root Causes
            const rootCauseStr = structuredData.causeGroups || '';
            const aiCauses = rootCauseStr.split(/,|\n/).map((s: string) => s.trim().toLowerCase());
            const selectedCauses: string[] = [];
            ROOT_CAUSE_GROUPS.forEach(cat => {
                cat.options.forEach(opt => {
                    if (aiCauses.includes(opt.toLowerCase())) {
                        selectedCauses.push(`${cat.label}: ${opt}`);
                    }
                });
            });

            const rootTextArr = [];
            if (structuredData.rootCause.individual) rootTextArr.push(`1. 👤 Cá nhân: ${structuredData.rootCause.individual}`);
            if (structuredData.rootCause.process) rootTextArr.push(`2. ⚙️ Quy trình: ${structuredData.rootCause.process}`);
            if (structuredData.rootCause.system) rootTextArr.push(`3. 🏥 Hệ thống: ${structuredData.rootCause.system}`);
            const rootTextFull = `⚠️ KẾT LUẬN (NGUYÊN NHÂN GỐC):\n${rootTextArr.join('\n')}`;

            const solTextArr = [];
            if (structuredData.solution.shortTerm) solTextArr.push(`🔹 Ngắn hạn: ${structuredData.solution.shortTerm}`);
            if (structuredData.solution.mediumTerm) solTextArr.push(`🔹 Trung hạn: ${structuredData.solution.mediumTerm}`);
            if (structuredData.solution.longTerm) solTextArr.push(`🔹 Dài hạn: ${structuredData.solution.longTerm}`);
            const solTextFull = `🛠️ ĐỀ XUẤT BIỆN PHÁP KHẮC PHỤC:\n${solTextArr.join('\n')}`;

            const whysText = structuredData.whys.map((w: any, idx: number) => `❓ WHY ${idx + 1}:\nQuestion: ${w.question}\n➡️ Answer: ${w.answer}`).join('\n\n');

            const ishikawaText = `🐟 BIỂU ĐỒ XƯƠNG CÁ:\n- Con người (Đào tạo): ${structuredData.ishikawa.man}\n- Quy trình (Method): ${structuredData.ishikawa.method}\n- Thiết bị (Machine): ${structuredData.ishikawa.machine}\n- Môi trường: ${structuredData.ishikawa.environment}\n- Quản lý (Management): ${structuredData.ishikawa.management}`;

            setFormData(prev => ({
                ...prev,
                i_mo_ta_chi_tiet: `${prev.i_mo_ta_chi_tiet}\n\n${ishikawaText}`,
                ii_phan_loai_theo_nhom: selectedTypes.join('\n'),
                iiii_phan_loai_theo_nhom_nguyen_nhan: `${rootTextFull}\n\n5 WHYS (Câu hỏi -> Trả lời):\n${whysText}\n\n${selectedCauses.join('\n')}`,
                iiiii_han_dong_khac_phuc: solTextFull,
                iiiiii_de_xuat_khuyen_cao: "Khuyến nghị quản lý hệ thống:\n" + solTextFull
            }));
            setShowSpecialistDashboard(false);
        } else {
            if (!mgmtStructuredData) return;
            // Section B Mapping
            setMgmtData(prev => ({
                ...prev,
                findings: mgmtStructuredData.managementFindings || '',
                discussed: 'Có',
                consistent: mgmtStructuredData.isConsistent || 'Có',
                consistentDetails: mgmtStructuredData.recommendations || '',
                severityPatient: mgmtStructuredData.severityPatient || 'C',
                severityOrg: Array.isArray(mgmtStructuredData.severityOrg) ? mgmtStructuredData.severityOrg : [],
            }));
            setShowMgmtDashboard(false);
        }
    };

    if (viewMode === 'FORM') {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-50 border-b border-slate-200 px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-200">
                            <BrainCircuit size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 text-sm md:text-base">{editingItem ? 'Cập nhật phân tích RCA' : 'Lập bản phân tích SCYK (RCA)'}</h2>
                            <p className="text-[10px] md:text-xs text-slate-500">Dựa trên mẫu báo cáo chuẩn sự cố y khoa</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setViewMode('LIST')} className="px-3 py-1.5 md:px-4 md:py-2 hover:bg-slate-200 rounded-lg text-slate-600 text-xs md:text-sm font-medium transition-colors">Hủy</button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-3 py-1.5 md:px-4 md:py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs md:text-sm font-bold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Lưu bản phân tích
                        </button>
                    </div>
                </div>

                <div className="p-4 md:p-8 space-y-10 max-h-[calc(100vh-140px)] overflow-y-auto">
                    {/* Linked Incident Selection */}
                    <div className="bg-white p-5 rounded-2xl border-2 border-primary-100 flex flex-col md:flex-row md:items-center gap-4 shadow-sm">
                        <div className="shrink-0 w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                            <ClipboardList size={24} />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1.5 block">Chọn Sự cố Y khoa cần phân tích *</label>
                            <div className="flex gap-2">
                                <select
                                    value={formData.scyk_id}
                                    onChange={e => handleIncidentSelect(e.target.value)}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[14pt] font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                >
                                    <option value="">-- Chọn trong danh sách sự cố --</option>
                                    {incidents
                                        .filter(inc => {
                                            if (isAdmin || !uDept) return true;
                                            const iDept1 = (inc.khoa_phong || '').trim().toLowerCase();
                                            const iDept2 = (inc.don_vi_bao_cao || '').trim().toLowerCase();
                                            return (iDept1 !== '' && (uDept === iDept1 || iDept1.includes(uDept) || uDept.includes(iDept1))) ||
                                                   (iDept2 !== '' && (uDept === iDept2 || iDept2.includes(uDept) || uDept.includes(iDept2)));
                                        })
                                        .map(inc => (
                                        <option key={inc.id} value={inc.id}>
                                            {inc.so_bc_ma_scyk} - {inc.ho_ten_nb || inc.doi_tuong_xay_ra_sc || 'N/A'} - {inc.khoa_phong || inc.don_vi_bao_cao}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => handleAiAnalysis('SPECIALIST')}
                                    disabled={!formData.scyk_id || isAnalyzing}
                                    className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-lg shadow-primary-200 hover:shadow-primary-300 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isAnalyzing && aiRole === 'SPECIALIST' ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                                    {isAnalyzing && aiRole === 'SPECIALIST' ? 'Đang phân tích...' : 'AI Phân tích RCA (Phần A)'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Specialist AI Result Dashboard */}
                    {showSpecialistDashboard && structuredData && (
                        <div id="ai-dashboard" className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-500 max-w-5xl mx-auto border border-slate-700">
                            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                                        <BrainCircuit size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Phân tích Nguyên nhân Gốc rễ (AI RCA)</h3>
                                        <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">Sử dụng trí tuệ nhân tạo để phân tích biểu đồ xương cá & 5 Whys</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowSpecialistDashboard(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400"><X size={20} /></button>
                            </div>

                            {/* Tabs Header */}
                            <div className="flex border-b border-slate-800 bg-slate-900/50">
                                <button
                                    onClick={() => setActiveAnalysisTab('ishikawa')}
                                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeAnalysisTab === 'ishikawa' ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Biểu đồ xương cá (Ishikawa)
                                </button>
                                <button
                                    onClick={() => setActiveAnalysisTab('whys')}
                                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeAnalysisTab === 'whys' ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Phân tích 5 Whys
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Error/Raw Result Alert if all fields are empty */}
                                {(!structuredData.rootCause && !structuredData.ishikawa.man && aiResult) && (
                                    <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-start gap-3">
                                        <AlertTriangle className="text-rose-500 shrink-0" size={20} />
                                        <div className="space-y-1">
                                            <p className="text-rose-400 text-xs font-black uppercase">Phân tích gặp lỗi định dạng hoặc lỗi API</p>
                                            <p className="text-slate-300 text-sm">{aiResult}</p>
                                        </div>
                                    </div>
                                )}

                                {activeAnalysisTab === 'ishikawa' ? (
                                    /* Ishikawa Fishbone Boxes */
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[
                                            { label: 'CON NGƯỜI (MAN)', icon: <User size={16} />, color: 'blue', content: structuredData.ishikawa.man },
                                            { label: 'QUY TRÌNH (METHOD)', icon: <ClipboardList size={16} />, color: 'emerald', content: structuredData.ishikawa.method },
                                            { label: 'THIẾT BỊ (MACHINE)', icon: <Printer size={16} />, color: 'amber', content: structuredData.ishikawa.machine },
                                            { label: 'QUẢN LÝ (MANAGEMENT)', icon: <ShieldCheck size={16} />, color: 'purple', content: structuredData.ishikawa.management },
                                            { label: 'MÔI TRƯỜNG (ENVIRONMENT)', icon: <LayoutGrid size={16} />, color: 'rose', content: structuredData.ishikawa.environment },
                                        ].map((box) => (
                                            <div key={box.label} className={`p-5 rounded-2xl bg-${box.color}-500/5 border border-${box.color}-500/20 space-y-3`}>
                                                <div className={`flex items-center gap-2 text-${box.color}-400 font-black text-[10px] uppercase tracking-wider`}>
                                                    {box.icon} {box.label}
                                                </div>
                                                <div className="text-slate-300 text-sm font-medium leading-relaxed">
                                                    {box.content || 'Không có dữ liệu'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* 5 Whys Chain */
                                    <div className="space-y-6">
                                        {structuredData.whys.map((w: any, i: number) => (
                                            <div key={i} className="flex gap-4 group">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-xs">
                                                        {i + 1}
                                                    </div>
                                                    {i < structuredData.whys.length - 1 && <div className="w-0.5 h-full bg-slate-800" />}
                                                </div>
                                                <div className="pb-4 flex-1">
                                                   <div className="mb-4">
                                                       <p className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-[0.2em]">❓ WHY {i + 1} (QUESTION)</p>
                                                       <p className="text-indigo-400 text-lg font-bold leading-snug uppercase">{w.question}</p>
                                                   </div>
                                                   <div className="pl-4 border-l-2 border-slate-800">
                                                       <p className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-[0.2em]">➡️ ANSWER</p>
                                                       <p className="text-white text-base font-medium leading-relaxed italic">"{w.answer}"</p>
                                                   </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="h-px bg-slate-800 mx-auto" />

                                {/* Summary Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 text-rose-400 text-xs font-black uppercase tracking-widest">
                                            <AlertCircle size={18} /> Kết luận & Đề xuất
                                        </div>
                                        <div className="bg-rose-500/5 border border-rose-500/20 p-6 rounded-2xl space-y-4">
                                            <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest">⚠️ NGUYÊN NHÂN GỐC (ROOT CAUSES)</p>
                                            <div className="space-y-4">
                                                {structuredData.rootCause.individual && (
                                                    <div className="flex gap-2">
                                                        <span className="text-rose-500 shrink-0 mt-1">👤</span>
                                                        <div>
                                                            <p className="text-rose-300 text-[9px] font-black uppercase">Cá nhân</p>
                                                            <p className="text-white text-xs font-medium">{structuredData.rootCause.individual}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {structuredData.rootCause.process && (
                                                    <div className="flex gap-2">
                                                        <span className="text-rose-500 shrink-0 mt-1">⚙️</span>
                                                        <div>
                                                            <p className="text-rose-300 text-[9px] font-black uppercase">Quy trình</p>
                                                            <p className="text-white text-xs font-medium">{structuredData.rootCause.process}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {structuredData.rootCause.system && (
                                                    <div className="flex gap-2">
                                                        <span className="text-rose-500 shrink-0 mt-1">🏥</span>
                                                        <div>
                                                            <p className="text-rose-300 text-[9px] font-black uppercase">Hệ thống</p>
                                                            <p className="text-white text-xs font-medium">{structuredData.rootCause.system}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-2xl space-y-4">
                                            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">🛠️ BIỆN PHÁP KHẮC PHỤC (SOLUTIONS)</p>
                                            <div className="space-y-4">
                                                {structuredData.solution.shortTerm && (
                                                    <div className="flex gap-2">
                                                        <span className="text-emerald-500 shrink-0">🔹</span>
                                                        <div>
                                                            <p className="text-emerald-300 text-[9px] font-black uppercase">Ngắn hạn</p>
                                                            <p className="text-white text-xs font-medium">{structuredData.solution.shortTerm}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {structuredData.solution.mediumTerm && (
                                                    <div className="flex gap-2">
                                                        <span className="text-emerald-500 shrink-0">🔹</span>
                                                        <div>
                                                            <p className="text-emerald-300 text-[9px] font-black uppercase">Trung hạn</p>
                                                            <p className="text-white text-xs font-medium">{structuredData.solution.mediumTerm}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {structuredData.solution.longTerm && (
                                                    <div className="flex gap-2">
                                                        <span className="text-emerald-500 shrink-0">🔹</span>
                                                        <div>
                                                            <p className="text-emerald-300 text-[9px] font-black uppercase">Dài hạn</p>
                                                            <p className="text-white text-xs font-medium">{structuredData.solution.longTerm}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={applyDashboardToForm}
                                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                        >
                                            <CheckCircle2 size={20} /> Xác nhận hoàn thành & Kết luận
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-12">
                        {/* SECTION A */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="h-0.5 flex-1 bg-slate-100"></div>
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-4">A. Dành cho nhân viên chuyên trách</h2>
                                <div className="h-0.5 flex-1 bg-slate-100"></div>
                            </div>

                            {/* I. Description */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded flex items-center justify-center text-xs font-bold">I</div>
                                    <h3 className="font-bold text-slate-800 text-sm md:text-base uppercase tracking-tight">Mô tả chi tiết sự cố</h3>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <p className="text-[11px] text-slate-500 italic mb-3 leading-relaxed">
                                        (Mô tả cả xử lý tức thời và hậu quả. Đối với loét tỳ đè, chỉ ra cụ thể vị trí, bên, phạm vi và tình trạng lúc nhập viện. Đối với sai sót về thuốc, liệt kê rõ tất cả thuốc)
                                    </p>
                                    <textarea
                                        rows={5}
                                        value={formData.i_mo_ta_chi_tiet}
                                        onChange={e => setFormData({ ...formData, i_mo_ta_chi_tiet: e.target.value })}
                                        placeholder="Nhập nội dung mô tả..."
                                        className="w-full bg-white border border-slate-200 rounded-xl p-4 text-[14pt] focus:ring-2 focus:ring-primary-500 outline-none shadow-sm resize-none font-medium"
                                    />
                                </div>
                            </div>

                            {/* II. Classification */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded flex items-center justify-center text-xs font-bold">II</div>
                                    <h3 className="font-bold text-slate-800 text-sm md:text-base uppercase tracking-tight">Phân loại sự cố theo nhóm sự cố (Incident type)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {INCIDENT_TYPES.map(cat => (
                                        <div key={cat.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-primary-400 transition-colors shadow-sm flex flex-col h-full">
                                            <h4 className="font-bold text-xs text-primary-700 mb-3 border-b border-primary-50 pb-2">{cat.id}. {cat.label}</h4>
                                            <div className="space-y-2 flex-1 overflow-y-auto max-h-48 scrollbar-thin">
                                                {cat.options.map(opt => (
                                                    <label key={opt} className="flex items-start gap-2 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={(formData.ii_phan_loai_theo_nhom || '').split('\n').includes(opt)}
                                                            onChange={() => toggleSelection('ii_phan_loai_theo_nhom', opt)}
                                                            className="mt-1 accent-primary-600 shrink-0"
                                                        />
                                                        <span className="text-[11px] text-slate-600 group-hover:text-primary-600 leading-tight">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* III. Treatment */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded flex items-center justify-center text-xs font-bold">III</div>
                                    <h3 className="font-bold text-slate-800 text-sm md:text-base uppercase tracking-tight">Điều trị / y lệnh đã được thực hiện</h3>
                                </div>
                                <textarea
                                    rows={4}
                                    value={formData.iii_dieu_tri_da_thuc_hien}
                                    onChange={e => setFormData({ ...formData, iii_dieu_tri_da_thuc_hien: e.target.value })}
                                    placeholder="Ghi nhận các can thiệp y tế đã thực hiện ngay sau sự cố..."
                                    className="w-full border border-slate-200 rounded-xl p-4 text-[14pt] focus:ring-2 focus:ring-primary-500 outline-none shadow-sm font-medium"
                                />
                            </div>

                            {/* IV. Root Causes */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded flex items-center justify-center text-xs font-bold">IV</div>
                                    <h3 className="font-bold text-slate-800 text-sm md:text-base uppercase tracking-tight">Phân loại nhóm nguyên nhân gây ra sự cố</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {ROOT_CAUSE_GROUPS.map(cat => (
                                        <div key={cat.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-amber-400 transition-colors flex flex-col">
                                            <h4 className="font-bold text-xs text-amber-700 mb-3">{cat.label}</h4>
                                            <div className="space-y-2">
                                                {cat.options.map(opt => (
                                                    <label key={opt} className="flex items-start gap-2 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={(formData.iiii_phan_loai_theo_nhom_nguyen_nhan || '').split('\n').includes(`${cat.label}: ${opt}`)}
                                                            onChange={() => toggleSelection('iiii_phan_loai_theo_nhom_nguyen_nhan', `${cat.label}: ${opt}`)}
                                                            className="mt-1 accent-amber-600 shrink-0"
                                                        />
                                                        <span className="text-[11px] text-slate-600 group-hover:text-amber-600 leading-tight">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* V & VI Actions & Recs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded flex items-center justify-center text-xs font-bold">V</div>
                                        <h3 className="font-bold text-slate-700 text-xs md:text-sm uppercase tracking-tight">Hành động khắc phục sự cố</h3>
                                    </div>
                                    <textarea
                                        rows={4}
                                        value={formData.iiiii_han_dong_khac_phuc}
                                        onChange={e => setFormData({ ...formData, iiiii_han_dong_khac_phuc: e.target.value })}
                                        placeholder="Mô tả hành động xử lý..."
                                        className="w-full border border-slate-200 rounded-xl p-4 text-[14pt] focus:ring-2 focus:ring-primary-500 outline-none shadow-sm font-medium"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded flex items-center justify-center text-xs font-bold">VI</div>
                                        <h3 className="font-bold text-slate-700 text-xs md:text-sm uppercase tracking-tight">Đề xuất khuyến cáo phòng ngừa</h3>
                                    </div>
                                    <textarea
                                        rows={4}
                                        value={formData.iiiiii_de_xuat_khuyen_cao}
                                        onChange={e => setFormData({ ...formData, iiiiii_de_xuat_khuyen_cao: e.target.value })}
                                        placeholder="Ghi đề xuất giải pháp lâu dài..."
                                        className="w-full border border-slate-200 rounded-xl p-4 text-[14pt] focus:ring-2 focus:ring-primary-500 outline-none shadow-sm font-medium"
                                    />
                                </div>
                            </div>

                            {/* Analyst Info */}
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Người tìm hiểu, phân tích</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={formData.a_danh_cho_nv_chuyen_trach}
                                            onChange={e => setFormData({ ...formData, a_danh_cho_nv_chuyen_trach: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[14pt] font-bold outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="Nhập tên nhân viên..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION B */}
                        <div className="space-y-8 pb-10">
                            <div className="flex items-center gap-3">
                                <div className="h-0.5 flex-1 bg-amber-100"></div>
                                <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em] px-4">B. Dành cho cấp quản lý</h2>
                                <div className="h-0.5 flex-1 bg-amber-100"></div>
                            </div>

                            {/* I. Specialist Evaluation */}
                            <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 space-y-6">
                                <h3 className="font-black text-amber-800 text-xs md:text-sm uppercase tracking-tight flex items-center gap-2"><ShieldCheck size={18} /> I. Đánh giá của trưởng nhóm chuyên gia</h3>
                                
                                <button
                                    onClick={() => handleAiAnalysis('MANAGEMENT')}
                                    disabled={!formData.scyk_id || isAnalyzing}
                                    className="w-full mb-4 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-200 hover:shadow-amber-300 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isAnalyzing && aiRole === 'MANAGEMENT' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                    {isAnalyzing && aiRole === 'MANAGEMENT' ? 'AI Đánh giá Quản lý (Phần B)' : 'AI Đánh giá Quản lý (Phần B)'}
                                </button>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-amber-900 block ml-1 uppercase opacity-60">Mô tả kết quả phát hiện được (không lặp lại các mô tả sự cố)</label>
                                    <textarea
                                        rows={3}
                                        value={mgmtData.findings}
                                        onChange={e => setMgmtData({ ...mgmtData, findings: e.target.value })}
                                        className="w-full bg-white border border-amber-200 rounded-xl p-4 text-[14pt] focus:ring-2 focus:ring-amber-500 outline-none shadow-sm font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
                                        <p className="text-xs font-bold text-amber-900 mb-3 opacity-80">Đã thảo luận đưa khuyến cáo/hướng xử lý với người báo cáo</p>
                                        <div className="flex gap-4">
                                            {['Có', 'Không', 'Không ghi nhận'].map(v => (
                                                <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="discussed"
                                                        checked={mgmtData.discussed === v}
                                                        onChange={() => setMgmtData({ ...mgmtData, discussed: v })}
                                                        className="accent-amber-600"
                                                    />
                                                    <span className="text-[11px] font-medium text-slate-700">{v}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
                                        <p className="text-xs font-bold text-amber-900 mb-3 opacity-80">Phù hợp với các khuyến cáo chính thức được ban hành</p>
                                        <div className="flex gap-4 mb-3">
                                            {['Có', 'Không', 'Không ghi nhận'].map(v => (
                                                <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="consistent"
                                                        checked={mgmtData.consistent === v}
                                                        onChange={() => setMgmtData({ ...mgmtData, consistent: v })}
                                                        className="accent-amber-600"
                                                    />
                                                    <span className="text-[11px] font-medium text-slate-700">{v}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            value={mgmtData.consistentDetails}
                                            onChange={e => setMgmtData({ ...mgmtData, consistentDetails: e.target.value })}
                                            placeholder="Nhập thông tin chi tiết..."
                                            className="w-full bg-slate-50 border border-amber-100 rounded-lg p-2 text-[11px] focus:ring-1 focus:ring-amber-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* II. Severity Assessment */}
                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-6">
                                <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-tight flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" /> II. Đánh giá mức độ tổn thương</h3>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* On Patient */}
                                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b pb-2">Trên người bệnh</h4>
                                        <div className="space-y-4">
                                            {SEVERITY_PATIENT.map(row => (
                                                <div key={row.cat} className="space-y-2">
                                                    <p className="text-[11px] font-bold text-slate-600">{row.cat}</p>
                                                    <div className="flex gap-2">
                                                        {row.levels.map(lv => (
                                                            <button
                                                                key={lv}
                                                                onClick={() => setMgmtData({ ...mgmtData, severityPatient: lv })}
                                                                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black transition-all ${mgmtData.severityPatient === lv ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                            >
                                                                {lv}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* On Organization */}
                                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b pb-2">Trên tổ chức</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {SEVERITY_ORG.map(opt => (
                                                <label key={opt} className="flex items-center gap-2 cursor-pointer group hover:bg-slate-50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                                                    <input
                                                        type="checkbox"
                                                        checked={mgmtData.severityOrg.includes(opt)}
                                                        onChange={() => {
                                                            const newItems = mgmtData.severityOrg.includes(opt)
                                                                ? mgmtData.severityOrg.filter(i => i !== opt)
                                                                : [...mgmtData.severityOrg, opt];
                                                            setMgmtData({ ...mgmtData, severityOrg: newItems });
                                                        }}
                                                        className="accent-slate-700"
                                                    />
                                                    <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{opt}</span>
                                                </label>
                                            ))}
                                            <div className="col-span-1 sm:col-span-2 pt-2">
                                                <input
                                                    type="text"
                                                    value={mgmtData.severityOrgOther}
                                                    onChange={e => setMgmtData({ ...mgmtData, severityOrgOther: e.target.value })}
                                                    placeholder="Nhập nội dung khác..."
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-[11px] focus:ring-1 focus:ring-slate-400 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mgmt Sign Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1 mb-2">Chức danh ký</label>
                                    <input
                                        type="text"
                                        value={formData.chuc_danh}
                                        onChange={e => setFormData({ ...formData, chuc_danh: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl p-3 text-[14pt] font-bold shadow-sm outline-none bg-slate-50/50"
                                        placeholder="VD: Trưởng khoa..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1 mb-2">Ngày ký</label>
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="date"
                                            value={formData.ngay}
                                            onChange={e => setFormData({ ...formData, ngay: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-[14pt] font-bold shadow-sm outline-none bg-slate-50/50"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1 mb-2">Giờ ký</label>
                                    <div className="relative">
                                        <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={formData.gio}
                                            onChange={e => setFormData({ ...formData, gio: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-[14pt] font-bold shadow-sm outline-none bg-slate-50/50"
                                            placeholder="HH:mm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Severity Notes at the bottom */}
                            <div className="pt-10 border-t border-slate-100">
                                <p className="text-xs text-slate-400 italic">
                                    [1] NC1: Tự hồi phục / không cần điều trị <br />
                                    [2] NC2: Yêu cầu can thiệp kéo dài <br />
                                    [3] NC3: Cấp cứu / tổn thương vĩnh viễn
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (viewMode === 'VIEW' && viewingItem) {
        const linkedInc = incidents.find(inc => inc.id === viewingItem.scyk_id);

        const handleExportWord = () => {
            if (!viewingItem) return;

            const selectedIncidentTypes = (viewingItem.ii_phan_loai_theo_nhom || '').split('\n').map(s => s.trim());
            const selectedCauseGroups = (viewingItem.iiii_phan_loai_theo_nhom_nguyen_nhan || '').split('\n').map(s => s.trim());
            const bLabels = viewingItem.b_danh_cho_cap_quan_ly || '';

            const renderCheckboxes = (options: string[], selected: string[], cols = 2) => {
                let rows = '';
                for (let i = 0; i < options.length; i += cols) {
                    const chunk = options.slice(i, i + cols);
                    rows += `<tr>${chunk.map(opt => `
                        <td style="width: ${100 / cols}%; padding: 2pt 0; border: none;">
                            <span style="font-family: 'DejaVu Sans', 'Arial Unicode MS'; font-size: 14pt;">${selected.includes(opt) ? '☑' : '☐'}</span>
                            <span style="font-size: 14pt;">${opt}</span>
                        </td>`).join('')}</tr>`;
                }
                return `<table style="width: 100%; border: none; border-collapse: collapse;">${rows}</table>`;
            };

            const htmlContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset="utf-8">
                    <style>
                        @page {
                            size: 21cm 29.7cm;
                            margin: 2cm 2cm 2cm 2.5cm;
                            mso-page-orientation: portrait;
                        }
                        body {
                            font-family: "Times New Roman", Times, serif;
                            font-size: 14pt;
                            color: #000;
                            line-height: 1.2;
                        }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 0px; margin-top: 0px; }
                        td { vertical-align: top; padding: 4pt; border: 0.5pt solid black; }
                        .no-border td { border: none; }
                        .text-center { text-align: center; }
                        .font-bold { font-weight: bold; }
                        .underline { text-decoration: underline; }
                        .header-title { font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 10pt; text-transform: uppercase; }
                        .item-title { font-size: 14pt; font-weight: bold; background-color: #f2f2f2; padding: 4pt; border: none; }
                    </style>
                </head>
                <body>
                    <div class="header-title">A. DÀNH CHO NHÂN VIÊN CHUYÊN TRÁCH</div>
                    
                    <table><tr><td class="item-title">I. Mô tả chi tiết sự cố</td></tr></table>
                    <table style="border-top: none;">
                        <tr>
                            <td>
                                <div style="font-size: 11pt; font-style: italic; margin-bottom: 5pt;">(Mô tả cả xử lý tức thời và hậu quả. Đối với loét tỳ đè, chỉ ra cụ thể vị trí, bên, phạm vi và tình trạng lúc nhập viện. Đối với sai sót về thuốc, liệt kê rõ tất cả thuốc (đính kèm thêm 1 tờ liệt kê nếu cần):</div>
                                <div style="min-height: 100pt;">${viewingItem.i_mo_ta_chi_tiet || ''}</div>
                                ${Array(5).fill('<div style="border-bottom: 1pt dotted #ccc; margin-top: 15pt;"></div>').join('')}
                            </td>
                        </tr>
                    </table>

                    <table style="margin-top: 10pt;"><tr><td class="item-title">II. Phân loại sự cố theo nhóm sự cố (Incident type)</td></tr></table>
                    <table style="border-top: none;">
                        ${INCIDENT_TYPES.map(cat => `
                            <tr>
                                <td style="width: 40%; font-weight: bold;">${cat.id}. ${cat.label}</td>
                                <td style="width: 60%;">${renderCheckboxes(cat.options, selectedIncidentTypes, 1)}</td>
                            </tr>
                        `).join('')}
                    </table>

                    <table style="margin-top: 10pt;"><tr><td class="item-title">III. Điều trị/y lệnh đã được thực hiện</td></tr></table>
                    <table style="border-top: none;">
                        <tr>
                            <td>
                                <div style="min-height: 60pt;">${viewingItem.iii_dieu_tri_da_thuc_hien || ''}</div>
                                ${Array(3).fill('<div style="border-bottom: 1pt dotted #ccc; margin-top: 15pt;"></div>').join('')}
                            </td>
                        </tr>
                    </table>

                    <table style="border-top: none;">
                        ${ROOT_CAUSE_GROUPS.map((cat, idx) => `
                            <tr>
                                <td style="width: 40%; font-weight: bold;">${idx + 1}. ${cat.label}</td>
                                <td style="width: 60%;">${renderCheckboxes(cat.options, selectedCauseGroups.filter(s => s.startsWith(cat.label)).map(s => s.replace(`${cat.label}: `, '')), 1)}</td>
                            </tr>
                        `).join('')}
                    </table>

                    <table style="margin-top: 10pt;">
                        <tr style="background-color: #f2f2f2; font-weight: bold;">
                            <td style="width: 50%;">V. Hành động khắc phục sự cố</td>
                            <td style="width: 50%;">VI. Đề xuất khuyến cáo phòng ngừa sự cố</td>
                        </tr>
                        <tr>
                            <td style="height: 120pt;">
                                <div style="font-weight: bold; font-size: 11pt;">Mô tả hành động xử lý sự cố</div>
                                <div>${viewingItem.iiiii_han_dong_khac_phuc || ''}</div>
                                ${Array(4).fill('<div style="border-bottom: 1pt dotted #ccc; margin-top: 15pt;"></div>').join('')}
                            </td>
                            <td style="height: 120pt;">
                                <div style="font-weight: bold; font-size: 11pt;">Ghi đề xuất khuyến cáo phòng ngừa</div>
                                <div>${viewingItem.iiiiii_de_xuat_khuyen_cao || ''}</div>
                                ${Array(4).fill('<div style="border-bottom: 1pt dotted #ccc; margin-top: 15pt;"></div>').join('')}
                            </td>
                        </tr>
                    </table>

                    <div class="header-title" style="margin-top: 20pt;">B. DÀNH CHO CẤP QUẢN LÝ</div>
                    
                    <table><tr><td class="item-title">I. Đánh giá của Trưởng nhóm chuyên gia</td></tr></table>
                    <table style="border-top: none;">
                        <tr>
                            <td>
                                <div style="margin-bottom: 5pt;">Mô tả kết quả phát hiện được (không lặp lại các mô tả sự cố)</div>
                                <div style="font-style: italic; min-height: 50pt;">${bLabels.split('\n')[0]?.replace('Kết quả: ', '') || ''}</div>
                                <div style="border-bottom: 1pt dotted #ccc; margin-top: 15pt;"></div>
                            </td>
                        </tr>
                    </table>
                    
                    <table style="border-top: none;">
                        <tr>
                            <td style="width: 65%;">Đã thảo luận đưa khuyến cáo/hướng xử lý với người báo cáo</td>
                            <td style="width: 35%;">
                                ${['Có', 'Không', 'Không ghi nhận'].map(v => `
                                    <div style="display: inline-block; white-space: nowrap;">
                                        <span style="font-family: 'DejaVu Sans', 'Arial Unicode MS';">${bLabels.includes(`Thảo luận khuyến cáo: ${v}`) ? '☑' : '☐'}</span> ${v} &nbsp;
                                    </div>
                                `).join('')}
                            </td>
                        </tr>
                        <tr>
                            <td style="width: 65%;">Phù hợp với các khuyến cáo chính thức được ban hành<br/>Ghi cụ thể khuyến cáo: ${bLabels.match(/Phù hợp khuyến cáo: .* \((.*)\)/)?.[1] || '....................'}</td>
                            <td style="width: 35%;">
                                ${['Có', 'Không', 'Không ghi nhận'].map(v => `
                                    <div style="display: inline-block; white-space: nowrap;">
                                        <span style="font-family: 'DejaVu Sans', 'Arial Unicode MS';">${bLabels.includes(`Phù hợp khuyến cáo: ${v}`) ? '☑' : '☐'}</span> ${v} &nbsp;
                                    </div>
                                `).join('')}
                            </td>
                        </tr>
                    </table>

                    <table style="margin-top: 10pt;"><tr><td class="item-title">II. Đánh giá mức độ tổn thương</td></tr></table>
                    <table style="border-top: none;">
                        <tr style="font-weight: bold;">
                            <td style="width: 50%;">Trên người bệnh</td>
                            <td style="width: 50%;">Trên tổ chức</td>
                        </tr>
                        <tr>
                            <td style="padding: 0;">
                                <table style="border: none;">
                                    ${SEVERITY_PATIENT.map(row => `
                                        <tr>
                                            <td style="border: none; border-bottom: 0.1pt solid #ccc; width: 65%; font-size: 12pt; padding: 2pt 4pt;">${row.cat}</td>
                                            <td style="border: none; border-bottom: 0.1pt solid #ccc; padding: 2pt 4pt; text-align: right;">
                                                <div style="white-space: nowrap;">
                                                ${row.levels.map(l => `
                                                    <span style="font-family: 'DejaVu Sans', 'Arial Unicode MS';">${bLabels.includes(`Mức độ (NB): ${l}`) ? '☑' : '☐'}</span> ${l} &nbsp;
                                                `).join('')}
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </table>
                            </td>
                            <td style="padding: 0;">
                                <table style="border: none;">
                                    ${SEVERITY_ORG.map(opt => `
                                        <tr>
                                            <td style="border: none; border-bottom: 0.1pt solid #ccc; padding: 2pt 4pt; font-size: 12pt;">
                                                <span style="font-family: 'DejaVu Sans', 'Arial Unicode MS';">${bLabels.includes(opt) ? '☑' : '☐'}</span> ${opt}
                                            </td>
                                        </tr>
                                    `).join('')}
                                    ${Array(Math.max(0, 4 - SEVERITY_ORG.length)).fill('<tr><td style="border: none; padding: 2pt 4pt;">&nbsp;</td></tr>').join('')}
                                </table>
                            </td>
                        </tr>
                    </table>

                    <table style="margin-top: 20pt;" class="no-border">
                        <tr>
                            <td style="width: 50%;">
                                <div style="font-weight: bold;">Tên: <span style="font-weight: normal;">${viewingItem.a_danh_cho_nv_chuyen_trach || '................'}</span></div>
                                <div style="font-weight: bold; margin-top: 10pt;">Chức danh: <span style="font-weight: normal;">${viewingItem.chuc_danh || '................'}</span></div>
                            </td>
                            <td style="width: 50%;">
                                <div style="font-weight: bold;">Ký tên: ..........................</div>
                                <div style="font-weight: bold; margin-top: 10pt;">Ngày: ${viewingItem.ngay || '/   /'} &nbsp;&nbsp;&nbsp; Giờ: ${viewingItem.gio || ' : '}</div>
                            </td>
                        </tr>
                    </table>

                    <div style="font-size: 11pt; margin-top: 25pt; line-height: 1.5; font-style: italic;">
                        [1] Tổn thương nhẹ là tổn thương tự hồi phục hoặc không cần can thiệp điều trị<br/>
                        [2] Tổn thương trung bình là tổn thương đòi hỏi can thiệp điều trị, kéo dài thời gian nằm viện, ảnh hưởng đến chức năng lâu dài.<br/>
                        [3] Tổn thương nặng là tổn thương đòi hỏi phải cấp cứu hoặc can thiệp điều trị lớn, gây mất chức năng vĩnh viễn hoặc gây tử vong.
                    </div>
                </body>
                </html>
            `;

            const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Phan_tich_RCA_${linkedInc?.so_bc_ma_scyk || 'export'}.doc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        // Helper for checkbox display
        const CheckboxList = ({ title, options, selectedValue, cols = 1 }: { title: string, options: string[], selectedValue: string, cols?: number }) => {
            const selectedItems = (selectedValue || '').split('\n').map(s => s.trim());
            return (
                <div className="mb-4">
                    <h4 className="font-bold mb-2 underline">{title}</h4>
                    <div className={`grid grid-cols-${cols} gap-y-1`}>
                        {options.map((opt, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                                <span className="text-lg leading-none">{selectedItems.includes(opt) ? '☑' : '☐'}</span>
                                <span>{opt}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        };

        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in duration-300">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center print:hidden">
                    <button onClick={() => setViewMode('LIST')} className="flex items-center gap-2 text-slate-600 hover:text-primary-600 font-medium text-sm transition-colors">
                        <ArrowLeft size={18} /> Quay lại danh sách
                    </button>
                    <div className="flex gap-2">
                        <button onClick={handleExportWord} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
                            <Download size={16} /> Xuất Word
                        </button>
                        <button onClick={() => { setEditingItem(viewingItem); setFormData(viewingItem); setViewMode('FORM'); }} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2">
                            <Edit2 size={16} /> Chỉnh sửa
                        </button>
                    </div>
                </div>

                {/* Print/Document Area */}
                <div className="p-[2cm] max-w-5xl mx-auto shadow-sm" style={{ fontSize: '14pt', fontFamily: 'Times New Roman, serif', color: '#000' }}>
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold uppercase mb-1">A. DÀNH CHO NHÂN VIÊN CHUYÊN TRÁCH</h2>
                    </div>

                    {/* Section I */}
                    <div className="p-2 mb-4">
                        <h3 className="font-bold underline mb-1">I. Mô tả chi tiết sự cố</h3>
                        <p className="italic mb-2 text-[12pt]">(Mô tả cả xử lý tức thời và hậu quả. Đối với loét tỳ đè, chỉ ra cụ thể vị trí, bên, phạm vi và tình trạng lúc nhập viện. Đối với sai sót về thuốc, liệt kê rõ tất cả thuốc):</p>
                        <div className="min-h-[100px] px-2 pb-2 leading-relaxed">
                            {viewingItem.i_mo_ta_chi_tiet || '................................................................................................................................................'}
                        </div>
                    </div>

                    {/* Section II */}
                    <div className="mb-4">
                        <h3 className="font-bold underline p-2">II. Phân loại sự cố theo nhóm sự cố (Incident type)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 p-2">
                            {INCIDENT_TYPES.map(cat => (
                                <div key={cat.id} className="mb-4 break-inside-avoid">
                                    <div className="flex gap-2 mb-1">
                                        <span className="font-bold shrink-0">{cat.id}.</span>
                                        <span className="font-bold leading-tight">{cat.label}</span>
                                    </div>
                                    <div className="pl-6 space-y-0.5">
                                        {cat.options.map((opt, idx) => (
                                            <div key={idx} className="flex items-start gap-2">
                                                <span className="text-lg -mt-0.5">{(viewingItem.ii_phan_loai_theo_nhom || '').includes(opt) ? '☑' : '☐'}</span>
                                                <span className="leading-tight">{opt}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section III */}
                    <div className="p-2 mb-4">
                        <h3 className="font-bold underline mb-1">III. Điều trị/y lệnh đã được thực hiện</h3>
                        <div className="min-h-[80px] px-2 pb-2 leading-relaxed">
                            {viewingItem.iii_dieu_tri_da_thuc_hien || '................................................................................................................................................'}
                        </div>
                    </div>

                    {/* Section IV */}
                    <div className="mb-4">
                        <h3 className="font-bold underline p-2">IV. Phân loại sự cố theo nhóm nguyên nhân gây ra sự cố</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 p-2">
                            {ROOT_CAUSE_GROUPS.map((cat, idx) => (
                                <div key={idx} className="mb-4 break-inside-avoid">
                                    <h4 className="font-bold mb-1">{cat.label}</h4>
                                    <div className="pl-6 space-y-0.5">
                                        {cat.options.map((opt, oIdx) => (
                                            <div key={oIdx} className="flex items-start gap-2">
                                                <span className="text-lg -mt-0.5">{(viewingItem.iiii_phan_loai_theo_nhom_nguyen_nhan || '').includes(opt) ? '☑' : '☐'}</span>
                                                <span className="leading-tight">{opt}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section V & VI */}
                    <div className="grid grid-cols-2 mb-4 gap-8">
                        <div className="p-2">
                            <h3 className="font-bold underline mb-2">V. Hành động khắc phục sự cố</h3>
                            <div className="min-h-[100px] leading-relaxed border-l-2 border-slate-100 pl-4">
                                <p className="font-bold mb-1 text-[10pt] uppercase text-slate-400 tracking-wider">Mô tả hành động xử lý sự cố</p>
                                {viewingItem.iiiii_han_dong_khac_phuc || '.........................................................'}
                            </div>
                        </div>
                        <div className="p-2">
                            <h3 className="font-bold underline mb-2">VI. Đề xuất khuyến cáo phòng ngừa sự cố</h3>
                            <div className="min-h-[100px] leading-relaxed border-l-2 border-slate-100 pl-4">
                                <p className="font-bold mb-1 text-[10pt] uppercase text-slate-400 tracking-wider">Ghi đề xuất khuyến cáo phòng ngừa</p>
                                {viewingItem.iiiiii_de_xuat_khuyen_cao || '.........................................................'}
                            </div>
                        </div>
                    </div>

                    {/* Section B */}
                    <div className="mt-8 border-t-2 border-slate-200 pt-8">
                        <h2 className="text-2xl font-black uppercase text-center mb-10 tracking-widest text-slate-900">B. DÀNH CHO CẤP QUẢN LÝ</h2>
                        <div className="">
                            <h3 className="font-bold p-2 text-lg">I. Đánh giá của Trưởng nhóm chuyên gia</h3>
                            <div className="p-2">
                                <p className="mb-2 text-slate-700">Mô tả kết quả phát hiện được (không lặp lại các mô tả sự cố):</p>
                                <div className="min-h-[60px] italic text-slate-800 leading-relaxed pl-4 border-l-2 border-primary-100">
                                    {viewingItem.b_danh_cho_cap_quan_ly?.split('\n')[0]?.replace('Kết quả: ', '') || '.........................................................'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 p-2 space-y-4 my-4">
                                <div className="flex justify-between items-center pb-2">
                                    <span className="font-medium text-slate-700">Đã thảo luận đưa khuyến cáo/hướng xử lý với người báo cáo:</span>
                                    <div className="flex gap-6">
                                        {['Có', 'Không', 'Không ghi nhận'].map(v => (
                                            <span key={v} className="flex items-center gap-2">
                                                <span className="text-xl">{viewingItem.b_danh_cho_cap_quan_ly?.includes(`Thảo luận khuyến cáo: ${v}`) ? '☑' : '☐'}</span> {v}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="pb-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-slate-700">Phù hợp với các khuyến cáo chính thức được ban hành:</span>
                                        <div className="flex gap-6">
                                            {['Có', 'Không', 'Không ghi nhận'].map(v => (
                                                <span key={v} className="flex items-center gap-2">
                                                    <span className="text-xl">{viewingItem.b_danh_cho_cap_quan_ly?.includes(`Phù hợp khuyến cáo: ${v}`) ? '☑' : '☐'}</span> {v}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm italic text-slate-500 pl-4 border-l-2 border-slate-100">Ghi cụ thể khuyến cáo: {viewingItem.b_danh_cho_cap_quan_ly?.match(/Phù hợp khuyến cáo: .* \((.*)\)/)?.[1] || '....................'}</p>
                                </div>
                            </div>

                            <h3 className="font-bold p-2 border-y border-black">II. Đánh giá mức độ tổn thương</h3>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="p-2">
                                    <h4 className="font-bold underline mb-2">Trên người bệnh</h4>
                                    <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
                                        {SEVERITY_PATIENT.map(cat => (
                                            <React.Fragment key={cat.cat}>
                                                <span className="text-sm">{cat.cat}</span>
                                                <div className="flex gap-2">
                                                    {cat.levels.map(l => (
                                                        <span key={l} className="flex items-center gap-1">
                                                            <span>{viewingItem.b_danh_cho_cap_quan_ly?.includes(`Mức độ (NB): ${l}`) ? '☑' : '☐'}</span> {l}
                                                        </span>
                                                    ))}
                                                </div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-2">
                                    <h4 className="font-bold underline mb-2">Trên tổ chức</h4>
                                    <div className="space-y-1">
                                        {SEVERITY_ORG.map(opt => (
                                            <div key={opt} className="flex items-center gap-2">
                                                <span>{viewingItem.b_danh_cho_cap_quan_ly?.includes(opt) ? '☑' : '☐'}</span>
                                                <span className="text-sm">{opt}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 pt-8 mt-10">
                                <div className="p-2 space-y-2">
                                    <p className="font-bold text-slate-900 italic underline">Nhân viên chuyên trách</p>
                                    <p className="text-slate-800">Tên: <span className="font-bold">{viewingItem.a_danh_cho_nv_chuyen_trach || '................'}</span></p>
                                    <p className="text-slate-800">Chức danh: <span className="font-bold">{viewingItem.chuc_danh || '................'}</span></p>
                                </div>
                                <div className="p-2 text-right space-y-2">
                                    <p className="font-bold text-slate-900 italic underline">Xác nhận của Quản lý</p>
                                    <p className="text-slate-800">Ký tên: ..........................</p>
                                    <div className="flex gap-4 justify-end text-slate-800">
                                        <span>Ngày: {viewingItem.ngay || '../../....'}</span>
                                        <span>Giờ: {viewingItem.gio || '....:....'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Severity Definitions */}
                        <div className="mt-6 text-[12pt] space-y-2 pl-4">
                            <p>[1] Tổn thương nhẹ là tổn thương tự hồi phục hoặc không cần can thiệp điều trị</p>
                            <p>[2] Tổn thương trung bình là tổn thương đòi hỏi can thiệp điều trị, kéo dài thời gian nằm viện, ảnh hưởng đến chức năng lâu dài.</p>
                            <p>[3] Tổn thương nặng là tổn thương đòi hỏi phải cấp cứu hoặc can thiệp điều trị lớn, gây mất chức năng vĩnh viễn hoặc gây tử vong.</p>
                        </div>
                    </div>

                    {/* Meta for Linked Incident - Discreet */}
                    <div className="mt-12 pt-4 border-t border-slate-100 text-[10pt] text-slate-400 italic text-right print:hidden">
                        Sự cố liên kết: {linkedInc?.so_bc_ma_scyk || 'N/A'} - {linkedInc?.ho_ten_nb || 'N/A'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" size={18} />
                    <input
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all font-medium"
                        placeholder="Tìm theo mã sự cố, nội dung..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => { setEditingItem(null); setFormData(initialForm); setViewMode('FORM'); }}
                    className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                    <Plus size={18} /> Lập bản phân tích mới
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 font-medium">Đang đồng bộ dữ liệu phân tích...</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200 shadow-inner">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center text-primary-200">
                            <BrainCircuit size={48} />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border-4 border-white shadow-lg rounded-2xl flex items-center justify-center text-amber-500 animate-bounce">
                            <AlertCircle size={20} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Chậm lại một chút!</h3>
                    <p className="text-slate-500 mb-10 px-6 text-center max-w-sm text-sm leading-relaxed">Hệ thống chưa tìm thấy bản phân tích RCA nào. Hãy bắt đầu bằng cách nhấn nút dưới đây để tìm hiểu nguyên nhân gốc rễ.</p>
                    <button
                        onClick={() => { setEditingItem(null); setFormData(initialForm); setViewMode('FORM'); }}
                        className="group flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold transition-all hover:bg-primary-600 hover:scale-[1.05] active:scale-95 shadow-xl shadow-slate-200"
                    >
                        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                        Tạo bản phân tích ngay
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Desktop View: Table */}
                    <div className="hidden md:block overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#009900] text-white font-bold text-[10px] uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Đơn vị / Mã SCYK</th>
                                    <th className="px-6 py-4">Phân loại / Nội dung</th>
                                    <th className="px-6 py-4">Chuyên trách</th>
                                    <th className="px-6 py-4 text-center">Ngày lập</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredItems.map(item => {
                                    const linkedInc = incidents.find(inc => inc.id === item.scyk_id);
                                    const iDept1 = (linkedInc?.khoa_phong || '').trim().toLowerCase();
                                    const iDept2 = (linkedInc?.don_vi_bao_cao || '').trim().toLowerCase();
                                    const isOwnUnit = isAdmin || (uDept !== '' && (uDept === iDept1 || iDept1.includes(uDept) || uDept.includes(iDept1) || uDept === iDept2 || iDept2.includes(uDept) || uDept.includes(iDept2)));
                                    return (
                                        <tr key={item.id} className="hover:bg-primary-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{linkedInc?.khoa_phong || linkedInc?.don_vi_bao_cao || '---'}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-black font-mono tracking-tighter opacity-70">{linkedInc?.so_bc_ma_scyk}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 cursor-pointer" onClick={() => { setViewingItem(item); setViewMode('VIEW'); }}>
                                                <div className="max-w-md">
                                                    <p className="font-bold text-slate-800 line-clamp-1 group-hover:text-primary-700 transition-colors">
                                                        {(item.ii_phan_loai_theo_nhom || '').split('\n')[0] || 'N/A'}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                                        {item.i_mo_ta_chi_tiet || 'Không có mô tả...'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                        {item.a_danh_cho_nv_chuyen_trach?.[0]?.toUpperCase() || 'A'}
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700">{item.a_danh_cho_nv_chuyen_trach || '---'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                    <Calendar size={14} />
                                                    {item.ngay || '---'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right w-44">
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    <button onClick={() => { setViewingItem(item); setViewMode('VIEW'); }} className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-all border border-green-200 shadow-sm">
                                                        <Eye size={12} /> Xem
                                                    </button>
                                                    {isOwnUnit && (
                                                        <>
                                                            <button onClick={() => { setEditingItem(item); setFormData(item); setViewMode('FORM'); }} className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all border border-blue-200 shadow-sm">
                                                                <Edit2 size={12} /> Sửa
                                                            </button>
                                                            <button onClick={() => item.id && handleDelete(item.id)} className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all border border-red-200 shadow-sm col-span-2">
                                                                <Trash2 size={12} /> Xóa phân tích
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View: Cards */}
                    <div className="md:hidden space-y-4">
                        {filteredItems.map(item => {
                            const linkedInc = incidents.find(inc => inc.id === item.scyk_id);
                            const iDept1 = (linkedInc?.khoa_phong || '').trim().toLowerCase();
                            const iDept2 = (linkedInc?.don_vi_bao_cao || '').trim().toLowerCase();
                            const isOwnUnit = isAdmin || (uDept !== '' && (uDept === iDept1 || iDept1.includes(uDept) || uDept.includes(iDept1) || uDept === iDept2 || iDept2.includes(uDept) || uDept.includes(iDept2)));

                            return (
                                <div key={item.id} className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-sm flex flex-col gap-4">
                                    <div className="flex justify-between items-center">
                                        <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black font-mono">
                                            {linkedInc?.so_bc_ma_scyk || 'N/A'}
                                        </span>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setViewingItem(item); setViewMode('VIEW'); }} className="w-8 h-8 flex items-center justify-center bg-primary-50 text-primary-600 rounded-lg"><Eye size={14} /></button>
                                            {isOwnUnit && (
                                                <>
                                                    <button onClick={() => { setEditingItem(item); setFormData(item); setViewMode('FORM'); }} className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg"><Edit2 size={14} /></button>
                                                    <button onClick={() => item.id && handleDelete(item.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg"><Trash2 size={14} /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div onClick={() => { setViewingItem(item); setViewMode('VIEW'); }}>
                                        <h4 className="font-bold text-slate-800 line-clamp-2 leading-tight text-lg">
                                            {linkedInc?.khoa_phong || linkedInc?.don_vi_bao_cao || 'N/A'}
                                        </h4>
                                        <div className="mt-2 space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Phân loại: {(item.ii_phan_loai_theo_nhom || '').split('\n')[0] || 'N/A'}</p>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic">
                                                {item.i_mo_ta_chi_tiet}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between mt-auto">
                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                            <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px]">{item.a_danh_cho_nv_chuyen_trach?.[0]?.toUpperCase() || 'A'}</span>
                                            {item.a_danh_cho_nv_chuyen_trach}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">{item.ngay}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncidentAnalysis;

// Add generic icons for View mode
const Activity = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
);
