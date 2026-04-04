import React, { useMemo, useState } from 'react';
import { Printer, XCircle, ChevronDown, ChevronRight, CheckCircle2, XCircle as XIcon, Minus } from 'lucide-react';
import { KqDanhGia83, AssessmentSheet } from '../types';

interface AssessmentDetailProps {
  phieuId: string;
  data: KqDanhGia83[];
  onClose: () => void;
  sheetInfo?: AssessmentSheet;
}

export const AssessmentDetail: React.FC<AssessmentDetailProps> = ({
  phieuId, data, onClose, sheetInfo
}) => {
  const [expandedTCs, setExpandedTCs] = useState<Record<string, boolean>>({});

  const toggleTC = (tcKey: string) => {
    setExpandedTCs(prev => ({ ...prev, [tcKey]: !prev[tcKey] }));
  };

  const hierarchyData = useMemo(() => {
    const hierarchy: any = {};
    const evaluatedData = data.filter(item => 
      item.dat_muc && (
        item.dat_muc === 'Đạt' || 
        item.dat_muc === 'Chưa đạt' || 
        item.dat_muc === 'Không đánh giá'
      )
    );

    evaluatedData.forEach(item => {
      const p = item.phan || "Khác";
      const c = item.chuong || "Khác";
      const tc = item.tieu_chi || "Khác";

      if (!hierarchy[p]) hierarchy[p] = { chuongs: {} };
      if (!hierarchy[p].chuongs[c]) hierarchy[p].chuongs[c] = { tieuChis: {} };
      if (!hierarchy[p].chuongs[c].tieuChis[tc]) hierarchy[p].chuongs[c].tieuChis[tc] = [];

      hierarchy[p].chuongs[c].tieuChis[tc].push(item);
    });
    return hierarchy;
  }, [data]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col animate-in fade-in duration-500 min-h-[600px]">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#009900] text-white flex justify-between items-center shadow-md print:hidden rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Printer size={24} />
            <div>
               <h3 className="font-black uppercase text-sm tracking-widest">Chi tiết chấm điểm tiêu chí</h3>
               <p className="text-[10px] opacity-80 font-bold uppercase">{sheetInfo?.don_vi_duoc_danh_gia} - {sheetInfo?.ngay_danh_gia}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <XCircle size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 bg-white print:p-0 print:overflow-visible">
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Report Header */}
            <div className="text-center space-y-4 border-b border-slate-100 pb-10">
              <h1 className="text-3xl font-black text-slate-900 uppercase">Kết quả đánh giá chất lượng bệnh viện</h1>
              <div className="flex justify-center gap-8 text-sm font-bold text-slate-500 uppercase tracking-widest">
                <p>Đơn vị: <span className="text-[#009900]">{sheetInfo?.don_vi_duoc_danh_gia}</span></p>
                <p>Ngày: <span className="text-[#009900]">{sheetInfo?.ngay_danh_gia}</span></p>
                <p>Điểm TB: <span className="text-[#009900]">{sheetInfo?.score || '0'}</span></p>
              </div>
            </div>

            {/* Hierarchy Data */}
            <div className="space-y-8">
              {Object.keys(hierarchyData).sort().map(phan => (
                <div key={phan} className="space-y-4">
                  <h2 className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-sm tracking-widest shadow-lg">
                    {phan}
                  </h2>
                  <div className="pl-4 space-y-6">
                    {Object.keys(hierarchyData[phan].chuongs).sort().map(chuong => (
                      <div key={chuong} className="space-y-3">
                        <h3 className="text-[#009900] font-black uppercase text-xs border-l-4 border-[#009900] pl-3 py-1">
                          {chuong}
                        </h3>
                        <div className="space-y-2">
                          {Object.keys(hierarchyData[phan].chuongs[chuong].tieuChis).sort().map(tc => {
                            const items = hierarchyData[phan].chuongs[chuong].tieuChis[tc];
                            const isExpanded = expandedTCs[tc];
                            return (
                              <div key={tc} className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                                <button 
                                  onClick={() => toggleTC(tc)}
                                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-100 transition-colors"
                                >
                                  <span className="font-black text-slate-700 text-xs uppercase text-left">{tc}</span>
                                  {isExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                                </button>
                                
                                {isExpanded && (
                                  <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-300">
                                    <table className="w-full text-[11px]">
                                      <thead>
                                        <tr className="text-slate-400 font-bold uppercase border-b border-slate-200">
                                          <th className="py-2 text-left w-12">Mức</th>
                                          <th className="py-2 text-left">Tiêu chí con</th>
                                          <th className="py-2 text-center w-24">Kết quả</th>
                                          <th className="py-2 text-left">Ghi chú / Minh chứng</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {items.map((item: KqDanhGia83) => (
                                          <tr key={item.ma_tieu_muc} className="group">
                                            <td className="py-3 font-black text-[#009900]">{item.nhom}</td>
                                            <td className="py-3 font-bold text-slate-600 pr-4">{item.tieu_muc}</td>
                                            <td className="py-3 text-center">
                                              {item.dat_muc === 'Đạt' && <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black text-[9px] uppercase"><CheckCircle2 size={10}/> Đạt</span>}
                                              {item.dat_muc === 'Chưa đạt' && <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-black text-[9px] uppercase"><XIcon size={10}/> Chưa đạt</span>}
                                              {item.dat_muc === 'Không đánh giá' && <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black text-[9px] uppercase"><Minus size={10}/> K.ĐG</span>}
                                            </td>
                                            <td className="py-3 text-slate-500 italic text-[10px]">
                                              {item.ghi_chu || '-'}
                                              {item.hinh_anh_minh_chung && item.hinh_anh_minh_chung.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                  {item.hinh_anh_minh_chung.map((img: string, idx: number) => (
                                                    <span key={idx} className="text-[8px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-100">Ảnh {idx+1}</span>
                                                  ))}
                                                </div>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
