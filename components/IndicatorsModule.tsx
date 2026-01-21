import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingDown, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchChiSoQlcl, ChiSoQlcl } from '../readChiSoQlcl';

const ChartBar = ({ label, value, max, color, target, donVi }: { label: string, value: number, max: number, color: string, target?: number, donVi?: string }) => (
    <div className="mb-4 group">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-700 font-medium group-hover:text-primary-700 transition-colors">{label}</span>
        <div className="flex items-center gap-2">
            {target && <span className="text-xs text-slate-400">Mục tiêu: {target}{donVi || '%'}</span>}
            <span className={`font-bold ${
                target && value < target ? 'text-red-600' : 'text-slate-900'
            }`}>{value}{donVi || '%'}</span>
        </div>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div className={`h-2.5 rounded-full ${color} transition-all duration-500 ease-out`} style={{ width: `${(value/max)*100}%` }}></div>
      </div>
    </div>
);

export const IndicatorsModule: React.FC = () => {
  const [indicators, setIndicators] = useState<ChiSoQlcl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('06/2024');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChiSoQlcl();
      setIndicators(data);
    } catch (err) {
      setError('Không thể tải dữ liệu chỉ số. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Separate indicators by group
  const safetyIndicators = indicators.filter(i => i.nhom_chi_so === 'Chuyên môn & An toàn');
  const satisfactionIndicators = indicators.filter(i => i.nhom_chi_so === 'Hài lòng & Quản lý');
  
  // Calculate stats
  const totalIndicators = indicators.length;
  const achievedCount = indicators.filter(i => i.trang_thai === 'Đạt').length;
  const warningIndicators = indicators.filter(i => i.trang_thai === 'Chưa đạt' || i.trang_thai === 'Cảnh báo');

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Bộ chỉ số Chất lượng Bệnh viện</h2>
          <p className="text-sm text-slate-500">Giám sát các chỉ số lâm sàng, cận lâm sàng và quản lý.</p>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={loadData}
              className="p-2.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 focus:ring-primary-500 focus:border-primary-500"
            >
                <option value="06/2024">Tháng 6/2024</option>
                <option value="05/2024">Tháng 5/2024</option>
                <option value="Q1/2024">Quý 1/2024</option>
            </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
           <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center">
                 <BarChart2 className="w-5 h-5 mr-2 text-indigo-600" />
                 Chỉ số Chuyên môn & An toàn
              </h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                Đạt {safetyIndicators.filter(i => i.trang_thai === 'Đạt').length}/{safetyIndicators.length} chỉ số
              </span>
           </div>
           
           {loading ? (
             <div className="text-center py-8 text-slate-400">Đang tải...</div>
           ) : (
             safetyIndicators.map(indicator => (
               <ChartBar 
                 key={indicator.id}
                 label={indicator.ten_chi_so} 
                 value={indicator.gia_tri || 0} 
                 max={indicator.gia_tri_max || 100} 
                 target={indicator.muc_tieu || undefined} 
                 color={indicator.mau_hien_thi || 'bg-primary-500'} 
                 donVi={indicator.don_vi_tinh}
               />
             ))
           )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
           <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center">
                 <TrendingUp className="w-5 h-5 mr-2 text-pink-600" />
                 Chỉ số Hài lòng & Quản lý
              </h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                Đạt {satisfactionIndicators.filter(i => i.trang_thai === 'Đạt').length}/{satisfactionIndicators.length} chỉ số
              </span>
           </div>
           
           {loading ? (
             <div className="text-center py-8 text-slate-400">Đang tải...</div>
           ) : (
             satisfactionIndicators.map(indicator => (
               <ChartBar 
                 key={indicator.id}
                 label={indicator.ten_chi_so} 
                 value={indicator.gia_tri || 0} 
                 max={indicator.gia_tri_max || 100} 
                 target={indicator.muc_tieu || undefined} 
                 color={indicator.mau_hien_thi || 'bg-primary-500'}
                 donVi={indicator.don_vi_tinh}
               />
             ))
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
         {warningIndicators.length > 0 && (
           <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
              <TrendingDown className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                 <h4 className="font-bold text-red-800 text-sm">Cảnh báo chỉ số</h4>
                 <p className="text-xs text-red-600 mt-1">
                   {warningIndicators[0].ten_chi_so}: {warningIndicators[0].gia_tri}{warningIndicators[0].don_vi_tinh} 
                   {warningIndicators[0].muc_tieu ? ` (Mục tiêu: ${warningIndicators[0].muc_tieu}${warningIndicators[0].don_vi_tinh})` : ''}
                 </p>
              </div>
           </div>
         )}
         <div className={`bg-primary-50 border border-primary-100 rounded-lg p-4 flex items-start gap-3 ${warningIndicators.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
             <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5" />
             <div>
                <h4 className="font-bold text-primary-800 text-sm">Tổng quan</h4>
                <p className="text-xs text-primary-600 mt-1">
                  Đã đạt {achievedCount}/{totalIndicators} chỉ số ({Math.round(achievedCount/totalIndicators*100)}%). 
                  {warningIndicators.length > 0 ? ` Có ${warningIndicators.length} chỉ số cần cải thiện.` : ' Tất cả chỉ số đang trong tầm kiểm soát.'}
                </p>
             </div>
         </div>
      </div>
    </div>
  );
};