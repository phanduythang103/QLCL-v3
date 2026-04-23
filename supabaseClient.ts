import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig';

// Custom storage to handle cases where localStorage is blocked (e.g., Zalo Android in-app)
const isStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

const memoryStorage: Record<string, string> = {};

const safeStorage = {
  getItem: (key: string) => {
    try {
      return isStorageAvailable() ? window.localStorage.getItem(key) : memoryStorage[key] || null;
    } catch (e) {
      return memoryStorage[key] || null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      if (isStorageAvailable()) {
        window.localStorage.setItem(key, value);
      } else {
        memoryStorage[key] = value;
      }
    } catch (e) {
      memoryStorage[key] = value;
    }
  },
  removeItem: (key: string) => {
    try {
      if (isStorageAvailable()) {
        window.localStorage.removeItem(key);
      } else {
        delete memoryStorage[key];
      }
    } catch (e) {
      delete memoryStorage[key];
    }
  },
};

// Validation: Cảnh báo nếu thiếu cấu hình
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase configuration.');
}

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            storage: safeStorage,
            persistSession: true,
            autoRefreshToken: true
        }
    })
    : null as any;
