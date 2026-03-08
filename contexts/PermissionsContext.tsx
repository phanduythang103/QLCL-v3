import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchPermissionsByRole, Permission, getPermissionFor } from '../readPhanQuyen';
import { useAuth } from './AuthContext';

interface PermissionsContextType {
  permissions: Permission[];
  loading: boolean;
  canView: (module: string, subModule?: string | null) => boolean;
  canCreate: (module: string, subModule?: string | null) => boolean;
  canUpdate: (module: string, subModule?: string | null) => boolean;
  canDelete: (module: string, subModule?: string | null) => boolean;
  reload: () => void;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role?.toLowerCase().includes('quản trị') || user?.role?.toLowerCase().includes('admin');

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch both user-specific and role-wide permissions
      const roleId = user.role ? (
        user.role.toLowerCase().includes('quản trị') || user.role.toLowerCase().includes('admin') ? 'admin' :
        user.role.toLowerCase().includes('hội đồng') ? 'council' :
        user.role.toLowerCase().includes('mạng lưới') ? 'network' : 'staff'
      ) : 'staff';

      // Load parallel
      const [userPerms, rolePerms] = await Promise.all([
        fetchPermissionsByRole(user.id),
        fetchPermissionsByRole(roleId)
      ]);

      // Combine: user perms take precedence over role perms
      // We'll merge them in a way that user perms overwrite role perms for the same module/sub_module
      const combined = [...rolePerms];
      userPerms.forEach(up => {
        const idx = combined.findIndex(rp => rp.module === up.module && rp.sub_module === up.sub_module);
        if (idx >= 0) combined[idx] = up;
        else combined.push(up);
      });

      setPermissions(combined);
    } catch (err) {
      console.error('PermissionsContext: error loading permissions', err);
    }
    setLoading(false);
  }, [user?.id, user?.role]);

  useEffect(() => {
    load();
  }, [load]);

  // Admin always has full access
  const canView = (module: string, subModule?: string | null) => {
    if (isAdmin) return true;
    if (!permissions.length) return true; // default allow when nothing configured anywhere
    const perm = getPermissionFor(permissions, module, subModule);
    return perm.can_view;
  };

  const canCreate = (module: string, subModule?: string | null) => {
    if (isAdmin) return true;
    const perm = getPermissionFor(permissions, module, subModule);
    return perm.can_create;
  };

  const canUpdate = (module: string, subModule?: string | null) => {
    if (isAdmin) return true;
    const perm = getPermissionFor(permissions, module, subModule);
    return perm.can_update;
  };

  const canDelete = (module: string, subModule?: string | null) => {
    if (isAdmin) return true;
    const perm = getPermissionFor(permissions, module, subModule);
    return perm.can_delete;
  };

  return (
    <PermissionsContext.Provider value={{ permissions, loading, canView, canCreate, canUpdate, canDelete, reload: load }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionsProvider');
  return ctx;
}
