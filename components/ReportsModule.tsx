import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Printer, RefreshCw } from 'lucide-react';
import { fetchLichSuBaoCao, addLichSuBaoCao, LichSuBaoCao } from '../readLichSuBaoCao';

export const ReportsModule: React.FC = () => {
  const [reports, setReports] = useState<LichSuBaoCao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLichSuBaoCao();
      setReports(data);
    } catch (err) {
      setError('Không thể tải dữ liệu lịch sử báo cáo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateReport = async (loai: string) => {
    const kyBaoCao = loai === 'Tháng' ? new Date().toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }) :
                     loai === 'Quý' ? `Q${Math.ceil((new Date().getMonth() + 1) / 3)}/${new Date().getFullYear()}` :
                     new Date().getFullYear().toString();
    
    try {
      await addLichSuBaoCao({
        ten_bao_cao: `Báo cáo công tác QLCL ${loai} ${kyBaoCao}`,
        loai_bao_cao: loai,
        ky_bao_cao: kyBaoCao,
        nguoi_tao: 'Người dùng hiện tại',
        ngay_tao: new Date().toISOString().split('T')[0]
      });
      loadData();
      alert(`Đã tạo báo cáo ${loai} thành công!`);
    } catch (err) {
      console.error('Lỗi tạo báo cáo:', err);
      alert('Có lỗi xảy ra khi tạo báo cáo.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Báo cáo Tổng hợp</h2>
          <p className="text-sm text-slate-500">Kết xuất báo cáo hoạt động QLCL định kỳ.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center border-dashed border-2">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto">
             <FileText size={40} />
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Chọn loại báo cáo để xuất dữ liệu</h3>
            <p className="text-slate-500 text-sm">Hệ thống sẽ tự động tổng hợp dữ liệu từ các module (Nhân sự, Sự cố, Chỉ số, Đánh giá tiêu chí) để tạo file Word/PDF theo mẫu quy định.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <button 
              onClick={() => handleCreateReport('Tháng')}
              className="group flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:border-primary-500 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                <Calendar size={24} className="text-slate-500 group-hover:text-primary-600" />
              </div>
              <span className="font-bold text-slate-800">Báo cáo Tháng</span>
              <span className="text-xs text-slate-500 mt-1">Hoạt động định kỳ</span>
            </button>
            
            <button 
              onClick={() => handleCreateReport('Quý')}
              className="group flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:border-primary-500 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                <FileText size={24} className="text-slate-500 group-hover:text-primary-600" />
              </div>
              <span className="font-bold text-slate-800">Sơ kết Quý</span>
              <span className="text-xs text-slate-500 mt-1">Tổng hợp 3 tháng</span>
            </button>
            
            <button 
              onClick={() => handleCreateReport('Năm')}
              className="group flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:border-primary-500 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                <Printer size={24} className="text-slate-500 group-hover:text-primary-600" />
              </div>
              <span className="font-bold text-slate-800">Tổng kết Năm</span>
              <span className="text-xs text-slate-500 mt-1">Báo cáo toàn diện</span>
            </button>
          </div>

          <div className="pt-6 border-t border-slate-100 w-full">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors">
                    <Download size={18} /> Tải xuống bản xem trước (PDF)
                </button>
                <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">
                    Xuất file Word (.docx)
                </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-sm uppercase">Lịch sử xuất báo cáo</h3>
          <button onClick={loadData} className="text-primary-600 hover:underline text-xs font-medium flex items-center gap-1">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Làm mới
          </button>
        </div>
        <div className="space-y-3">
            {loading && <div className="text-center py-4 text-slate-400">Đang tải...</div>}
            {error && <div className="text-center py-4 text-red-600">{error}</div>}
            {!loading && !error && reports.length === 0 && (
              <div className="text-center py-4 text-slate-400 italic">Chưa có lịch sử báo cáo nào</div>
            )}
            {!loading && !error && reports.map((report) => (
                <div key={report.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                            <FileText size={16} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-800">{report.ten_bao_cao}</p>
                            <p className="text-xs text-slate-500">
                              Người tạo: {report.nguoi_tao || 'Không rõ'} • 
                              {report.ngay_tao ? new Date(report.ngay_tao).toLocaleDateString('vi-VN') : ''}
                            </p>
                        </div>
                    </div>
                    <button className="text-primary-600 hover:underline text-xs font-medium">Tải lại</button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};