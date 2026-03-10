import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingDown, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchChiSoQlcl, ChiSoQlcl } from '../readChiSoQlcl';
import { VAPModule } from './VAPModule';
import { KtcmModule } from './KtcmModule';
import { PtLoai2Module } from './PtLoai2Module';

const ChartBar = ({ label, value, max, color, target, donVi }: { label: string, value: number, max: number, color: string, target?: number, donVi?: string }) => (
  <div className="mb-4 group">
    <div className="flex justify-between text-label mb-1.5">
      <span className="text-black font-black uppercase group-hover:text-[#009900] transition-colors">{label}</span>
      <div className="flex items-center gap-2">
        {target && <span className="text-table text-black/60 font-bold">Mục tiêu: {target}{donVi || '%'}</span>}
        <span className={`text-input font-black ${target && value < target ? 'text-red-600' : 'text-black'
          }`}>{value}{donVi || '%'}</span>
      </div>
    </div>
    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
      <div className={`h-2.5 rounded-full ${color} transition-all duration-500 ease-out`} style={{ width: `${(value / max) * 100}%` }}></div>
    </div>
  </div>
);

import { useIndicators } from './IndicatorsContext';
import { IndicatorCategory } from '../types';

export const IndicatorsModule: React.FC = () => {
  const { category } = useIndicators();
  const [indicators, setIndicators] = useState<ChiSoQlcl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('06/2024');

  const getCategoryTitle = (cat: IndicatorCategory) => {
    switch (cat) {
      case 'KTCM': return 'Thực hiện kỹ thuật chuyên môn theo tuyến';
      case 'SURGERY_II': return 'Phẫu thuật loại II trở lên';
      case 'SSI': return 'Nhiễm khuẩn vết mổ';
      case 'VAP': return 'Viêm phổi do nhiễm khuẩn bệnh viện';
      case 'SEVERE_INCIDENT': return 'Sự cố y khoa nghiêm trọng';
      case 'SEVERE_NON_MEDICAL': return 'Sự cố ngoài y khoa nghiêm trọng';
      case 'AVG_EXAM_TIME': return 'Thời gian khám bệnh trung bình';
      case 'AVG_STAY_TIME': return 'Thời gian nằm viện trung bình';
      case 'BED_USAGE': return 'Tỷ lệử dụng giường';
      case 'OR_USAGE': return 'Tỷ lệ sử dụng phòng mổ';
      case 'NURSE_PATIENT_RATIO': return 'Tỷ lệ Điều dưỡngtrên người bệnh';
      case 'HAND_HYGIENE': return 'Tỷ lệ tuân thủ vệ sinh tay';
      default: return null;
    }
  };

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
          {category && (
            <h2 className="text-title font-black text-[#009900] uppercase animate-in fade-in slide-in-from-left-4 duration-300">
              {getCategoryTitle(category)}
            </h2>
          )}
        </div>
        {!category && (
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
             className="bg-white border border-slate-200 text-black text-input font-bold rounded-lg p-2.5 focus:ring-green-500 focus:border-green-500"
           >
             <option value="06/2024">Tháng 6/2024</option>
             <option value="05/2024">Tháng 5/2024</option>
             <option value="Q1/2024">Quý 1/2024</option>
           </select>
         </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      {category === 'VAP' ? (
        <VAPModule />
      ) : category === 'KTCM' ? (
        <KtcmModule />
      ) : category === 'SURGERY_II' ? (
        <PtLoai2Module />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                <h3 className="text-section font-black text-black flex items-center uppercase">
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
                <h3 className="text-section font-black text-black flex items-center uppercase">
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
                  <h4 className="font-black text-red-800 text-label uppercase">Cảnh báo chỉ số</h4>
                  <p className="text-table text-red-600 font-bold mt-1">
                    {warningIndicators[0].ten_chi_so}: {warningIndicators[0].gia_tri}{warningIndicators[0].don_vi_tinh}
                    {warningIndicators[0].muc_tieu ? ` (Mục tiêu: ${warningIndicators[0].muc_tieu}${warningIndicators[0].don_vi_tinh})` : ''}
                  </p>
                </div>
              </div>
            )}
            <div className={`bg-primary-50 border border-primary-100 rounded-lg p-4 flex items-start gap-3 ${warningIndicators.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
              <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h4 className="font-black text-primary-800 text-label uppercase">Tổng quan</h4>
                <p className="text-table text-primary-600 font-bold mt-1">
                  Đã đạt {achievedCount}/{totalIndicators} chỉ số ({Math.round(achievedCount / totalIndicators * 100)}%).
                  {warningIndicators.length > 0 ? ` Có ${warningIndicators.length} chỉ số cần cải thiện.` : ' Tất cả chỉ số đang trong tầm kiểm soát.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};