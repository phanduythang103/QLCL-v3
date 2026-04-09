import React from 'react';
import {
  ChevronRight, ChevronDown, CheckCircle2, XCircle,
  RefreshCw, Minus, Camera
} from 'lucide-react';
import { Data83tc, DmDonVi, KqDanhGia83 } from '../types';

interface AssessmentFormProps {
  ngayDanhGia: string;
  setNgayDanhGia: (v: string) => void;
  nguoiDanhGia: string;
  setNguoiDanhGia: (v: string) => void;
  donViDuocDanhGia: string;
  setDonViDuocDanhGia: (v: string) => void;
  units: DmDonVi[];
  fontSize: number;
  setFontSize: (v: number) => void;
  groupedCriteria: any;
  results: Record<string, Partial<KqDanhGia83>>;
  onScoreChange: (ma: string, field: keyof Partial<KqDanhGia83>, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isAdmin: boolean;
  expandedPhan: string | null;
  setExpandedPhan: (v: string | null) => void;
  expandedChuong: string | null;
  setExpandedChuong: (v: string | null) => void;
  expandedTieuChi: string | null;
  setExpandedTieuChi: (v: string | null) => void;
}

export const AssessmentForm: React.FC<AssessmentFormProps> = ({
  ngayDanhGia, setNgayDanhGia,
  nguoiDanhGia, setNguoiDanhGia,
  donViDuocDanhGia, setDonViDuocDanhGia,
  units, fontSize, setFontSize,
  groupedCriteria, results, onScoreChange, onSave, onCancel,
  saving, isAdmin,
  expandedPhan, setExpandedPhan,
  expandedChuong, setExpandedChuong,
  expandedTieuChi, setExpandedTieuChi
}) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-20">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl sticky top-0 z-10">
        <div className="flex flex-wrap items-center gap-4 text-sm font-black uppercase text-slate-800">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400">Ngày đánh giá</label>
            <input type="date" value={ngayDanhGia} onChange={(e) => setNgayDanhGia(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-2 focus:ring-2 ring-[#009900]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400">Người đánh giá</label>
            <input type="text" value={nguoiDanhGia} onChange={(e) => setNguoiDanhGia(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-2 focus:ring-2 ring-[#009900]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400">Đơn vị được đánh giá</label>
            {isAdmin ? (
              <select value={donViDuocDanhGia} onChange={(e) => setDonViDuocDanhGia(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-2 focus:ring-2 ring-[#009900]">
                <option value="">-- Chọn đơn vị --</option>
                {units.map(u => <option key={u.ma_don_vi} value={`${u.ma_don_vi} - ${u.ten_don_vi}`}>{u.ma_don_vi} - {u.ten_don_vi}</option>)}
              </select>
            ) : (
              <input type="text" readOnly value={donViDuocDanhGia} className="bg-slate-100 border-none rounded-xl px-4 py-2 text-slate-500" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-black uppercase text-sm hover:bg-slate-200 transition-all active:scale-95">Hủy</button>
          <button onClick={onSave} disabled={saving} className="bg-[#009900] text-white px-8 py-3 rounded-xl font-black uppercase text-sm shadow-lg hover:bg-[#007700] transition-all flex items-center gap-2 active:scale-95 disabled:bg-slate-200">
            {saving ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
            Lưu phiếu ngay
          </button>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="space-y-6" style={{ fontSize: `${fontSize}pt` }}>
        {Object.keys(groupedCriteria).sort().map(phan => {
          const isPhanOpen = expandedPhan === phan;
          return (
            <div key={phan} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all mb-4">
              <button
                onClick={() => setExpandedPhan(isPhanOpen ? null : phan)}
                className="w-full text-left bg-slate-50/80 hover:bg-slate-100/80 px-6 py-4 flex items-center gap-3 transition-colors border-b border-slate-100"
              >
                <div className={isPhanOpen ? 'text-[#009900]' : 'text-slate-400'}>
                  {isPhanOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
                <h2 className="text-sm font-black uppercase text-slate-800 tracking-tight flex-1">{phan}</h2>
                <div className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400">{Object.keys(groupedCriteria[phan].chuongs).length} Chương</div>
              </button>

              {isPhanOpen && (
                <div className="bg-white divide-y divide-slate-50">
                  {Object.keys(groupedCriteria[phan].chuongs).sort().map(chuong => {
                    const isChuongOpen = expandedChuong === chuong;
                    return (
                      <div key={chuong} className="ml-4 border-l-2 border-slate-100">
                        <button
                          onClick={() => setExpandedChuong(isChuongOpen ? null : chuong)}
                          className="px-6 py-3 flex items-center gap-3 w-full hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className={isChuongOpen ? 'text-[#009900]' : 'text-slate-400'}>
                            {isChuongOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </div>
                          <h3 className="text-xs font-black text-slate-600 uppercase italic leading-relaxed flex-1">{chuong}</h3>
                        </button>

                        {isChuongOpen && (
                          <div className="divide-y divide-slate-50">
                            {Object.keys(groupedCriteria[phan].chuongs[chuong].tieuChis).sort().map(tieuChi => {
                              const isTCOpen = expandedTieuChi === tieuChi;
                              const tieuChiData = groupedCriteria[phan].chuongs[chuong].tieuChis[tieuChi];
                              return (
                                <div key={tieuChi} className="ml-6 mb-2">
                                  <button
                                    onClick={() => setExpandedTieuChi(isTCOpen ? null : tieuChi)}
                                    className="w-full flex items-center gap-3 px-6 py-4 hover:bg-slate-50 transition-colors"
                                  >
                                    <div className={isTCOpen ? 'text-[#009900]' : 'text-slate-400'}>
                                      {isTCOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>
                                    <span className="font-bold text-xs text-[#009900] uppercase tracking-wide text-left">{tieuChi}</span>
                                  </button>

                                  {isTCOpen && (
                                    <div className="animate-in slide-in-from-top-2 duration-300">
                                      <div className="bg-slate-50/80 px-10 py-3 border-y border-slate-100 flex items-center">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mã & Nội dung tiểu mục</span>
                                      </div>

                                      <div className="divide-y divide-slate-100">
                                        {(() => {
                                          let shouldHideSubsequent = false;
                                          return tieuChiData.map((tc: Data83tc) => {
                                            const currentRes = results[tc.ma_tieu_muc!];
                                            const isSelected = !!currentRes?.dat_muc;
                                            const isNotMet = currentRes?.dat_muc === "Chưa đạt";

                                            if (shouldHideSubsequent) return null;
                                            if (isNotMet) shouldHideSubsequent = true;

                                            return (
                                              <div key={tc.ma_tieu_muc} className={`p-6 pl-10 group transition-all ${isSelected ? 'bg-emerald-50/30' : 'hover:bg-slate-50'}`}>
                                                <div className="flex items-start gap-4">
                                                  <input
                                                    type="checkbox"
                                                    checked={isSelected && !isNotMet}
                                                    onChange={(e) => onScoreChange(tc.ma_tieu_muc!, 'dat_muc', e.target.checked ? 'Đạt' : 'Chưa đạt')}
                                                    className="mt-1 w-5 h-5 rounded border-slate-300 text-[#009900] focus:ring-[#009900] cursor-pointer"
                                                  />

                                                  <div className="flex-1 space-y-1">
                                                    <span className="block text-[11px] font-bold text-slate-400 font-mono">{tc.ma_tieu_muc}</span>
                                                    <p className="font-bold text-[14px] text-slate-800 leading-snug">
                                                      {tc.tieu_muc}
                                                    </p>

                                                    <div className="pt-4 flex flex-wrap items-center gap-6">
                                                      <div className="flex bg-white shadow-sm border border-slate-200 p-1 rounded-xl gap-1">
                                                        {[
                                                          { label: "Đạt", value: "Đạt", icon: <CheckCircle2 size={12} />, color: "hover:bg-emerald-500 hover:text-white" },
                                                          { label: "Không đạt", value: "Chưa đạt", icon: <XCircle size={12} />, color: "hover:bg-red-500 hover:text-white" },
                                                          { label: "K.ĐG", value: "Không đánh giá", icon: <Minus size={12} />, color: "hover:bg-slate-400 hover:text-white" }
                                                        ].map((btn) => (
                                                          <button
                                                            key={btn.value}
                                                            type="button"
                                                            onClick={() => onScoreChange(tc.ma_tieu_muc!, 'dat_muc', btn.value)}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase transition-all ${currentRes?.dat_muc === btn.value
                                                                ? (btn.value === 'Đạt' ? 'bg-emerald-500 text-white' : btn.value === 'Chưa đạt' ? 'bg-red-500 text-white' : 'bg-slate-400 text-white')
                                                                : `text-slate-400 ${btn.color}`
                                                              }`}
                                                          >
                                                            {btn.icon} {btn.label}
                                                          </button>
                                                        ))}
                                                      </div>

                                                      {isNotMet && (
                                                        <div className="flex items-center gap-4 flex-1">
                                                          <div className="flex-1 flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2">
                                                            <textarea
                                                              rows={1}
                                                              value={currentRes?.ghi_chu || ""}
                                                              onChange={(e) => onScoreChange(tc.ma_tieu_muc!, 'ghi_chu', e.target.value)}
                                                              placeholder="Ghi chú minh chứng..."
                                                              className="flex-1 bg-transparent border-none text-[11px] text-slate-600 focus:ring-0 placeholder:italic p-0 resize-none"
                                                            />
                                                          </div>
                                                          <button type="button" className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-[#009900] transition-colors">
                                                            <Camera size={16} />
                                                          </button>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>

                                                  <div className="text-[14px] font-black text-[#009900] bg-slate-100 px-2 py-1 rounded-md">
                                                    {tc.muc}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          });
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
