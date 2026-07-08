import React, { useEffect, useState } from 'react';
import { getContinuousTrainingHistory, getContinuousTrainingLessonsProgress, getTestAttemptDetails, deleteLessonProgress, deleteTestAttempt } from '../services/trainingService';
import { AttemptReview } from './TrainingHistoryDetails';
import { Clock3, CheckCircle2, XCircle, FileText, Play, Trash2 } from 'lucide-react';

export function ContinuousTrainingHistory({ userId, isAdmin }: { userId?: string; isAdmin: boolean }) {
  const [tab, setTab] = useState<'LEARNING' | 'TESTS'>('LEARNING');
  const [loading, setLoading] = useState(true);
  const [lessonsHistory, setLessonsHistory] = useState<any[]>([]);
  const [testsHistory, setTestsHistory] = useState<any[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);
  const [reviewData, setReviewData] = useState<any | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(10);

  const handleTabChange = (newTab: 'LEARNING' | 'TESTS') => {
    setTab(newTab);
    setPage(1);
  };

  const load = async () => {
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
  };

  useEffect(() => {
    load();
  }, [userId, isAdmin]);

  const handleDelete = async (type: 'LEARNING' | 'TESTS', id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi lịch sử này?')) return;
    try {
      if (type === 'LEARNING') {
        await deleteLessonProgress(id);
      } else {
        await deleteTestAttempt(id);
      }
      await load();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi xóa!');
    }
  };

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
        <button onClick={() => handleTabChange('LEARNING')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${tab === 'LEARNING' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Thời gian học</button>
        <button onClick={() => handleTabChange('TESTS')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${tab === 'TESTS' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Bài kiểm tra đã làm</button>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        {(() => {
          const currentData = tab === 'LEARNING' ? lessonsHistory : testsHistory;
          const isAll = pageSize === 'ALL';
          const displayData = isAll ? currentData : currentData.slice((page - 1) * (pageSize as number), page * (pageSize as number));
          const totalPages = isAll ? 1 : Math.ceil(currentData.length / (pageSize as number));

          return (
            <>
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
                  {isAdmin && <th className="px-4 py-3 font-bold border-b text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayData.map((row) => (
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
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDelete('LEARNING', row.id)} className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 shadow-sm transition-colors" title="Xóa lịch sử">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {!displayData.length && (
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
                {displayData.map((row) => (
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
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleReview(row)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">Xem lại</button>
                        {isAdmin && (
                          <button onClick={() => handleDelete('TESTS', row.id)} className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 shadow-sm transition-colors" title="Xóa bài kiểm tra">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!displayData.length && (
                  <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-slate-500">Chưa có lịch sử làm bài kiểm tra.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 p-4 bg-slate-50/50 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value="ALL">Tất cả</option>
            </select>
            <span className="text-xs font-medium text-slate-500">dòng</span>
          </div>
          {!isAll && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Trước
              </button>
              <span className="px-3 text-xs font-medium text-slate-600">
                Trang {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </>
    );
  })()}
</div>

      {reviewData && (
        <AttemptReview attempt={reviewData} onClose={() => setReviewData(null)} />
      )}
    </div>
  );
}
