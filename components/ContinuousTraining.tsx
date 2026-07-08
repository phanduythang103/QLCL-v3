import React, { useEffect, useMemo, useState } from 'react';
import { Award, BookOpen, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Eye, FileText, FileUp, GraduationCap, Play, Plus, RefreshCw, Rocket, Upload, Video, Clock3, AlertTriangle } from 'lucide-react';
import { TrainingCenter } from './DocsModule';
import { useAuth } from '../contexts/AuthContext';
import {
  convertMaterialToELearning,
  createTrainingCourse,
  createTrainingCourseFromJson,
  deleteTrainingCourse,
  getAssignmentsForUser,
  getFinalTestQuestions,
  getLearningProgress,
  getLessonsByCourse,
  getMaterialsByCourse,
  getQuestionsByLesson,
  getTrainingCourses,
  markLessonComplete,
  publishTrainingCourse,
  submitFinalTest,
  updateTrainingCourse,
  uploadTrainingMaterial,
  getLearnerCourseStats,
  startLesson,
  startTestAttempt,
  getTestAttemptDetails
} from '../services/trainingService';
import { ContinuousTrainingHistory } from './ContinuousTrainingHistory';
import { AttemptReview } from './TrainingHistoryDetails';

type AnyRow = Record<string, any>;
type ViewMode = 'LEARNER' | 'ADMIN';
const parseOptions = (value: any): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return value.split('|').map(item => item.trim()).filter(Boolean);
    }
  }
  return [];
};

const isPublished = (course: AnyRow) => String(course.status || '').toLowerCase() === 'published';

const normalizeLessonText = (value: any, fallback: string) => String(value || fallback || '')
  .replace(/\s+([-+])\s+/g, '\n$1 ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const renderLessonContent = (value: any, fallback: string) => {
  const lines = normalizeLessonText(value, fallback).split('\n').map(line => line.trim()).filter(Boolean);
  if (!lines.length) return <p className="text-sm text-slate-500">{fallback}</p>;

  const groups = {
    objectives: [] as string[],
    main: [] as string[],
    keyPoints: [] as string[],
    notes: [] as string[],
    quickChecks: [] as string[],
    other: [] as { marker: string; text: string }[],
  };

  lines.forEach((line) => {
    const match = line.match(/^([-+])\s*(.+)$/);
    const marker = match?.[1] || '-';
    const text = (match?.[2] || line).trim();
    if (/^Mục tiêu:\s*/i.test(text)) groups.objectives.push(text.replace(/^Mục tiêu:\s*/i, '').trim());
    else if (/^Nội dung chính:\s*/i.test(text)) groups.main.push(text.replace(/^Nội dung chính:\s*/i, '').trim());
    else if (/^Ý chính:\s*/i.test(text)) groups.keyPoints.push(text.replace(/^Ý chính:\s*/i, '').trim());
    else if (/^Câu hỏi nhanh:\s*/i.test(text)) groups.quickChecks.push(text.replace(/^Câu hỏi nhanh:\s*/i, '').trim());
    else if (marker === '+') groups.notes.push(text);
    else groups.other.push({ marker, text });
  });

  const orderedGroups = [
    { title: 'Mục tiêu', items: groups.objectives, marker: '-' },
    { title: 'Nội dung chính', items: groups.main, marker: null },
    { title: 'Ý chính', items: groups.keyPoints, marker: '-' },
    { title: 'Lưu ý thực hành', items: groups.notes, marker: '+' },
    { title: 'Câu hỏi nhanh', items: groups.quickChecks, marker: '+' },
  ].filter(group => group.items.length);

  const renderGroupedItem = (group: { title: string; marker: string | null }, item: string, index: number) => {
    if (group.title === 'Câu hỏi nhanh') {
      const parts = item.split(/\s*\|\s*Đáp án:\s*/i);
      return <div key={index} className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">+</span>
        <span className="space-y-1">
          <span className="block">{parts[0]}</span>
          {parts[1] && <span className="block"><b>Đáp án:</b> {parts.slice(1).join(' | Đáp án: ')}</span>}
        </span>
      </div>;
    }

    return group.marker ? <div key={index} className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">{group.marker}</span>
      <span>{item}</span>
    </div> : <p key={index} className="rounded-lg bg-slate-50 px-3 py-2">{item}</p>;
  };
  if (!orderedGroups.length) {
    return <div className="space-y-2 text-sm leading-7 text-slate-700">
      {groups.other.map((item, index) => <div key={index} className="flex gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">{item.marker}</span>
        <span>{item.text}</span>
      </div>)}
    </div>;
  }

  return <div className="space-y-4 text-sm leading-7 text-slate-700">
    {orderedGroups.map((group, groupIndex) => <section key={group.title} className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <h5 className="mb-2 font-black text-slate-900">{groupIndex + 1}. {group.title}</h5>
      <div className="space-y-2">
        {group.items.map((item, index) => renderGroupedItem(group, item, index))}
      </div>
    </section>)}
    {groups.other.length > 0 && <section className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <h5 className="mb-2 font-black text-slate-900">{orderedGroups.length + 1}. Nội dung khác</h5>
      <div className="space-y-2">{groups.other.map((item, index) => <div key={index} className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">{item.marker}</span>
        <span>{item.text}</span>

      </div>)}</div>
    </section>}
  </div>;
};
export const ContinuousTraining = () => {
  const { user } = useAuth();
  const roleText = String(user?.role || '').toLowerCase();
  const canManage = roleText.includes('admin') || roleText.includes('quản trị') || roleText.includes('quan tri');
  const [mode, setMode] = useState<ViewMode>('LEARNER');
  const [courses, setCourses] = useState<AnyRow[]>([]);
  const [assignments, setAssignments] = useState<AnyRow[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [mainTab, setMainTab] = useState<'CONTENT' | 'VIDEO' | 'HISTORY'>('CONTENT');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [courseData, assignmentData] = await Promise.all([
        getTrainingCourses(),
        user?.id ? getAssignmentsForUser(user.id).catch(() => []) : Promise.resolve([]),
      ]);
      setCourses(courseData || []);
      setAssignments(assignmentData || []);
    } catch (error: any) {
      setMessage(error.message || 'Không thể tải dữ liệu đào tạo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);
  useEffect(() => { if (!canManage && mode === 'ADMIN') setMode('LEARNER'); }, [canManage, mode]);

  const assignedIds = new Set(assignments.map(item => item.course_id));
  const learnerCourses = courses.filter(course => assignedIds.has(course.id) || isPublished(course));
  const selectedCourse = courses.find(course => course.id === selectedCourseId);

  return <div className="space-y-4">
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-lg font-black text-slate-900 uppercase">ĐÀO TẠO LIÊN TỤC</h2>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setMainTab('CONTENT')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${mainTab === 'CONTENT' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}><FileText size={16}/> Bài giảng điện tử</button>
          <button onClick={() => setMainTab('VIDEO')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${mainTab === 'VIDEO' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}><Video size={16}/> Video</button>
          <button onClick={() => setMainTab('HISTORY')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${mainTab === 'HISTORY' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}><Clock3 size={16}/> Lịch sử</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {mainTab === 'CONTENT' && <button onClick={load} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"><RefreshCw size={16} /> Tải lại</button>}
          {mainTab === 'CONTENT' && canManage && <button onClick={() => setMode(mode === 'ADMIN' ? 'LEARNER' : 'ADMIN')} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-emerald-700">{mode === 'ADMIN' ? 'Khóa học của tôi' : 'Quản trị khóa học'}</button>}
        </div>
      </div>
    </div>

    {mainTab === 'VIDEO' ? (
      <TrainingCenter />
    ) : mainTab === 'HISTORY' ? (
      <ContinuousTrainingHistory userId={user?.id} isAdmin={canManage} />
    ) : (
      <>
        {message && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{message}</div>}
        {loading ? <div className="rounded-xl border bg-white p-8 text-center text-slate-500">Đang tải dữ liệu...</div> : mode === 'ADMIN' && canManage ? <AdminTraining courses={courses} selectedCourse={selectedCourse} onSelect={setSelectedCourseId} onReload={load} userId={user?.id} /> : <LearnerTraining courses={learnerCourses} selectedCourse={selectedCourse} onSelect={setSelectedCourseId} userId={user?.id} />}
      </>
    )}
  </div>;
};

function AdminTraining({ courses, selectedCourse, onSelect, onReload, userId }: { courses: AnyRow[]; selectedCourse?: AnyRow; onSelect: (id: string) => void; onReload: () => void; userId?: string }) {
  const [materials, setMaterials] = useState<AnyRow[]>([]);
  const [lessons, setLessons] = useState<AnyRow[]>([]);
  const [lessonJsonFile, setLessonJsonFile] = useState<File | null>(null);
  const [quizJsonFile, setQuizJsonFile] = useState<File | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<'create' | 'publish' | 'save' | 'delete' | ''>('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('draft');
  const draftCount = courses.filter(course => String(course.status || 'draft').toLowerCase() === 'draft').length;
  const publishedCount = courses.filter(course => String(course.status || '').toLowerCase() === 'published').length;

  const loadCourseData = async () => {
    if (!selectedCourse?.id) return;
    const [materialData, lessonData] = await Promise.all([getMaterialsByCourse(selectedCourse.id), getLessonsByCourse(selectedCourse.id)]);
    setMaterials(materialData || []);
    setLessons(lessonData || []);
  };

  useEffect(() => { loadCourseData().catch(console.error); }, [selectedCourse?.id]);
  useEffect(() => {
    setEditTitle(selectedCourse?.title || '');
    setEditDescription(selectedCourse?.description || '');
    setEditStatus(selectedCourse?.status || 'draft');
  }, [selectedCourse?.id, selectedCourse?.title, selectedCourse?.description, selectedCourse?.status]);

  const createCourse = async () => {
    if (!lessonJsonFile || !quizJsonFile) return alert('Vui lòng chọn đủ lesson_json và quiz_json.');
    setBusy('create');
    try {
      const course = await createTrainingCourseFromJson({ lessonFile: lessonJsonFile, quizFile: quizJsonFile, originalFile, createdBy: userId });
      setLessonJsonFile(null);
      setQuizJsonFile(null);
      setOriginalFile(null);
      onSelect(course.id);
      await onReload();
    } finally { setBusy(''); }
  };

  const publish = async () => {
    if (!selectedCourse?.id) return;
    setBusy('publish');
    try { await publishTrainingCourse(selectedCourse.id, userId); await onReload(); } finally { setBusy(''); }
  };

  const saveCourse = async () => {
    if (!selectedCourse?.id) return;
    setBusy('save');
    try {
      const course = await updateTrainingCourse(selectedCourse.id, { title: editTitle, description: editDescription, status: editStatus });
      onSelect(course.id);
      await onReload();
    } finally { setBusy(''); }
  };

  const removeCourse = async () => {
    if (!selectedCourse?.id) return;
    if (!confirm(`Xóa khóa học "${selectedCourse.title}"? Dữ liệu section, câu hỏi và tiến độ liên quan sẽ bị xóa theo ràng buộc database.`)) return;
    setBusy('delete');
    try {
      await deleteTrainingCourse(selectedCourse.id);
      onSelect('');
      await onReload();
    } finally { setBusy(''); }
  };

  return <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
    <aside className="space-y-4">
      <section className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 flex items-center gap-2 font-black"><Plus size={18} /> Tạo khóa học từ JSON</h3>
        <label className="mb-3 block rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-3 text-sm">
          <span className="mb-2 flex items-center gap-2 font-bold text-emerald-800"><FileUp size={16} /> lesson_json</span>
          <span className="mb-2 block text-xs text-slate-500">File bài giảng điện tử theo section. Hệ thống lấy tên khóa học từ trường course_title.</span>
          <input type="file" accept=".json,application/json" onChange={e => setLessonJsonFile(e.target.files?.[0] || null)} className="w-full rounded-lg border bg-white p-2 text-xs" />
          {lessonJsonFile && <span className="mt-2 block text-xs font-bold text-emerald-700">Đã chọn: {lessonJsonFile.name}</span>}
        </label>
        <label className="mb-3 block rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/40 p-3 text-sm">
          <span className="mb-2 flex items-center gap-2 font-bold text-sky-800"><FileUp size={16} /> quiz_json</span>
          <span className="mb-2 block text-xs text-slate-500">File bộ câu hỏi trắc nghiệm dùng làm bài kiểm tra cuối khóa.</span>
          <input type="file" accept=".json,application/json" onChange={e => setQuizJsonFile(e.target.files?.[0] || null)} className="w-full rounded-lg border bg-white p-2 text-xs" />
          {quizJsonFile && <span className="mt-2 block text-xs font-bold text-sky-700">Đã chọn: {quizJsonFile.name}</span>}
        </label>
        <label className="mb-3 block rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/40 p-3 text-sm">
          <span className="mb-2 flex items-center gap-2 font-bold text-amber-800"><Upload size={16} /> Quy trình gốc</span>
          <span className="mb-2 block text-xs text-slate-500">File tài liệu gốc (Word, PDF, PowerPoint, ...). Sẽ được mở trực tiếp khi bấm xem.</span>
          <input type="file" accept=".doc,.docx,.pdf,.ppt,.pptx,.xls,.xlsx" onChange={e => setOriginalFile(e.target.files?.[0] || null)} className="w-full rounded-lg border bg-white p-2 text-xs" />
          {originalFile && <span className="mt-2 block text-xs font-bold text-amber-700">Đã chọn: {originalFile.name}</span>}
        </label>
        <button disabled={busy === 'create' || !lessonJsonFile || !quizJsonFile} onClick={createCourse} className="w-full rounded-lg bg-emerald-600 py-2.5 font-bold text-white disabled:opacity-50">{busy === 'create' ? 'Đang tạo...' : 'Tạo khóa học mới'}</button>
      </section>
      <section className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 font-black">Danh sách khóa học</h3>
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs font-bold">
          <span className="rounded-lg bg-amber-50 px-3 py-2 text-amber-700">Lưu nháp: {draftCount}</span>
          <span className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">Đã xuất bản: {publishedCount}</span>
        </div>
        <div className="space-y-2">{courses.map(course => {
          const status = String(course.status || 'draft').toLowerCase();
          const statusLabel = status === 'published' ? 'Đã xuất bản' : status === 'closed' ? 'Đóng' : 'Lưu nháp';
          const statusClass = status === 'published' ? 'bg-emerald-100 text-emerald-700' : status === 'closed' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700';
          return <button key={course.id} onClick={() => onSelect(course.id)} className={`w-full rounded-lg border p-3 text-left ${selectedCourse?.id === course.id ? 'border-emerald-500 bg-emerald-50' : 'bg-white'}`}>
            <b className="block leading-snug">{course.title}</b>
            <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${statusClass}`}>{statusLabel}</span>
          </button>;
        })}</div>
        {!courses.length && <p className="py-6 text-center text-sm text-slate-400">Chưa có khóa học.</p>}
      </section>
    </aside>

    <main className="space-y-4">
      {!selectedCourse ? <div className="rounded-xl border bg-white p-8 text-center text-slate-500">Chưa có khóa học.</div> : <>
        <section className="rounded-xl border bg-white p-4">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="text-xs font-bold text-emerald-700">KHÓA HỌC</p><h3 className="text-xl font-black">{selectedCourse.title}</h3><p className="text-sm text-slate-500">{selectedCourse.description}</p></div><button disabled={busy === 'publish' || !lessons.length} onClick={publish} className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-40"><Rocket size={17} /> Xuất bản khóa học</button></div>
        </section>
        <section className="rounded-xl border bg-white p-4">
          <h3 className="mb-3 font-black">Chỉnh sửa khóa học</h3>
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Tên bài giảng" className="rounded-lg border p-2.5" />
            <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="rounded-lg border p-2.5">
              <option value="draft">Lưu nháp</option>
              <option value="published">Đã xuất bản</option>
              <option value="closed">Đóng</option>
            </select>
          </div>
          <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Mô tả" rows={3} className="mt-3 w-full rounded-lg border p-2.5" />
          <div className="mt-3 flex flex-wrap gap-2">
            <button disabled={busy === 'save' || !editTitle.trim()} onClick={saveCourse} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === 'save' ? 'Đang lưu...' : 'Lưu chỉnh sửa'}</button>
            <button disabled={busy === 'delete'} onClick={removeCourse} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === 'delete' ? 'Đang xóa...' : 'Xóa khóa học'}</button>
          </div>
        </section>
        <section className="rounded-xl border bg-white p-4"><h3 className="mb-3 font-black">Tài liệu đính kèm</h3><div className="space-y-3">{materials.map(item => {
          const isOffice = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(String(item.file_type || '').toLowerCase());
          const viewUrl = isOffice && item.file_url ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(item.file_url)}` : item.file_url;
          const isJson = String(item.file_type || '').toLowerCase().includes('json') || String(item.file_name || '').toLowerCase().endsWith('.json') || String(item.title || '').toLowerCase().includes('json');
          return <div key={item.id} className="rounded-lg border p-3"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><b>{item.title}</b><p className="text-xs text-slate-500">{item.file_name} · {item.convert_status}</p></div>{viewUrl && <a href={viewUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold">{isJson ? 'Xem file JSON' : 'Xem quy trình gốc'}</a>}</div></div>;
        })}{!materials.length && <p className="py-6 text-center text-slate-400">Chưa có tài liệu nào.</p>}</div></section>
        <section className="rounded-xl border bg-white p-4"><h3 className="mb-3 font-black">Xem trước các section</h3><div className="space-y-3">{lessons.map((lesson, index) => <article key={lesson.id} className="rounded-lg border p-4"><p className="text-xs font-bold text-emerald-700">SECTION {index + 1}</p><h4 className="font-black">{lesson.title}</h4><div className="mt-3 rounded-xl bg-slate-50 p-4">{renderLessonContent(lesson.content || lesson.summary, 'Section chưa có nội dung.')}</div></article>)}{!lessons.length && <p className="py-6 text-center text-slate-400">Chưa có section. Hãy tạo khóa học từ lesson_json và quiz_json.</p>}</div></section>
      </>}
    </main>
  </div>;
}

function LearnerTraining({ courses, selectedCourse, onSelect, userId }: { courses: AnyRow[]; selectedCourse?: AnyRow; onSelect: (id: string) => void; userId?: string }) {
  const [lessons, setLessons] = useState<AnyRow[]>([]);
  const [materials, setMaterials] = useState<AnyRow[]>([]);
  const [progress, setProgress] = useState<AnyRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quickQuestions, setQuickQuestions] = useState<AnyRow[]>([]);
  const [quickAnswer, setQuickAnswer] = useState<number | null>(null);
  const [finalQuestions, setFinalQuestions] = useState<AnyRow[]>([]);
  const [finalAnswers, setFinalAnswers] = useState<Record<string, number>>({});
  const [showFinalTest, setShowFinalTest] = useState(false);
  const [testStartTime, setTestStartTime] = useState<string | null>(null);
  const [testAttemptId, setTestAttemptId] = useState<string | null>(null);
  const [result, setResult] = useState<AnyRow | null>(null);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [reviewData, setReviewData] = useState<any | null>(null);
  const [courseStats, setCourseStats] = useState<Record<string, any>>({});
  const [tabMode, setTabMode] = useState<'VIDEO' | 'CONTENT'>('VIDEO');
  const [courseFilter, setCourseFilter] = useState<'ALL' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  useEffect(() => {
    if (!userId || !courses.length) return;
    const courseIds = courses.map(c => c.id);
    getLearnerCourseStats(courseIds, userId).then(setCourseStats).catch(console.error);
  }, [courses, userId]);

  const loadCourse = async () => {
    if (!selectedCourse?.id) return;
    const [lessonData, materialData, progressData, finalData] = await Promise.all([
      getLessonsByCourse(selectedCourse.id), getMaterialsByCourse(selectedCourse.id), userId ? getLearningProgress(selectedCourse.id, userId) : Promise.resolve([]), getFinalTestQuestions(selectedCourse.id),
    ]);
    setLessons(lessonData || []); setMaterials(materialData || []); setProgress(progressData || []); setFinalQuestions(finalData || []); setCurrentIndex(0); setShowFinalTest(false); setTestStartTime(null); setTestAttemptId(null); setFinalAnswers({}); setResult(null); setShowResultPopup(false); setReviewData(null);
  };

  useEffect(() => { loadCourse().catch(console.error); }, [selectedCourse?.id, userId]);
  const currentLesson = lessons[currentIndex];
  useEffect(() => { 
    if (currentLesson?.id) {
      getQuestionsByLesson(currentLesson.id).then(setQuickQuestions).catch(console.error); 
      setQuickAnswer(null); 
      if (userId && selectedCourse?.id) {
        startLesson({ courseId: selectedCourse.id, lessonId: currentLesson.id, userId }).catch(console.error);
      }
    }
  }, [currentLesson?.id, selectedCourse?.id, userId]);

  const completedIds = new Set(progress.filter(item => item.is_completed).map(item => item.lesson_id));
  const completion = lessons.length ? Math.round((completedIds.size / lessons.length) * 100) : 0;
  const originalMaterial = materials.find(m => !(String(m.file_type || '').toLowerCase().includes('json') || String(m.file_name || '').toLowerCase().endsWith('.json') || String(m.title || '').toLowerCase().includes('json')));
  const isOriginalOffice = originalMaterial ? ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(String(originalMaterial.file_type || '').toLowerCase()) : false;
  const originalViewUrl = originalMaterial && isOriginalOffice && originalMaterial.file_url ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(originalMaterial.file_url)}` : originalMaterial?.file_url;
  const quickQuestion = quickQuestions[0];
  const quickOptions = parseOptions(quickQuestion?.options);

  const completeSection = async () => {
    if (!currentLesson || !userId) return;
    const expectedIndex = quickQuestion?.correct_answer_index;
    const expectedText = quickQuestion?.correct_answer;
    const expected = Number(expectedIndex != null ? expectedIndex : (expectedText != null ? expectedText : -1));
    await markLessonComplete({ courseId: selectedCourse?.id, lessonId: currentLesson.id, userId, quickAnswer: quickAnswer == null ? null : String(quickAnswer), quickCorrect: quickAnswer == null || expected < 0 ? null : quickAnswer === expected });
    const nextProgress = await getLearningProgress(selectedCourse?.id, userId);
    setProgress(nextProgress || []);
    if (currentIndex < lessons.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowFinalTest(true);
    }
  };

  const handleStartTest = () => {
    setTestStartTime(new Date().toISOString());
    if (userId && selectedCourse?.id) {
      startTestAttempt({ courseId: selectedCourse.id, userId }).then(data => {
        if (data) setTestAttemptId(data.id);
      }).catch(console.error);
    }
  };

  const submitTest = async () => {
    if (!selectedCourse?.id || !userId) return;
    const attempt = await submitFinalTest({ attemptId: testAttemptId, courseId: selectedCourse.id, userId, questions: finalQuestions, answers: finalAnswers, passingScore: selectedCourse.passing_score || 80, startedAt: testStartTime });
    setResult(attempt);
    setShowFinalTest(false);
    setShowResultPopup(true);
    
    // Refresh course stats so the UI updates
    const nextStats = await getLearnerCourseStats([selectedCourse.id], userId);
    setCourseStats(prev => ({ ...prev, ...nextStats }));
  };

  const handleReview = async () => {
    if (!result) return;
    try {
      const details = await getTestAttemptDetails(result.id);
      setReviewData({
        ...result,
        chi_tiet_bai_lam: details,
        diem: result.score,
        dat: result.passed,
        so_cau_dung: result.correct_count,
        tong_so_cau: result.total_questions,
        thoi_gian_giay: result.duration_seconds,
        ten_bai_kiem_tra: selectedCourse?.title || 'Bài kiểm tra cuối khóa'
      });
      setShowResultPopup(false);
    } catch (err) {
      console.error(err);
      alert('Không thể tải chi tiết bài làm.');
    }
  };

  if (!selectedCourse) {
    const filteredCourses = courses.filter(course => {
      if (courseFilter === 'ALL') return true;
      const stats = courseStats[course.id] || { completion: 0, passed: false };
      if (courseFilter === 'NOT_STARTED') return stats.completion === 0;
      if (courseFilter === 'COMPLETED') return stats.completion === 100 && stats.passed;
      if (courseFilter === 'IN_PROGRESS') return stats.completion > 0 && !(stats.completion === 100 && stats.passed);
      return true;
    });

    return <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          onClick={() => setCourseFilter('ALL')} 
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${courseFilter === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
        >Tất cả</button>
        <button 
          onClick={() => setCourseFilter('NOT_STARTED')} 
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${courseFilter === 'NOT_STARTED' ? 'bg-slate-800 text-white shadow-md' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
        >Chưa học</button>
        <button 
          onClick={() => setCourseFilter('IN_PROGRESS')} 
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${courseFilter === 'IN_PROGRESS' ? 'bg-amber-500 text-white shadow-md' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
        >Đang học</button>
        <button 
          onClick={() => setCourseFilter('COMPLETED')} 
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${courseFilter === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
        >Đã hoàn thành</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredCourses.map(course => {
          return <button key={course.id} onClick={() => onSelect(course.id)} className="flex flex-col text-left rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><GraduationCap size={24} /></div>
              <h3 className="font-black text-[15px] leading-snug">{course.title}</h3>
            </div>
            <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">{course.description || 'Chưa có mô tả'}</p>
            {courseStats[course.id] && (
              <div className="mb-4 grid grid-cols-2 gap-2 text-[11px] font-bold border-t border-slate-100 pt-3">
                <div className={`px-2 py-1.5 rounded text-center truncate ${courseStats[course.id].completion === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                  Tiến độ: {courseStats[course.id].completion}%
                </div>
                <div className={`px-2 py-1.5 rounded text-center truncate ${courseStats[course.id].passed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  Kiểm tra: {courseStats[course.id].passed ? 'Hoàn thành' : 'Chưa HT'}
                </div>
              </div>
            )}
            <div className="pt-3 border-t w-full flex items-center justify-between text-sm font-bold text-emerald-700">
              <span>Vào học</span>
              <ChevronRight size={16} />
            </div>
          </button>
        })}
        {!filteredCourses.length && <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border">Không tìm thấy khóa học nào phù hợp.</div>}
      </div>
    </div>;
  }

  const renderSectionContent = (lesson: any, index: number) => (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 min-h-[300px]">
        {(lesson.video_url || lesson.video) && (
          <div className="aspect-video rounded-lg overflow-hidden bg-black shadow-inner mb-6">
             <iframe src={lesson.video_url || lesson.video} className="w-full h-full" allowFullScreen></iframe>
          </div>
        )}
        {renderLessonContent(lesson.content || lesson.summary, 'Section chưa có nội dung.')}
      </div>
      {quickQuestion && <div className="mt-4 rounded-xl border p-4 bg-white">
        <b className="text-slate-900">Câu hỏi nhanh</b>
        <p className="mt-2 text-sm text-slate-700">{quickQuestion.question_text}</p>
        <div className="mt-3 space-y-2">
          {quickOptions.map((option, optIndex) => (
            <label key={optIndex} className={`flex gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${quickAnswer === optIndex ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm' : 'hover:border-slate-300 text-slate-700'}`}>
              <input type="radio" className="mt-0.5 accent-emerald-600" checked={quickAnswer === optIndex} onChange={() => setQuickAnswer(optIndex)} /> 
              <span className="text-sm font-medium">{option}</span>
            </label>
          ))}
        </div>
      </div>}
      <button onClick={completeSection} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors">
        <CheckCircle2 size={18} /> Hoàn thành section
      </button>
      {materials.filter(m => !(String(m.file_type || '').toLowerCase().includes('json') || String(m.file_name || '').toLowerCase().endsWith('.json') || String(m.title || '').toLowerCase().includes('json'))).length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-bold text-slate-700">Tài liệu tham khảo (Quy trình gốc):</p>
          {materials.filter(m => !(String(m.file_type || '').toLowerCase().includes('json') || String(m.file_name || '').toLowerCase().endsWith('.json') || String(m.title || '').toLowerCase().includes('json'))).map(item => {
            const isOffice = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(String(item.file_type || '').toLowerCase());
            const viewUrl = isOffice && item.file_url ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(item.file_url)}` : item.file_url;
            return <a key={item.id} href={viewUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border p-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors bg-white">
              <FileUp size={16} /> Xem quy trình gốc: {item.file_name}
            </a>;
          })}
        </div>
      )}
    </div>
  );

  const renderFinalTestContent = () => (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-white lg:p-6 lg:rounded-xl lg:border lg:shadow-sm">
      <div className="mb-6">
        <h3 className="flex items-center gap-2 font-black text-xl text-slate-900"><Award size={24} className="text-emerald-600" /> Bài kiểm tra cuối khóa</h3>
        <p className="text-sm text-slate-500 mt-2">Hoàn thành bài kiểm tra để kết thúc khóa học.</p>
        <div className="mt-3 bg-amber-50 px-4 py-3 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-800 text-sm">
          <AlertTriangle size={18} className="shrink-0" />
          <p><b>Lưu ý:</b> Kết quả kiểm tra đạt <b>80%</b> trở lên mới được tính là Hoàn thành bài kiểm tra. Thời gian tính từ lúc bạn bấm bắt đầu.</p>
        </div>
      </div>
      
      {!testStartTime ? (
        <div className="py-12 text-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/30">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Clock3 size={32} />
          </div>
          <h4 className="mb-2 text-lg font-bold text-slate-900">Sẵn sàng làm bài?</h4>
          <p className="mb-6 text-sm text-slate-500">Bài kiểm tra có {finalQuestions.length} câu hỏi. Hãy chắc chắn bạn đã ôn tập kỹ.</p>
          <button onClick={handleStartTest} className="rounded-xl bg-emerald-600 px-8 py-3.5 font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors">
            Bắt đầu làm bài
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {finalQuestions.map((question, qIndex) => (
            <div key={question.id} className="rounded-xl border p-5 bg-slate-50">
              <b className="block mb-3 text-slate-900">Câu {qIndex + 1}. {question.question_text}</b>
              <div className="space-y-2">
                {parseOptions(question.options).map((option, optIndex) => (
                  <label key={optIndex} className={`flex gap-3 rounded-xl border p-3 cursor-pointer transition-colors bg-white ${finalAnswers[question.id] === optIndex ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'hover:border-slate-300'}`}>
                    <input type="radio" className="mt-0.5 accent-emerald-600" checked={finalAnswers[question.id] === optIndex} onChange={() => setFinalAnswers({ ...finalAnswers, [question.id]: optIndex })} />
                    <span className="text-sm font-medium">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          {!finalQuestions.length && <p className="text-slate-500 py-4">Chưa có câu hỏi.</p>}
          {finalQuestions.length > 0 && <button disabled={Object.keys(finalAnswers).length !== finalQuestions.length} onClick={submitTest} className="w-full rounded-xl bg-slate-900 py-3.5 font-bold text-white shadow-sm disabled:opacity-50 transition-colors hover:bg-slate-800">
            Nộp bài kiểm tra
          </button>}
        </div>
      )}
    </div>
  );

  return <div className="space-y-4">
    <button onClick={() => onSelect('')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-700 transition-colors">
      <ChevronLeft size={16} /> Quay lại danh sách khóa học
    </button>
    
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="mb-1 text-xs font-bold tracking-widest text-emerald-700 uppercase">Đang học</p>
          <h3 className="text-2xl font-black text-slate-900">{selectedCourse.title}</h3>
          <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
            <div className="flex-1 w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${completion}%` }} />
            </div>
            <span className="font-medium text-emerald-700">{completion}%</span>
          </div>
        </div>
        {originalViewUrl && <a href={originalViewUrl} target="_blank" rel="noreferrer" className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800"><FileText size={16} /> Xem quy trình gốc</a>}
      </div>
    </section>

    <div className="grid gap-5 lg:grid-cols-[340px_1fr] items-start">
      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-5 py-4 border-b">
            <h3 className="font-black text-slate-900">Nội dung khóa học</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {lessons.map((lesson, index) => {
              const done = completedIds.has(lesson.id);
              const isActive = currentIndex === index && !showFinalTest;
              return <div key={lesson.id} className="bg-white">
                <button onClick={() => { setCurrentIndex(index); setShowFinalTest(false); }} className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm transition-colors ${isActive ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}>
                  <span className={`min-w-0 font-bold leading-snug ${isActive ? 'text-emerald-700' : 'text-slate-700'}`}>
                    <span className={`mr-2 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>{index + 1}.</span>
                    {lesson.title}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {done && <CheckCircle2 size={18} className="text-emerald-500" />}
                    <ChevronDown size={16} className={`text-slate-400 transition-transform lg:hidden ${isActive ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {/* Mobile Accordion Content */}
                {isActive && <div className="p-4 border-t lg:hidden bg-white">
                  {renderSectionContent(lesson, index)}
                </div>}
              </div>;
            })}
            {!lessons.length && <p className="text-sm text-slate-500 py-8 text-center">Khóa học chưa có section.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <button onClick={() => setShowFinalTest(true)} className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${showFinalTest ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}>
             <div>
               <h3 className={`flex items-center gap-2 font-black text-[15px] ${showFinalTest ? 'text-emerald-700' : 'text-slate-900'}`}><Award size={18} className={showFinalTest ? 'text-emerald-600' : 'text-slate-400'} /> Kiểm tra cuối khóa</h3>
               <p className="mt-1.5 text-xs text-slate-500 font-medium">{finalQuestions.length ? `${finalQuestions.length} câu hỏi` : 'Chưa có câu hỏi'}</p>
             </div>
             <ChevronDown size={16} className={`text-slate-400 transition-transform lg:hidden ${showFinalTest ? 'rotate-180' : ''}`} />
          </button>
          {/* Mobile Accordion Content for Final Test */}
          {showFinalTest && <div className="p-4 border-t lg:hidden bg-slate-50/50">
             {renderFinalTestContent()}
          </div>}
        </div>
      </aside>

      <main className="hidden lg:block">
        {showFinalTest ? (
          renderFinalTestContent()
        ) : currentLesson ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-black mb-6 text-slate-900 leading-snug">{currentLesson.title}</h3>
            {renderSectionContent(currentLesson, currentIndex)}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-500 shadow-sm flex flex-col items-center">
            <div className="p-5 bg-slate-50 rounded-full mb-5 text-slate-300"><FileText size={40} /></div>
            <p className="font-medium text-lg">Chọn bài học ở danh sách bên trái để bắt đầu</p>
          </div>
        )}
      </main>
    </div>

    {showResultPopup && result && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="mb-2 text-2xl font-black text-slate-900">Nộp bài thành công!</h2>
          <div className="mb-6 rounded-xl bg-slate-50 p-4 text-left border border-slate-200">
            <p className="flex justify-between py-1.5 text-sm"><span className="text-slate-500 font-medium">Điểm số:</span><b className="text-slate-900">{result.score}</b></p>
            <p className="flex justify-between py-1.5 text-sm"><span className="text-slate-500 font-medium">Số câu đúng:</span><b className="text-slate-900">{result.correct_count} / {result.total_questions}</b></p>
            <p className="flex justify-between py-1.5 text-sm mt-2 border-t border-slate-200 pt-3"><span className="text-slate-500 font-medium">Kết quả:</span><b className={result.passed ? 'text-emerald-700 font-black' : 'text-red-700 font-black'}>{result.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}</b></p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowResultPopup(false)} className="flex-1 rounded-xl border border-slate-200 bg-white py-3 font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">Đóng</button>
            <button onClick={handleReview} className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors">Xem lại bài</button>
          </div>
        </div>
      </div>
    )}

    {reviewData && (
      <AttemptReview attempt={reviewData} onClose={() => setReviewData(null)} />
    )}
  </div>;
}

