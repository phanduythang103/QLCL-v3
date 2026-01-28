import { supabase } from './supabaseClient';

export interface Permission {
    id: string;
    role_id: string;
    module: string;
    can_view: boolean;
    can_create: boolean;
    can_update: boolean;
    can_delete: boolean;
    created_at?: string;
    updated_at?: string;
}

/**
 * Fetch all permissions from database
 */
export async function fetchPermissions(): Promise<Permission[]> {
    const { data, error } = await supabase
        .from('phan_quyen')
        .select('*')
        .order('role_id', { ascending: true })
        .order('module', { ascending: true });

    if (error) {
        console.error('Error fetching permissions:', error);
        throw error;
    }

    return data || [];
}

/**
 * Fetch permissions for a specific role
 */
export async function fetchPermissionsByRole(roleId: string): Promise<Permission[]> {
    const { data, error } = await supabase
        .from('phan_quyen')
        .select('*')
        .eq('role_id', roleId)
        .order('module', { ascending: true });

    if (error) {
        console.error('Error fetching permissions by role:', error);
        throw error;
    }

    return data || [];
}

/**
 * Update a single permission
 */
export async function updatePermission(
    roleId: string,
    module: string,
    permissions: {
        can_view?: boolean;
        can_create?: boolean;
        can_update?: boolean;
        can_delete?: boolean;
    }
): Promise<Permission> {
    const { data, error } = await supabase
        .from('phan_quyen')
        .update({
            ...permissions,
            updated_at: new Date().toISOString(),
        })
        .eq('role_id', roleId)
        .eq('module', module)
        .select()
        .single();

    if (error) {
        console.error('Error updating permission:', error);
        throw error;
    }

    return data;
}

/**
 * Update multiple permissions for a role
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
    const updates = permissions.map((perm) =>
        supabase
            .from('phan_quyen')
            .update({
                can_view: perm.can_view,
                can_create: perm.can_create,
                can_update: perm.can_update,
                can_delete: perm.can_delete,
                updated_at: new Date().toISOString(),
            })
            .eq('role_id', roleId)
            .eq('module', perm.module)
    );

    const results = await Promise.all(updates);

    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
        console.error('Errors updating permissions:', errors);
        throw new Error('Failed to update some permissions');
    }
}

/**
 * Create default permissions for a role if they don't exist
 */
export async function initializeDefaultPermissions(): Promise<void> {
    const modules = [
        'DASHBOARD', 'HR', 'DOCS', 'ASSESSMENT', 'INCIDENTS',
        'IMPROVEMENT', 'INDICATORS', 'SUPERVISION', 'REPORTS', 'SETTINGS'
    ];

    const roles = ['admin', 'council', 'network', 'staff'];

    const defaultPermissions = [];

    for (const role of roles) {
        for (const module of modules) {
            defaultPermissions.push({
                role_id: role,
                module: module,
                can_view: true,
                can_create: role === 'admin',
                can_update: role === 'admin' || role === 'council' || role === 'network',
                can_delete: role === 'admin',
            });
        }
    }

    const { error } = await supabase
        .from('phan_quyen')
        .upsert(defaultPermissions, {
            onConflict: 'role_id,module',
            ignoreDuplicates: true,
        });

    if (error) {
        console.error('Error initializing default permissions:', error);
        throw error;
    }
}
