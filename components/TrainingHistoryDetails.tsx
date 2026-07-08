import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Clock3, Video, X, XCircle } from 'lucide-react';
import { DaoTao } from '../readDaoTao';
import { useAuth } from '../contexts/AuthContext';
import { finishVideoHistory, startVideoHistory } from '../trainingHistoryApi';

export function TrainingVideoViewer({ video, embedUrl, onClose }: {
  video: DaoTao;
  embedUrl: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const session = useRef<{ id: string; bat_dau_luc: string } | null>(null);
  const closing = useRef(false);

  useEffect(() => {
    if (user && video.id) {
      startVideoHistory({
        video_id: video.id,
        video_name: video.tieu_de,
        user_id: user.id,
        user_name: user.full_name,
      }).then(value => { session.current = value; }).catch(console.error);
    }
    return () => {
      if (session.current && !closing.current) {
        closing.current = true;
        finishVideoHistory(session.current.id, session.current.bat_dau_luc).catch(console.error);
      }
    };
  }, [video.id, user?.id]);

  const close = async () => {
    if (session.current && !closing.current) {
      closing.current = true;
      await finishVideoHistory(session.current.id, session.current.bat_dau_luc);
    }
    onClose();
  };

  return <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
    <header className="flex items-center justify-between bg-white p-4">
      <div><p className="flex items-center gap-2 text-xs font-bold text-[#059669]"><Video size={15} /> VIDEO ĐÀO TẠO</p><h3 className="font-bold">{video.tieu_de}</h3></div>
      <button onClick={close} className="rounded-lg p-2 hover:bg-slate-100"><X /></button>
    </header>
    <iframe title={video.tieu_de} src={embedUrl} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
  </div>;
}

export function AttemptReview({ attempt, onClose }: { attempt: any; onClose: () => void }) {
  const details = Array.isArray(attempt.chi_tiet_bai_lam) ? attempt.chi_tiet_bai_lam : [];
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4">
    <div className="mx-auto max-w-3xl rounded-2xl bg-white shadow-2xl">
      <header className="sticky top-0 flex items-center justify-between rounded-t-2xl border-b bg-white p-4">
        <div><p className="text-xs font-bold text-[#059669]">XEM LẠI BÀI ĐÃ LÀM</p><h3 className="font-bold">{attempt.ten_bai_kiem_tra || attempt.bai_hoc?.tieu_de}</h3></div>
        <button onClick={onClose}><X /></button>
      </header>
      <div className="p-5">
        <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-4">
          <div><small>Điểm</small><p className="font-black">{attempt.diem}</p></div>
          <div><small>Kết quả</small><p className={attempt.dat ? 'font-bold text-green-600' : 'font-bold text-red-600'}>{attempt.dat ? 'Đạt' : 'Chưa đạt'}</p></div>
          <div><small>Số câu đúng</small><p className="font-bold">{attempt.so_cau_dung}/{attempt.tong_so_cau}</p></div>
          <div><small>Thời gian</small><p className="flex items-center gap-1 font-bold"><Clock3 size={15} /> {Math.floor(attempt.thoi_gian_giay / 60)}:{String(attempt.thoi_gian_giay % 60).padStart(2, '0')}</p></div>
        </div>
        <div className="space-y-4">{details.map((detail: any, index: number) =>
          <section key={index} className={`rounded-xl border p-4 ${detail.dung ? 'border-green-200' : 'border-red-200'}`}>
            <p className="flex gap-2 font-bold">{detail.dung ? <CheckCircle2 className="shrink-0 text-green-600" /> : <XCircle className="shrink-0 text-red-600" />} Câu {index + 1}. {detail.cau_hoi}</p>
            <div className="mt-3 space-y-2">{detail.lua_chon?.map((option: string, optionIndex: number) => {
              const selected = optionIndex === detail.dap_an_da_chon;
              const correct = optionIndex === detail.dap_an_dung;
              return <div key={optionIndex} className={`rounded-lg border p-2.5 ${correct ? 'border-green-500 bg-green-50' : selected ? 'border-red-400 bg-red-50' : ''}`}>
                {String.fromCharCode(65 + optionIndex)}. {option}
                {correct && <span className="ml-2 font-bold text-green-700">✓ Đáp án đúng</span>}
                {selected && !correct && <span className="ml-2 font-bold text-red-700">Đã chọn</span>}
              </div>;
            })}</div>
            {detail.giai_thich && <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800"><b>Giải thích:</b> {detail.giai_thich}</p>}
          </section>
        )}</div>
        {!details.length && <p className="py-10 text-center text-slate-500">Lượt làm cũ chưa có dữ liệu đáp án chi tiết.</p>}
      </div>
    </div>
  </div>;
}
