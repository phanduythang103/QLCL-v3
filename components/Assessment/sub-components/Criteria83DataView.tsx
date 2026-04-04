import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, ListFilter } from 'lucide-react';
import { assessmentService } from '../services';
import { Data83tc } from '../types';

export const Criteria83DataView: React.FC = () => {
  const [data, setData] = useState<Data83tc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPhan, setExpandedPhan] = useState<string | null>(null);
  const [expandedTieuChi, setExpandedTieuChi] = useState<string | null>(null);

  useEffect(() => {
    assessmentService.fetchCriteria().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  // Set the first section as expanded initially to match the image
  useEffect(() => {
    if (data.length > 0 && !expandedPhan) {
      const firstPhan = data[0].phan;
      if (firstPhan) setExpandedPhan(firstPhan);
    }
  }, [data]);

  const filteredData = data.filter(item => 
    item.tieu_chi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tieu_muc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ma_tieu_muc?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grouped = filteredData.reduce((acc: any, item) => {
    const p = item.phan || "Khác";
    const c = item.chuong || "Khác";
    const tc = item.tieu_chi || "Khác";
    if (!acc[p]) acc[p] = { chuongs: {} };
    if (!acc[p].chuongs[c]) acc[p].chuongs[c] = { tieuChis: {} };
    if (!acc[p].chuongs[c].tieuChis[tc]) acc[p].chuongs[c].tieuChis[tc] = [];
    acc[p].chuongs[c].tieuChis[tc].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
        <div>
          <h3 className="text-section font-black text-black uppercase tracking-tight flex items-center gap-2">
            <ListFilter className="text-[#009900]" size={24} />
            Danh mục 83 Tiêu chí bộ y tế
          </h3>
          <p className="text-slate-500 font-bold uppercase text-[10px]">Tra cứu nội dung các tiêu chí và tiêu mục</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#009900] transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Tìm mã hoặc nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 ring-[#009900] transition-all"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-20 text-center rounded-2xl border border-slate-200 text-slate-400 font-bold uppercase text-xs">Đang tải dữ liệu...</div>
        ) : Object.keys(grouped).sort().map(phan => (
          <div key={phan} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all mb-4">
            <button 
              onClick={() => setExpandedPhan(expandedPhan === phan ? null : phan)}
              className="w-full text-left bg-slate-50/80 hover:bg-slate-100/80 px-6 py-4 flex items-center gap-3 transition-colors border-b border-slate-100"
            >
              <div className={expandedPhan === phan ? 'text-[#009900]' : 'text-slate-400'}>
                {expandedPhan === phan ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
              </div>
              <span className="text-sm font-black text-slate-800 uppercase tracking-tight flex-1">{phan}</span>
              <div className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400">{Object.keys(grouped[phan].chuongs).length} Chương</div>
            </button>
            
            {expandedPhan === phan && (
              <div className="bg-white divide-y divide-slate-50">
                {Object.keys(grouped[phan].chuongs).sort().map(chuong => (
                  <div key={chuong} className="ml-4 border-l-2 border-slate-100">
                    <button 
                      onClick={() => {/* chapter toggle logic */}}
                      className="px-6 py-3 flex items-center gap-3 transition-colors w-full text-left hover:bg-slate-50"
                    >
                      <div className="text-slate-400">
                        <ChevronRight size={16} />
                      </div>
                      <h4 className="text-xs font-black text-slate-600 uppercase italic leading-relaxed flex-1">{chuong}</h4>
                    </button>
                    
                    <div className="divide-y divide-slate-50">
                      {Object.keys(grouped[phan].chuongs[chuong].tieuChis).sort().map(tc => {
                        const isTCOpen = expandedTieuChi === tc;
                        const items = grouped[phan].chuongs[chuong].tieuChis[tc];
                        
                        return (
                          <div key={tc} className="ml-6 mb-2">
                            <button 
                              onClick={() => setExpandedTieuChi(isTCOpen ? null : tc)}
                              className="w-full text-left p-4 flex items-center gap-3 group hover:bg-slate-50 transition-colors"
                            >
                              <div className={isTCOpen ? 'text-[#009900]' : 'text-slate-400'}>
                                {isTCOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                              </div>
                              <p className={`font-black text-xs uppercase leading-tight flex-1 ${isTCOpen ? 'text-[#009900]' : 'text-slate-700'}`}>
                                {tc}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold italic">{items.length} tiểu mục</p>
                            </button>

                            {isTCOpen && (
                              <div className="mt-2 mr-4 overflow-hidden rounded-xl border border-slate-100 shadow-inner animate-in zoom-in-95 duration-200">
                                <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center">
                                   <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Nội dung chi tiết các tiểu mục</span>
                                </div>
                                <div className="p-2 divide-y divide-slate-100">
                                   {items.map((item: Data83tc) => (
                                     <div key={item.ma_tieu_muc} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                                       <div className="min-w-[64px] font-mono font-bold text-[10px] text-slate-400">{item.ma_tieu_muc}</div>
                                       <div className="flex-1">
                                          <p className="text-[13px] font-bold text-slate-700">{item.tieu_muc}</p>
                                          <p className="mt-1 text-[10px] text-[#009900] font-black uppercase bg-[#009900]/5 px-2 py-0.5 rounded-md inline-block">Mức {item.muc}</p>
                                       </div>
                                     </div>
                                   ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
