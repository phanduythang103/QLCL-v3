import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, ListFilter } from 'lucide-react';
import { assessmentService } from '../services';
import { Data83tc } from '../types';

export const Criteria83DataView: React.FC = () => {
  const [data, setData] = useState<Data83tc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPhan, setExpandedPhan] = useState<string | null>(null);

  useEffect(() => {
    assessmentService.fetchCriteria().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  const filteredData = data.filter(item => 
    item.tieu_chi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tieu_muc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ma_tieu_muc?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grouped = filteredData.reduce((acc: any, item) => {
    const p = item.phan || "Khác";
    const c = item.chuong || "Khác";
    const tc = item.tieu_chi || "Khác";
    if (!acc[p]) acc[p] = {};
    if (!acc[p][c]) acc[p][c] = {};
    if (!acc[p][c][tc]) acc[p][c][tc] = [];
    acc[p][c][tc].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-section font-black text-black uppercase tracking-tight flex items-center gap-2">
            <ListFilter className="text-[#009900]" size={24} />
            Danh mục 83 Tiêu chí bộ y tế
          </h3>
          <p className="text-slate-500 font-bold uppercase text-[10px]">Tra cứu nội dung các tiêu chí và tiêu mục</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
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
          <div key={phan} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => setExpandedPhan(expandedPhan === phan ? null : phan)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <span className="font-black text-slate-900 uppercase text-xs tracking-widest">{phan}</span>
              {expandedPhan === phan ? <ChevronDown size={20}/> : <ChevronRight size={20}/>}
            </button>
            
            {expandedPhan === phan && (
              <div className="px-6 pb-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                {Object.keys(grouped[phan]).sort().map(chuong => (
                  <div key={chuong} className="space-y-3">
                    <h4 className="text-[#009900] font-black uppercase text-[10px] pl-3 border-l-4 border-[#009900]">{chuong}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.keys(grouped[phan][chuong]).sort().map(tc => (
                        <div key={tc} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                          <p className="font-black text-slate-700 text-[10px] uppercase mb-2">{tc}</p>
                          <p className="text-[10px] text-slate-400 font-bold italic">{grouped[phan][chuong][tc].length} tiêu mục</p>
                        </div>
                      ))}
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
