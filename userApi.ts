import { supabase } from './supabaseClient';

/**
 * Lấy danh sách tất cả users với thông tin avatar
 */
export async function fetchUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('*');

    if (error) throw error;
    return data || [];
}

/**
 * Cập nhật URL avatar cho user
 */
export async function updateUserAvatar(userId: string, avatarUrl: string) {
    const { data, error } = await supabase
        .from('users')
        .update({ avatar: avatarUrl })
        .eq('id', userId)
        .select();

    if (error) throw error;
    return data?.[0];
}

/**
 * Upload ảnh avatar lên storage bucket và cập nhật URL vào bảng users
 * @param file - File ảnh cần upload
 * @param userId - ID của user
 * @returns URL của ảnh đã upload
 */
export async function uploadAvatar(file: File, userId: string) {
    try {
        // Lấy extension của file
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}.${fileExt}`;
        const filePath = fileName;

        // Upload file lên storage bucket 'avatar'
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatar')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true // Ghi đè nếu file đã tồn tại
            });

        if (uploadError) throw uploadError;

        // Lấy public URL của ảnh
        const { data: urlData } = supabase.storage
            .from('avatar')
            .getPublicUrl(filePath);

        const avatarUrl = urlData.publicUrl;

        // Cập nhật URL vào bảng users
        await updateUserAvatar(userId, avatarUrl);

        return avatarUrl;
    } catch (error) {
        console.error('Error uploading avatar:', error);
        throw error;
    }
}

/**
 * Xóa avatar của user
 */
export async function deleteAvatar(userId: string, avatarUrl: string) {
    try {
        // Lấy file path từ URL
        const fileName = avatarUrl.split('/').pop();

        if (fileName) {
            // Xóa file từ storage
            const { error: deleteError } = await supabase.storage
                .from('avatar')
                .remove([fileName]);

            if (deleteError) throw deleteError;
        }

        // Xóa URL khỏi bảng users
        await updateUserAvatar(userId, '');

        return true;
    } catch (error) {
        console.error('Error deleting avatar:', error);
        throw error;
    }
}
