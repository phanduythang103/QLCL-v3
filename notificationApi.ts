import { supabase } from './supabaseClient';

export interface Notification {
    id: string;
    type: 'general' | 'incident' | 'document' | 'assessment' | 'improvement';
    title: string;
    message: string;
    module: string;
    created_at: string;
}

/**
 * Fetch UNREAD notifications only (chưa có trong notification_reads)
 * Chỉ lấy notifications mà user chưa click vào xem
 */
export async function fetchUnreadNotifications(): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Lấy tất cả notifications
    const { data: allNotifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (notifError) throw notifError;

    // Lấy danh sách notifications mà user đã đọc
    const { data: readNotifications, error: readError } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', user.id);

    if (readError) throw readError;

    // Filter ra những notification chưa đọc
    const readIds = new Set(readNotifications?.map(r => r.notification_id) || []);
    const unreadNotifications = allNotifications?.filter(n => !readIds.has(n.id)) || [];

    return unreadNotifications as Notification[];
}

/**
 * Mark notification as read by inserting into notification_reads
 * Khi user click vào notification, insert 1 record vào bảng này
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
        .from('notification_reads')
        .insert({
            notification_id: notificationId,
            user_id: user.id
        });

    // Ignore duplicate key error (user đã đọc rồi)
    if (error && error.code !== '23505') {
        throw error;
    }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
    const unread = await fetchUnreadNotifications();
    return unread.length;
}

/**
 * Subscribe to realtime NEW notifications
 * Callback sẽ được gọi khi có notification mới được insert vào database
 */
export function subscribeToNotifications(callback: (notification: Notification) => void) {
    const channel = supabase
        .channel('notifications')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications'
            },
            (payload) => {
                callback(payload.new as Notification);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Create a new notification (Admin only)
 */
export async function createNotification(notification: {
    type: Notification['type'];
    title: string;
    message: string;
    module: string;
}): Promise<Notification> {
    const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();

    if (error) throw error;
    return data as Notification;
}
