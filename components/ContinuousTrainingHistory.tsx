import React, { useEffect, useState } from 'react';
import { getContinuousTrainingHistory, getContinuousTrainingLessonsProgress, getTestAttemptDetails } from '../services/trainingService';
import { AttemptReview } from './TrainingHistoryDetails';
import { Clock3, CheckCircle2, XCircle, FileText, Play } from 'lucide-react';

export function ContinuousTrainingHistory({ userId, isAdmin }: { userId?: string; isAdmin: boolean }) {
  const [tab, setTab] = useState<'LEARNING' | 'TESTS'>('LEARNING');
  const [loading, setLoading] = useState(true);
  const [lessonsHistory, setLessonsHistory] = useState<any[]>([]);
  const [testsHistory, setTestsHistory] = useState<any[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);
  const [reviewData, setReviewData] = useState<any | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [tests, lessons] = await Promise.all([
          getContinuousTrainingHistory(userId, isAdmin),
          getContinuousTrainingLessonsProgress(userId, isAdmin)
        ]);
        setTestsHistory(tests || []);
        setLessonsHistory(lessons || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId, isAdmin]);

  const handleReview = async (attempt: any) => {
    try {
      const details = await getTestAttemptDetails(attempt.id);
      setReviewData({
        ...attempt,
        chi_tiet_bai_lam: details,
        diem: attempt.score,
        dat: attempt.passed,
        so_cau_dung: attempt.correct_count,
        tong_so_cau: attempt.total_questions,
        thoi_gian_giay: attempt.duration_seconds,
        ten_bai_kiem_tra: attempt.training_courses?.title || 'Bài kiểm tra cuối khóa'
      });
    } catch (err) {
      console.error(err);
      alert('Không thể tải chi tiết bài làm.');
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs || secs < 0) return '0 phút';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) return `${m} phút ${s > 0 ? `${s} giây` : ''}`;
    return `${s} giây`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN')}`;
  };

  if (loading) {
    return <div className="rounded-xl border bg-white p-8 text-center text-slate-500">Đang tải lịch sử...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('LEARNING')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${tab === 'LEARNING' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Thời gian học</button>
        <button onClick={() => setTab('TESTS')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${tab === 'TESTS' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Bài kiểm tra đã làm</button>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        {tab === 'LEARNING' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {isAdmin && <th className="px-4 py-3 font-bold border-b">Học viên</th>}
                  <th className="px-4 py-3 font-bold border-b">Khóa học / Bài giảng</th>
                  <th className="px-4 py-3 font-bold border-b">Bắt đầu lúc</th>
                  <th className="px-4 py-3 font-bold border-b">Hoàn thành lúc</th>
                  <th className="px-4 py-3 font-bold border-b">Thời gian học</th>
                  <th className="px-4 py-3 font-bold border-b">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lessonsHistory.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    {isAdmin && <td className="px-4 py-3 font-medium text-slate-900">{row.users?.full_name || 'Không rõ'}</td>}
                    <td className="px-4 py-3">
                      <b className="block text-slate-900">{row.training_courses?.title}</b>
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-1"><FileText size={12}/> {row.training_lessons?.title}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{formatDate(row.started_at)}</td>
                    <td className="px-4 py-3 text-xs">{formatDate(row.completed_at)}</td>
                    <td className="px-4 py-3 font-medium text-emerald-700">{formatDuration(row.calculated_seconds)}</td>
                    <td className="px-4 py-3">
                      {row.is_completed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700"><CheckCircle2 size={12}/> Đã hoàn thành</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700"><Play size={12}/> Đang học</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!lessonsHistory.length && (
                  <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-slate-500">Chưa có lịch sử học tập.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'TESTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {isAdmin && <th className="px-4 py-3 font-bold border-b">Học viên</th>}
                  <th className="px-4 py-3 font-bold border-b">Khóa học</th>
                  <th className="px-4 py-3 font-bold border-b">Thời gian nộp</th>
                  <th className="px-4 py-3 font-bold border-b">Làm bài trong</th>
                  <th className="px-4 py-3 font-bold border-b">Kết quả</th>
                  <th className="px-4 py-3 font-bold border-b text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {testsHistory.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    {isAdmin && <td className="px-4 py-3 font-medium text-slate-900">{row.users?.full_name || 'Không rõ'}</td>}
                    <td className="px-4 py-3">
                      <b className="block text-slate-900">{row.training_courses?.title}</b>
                      <span className="text-xs text-slate-500">Điểm: {row.score} - {row.correct_count}/{row.total_questions} câu</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{formatDate(row.submitted_at)}</td>
                    <td className="px-4 py-3 text-xs flex items-center gap-1 mt-2.5"><Clock3 size={14}/> {formatDuration(row.duration_seconds)}</td>
                    <td className="px-4 py-3">
                      {row.passed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700"><CheckCircle2 size={12}/> Đạt</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700"><XCircle size={12}/> Chưa đạt</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleReview(row)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">Xem lại</button>
                    </td>
                  </tr>
                ))}
                {!testsHistory.length && (
                  <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-slate-500">Chưa có lịch sử làm bài kiểm tra.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reviewData && (
        <AttemptReview attempt={reviewData} onClose={() => setReviewData(null)} />
      )}
    </div>
  );
}
