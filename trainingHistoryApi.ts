import { supabase } from './supabaseClient';

type VideoSession = { id: string; bat_dau_luc: string };
const activeVideoSessions = new Map<string, Promise<VideoSession>>();
const sessionKeysById = new Map<string, string>();

export async function startVideoHistory(record: {
  video_id: string;
  video_name: string;
  user_id: string;
  user_name?: string;
}) {
  const sessionKey = `${record.user_id}:${record.video_id}`;
  const activeSession = activeVideoSessions.get(sessionKey);
  if (activeSession) return activeSession;

  const pendingSession = (async () => {
    const { data, error } = await supabase
      .from('dtlt_lich_su_video')
      .insert({ ...record, bat_dau_luc: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    const session = data as VideoSession;
    sessionKeysById.set(session.id, sessionKey);
    return session;
  })();

  activeVideoSessions.set(sessionKey, pendingSession);
  pendingSession.catch(() => activeVideoSessions.delete(sessionKey));
  return pendingSession;
}

export async function finishVideoHistory(id: string, startedAt: string) {
  const endedAt = new Date();
  const seconds = Math.max(1, Math.round((endedAt.getTime() - new Date(startedAt).getTime()) / 1000));
  const { error } = await supabase
    .from('dtlt_lich_su_video')
    .update({ ket_thuc_luc: endedAt.toISOString(), thoi_gian_giay: seconds })
    .eq('id', id);
  if (error) throw error;

  const sessionKey = sessionKeysById.get(id);
  if (sessionKey) {
    activeVideoSessions.delete(sessionKey);
    sessionKeysById.delete(id);
  }
}

export async function fetchVideoHistory(userId?: string) {
  let query = supabase.from('dtlt_lich_su_video').select('*').order('bat_dau_luc', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;

  const deduplicated: any[] = [];
  for (const item of data || []) {
    const duplicate = deduplicated.find(existing =>
      existing.video_id === item.video_id &&
      Math.abs(new Date(existing.bat_dau_luc).getTime() - new Date(item.bat_dau_luc).getTime()) < 5000
    );
    if (!duplicate) {
      deduplicated.push(item);
    } else if ((item.thoi_gian_giay || 0) > (duplicate.thoi_gian_giay || 0)) {
      Object.assign(duplicate, item);
    }
  }
  return deduplicated;
}