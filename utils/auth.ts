// Authentication utility functions

/**
 * Validate username and password format
 */
export function validateCredentials(username: string, password: string): { valid: boolean; error?: string } {
    if (!username || username.trim().length === 0) {
        return { valid: false, error: 'Tên đăng nhập không được để trống' };
    }

    if (!password || password.length === 0) {
        return { valid: false, error: 'Mật khẩu không được để trống' };
    }

    if (password.length < 6) {
        return { valid: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' };
    }

    return { valid: true };
}

/**
 * Store user info in localStorage
 */
export function storeUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
}

/**
 * Get stored user from localStorage
 */
export function getStoredUser() {
    const userStr = localStorage.getItem('user');
    const isAuth = localStorage.getItem('isAuthenticated');

    if (!userStr || isAuth !== 'true') {
        return null;
    }

    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}

/**
 * Clear stored user (logout)
 */
export function clearStoredUser() {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return localStorage.getItem('isAuthenticated') === 'true';
}
