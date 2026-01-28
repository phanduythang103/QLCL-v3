-- Bảng notifications: Lưu tất cả thông báo trong hệ thống
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('general', 'incident', 'document', 'assessment', 'improvement')),
  title text NOT NULL,
  message text NOT NULL,
  module text NOT NULL CHECK (module IN ('DASHBOARD', 'HR', 'DOCS', 'INCIDENTS', 'ASSESSMENT', 'IMPROVEMENT', 'INDICATORS', 'SUPERVISION', 'REPORTS', 'SETTINGS')),
  created_at timestamp with time zone DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view notifications" ON notifications
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can delete notifications" ON notifications
  FOR DELETE USING (true);

-- Bảng notification_reads: Tracking user nào đã xem notification nào
CREATE TABLE notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at timestamp with time zone DEFAULT now(),
  UNIQUE(notification_id, user_id) -- Mỗi user chỉ đọc 1 notification 1 lần
);

-- Index for fast lookup
CREATE INDEX idx_notification_reads_user ON notification_reads(user_id);
CREATE INDEX idx_notification_reads_notification ON notification_reads(notification_id);
CREATE INDEX idx_notification_reads_combined ON notification_reads(user_id, notification_id);

-- RLS Policies
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reads" ON notification_reads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reads" ON notification_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Insert sample notifications for testing
INSERT INTO notifications (type, title, message, module) VALUES
  ('general', 'Thông báo mới', 'Có 3 thông báo mới được cập nhật trong hệ thống', 'DASHBOARD'),
  ('incident', 'Báo cáo sự cố y khoa mới', 'Có 2 báo cáo sự cố y khoa mới cần xem xét', 'INCIDENTS'),
  ('document', 'Văn bản mới', 'Có 4 văn bản mới được ban hành', 'DOCS'),
  ('assessment', 'Đánh giá chất lượng mới', 'Có 1 đánh giá chất lượng mới cần phê duyệt', 'ASSESSMENT'),
  ('improvement', 'Cải tiến chất lượng mới', 'Có 1 đề xuất cải tiến chất lượng mới', 'IMPROVEMENT');
