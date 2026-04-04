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
            {saving ? <RefreshCw className="animate-spin" size={20}/> : <CheckCircle2 size={20}/>}
            Lưu phiếu ngay
          </button>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="space-y-6" style={{ fontSize: `${fontSize}pt` }}>
        {Object.keys(groupedCriteria).sort().map(phan => {
          const isPhanOpen = expandedPhan === phan;
          return (
            <div key={phan} className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden transition-all">
              <button 
                onClick={() => setExpandedPhan(isPhanOpen ? null : phan)}
                className={`w-full text-left px-8 py-5 flex items-center justify-between transition-colors ${isPhanOpen ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-900'}`}
              >
                <div className="flex items-center gap-4">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${isPhanOpen ? 'bg-[#009900]' : 'bg-slate-100 text-slate-400'}`}>
                     {phan.split(' ')[1]}
                   </div>
                   <h2 className="text-sm font-black uppercase tracking-widest">{phan}</h2>
                </div>
                {isPhanOpen ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
              </button>

              {isPhanOpen && (
                <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
                  {Object.keys(groupedCriteria[phan].chuongs).sort().map(chuong => {
                    const isChuongOpen = expandedChuong === chuong;
                    return (
                      <div key={chuong} className="space-y-4">
                        <button 
                          onClick={() => setExpandedChuong(isChuongOpen ? null : chuong)}
                          className="flex items-center gap-3 group"
                        >
                          <div className={`w-2 h-8 rounded-full transition-all ${isChuongOpen ? 'bg-[#009900]' : 'bg-slate-200'}`} />
                          <h3 className="text-xs font-black uppercase tracking-widest text-[#009900] group-hover:translate-x-1 transition-transform">{chuong}</h3>
                          {isChuongOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                        </button>

                        {isChuongOpen && (
                          <div className="pl-5 space-y-4 animate-in slide-in-from-left-2 duration-300">
                            {Object.keys(groupedCriteria[phan].chuongs[chuong].tieuChis).sort().map(tieuChi => {
                              const isTCOpen = expandedTieuChi === tieuChi;
                              const tieuChiData = groupedCriteria[phan].chuongs[chuong].tieuChis[tieuChi];
                              return (
                                <div key={tieuChi} className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
                                  <button 
                                    onClick={() => setExpandedTieuChi(isTCOpen ? null : tieuChi)}
                                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-100 transition-colors"
                                  >
                                    <span className="font-black text-[11px] text-slate-600 uppercase tracking-tight text-left">{tieuChi}</span>
                                    {isTCOpen ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                                  </button>

                                  {isTCOpen && (
                                    <div className="p-6 pt-0 overflow-x-auto">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="text-slate-400 font-bold uppercase tracking-widest text-[9px] border-b border-slate-100">
                                            <th className="pb-4 text-left w-16">Mức</th>
                                            <th className="pb-4 text-left">Tiêu chí con (Tiêu mục)</th>
                                            <th className="pb-4 text-center w-64">Đánh giá</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {tieuChiData.map((tc: Data83tc) => {
                                            const currentRes = results[tc.ma_tieu_muc!];
                                            const isSelected = !!currentRes?.dat_muc;
                                            const isNotMet = currentRes?.dat_muc === "Chưa đạt";
                                            return (
                                              <React.Fragment key={tc.ma_tieu_muc}>
                                                <tr className={`group transition-all ${isSelected ? 'bg-white' : ''}`}>
                                                  <td className="py-4 font-black text-[#009900]">{tc.muc}</td>
                                                  <td className="py-4 pr-10">
                                                    <p className="font-bold text-slate-700 leading-relaxed mb-1">{tc.tieu_muc}</p>
                                                    <p className="text-[10px] text-slate-400 italic">Mã: {tc.ma_tieu_muc}</p>
                                                  </td>
                                                  <td className="py-4">
                                                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                                                      {[
                                                        { label: "Đạt", value: "Đạt", icon: <CheckCircle2 size={14}/>, color: "hover:bg-emerald-500 hover:text-white" },
                                                        { label: "Không đạt", value: "Chưa đạt", icon: <XCircle size={14}/>, color: "hover:bg-red-500 hover:text-white" },
                                                        { label: "K.ĐG", value: "Không đánh giá", icon: <Minus size={14}/>, color: "hover:bg-slate-400 hover:text-white" }
                                                      ].map((btn) => (
                                                        <button
                                                          key={btn.value}
                                                          onClick={() => onScoreChange(tc.ma_tieu_muc!, 'dat_muc', btn.value)}
                                                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${
                                                            currentRes?.dat_muc === btn.value
                                                            ? (btn.value === 'Đạt' ? 'bg-emerald-500 text-white shadow-md' : btn.value === 'Chưa đạt' ? 'bg-red-500 text-white shadow-md' : 'bg-slate-400 text-white shadow-md')
                                                            : `text-slate-400 ${btn.color}`
                                                          }`}
                                                        >
                                                           {btn.icon} {btn.label}
                                                        </button>
                                                      ))}
                                                    </div>
                                                  </td>
                                                </tr>
                                                {(isSelected || isNotMet) && (
                                                  <tr className="bg-white">
                                                    <td colSpan={3} className="px-6 pb-6 pt-0 space-y-4">
                                                       <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Ghi chú / Minh chứng</p>
                                                          <textarea 
                                                            rows={2}
                                                            value={currentRes?.ghi_chu || ""}
                                                            onChange={(e) => onScoreChange(tc.ma_tieu_muc!, 'ghi_chu', e.target.value)}
                                                            placeholder="Nhập ghi chú hoặc liệt kê minh chứng..."
                                                            className="w-full bg-transparent border-none text-xs text-slate-600 focus:ring-0 placeholder:italic p-0"
                                                          />
                                                       </div>
                                                       {/* Image Upload Simulation */}
                                                       <div className="flex gap-2">
                                                         <button className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-all">
                                                           <Camera size={14} /> Chụp ảnh / Tải lên
                                                         </button>
                                                         {currentRes?.hinh_anh_minh_chung?.map((img: string, idx: number) => (
                                                           <div key={idx} className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-[10px]">Img</div>
                                                         ))}
                                                       </div>
                                                    </td>
                                                  </tr>
                                                )}
                                              </React.Fragment>
                                            );
                                          })}
                                        </tbody>
                                      </table>
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
