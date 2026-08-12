import { supabase } from './supabaseClient';

export interface Permission {
    id: string;
    role_id: string;
    module: string;
    sub_module?: string | null;
    can_view: boolean;
    can_create: boolean;
    can_update: boolean;
    can_delete: boolean;
    created_at?: string;
    updated_at?: string;
}

export enum ModuleType {
    DASHBOARD = 'DASHBOARD',
    JCI = 'JCI',
    HR = 'HR',
    DOCS = 'DOCS',
    ASSESSMENT = 'ASSESSMENT',
    INCIDENTS = 'INCIDENTS',
    IMPROVEMENT = 'IMPROVEMENT',
    INDICATORS = 'INDICATORS',
    SUPERVISION = 'SUPERVISION',
    KTCM = 'KTCM',
    PT_LOAI_2 = 'PT_LOAI_2',
    REPORTS = 'REPORTS',
    SETTINGS = 'SETTINGS'
}

// Sub-module definitions for each module
export const SUB_MODULES: Record<string, { id: string, label: string }[]> = {
  [ModuleType.ASSESSMENT]: [
    { id: 'QUALITY_ASSESSMENT', label: 'Chấm điểm 83 Tiêu chí' },
    { id: 'ASSESSMENT_REPORTS', label: 'Các bộ tiêu chuẩn khác' },
    { id: 'TEAM_ASSESSMENT', label: 'Chấm điểm theo tổ' },
    { id: 'CRITERIA_83', label: 'Danh mục 83 Tiêu chí' },
    { id: 'STANDARD_1', label: 'Tiêu chuẩn chất lượng cơ bản' },
    { id: 'STANDARD_2_SATISFACTION', label: 'Mức độ hài lòng - Nội trú' },
    { id: 'STANDARD_2_OUTPATIENT', label: 'Mức độ hài lòng - Ngoại trú' },
    { id: 'STANDARD_2_STAFF', label: 'Mức độ hài lòng - Nhân viên' },
    { id: 'STANDARD_2_KS_NUOI_CON', label: 'Khảo sát Nuôi con bằng sữa mẹ' },
    { id: 'STANDARD_2_KS_ME_SINH_CON', label: 'Khảo sát Người mẹ sinh con' },
  ],
  [ModuleType.IMPROVEMENT]: [
    { id: 'PLAN', label: 'Kế hoạch CTCL' },
    { id: 'REPORT', label: 'Báo cáo tiến độ' },
  ],
  [ModuleType.INCIDENTS]: [
    { id: 'OVERVIEW', label: 'Tổng quan' },
    { id: 'LIST', label: 'Danh sách SCYK' },
    { id: 'VERIFICATION', label: 'Biên bản xác minh' },
    { id: 'ANALYSIS', label: 'Phân tích (RCA)' },
    { id: 'REPORTS', label: 'Báo cáo Cục Quân y' },
  ],
  [ModuleType.HR]: [
    { id: 'ALL', label: 'Tất cả nhân sự' },
    { id: 'COUNCIL', label: 'Hội đồng QLCL' },
    { id: 'BOARD', label: 'Ban QLCL' },
    { id: 'NETWORK', label: 'Mạng lưới' },
  ],
  [ModuleType.DOCS]: [
    { id: 'LIBRARY', label: 'Thư viện văn bản' },
    { id: 'TRAINING', label: 'Đào tạo' },
    { id: 'SHARING', label: 'Góc chia sẻ' },
  ],
  [ModuleType.SUPERVISION]: [
    { id: 'OVERVIEW', label: 'Tổng quan' },
    { id: 'SURGERY', label: 'An toàn phẫu thuật' },
    { id: 'HAND_HYGIENE', label: 'Vệ sinh tay' },
    { id: '5S', label: 'Giám sát 5S' },
    { id: 'NDNB', label: 'Nhận diện người bệnh' },
    { id: 'RECORDS', label: 'Hồ sơ bệnh án' },
    { id: 'DRUGS', label: 'Sử dụng thuốc' },
    { id: 'PROFESSIONAL', label: 'Chế độ chuyên môn' },
    { id: 'GENERAL', label: 'Giám sát chung' },
    { id: 'ENDOSCOPY', label: 'Nội soi đại trực tràng' },
    { id: 'STOMACH_ENDOSCOPY', label: 'Nội soi TQDD có gây mê' },
    { id: 'EPIDURAL_INJECTION', label: 'Tiêm ngoài màng cứng' },
    { id: 'BRONCHOSCOPY', label: 'Nội soi phế quản sinh thiết' },
  ],
  [ModuleType.JCI]: [
    { id: 'FALL_RATE', label: 'Tỷ suất người bệnh ngã' },
    { id: 'PATIENT_IDENTIFICATION', label: 'Nhận dạng người bệnh' },
    { id: 'CRITICAL_RESULTS', label: 'Thông báo KQ báo động CLS' },
    { id: 'HANDOVER_INCIDENTS', label: 'Sự cố liên quan bàn giao' },
    { id: 'SURGERY_SAFETY', label: 'Tuân thủ An toàn phẫu thuật' },
    { id: 'HAND_HYGIENE', label: 'Tuân thủ 5 thời điểm VST' },
  ],
  [ModuleType.SETTINGS]: [
    { id: 'USER', label: 'Người dùng' },
    { id: 'AI', label: 'Cấu hình AI' },
    { id: 'NOTI', label: 'Thông báo' },
    { id: 'PERMISSIONS', label: 'Phân quyền' },
    { id: 'DEPT', label: 'Đơn vị' },
    { id: 'POSITION', label: 'Chức vụ' },
    { id: 'RANK', label: 'Cấp bậc' },
    { id: 'AUTHORITY', label: 'Cơ quan BH' },
    { id: 'SCHEDULE', label: 'Lịch giám sát' },
    { id: 'CRITERIA83', label: 'Cấu hình 83 TC' },
    { id: 'TEAM_CONFIG', label: 'Danh sách tổ chấm điểm' },
    { id: 'SURVEY_PUBLIC', label: 'Khảo sát Public' },
    { id: 'THEME', label: 'Giao diện' },
  ],
};

/**
 * Fetch all permissions for a user/role_id (includes both module-level and sub-module-level)
 */
export async function fetchPermissionsByRole(roleId: string): Promise<Permission[]> {
    const { data, error } = await supabase
        .from('phan_quyen')
        .select('*')
        .eq('role_id', roleId)
        .order('module', { ascending: true })
        .order('sub_module', { ascending: true });

    if (error) {
        console.error('Error fetching permissions by role:', error);
        throw error;
    }

    return data || [];
}

/**
 * Check if a user can view a specific sub_module
 * Returns true if no permission row exists (default allow) or if can_view is true
 */
export function canViewSubModule(
    permissions: Permission[],
    module: string,
    subModule: string
): boolean {
    const perm = permissions.find(
        p => p.module === module && p.sub_module === subModule
    );
    // If no row exists, default to checking module-level permission
    if (!perm) {
        const modulePerm = permissions.find(p => p.module === module && !p.sub_module);
        return modulePerm ? modulePerm.can_view : true; // default allow if no permission set
    }
    return perm.can_view;
}

/**
 * Get permission object for a module or sub_module
 */
export function getPermissionFor(
    permissions: Permission[],
    module: string,
    subModule?: string | null
): Pick<Permission, 'can_view' | 'can_create' | 'can_update' | 'can_delete'> {
    const perm = permissions.find(
        p => p.module === module && (p.sub_module ?? null) === (subModule ?? null)
    );
    if (perm) return perm;
    
    // If checking for a sub-module but none exists, return module-level perms
    if (subModule) {
        const modulePerm = permissions.find(p => p.module === module && !p.sub_module);
        if (modulePerm) return modulePerm;
    }

    return { can_view: true, can_create: false, can_update: false, can_delete: false };
}

/**
 * Upsert permissions for a user (handles both insert and update)
 */
export async function upsertPermissionsForUser(
    userId: string,
    permissions: Array<{
        module: string;
        sub_module?: string | null;
        can_view: boolean;
        can_create: boolean;
        can_update: boolean;
        can_delete: boolean;
    }>
): Promise<void> {
    const rows = permissions.map(p => ({
        role_id: userId,
        module: p.module,
        sub_module: p.sub_module ?? null,
        can_view: p.can_view,
        can_create: p.can_create,
        can_update: p.can_update,
        can_delete: p.can_delete,
        updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
        .from('phan_quyen')
        .upsert(rows, { onConflict: 'role_id,module,sub_module' });

    if (error) {
        console.error('Error upserting permissions:', error);
        throw error;
    }
}

/**
 * @deprecated Use upsertPermissionsForUser instead
 * Update multiple permissions for a role (legacy - module level only)
 */
export async function updatePermissionsForRole(
    roleId: string,
    permissions: Array<{
        module: string;
        can_view: boolean;
        can_create: boolean;
        can_update: boolean;
        can_delete: boolean;
    }>
): Promise<void> {
    await upsertPermissionsForUser(roleId, permissions.map(p => ({ ...p, sub_module: null })));
}

/**
 * Fetch all permissions from database
 */
export async function fetchPermissions(): Promise<Permission[]> {
    const { data, error } = await supabase
        .from('phan_quyen')
        .select('*')
        .order('role_id', { ascending: true })
        .order('module', { ascending: true })
        .order('sub_module', { ascending: true });

    if (error) {
        console.error('Error fetching permissions:', error);
        throw error;
    }

    return data || [];
}
