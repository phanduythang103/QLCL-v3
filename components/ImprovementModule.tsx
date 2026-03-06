import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, ChevronDown, CheckCircle2, 
  FileText, Target, BarChart3, ArrowLeft, RefreshCw, Eye, Save,
  FileDown, Clock, MoreHorizontal, Filter, Calendar, Users,
  AlertCircle, ArrowUpRight
} from 'lucide-react';
import { 
  Document, Packer, Paragraph, TextRun, AlignmentType, 
  Table, TableRow, TableCell, WidthType, BorderStyle, 
  VerticalAlign, Header, Footer
} from 'docx';
import { saveAs } from 'file-saver';
import { fetchKeHoachCaiTien, addKeHoachCaiTien, updateKeHoachCaiTien, deleteKeHoachCaiTien, KeHoachCaiTien } from '../readKeHoachCaiTien';
import { fetchKhctcl, addKhctcl, updateKhctcl, deleteKhctcl, Khctcl, GiaiPhapToChuc } from '../readKhctcl';
import { fetchDmDonVi, DmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';

type ViewState = 'LIST' | 'CREATE_PLAN' | 'CREATE_REPORT' | 'KHCTCL_FORM' | 'VIEW_PLAN';

// Define props interface for ImprovementCard to ensure key and other React props are handled correctly
interface ImprovementCardProps {
  item: any;
  color: 'primary' | 'green' | 'amber';
}

// Correctly typed ImprovementCard using React.FC
const ImprovementCard: React.FC<ImprovementCardProps> = ({ item, color }) => {
  const colorClasses = {
    primary: 'bg-primary-50 border-primary-100',
    green: 'bg-green-50 border-green-100',
    amber: 'bg-amber-50 border-amber-100'
  };

  const progressColors = {
    primary: 'bg-primary-500',
    green: 'bg-green-500',
    amber: 'bg-amber-500'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} transition-shadow hover:shadow-md cursor-pointer`}>
      <h4 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-2">{item.tieu_de || item.title}</h4>
      <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
        <span className="flex items-center gap-1"><FileText size={12} /> {item.don_vi || item.dept}</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {item.ngay_ket_thuc || item.date || '-'}</span>
      </div>
      <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full ${progressColors[color]}`}
          style={{ width: `${item.tien_do || item.progress || 0}%` }}
        ></div>
      </div>
    </div>
  );
};

export const ImprovementModule: React.FC = () => {
  const [view, setView] = useState<ViewState>('LIST');
  const [plans, setPlans] = useState<KeHoachCaiTien[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [khctclPlans, setKhctclPlans] = useState<Khctcl[]>([]);
  const [editingKhctcl, setEditingKhctcl] = useState<Khctcl | null>(null);
  const [statusPopup, setStatusPopup] = useState<Khctcl | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<'PLAN' | 'REPORT'>('PLAN');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data independently to prevent one failure from blocking everything
      const results = await Promise.allSettled([
        fetchKeHoachCaiTien(),
        fetchKhctcl()
      ]);

      if (results[0].status === 'fulfilled') {
        setPlans(results[0].value);
      } else {
        console.error('PDCA Fetch Error:', results[0].reason);
      }

      if (results[1].status === 'fulfilled') {
        setKhctclPlans(results[1].value);
      } else {
        const fetchError = results[1].reason?.message || 'Không thể tải danh sách KHCTCL';
        setError(fetchError);
        console.error('KHCTCL Fetch Error:', results[1].reason);
      }
    } catch (err: any) {
      setError('Lỗi hệ thống: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderKhctclView = () => {
    if (activeMainTab === 'REPORT') {
      return <KhctclReport plans={khctclPlans} />;
    }

    switch (view) {
      case 'CREATE_REPORT':
        return <ReportForm onCancel={() => setView('LIST')} />;
      case 'VIEW_PLAN':
        return (
          <KhctclView 
            item={editingKhctcl!} 
            onBack={() => setView('LIST')} 
            onEdit={() => setView('KHCTCL_FORM')}
          />
        );
      case 'KHCTCL_FORM':
        return (
          <KhctclForm 
            initialData={editingKhctcl} 
            onCancel={() => { setView('LIST'); setEditingKhctcl(null); }} 
            onSaved={() => { setView('LIST'); setEditingKhctcl(null); loadData(); }} 
          />
        );
      default:
        return (
          <ImprovementList 
            plans={plans} 
            khctclPlans={khctclPlans}
            loading={loading} 
            error={error} 
            onCreate={() => setView('KHCTCL_FORM')} 
            onReport={() => setView('CREATE_REPORT')} 
            onCreateKhctcl={() => { setEditingKhctcl(null); setView('KHCTCL_FORM'); }}
            onEditKhctcl={(item) => { setEditingKhctcl(item); setView('KHCTCL_FORM'); }}
            onViewKhctcl={(item) => { setEditingKhctcl(item); setView('VIEW_PLAN'); }}
            onRefresh={loadData} 
            onUpdateStatus={(item) => setStatusPopup(item)}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex gap-4 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveMainTab('PLAN')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            activeMainTab === 'PLAN' 
            ? 'bg-white text-[#108545] shadow-lg' 
            : 'text-slate-500 hover:bg-slate-200'
          }`}
        >
          <FileText size={20} /> Kế hoạch CTCL
        </button>
        <button
          onClick={() => setActiveMainTab('REPORT')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            activeMainTab === 'REPORT' 
            ? 'bg-white text-[#108545] shadow-lg' 
            : 'text-slate-500 hover:bg-slate-200'
          }`}
        >
          <BarChart3 size={20} /> Báo cáo tiến độ
        </button>
      </div>

      {renderKhctclView()}
      {statusPopup && (
        <StatusPopup 
          item={statusPopup} 
          onClose={() => setStatusPopup(null)} 
          onUpdated={loadData}
        />
      )}
    </div>
  );
};

const KhctclReport: React.FC<{ plans: Khctcl[] }> = ({ plans }) => {
  const stats = {
    total: plans.length,
    draft: plans.filter(p => p.trang_thai === 'Dự thảo').length,
    ongoing: plans.filter(p => p.trang_thai === 'Đang thực hiện').length,
    completed: plans.filter(p => p.trang_thai === 'Hoàn thành').length,
    paused: plans.filter(p => p.trang_thai === 'Tạm dừng').length,
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'Hoàn thành': return 100;
      case 'Đang thực hiện': return 50;
      case 'Tạm dừng': return 25;
      default: return 0;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hoàn thành': return 'bg-emerald-500';
      case 'Đang thực hiện': return 'bg-blue-500';
      case 'Tạm dừng': return 'bg-amber-500';
      case 'Dự thảo': return 'bg-slate-400';
      default: return 'bg-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <span className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Tổng số</span>
          <span className="text-4xl font-black text-slate-800">{stats.total}</span>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <span className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Hoàn thành</span>
          <span className="text-4xl font-black text-emerald-600">{stats.completed}</span>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <span className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Đang làm</span>
          <span className="text-4xl font-black text-blue-600">{stats.ongoing}</span>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <span className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Tạm dừng</span>
          <span className="text-4xl font-black text-amber-600">{stats.paused}</span>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <span className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Dự thảo</span>
          <span className="text-4xl font-black text-slate-500">{stats.draft}</span>
        </div>
      </div>

      {/* Detail List with Progress */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="px-8 py-6 bg-[#009900] text-white flex justify-between items-center">
          <h3 className="text-xl font-black">Theo dõi tiến độ chi tiết</h3>
          <span className="text-sm bg-black/20 px-4 py-1 rounded-full font-bold">Cập nhật thời gian thực</span>
        </div>
        <div className="divide-y divide-slate-100">
          {plans.map((plan) => (
            <div key={plan.id} className="p-8 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase text-white ${getStatusColor(plan.trang_thai)}`}>
                      {plan.trang_thai}
                    </span>
                    <span className="text-slate-400 text-sm font-bold">{plan.don_vi}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">{plan.ten_van_de}</h4>
                  <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(plan.ngay_bat_dau!).toLocaleDateString('vi-VN')}</span>
                    <span>→</span>
                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(plan.ngay_ket_thuc!).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                
                <div className="w-full md:w-80 space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-black text-slate-600">Tiến độ ước tính</span>
                    <span className="text-2xl font-black text-slate-800">{getProgressValue(plan.trang_thai)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-1 shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${getStatusColor(plan.trang_thai)} shadow-lg shadow-black/5`}
                      style={{ width: `${getProgressValue(plan.trang_thai)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="p-20 text-center text-slate-400 space-y-4">
              <BarChart3 size={64} className="mx-auto opacity-20" />
              <p className="font-bold text-lg">Chưa có kế hoạch nào để báo cáo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Sub-component: KHCTCL Formal View ---
const KhctclView: React.FC<{ item: Khctcl, onBack: () => void, onEdit: () => void }> = ({ item, onBack, onEdit }) => {
  const [exporting, setExporting] = useState(false);

  const handleExportWord = async () => {
    try {
      setExporting(true);
      
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1134, // 2cm roughly (1440 twips = 1 inch)
                right: 850,
                bottom: 1134,
                left: 1417, // ~2.5cm
              },
            },
          },
          children: [
            // Header: BVQY 103 | Q hiệu T ngữ
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 45, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: "BỆNH VIỆN QUÂN Y 103", bold: true, size: 28, font: "Times New Roman" })],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: (item.don_vi || "TÊN ĐƠN VỊ").toUpperCase(), bold: true, size: 28, font: "Times New Roman" })],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: "________________", bold: true })],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 55, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 28, font: "Times New Roman" })],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, size: 28, font: "Times New Roman" })],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: "________________________", bold: true })],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ spacing: { before: 400, after: 200 } }),

            // Title
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "KẾ HOẠCH CẢI TIẾN CHẤT LƯỢNG", bold: true, size: 36, font: "Times New Roman" }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
              children: [
                new TextRun({ text: (item.ten_van_de || "TÊN VẤN ĐỀ").toUpperCase(), bold: true, size: 32, font: "Times New Roman" }),
              ],
            }),

            // Section 1
            new Paragraph({
              children: [new TextRun({ text: "1. Lý do thực hiện (Đặt vấn đề):", bold: true, size: 28, font: "Times New Roman" })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              indent: { left: 400 },
              children: [new TextRun({ text: item.ly_do_thuc_hien || "Chưa có nội dung", size: 28, font: "Times New Roman" })],
              spacing: { after: 200 },
            }),

            // Section 2
            new Paragraph({
              children: [new TextRun({ text: "2. Mục tiêu (SMART):", bold: true, size: 28, font: "Times New Roman" })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              indent: { left: 400 },
              children: [new TextRun({ text: item.muc_tieu || "Chưa có nội dung", size: 28, font: "Times New Roman" })],
              spacing: { after: 100 },
            }),
            new Paragraph({
              indent: { left: 400 },
              children: [new TextRun({ 
                text: `Thời gian hoàn thành: Từ ngày ${item.ngay_bat_dau ? new Date(item.ngay_bat_dau).toLocaleDateString('vi-VN') : '....'} đến ngày ${item.ngay_ket_thuc ? new Date(item.ngay_ket_thuc).toLocaleDateString('vi-VN') : '....'}`, 
                bold: true,
                size: 28, 
                font: "Times New Roman" 
              })],
              spacing: { after: 200 },
            }),

            // Section 3
            new Paragraph({
              children: [new TextRun({ text: "3. Giải pháp và Tổ chức thực hiện:", bold: true, size: 28, font: "Times New Roman" })],
              spacing: { before: 200, after: 200 },
            }),

            // Solution Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                // Header
                new TableRow({
                  tableHeader: true,
                  children: [
                    ["STT", 5], ["Hành động cụ thể", 45], ["Người phụ trách", 15], ["Thời hạn", 15], ["Kết quả mong đợi", 20]
                  ].map(([text, width]) => new TableCell({
                    width: { size: width as number, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { fill: "F2F2F2" },
                    children: [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: text as string, bold: true, size: 28, font: "Times New Roman" })],
                    })],
                  })),
                }),
                // Data Rows
                ...(item.giai_phap_to_chuc || []).map(row => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(row.tt), size: 28, font: "Times New Roman" })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.hanh_dong, size: 28, font: "Times New Roman" })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: row.nguoi_phu_trach, size: 28, font: "Times New Roman" })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: row.thoi_han, size: 28, font: "Times New Roman" })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.ket_qua, size: 28, font: "Times New Roman" })] })] }),
                  ],
                })),
                // Placeholder rows if needed
                ...Array.from({ length: Math.max(0, 3 - (item.giai_phap_to_chuc?.length || 0)) }).map(() => new TableRow({
                  children: Array.from({ length: 5 }).map(() => new TableCell({ children: [new Paragraph({ children: [] })] })),
                })),
              ],
            }),

            // Footer / Signatures
            new Paragraph({ spacing: { before: 800 } }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CHỈ HUY ĐƠN VỊ", bold: true, size: 28, font: "Times New Roman" })] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(Ký và ghi rõ họ tên)", italics: true, size: 28, font: "Times New Roman" })] }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NGƯỜI LẬP KẾ HOẠCH", bold: true, size: 28, font: "Times New Roman" })] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.nguoi_lap_ke_hoach || "", bold: true, size: 28, font: "Times New Roman" })] }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `KHCTCL_${item.ten_van_de.substring(0, 30)}.docx`);
      
    } catch (err: any) {
      alert("Lỗi xuất Word: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 animate-in fade-in duration-500" style={{ fontFamily: 'Tahoma, sans-serif' }}>
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-sm p-16 print:p-0 print:shadow-none min-h-[29.7cm]">
        {/* Sticky Controls (Hidden on Print) */}
        <div className="flex justify-between items-center mb-10 print:hidden border-b border-slate-100 pb-6">
          <button onClick={onBack} className="flex items-center gap-2 px-5 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-bold transition-all">
            <ArrowLeft size={20} /> Quay lại
          </button>
          <div className="flex gap-4">
            <button 
               onClick={handleExportWord} 
               disabled={exporting}
               className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-black transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50"
            >
               <FileDown size={20} /> {exporting ? 'Đang chuẩn bị...' : 'Xuất file Word'}
            </button>
            <button onClick={onEdit} className="flex items-center gap-2 px-6 py-3 bg-[#108545] text-white rounded-2xl hover:bg-[#0e723b] font-black transition-all shadow-xl shadow-emerald-200 active:scale-95">
               Chỉnh sửa
            </button>
          </div>
        </div>

        {/* Paper Document Content */}
        <div className="flex flex-col space-y-8">
          {/* Header Rows */}
          <div className="grid grid-cols-2 border-b border-black pb-4 text-center">
            <div className="border-r border-black p-4">
              <p className="font-bold text-[12pt] mb-1">BỆNH VIỆN QUÂN Y 103</p>
              <p className="font-bold text-[13pt] uppercase">{item.don_vi || '[TÊN ĐƠN VỊ]'}</p>
            </div>
            <div className="p-4">
              <p className="font-bold text-[12pt] mb-1 uppercase tracking-tight">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="font-bold text-[13pt]">Độc lập - Tự do - Hạnh phúc</p>
            </div>
          </div>

          {/* Title Area */}
          <div className="text-center py-8 space-y-4">
            <h1 className="text-[18pt] font-black uppercase tracking-widest">KẾ HOẠCH CẢI TIẾN CHẤT LƯỢNG</h1>
            <p className="text-[16pt] font-black uppercase max-w-2xl mx-auto leading-relaxed border-b-2 border-black/10 pb-4">
              {item.ten_van_de || '[TÊN VẤN ĐỀ]'}
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-10 text-[14pt] leading-relaxed">
            {/* 1. Lý do thực hiện */}
            <section className="space-y-4">
              <h3 className="font-black text-[15pt]">1. Lý do thực hiện (Đặt vấn đề):</h3>
              <div className="pl-6 whitespace-pre-wrap text-slate-700">
                {item.ly_do_thuc_hien || 'Chưa cập nhật nội dung...'}
              </div>
            </section>

            {/* 2. Mục tiêu */}
            <section className="space-y-4">
              <h3 className="font-black text-[15pt]">2. Mục tiêu (SMART):</h3>
              <div className="pl-6 space-y-4">
                <div className="whitespace-pre-wrap text-slate-700">
                  {item.muc_tieu || 'Chưa cập nhật nội dung...'}
                </div>
                {(item.ngay_bat_dau || item.ngay_ket_thuc) && (
                  <p className="font-bold">
                    Thời gian hoàn thành: Từ ngày {item.ngay_bat_dau ? new Date(item.ngay_bat_dau).toLocaleDateString('vi-VN') : '.....'} 
                    {' đến ngày '} 
                    {item.ngay_ket_thuc ? new Date(item.ngay_ket_thuc).toLocaleDateString('vi-VN') : '.....'}
                  </p>
                )}
              </div>
            </section>

            {/* 3. Giải pháp */}
            <section className="space-y-4">
              <h3 className="font-black text-[15pt]">3. Giải pháp và Tổ chức thực hiện:</h3>
              <div className="overflow-hidden border border-black rounded-sm">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slate-50 border-b border-black">
                      <th className="p-3 border-r border-black w-12 text-center font-black uppercase text-xs">STT</th>
                      <th className="p-3 border-r border-black font-black uppercase text-xs">Hành động cụ thể</th>
                      <th className="p-3 border-r border-black w-40 font-black uppercase text-xs text-center">Người phụ trách</th>
                      <th className="p-3 border-r border-black w-32 font-black uppercase text-xs text-center">Thời hạn</th>
                      <th className="p-3 font-black uppercase text-xs">Kết quả mong đợi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {item.giai_phap_to_chuc?.map((row, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="p-3 border-r border-black text-center font-bold">{row.tt}</td>
                        <td className="p-3 border-r border-black whitespace-pre-wrap">{row.hanh_dong}</td>
                        <td className="p-3 border-r border-black text-center">{row.nguoi_phu_trach}</td>
                        <td className="p-3 border-r border-black text-center">{row.thoi_han}</td>
                        <td className="p-3 whitespace-pre-wrap">{row.ket_qua}</td>
                      </tr>
                    ))}
                    {/* Placeholder rows if few items to fill space */}
                    {Array.from({ length: Math.max(0, 5 - (item.giai_phap_to_chuc?.length || 0)) }).map((_, i) => (
                      <tr key={`p-${i}`} className="h-10">
                        <td className="p-3 border-r border-black"></td>
                        <td className="p-3 border-r border-black"></td>
                        <td className="p-3 border-r border-black"></td>
                        <td className="p-3 border-r border-black"></td>
                        <td className="p-3"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Footer Signatures */}
          <div className="grid grid-cols-2 pt-20 text-center text-[14pt]">
            <div className="space-y-24">
              <p className="font-black uppercase">CHỈ HUY ĐƠN VỊ</p>
              <div className="italic text-slate-300">(Ký và ghi rõ họ tên)</div>
            </div>
            <div className="space-y-24">
              <p className="font-black uppercase">NGƯỜI LẬP KẾ HOẠCH</p>
              <p className="font-black text-slate-800">{item.nguoi_lap_ke_hoach}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-component: Status Update Popup ---
const StatusPopup: React.FC<{ item: Khctcl, onClose: () => void, onUpdated: () => void }> = ({ item, onClose, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(item.trang_thai);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      if (item.id) {
        await updateKhctcl(item.id, { trang_thai: status });
        onUpdated();
        onClose();
      }
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" style={{ fontFamily: 'Tahoma, sans-serif' }}>
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 scale-in-center">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-[#108545]/5">
          <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">Cập nhật trạng thái</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
             <Plus className="rotate-45" size={24} />
          </button>
        </div>
        <div className="p-8 space-y-8">
          <div className="space-y-3">
             <p className="font-bold text-slate-400 text-xs uppercase tracking-widest">Kế hoạch</p>
             <p className="font-black text-slate-800 text-[14pt] line-clamp-2">{item.ten_van_de}</p>
          </div>
          <div className="space-y-4">
             <p className="font-bold text-slate-400 text-xs uppercase tracking-widest">Trạng thái hiện tại: <span className="text-[#108545]">{item.trang_thai}</span></p>
             <div className="grid grid-cols-2 gap-3">
                {['Dự thảo', 'Đang thực hiện', 'Hoàn thành', 'Tạm dừng'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-4 py-3 rounded-2xl font-black text-sm transition-all border-2 ${
                      status === s 
                      ? 'bg-[#108545] text-white border-[#108545] shadow-lg shadow-[#108545]/20 scale-105' 
                      : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
             </div>
          </div>
          <div className="flex gap-4 pt-4">
             <button onClick={onClose} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all">Bỏ qua</button>
             <button 
               onClick={handleUpdate}
               disabled={loading}
               className="flex-1 py-4 bg-[#108545] text-white rounded-2xl font-black text-sm hover:bg-[#0e723b] shadow-xl shadow-[#108545]/10 active:scale-95 transition-all disabled:opacity-50"
             >
               {loading ? 'Đang lưu...' : 'Lưu cập nhật'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-component: Improvement List (Default View) ---
interface ImprovementListProps {
  plans: KeHoachCaiTien[];
  khctclPlans: Khctcl[];
  loading: boolean;
  error: string | null;
  onCreate: () => void;
  onReport: () => void;
  onCreateKhctcl: () => void;
  onEditKhctcl: (item: Khctcl) => void;
  onViewKhctcl: (item: Khctcl) => void;
  onUpdateStatus: (item: Khctcl) => void;
  onRefresh: () => void;
}

const ImprovementList: React.FC<ImprovementListProps> = ({ 
  khctclPlans, 
  loading, 
  error, 
  onCreateKhctcl, 
  onEditKhctcl, 
  onViewKhctcl,
  onUpdateStatus,
  onRefresh 
}) => {

  const handleDeleteKhctcl = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa kế hoạch cải tiến này?')) {
      try {
        await deleteKhctcl(id);
        onRefresh();
      } catch (err: any) {
        alert('Lỗi: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-8" style={{ fontFamily: 'Tahoma, sans-serif' }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Kế hoạch Cải tiến Chất lượng (KHCTCL)</h2>
          <p className="text-slate-500 font-bold text-sm">Quản lý và theo dõi các đề án cải tiến chất lượng bệnh viện</p>
        </div>

        <button
          onClick={onCreateKhctcl}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#108545] text-white px-8 py-3 rounded-2xl hover:bg-[#0e723b] font-black text-[14pt] transition-all shadow-xl active:scale-95"
        >
          <Plus size={24} /> Lập KHCTCL mới
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300">
          <AlertCircle className="shrink-0" size={24} />
          <div className="font-bold text-[14pt]">
            <p>Đã xảy ra lỗi khi tải dữ liệu: {error}</p>
            <button 
              onClick={onRefresh}
              className="mt-2 text-sm underline hover:text-red-800 transition-colors"
            >
              Thử tải lại ngay
            </button>
          </div>
        </div>
      )}

      {/* Main List Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-50/30">
          <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest text-sm">
            <div className="p-2 bg-[#108545]/10 text-[#108545] rounded-xl">
              <FileText size={20} />
            </div>
            Danh sách Kế hoạch Cải tiến
          </h3>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm kế hoạch..."
              className="w-full pl-12 pr-6 py-3 border border-slate-200 rounded-2xl text-[14pt] font-bold focus:outline-none focus:ring-4 focus:ring-[#108545]/10 focus:border-[#108545] transition-all bg-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#009900] text-white font-black uppercase text-[11px] tracking-widest">
              <tr>
                <th className="px-8 py-5 w-48 rounded-tl-[2rem]">Thời gian</th>
                <th className="px-8 py-5 min-w-[280px]">Đơn vị thực hiện</th>
                <th className="px-8 py-5">Vấn đề cải tiến</th>
                <th className="px-8 py-5 text-center w-72 rounded-tr-[2rem]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold">Đang tải dữ liệu...</td></tr>
              ) : khctclPlans.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic font-bold">Chưa có kế hoạch cải tiến nào được lập.</td></tr>
              ) : khctclPlans.map((item) => (
                <tr key={item.id} className="hover:bg-[#108545]/5 transition-colors group">
                  <td className="px-8 py-6 whitespace-nowrap font-black text-slate-500 text-[12pt]">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-600 font-bold">{new Date(item.ngay_lap_ke_hoach).toLocaleDateString('vi-VN')}</span>
                      {(item.ngay_bat_dau || item.ngay_ket_thuc) && (
                        <p className="text-[10px] text-slate-400 uppercase">
                          {item.ngay_bat_dau ? new Date(item.ngay_bat_dau).toLocaleDateString('vi-VN') : '?'} 
                          {' → '} 
                          {item.ngay_ket_thuc ? new Date(item.ngay_ket_thuc).toLocaleDateString('vi-VN') : '?'}
                        </p>
                      )}
                      <div className="mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          item.trang_thai === 'Hoàn thành' ? 'bg-green-100 text-green-700' :
                          item.trang_thai === 'Đang thực hiện' ? 'bg-blue-100 text-blue-700' :
                          item.trang_thai === 'Tạm dừng' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {item.trang_thai}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-800 text-[14pt] leading-tight break-words">{item.don_vi}</td>
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-800 text-[14pt] line-clamp-2 group-hover:text-[#108545] transition-colors leading-snug">{item.ten_van_de}</p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="grid grid-cols-2 gap-2 max-w-[280px] mx-auto">
                      <button 
                        onClick={() => onViewKhctcl(item)} 
                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl transition-all active:scale-90 font-black text-[10px] uppercase tracking-tight border border-slate-200/50" 
                        title="Xem chi tiết"
                      >
                        <Eye size={16} /> Xem
                      </button>
                      <button 
                        onClick={() => onUpdateStatus(item)} 
                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-all active:scale-90 font-black text-[10px] uppercase tracking-tight border border-emerald-200/50" 
                        title="Cập nhật trạng thái"
                      >
                        <RefreshCw size={16} /> Update
                      </button>
                      <button 
                        onClick={() => onEditKhctcl(item)} 
                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition-all active:scale-90 font-black text-[10px] uppercase tracking-tight border border-blue-200/50" 
                        title="Chỉnh sửa nội dung"
                      >
                        <Edit2 size={16} /> Sửa
                      </button>
                      <button 
                        onClick={() => handleDeleteKhctcl(item.id!)} 
                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all active:scale-90 font-black text-[10px] uppercase tracking-tight border border-red-200/50" 
                        title="Xóa kế hoạch"
                      >
                        <Trash2 size={16} /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center font-bold text-[12pt] text-slate-500">
          <span>Tổng số: <span className="text-[#108545]">{khctclPlans.length}</span> kế hoạch</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors disabled:opacity-30" disabled>Trước</button>
            <button className="px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors disabled:opacity-30" disabled>Sau</button>
          </div>
        </div>
      </div>

      {/* Hidden card per user request */}
      {/* 
      <div className="bg-gradient-to-br from-[#108545]/5 to-[#108545]/10 border border-[#108545]/20 rounded-[2rem] p-8 flex items-center justify-between shadow-sm">
        <div className="flex gap-6 items-center">
          <div className="p-4 bg-white rounded-2xl text-[#108545] shadow-lg">
            <Target size={32} />
          </div>
          <div>
            <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">Kết quả đầu ra & Đánh giá</h3>
            <p className="text-[#108545] font-bold text-[14pt]">Xem tổng hợp báo cáo hiệu quả cải tiến định kỳ.</p>
          </div>
        </div>
        <button className="flex items-center gap-3 bg-white text-[#108545] px-8 py-4 rounded-2xl font-black shadow-md hover:shadow-xl transition-all active:scale-95 text-[14pt]">
          Xem chi tiết <ArrowUpRight size={24} />
        </button>
      </div> 
      */}
    </div>
  );
};

// --- Sub-component: KHCTCL Form (Full-page Implementation) ---
const KhctclForm = ({ initialData, onCancel, onSaved }: { initialData?: Khctcl | null, onCancel: () => void, onSaved: () => void }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Omit<Khctcl, 'id' | 'created_at' | 'nguoi_tao_id'>>({
    ngay_lap_ke_hoach: initialData?.ngay_lap_ke_hoach || new Date().toISOString().split('T')[0],
    don_vi: initialData?.don_vi || '',
    nguoi_lap_ke_hoach: initialData?.nguoi_lap_ke_hoach || user?.full_name || '',
    ten_van_de: initialData?.ten_van_de || '',
    ly_do_thuc_hien: initialData?.ly_do_thuc_hien || '',
    muc_tieu: initialData?.muc_tieu || '',
    ngay_bat_dau: initialData?.ngay_bat_dau || '',
    ngay_ket_thuc: initialData?.ngay_ket_thuc || '',
    trang_thai: initialData?.trang_thai || 'Dự thảo',
    giai_phap_to_chuc: initialData?.giai_phap_to_chuc || [
      { tt: 1, hanh_dong: '', nguoi_phu_trach: '', thoi_han: '', ket_qua: '' }
    ]
  });

  const [units, setUnits] = useState<DmDonVi[]>([]);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const data = await fetchDmDonVi();
        setUnits(data);
      } catch (err) {
        console.error('Error loading units:', err);
      }
    };
    loadUnits();
  }, []);

  const handleAddRow = () => {
    setFormData(prev => ({
      ...prev,
      giai_phap_to_chuc: [
        ...prev.giai_phap_to_chuc,
        { tt: prev.giai_phap_to_chuc.length + 1, hanh_dong: '', nguoi_phu_trach: '', thoi_han: '', ket_qua: '' }
      ]
    }));
  };

  const handleRemoveRow = (index: number) => {
    if (formData.giai_phap_to_chuc.length <= 1) return;
    const newRows = formData.giai_phap_to_chuc.filter((_, i) => i !== index).map((row, i) => ({ ...row, tt: i + 1 }));
    setFormData(prev => ({ ...prev, giai_phap_to_chuc: newRows }));
  };

  const handleRowChange = (index: number, field: keyof GiaiPhapToChuc, value: any) => {
    const newRows = [...formData.giai_phap_to_chuc];
    newRows[index] = { ...newRows[index], [field]: value };
    setFormData(prev => ({ ...prev, giai_phap_to_chuc: newRows }));
  };

  const handleSave = async () => {
    if (!formData.ten_van_de || !formData.don_vi) {
      alert('Vui lòng nhập tên vấn đề và đơn vị thực hiện.');
      return;
    }

    try {
      setLoading(true);
      if (initialData?.id) {
        await updateKhctcl(initialData.id, formData);
      } else {
        await addKhctcl({
          ...formData,
          nguoi_tao_id: user?.id || ''
        });
      }
      onSaved();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen animate-in fade-in duration-500" style={{ fontFamily: 'Tahoma, sans-serif' }}>
      {/* Optimized Header: Clean & professional (Stationary) */}
      <div className="bg-white border-b border-slate-200 py-6 px-10 shadow-sm">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <button 
              onClick={onCancel} 
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl transition-all active:scale-95 border border-slate-200"
              title="Quay lại"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Lập Kế hoạch Cải tiến (KHCTCL)</h2>
              <p className="text-[#108545] font-bold text-sm flex items-center gap-2">
                <CheckCircle2 size={16} /> Quy trình cải tiến chất lượng bệnh viện
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Trạng thái:</span>
              <select
                value={formData.trang_thai}
                onChange={e => setFormData({ ...formData, trang_thai: e.target.value })}
                className="bg-transparent border-none focus:ring-0 font-black text-[#108545] text-sm uppercase cursor-pointer outline-none"
              >
                <option value="Dự thảo">Dự thảo</option>
                <option value="Đang thực hiện">Đang thực hiện</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Tạm dừng">Tạm dừng</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button
                onClick={onCancel}
                className="px-6 py-3 text-slate-600 hover:bg-slate-50 rounded-2xl font-bold text-[14pt] transition-all"
              >
                Hủy bỏ
              </button>
              <button
                disabled={loading}
                onClick={handleSave}
                className="flex items-center gap-3 px-10 py-3 bg-[#108545] text-white rounded-2xl font-black text-[14pt] shadow-lg hover:shadow-xl hover:bg-[#0e723b] transition-all active:scale-95 disabled:opacity-50"
              >
                <Save size={24} /> {loading ? 'Đang lưu...' : 'Lưu kế hoạch'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-10 space-y-10 pb-20">
        {/* Section 1: Thông tin chung (Card style) */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-[#108545]/10 text-[#108545] flex items-center justify-center">
              <FileText size={18} />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Thông tin chung</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 group">
              <label className="text-[14pt] font-black text-slate-500 flex items-center gap-2 group-focus-within:text-[#108545] transition-colors">
                Ngày lập kế hoạch
              </label>
              <input
                type="date"
                value={formData.ngay_lap_ke_hoach}
                onChange={e => setFormData({ ...formData, ngay_lap_ke_hoach: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#108545]/5 focus:border-[#108545] font-bold text-slate-700 text-[14pt] outline-none transition-all"
              />
            </div>
            <div className="space-y-3 group">
              <label className="text-[14pt] font-black text-slate-500 flex items-center gap-2 group-focus-within:text-[#108545] transition-colors">
                Đơn vị thực hiện
              </label>
              <div className="relative group/select">
                <select
                  value={formData.don_vi}
                  onChange={e => setFormData({ ...formData, don_vi: e.target.value })}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#108545]/5 focus:border-[#108545] font-bold text-slate-700 text-[14pt] outline-none transition-all appearance-none cursor-pointer pr-12"
                >
                  <option value="">-- Chọn đơn vị --</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.ten_don_vi}>
                      {unit.ten_don_vi}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/select:text-[#108545] transition-colors">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>
            <div className="space-y-3 group">
              <label className="text-[14pt] font-black text-slate-500 flex items-center gap-2 group-focus-within:text-[#108545] transition-colors">
                Người lập kế hoạch
              </label>
              <input
                type="text"
                placeholder="Nhập họ và tên..."
                value={formData.nguoi_lap_ke_hoach}
                onChange={e => setFormData({ ...formData, nguoi_lap_ke_hoach: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#108545]/5 focus:border-[#108545] font-bold text-slate-700 text-[14pt] outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 pt-10 border-t border-slate-100">
            <div className="space-y-3 group">
              <label className="text-[14pt] font-black text-slate-500 flex items-center gap-2 group-focus-within:text-[#108545] transition-colors">
                Thời gian thực hiện: Từ ngày
              </label>
              <input
                type="date"
                value={formData.ngay_bat_dau || ''}
                onChange={e => setFormData({ ...formData, ngay_bat_dau: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#108545]/5 focus:border-[#108545] font-bold text-slate-700 text-[14pt] outline-none transition-all"
              />
            </div>
            <div className="space-y-3 group">
              <label className="text-[14pt] font-black text-slate-500 flex items-center gap-2 group-focus-within:text-[#108545] transition-colors">
                Đến ngày
              </label>
              <input
                type="date"
                value={formData.ngay_ket_thuc || ''}
                onChange={e => setFormData({ ...formData, ngay_ket_thuc: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#108545]/5 focus:border-[#108545] font-bold text-slate-700 text-[14pt] outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Vấn đề & Mục tiêu */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 space-y-8">
          <div className="flex items-center gap-3 mb-2 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-[#108545]/10 text-[#108545] flex items-center justify-center">
              <Target size={18} />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Nội dung cải tiến</h3>
          </div>

          <div className="space-y-3 group">
            <label className="text-[14pt] font-black text-slate-500 flex items-center gap-2 group-focus-within:text-[#108545] transition-colors">
              Tên vấn đề/Đề tài cải tiến
            </label>
            <input
              type="text"
              placeholder="Nhập tên vấn đề cần cải tiến..."
              value={formData.ten_van_de}
              onChange={e => setFormData({ ...formData, ten_van_de: e.target.value })}
              className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#108545]/10 focus:shadow-sm font-black text-slate-800 text-[16pt] outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3 group">
              <label className="text-[14pt] font-black text-slate-500 flex items-center gap-2 group-focus-within:text-[#108545] transition-colors">
                Lý do thực hiện (Đặt vấn đề)
              </label>
              <textarea
                rows={5}
                placeholder="Mô tả ngắn gọn thực trạng..."
                value={formData.ly_do_thuc_hien}
                onChange={e => setFormData({ ...formData, ly_do_thuc_hien: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#108545]/5 focus:border-[#108545] font-bold text-slate-700 text-[14pt] outline-none transition-all leading-relaxed"
              />
            </div>
            <div className="space-y-3 group">
              <label className="text-[14pt] font-black text-slate-500 flex items-center gap-2 group-focus-within:text-[#108545] transition-colors">
                Mục tiêu (SMART)
              </label>
              <textarea
                rows={5}
                placeholder="Mục tiêu cụ thể cần đạt được..."
                value={formData.muc_tieu}
                onChange={e => setFormData({ ...formData, muc_tieu: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#108545]/5 focus:border-[#108545] font-bold text-slate-700 text-[14pt] outline-none transition-all leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Giải pháp (Clean Table) */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-center mb-10 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#108545]/10 text-[#108545] flex items-center justify-center">
                <BarChart3 size={18} />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Giải pháp & Tổ chức</h3>
            </div>
            <button
              onClick={handleAddRow}
              className="flex items-center gap-2 px-6 py-3 bg-[#108545] text-white rounded-2xl hover:bg-[#0e723b] font-black text-sm transition-all shadow-md active:scale-95"
            >
              <Plus size={20} /> Thêm giải pháp
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">
                  <th className="px-6 py-4 w-16 text-center rounded-l-2xl">STT</th>
                  <th className="px-6 py-4 min-w-[300px]">Hành động cụ thể</th>
                  <th className="px-6 py-4 w-56">Người phụ trách</th>
                  <th className="px-6 py-4 w-44">Thời hạn</th>
                  <th className="px-6 py-4 min-w-[250px]">Kết quả mong đợi</th>
                  <th className="px-6 py-4 w-16 text-center rounded-r-2xl"></th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {formData.giai_phap_to_chuc.map((row, index) => (
                  <tr key={index} className="group transition-colors border-b border-slate-50 last:border-none">
                    <td className="px-6 py-8 text-center align-top pt-10">
                      <span className="text-slate-300 text-sm font-black">{row.tt < 10 ? `0${row.tt}` : row.tt}</span>
                    </td>
                    <td className="px-4 py-6 align-top">
                      <textarea
                        rows={3}
                        value={row.hanh_dong}
                        onChange={e => handleRowChange(index, 'hanh_dong', e.target.value)}
                        className="w-full px-0 py-2 bg-transparent border-none focus:ring-0 text-[14pt] font-bold text-slate-700 outline-none resize-none leading-relaxed placeholder:text-slate-300"
                        placeholder="Mô tả hành động..."
                      />
                    </td>
                    <td className="px-4 py-6 align-top">
                      <input
                        type="text"
                        value={row.nguoi_phu_trach}
                        onChange={e => handleRowChange(index, 'nguoi_phu_trach', e.target.value)}
                        className="w-full px-0 py-2 bg-transparent border-none focus:ring-0 text-[14pt] font-bold text-slate-700 outline-none placeholder:text-slate-300"
                        placeholder="Nhân sự..."
                      />
                    </td>
                    <td className="px-4 py-6 align-top">
                      <input
                        type="text"
                        value={row.thoi_han}
                        onChange={e => handleRowChange(index, 'thoi_han', e.target.value)}
                        className="w-full px-0 py-2 bg-transparent border-none focus:ring-0 text-[14pt] font-bold text-slate-700 outline-none placeholder:text-slate-300"
                        placeholder="Hạn định..."
                      />
                    </td>
                    <td className="px-4 py-6 align-top">
                      <textarea
                        rows={3}
                        value={row.ket_qua}
                        onChange={e => handleRowChange(index, 'ket_qua', e.target.value)}
                        className="w-full px-0 py-2 bg-transparent border-none focus:ring-0 text-[14pt] font-bold text-slate-700 outline-none resize-none leading-relaxed placeholder:text-slate-300"
                        placeholder="Chỉ số đạt được..."
                      />
                    </td>
                    <td className="px-4 py-8 text-center align-top pt-8">
                      <button
                        onClick={() => handleRemoveRow(index)}
                        className="p-3 text-slate-200 hover:text-red-400 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-8 bg-blue-50 text-blue-900 text-[13pt] font-bold rounded-[2.5rem] flex items-center gap-5 border border-blue-100">
          <div className="p-3 bg-white rounded-2xl text-blue-500 shadow-sm">
            <FileText size={24} />
          </div>
          <p>Kế hoạch sau khi lưu sẽ được bộ phận chuyên trách thẩm định. Hãy đảm bảo các mục tiêu được thiết lập theo tiêu chí SMART.</p>
        </div>
      </div>
    </div>
  );
};

// --- Sub-component: Report Form (Báo cáo) ---
const ReportForm = ({ onCancel }: { onCancel: () => void }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
    <div className="border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800">BÁO CÁO KẾT QUẢ CẢI TIẾN</h2>
          <p className="text-xs text-slate-500">Đánh giá hiệu quả sau can thiệp (Check & Act)</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-medium text-sm rounded-lg">Hủy</button>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm shadow-sm">
          <Save size={16} /> Nộp báo cáo
        </button>
      </div>
    </div>

    <div className="p-8 space-y-8">
      {/* 1. Project Selection */}
      <section className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <label className="block text-sm font-bold text-slate-700 mb-2">Chọn đề tài/kế hoạch cần báo cáo</label>
        <select className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white">
          <option>-- Chọn đề tài đang thực hiện --</option>
          <option selected>Cải tiến quy trình cấp phát thuốc nội trú (Khoa Dược)</option>
          <option>Giảm thời gian chờ tại Khoa Khám bệnh</option>
        </select>
      </section>

      {/* 2. Implementation Results */}
      <section>
        <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-100 pb-2 mb-4 flex items-center">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs mr-2">1</span>
          Kết quả thực hiện (Check)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian bắt đầu</label>
            <input type="date" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50" value="2024-01-01" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian kết thúc</label>
            <input type="date" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">So sánh chỉ số (Trước vs Sau)</label>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-primary-600 text-white font-bold text-xs uppercase">
                <tr>
                  <th className="p-3 border-r border-primary-500">Chỉ số đo lường</th>
                  <th className="p-3 border-r border-primary-500 w-32 text-white">Trước cải tiến</th>
                  <th className="p-3 border-r border-primary-500 w-32 text-white">Sau cải tiến</th>
                  <th className="p-3 w-32">Tỷ lệ thay đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2"><input type="text" className="w-full border-none focus:ring-0 text-sm" placeholder="VD: Thời gian chờ trung bình" /></td>
                  <td className="p-2 border-l border-slate-100"><input type="text" className="w-full border-none focus:ring-0 text-sm text-center font-medium" /></td>
                  <td className="p-2 border-l border-slate-100"><input type="text" className="w-full border-none focus:ring-0 text-sm text-center font-bold text-green-700" /></td>
                  <td className="p-2 border-l border-slate-100"><input type="text" className="w-full border-none focus:ring-0 text-sm text-center" placeholder="%" /></td>
                </tr>
                <tr>
                  <td className="p-2"><input type="text" className="w-full border-none focus:ring-0 text-sm" placeholder="VD: Số sự cố y khoa" /></td>
                  <td className="p-2 border-l border-slate-100"><input type="text" className="w-full border-none focus:ring-0 text-sm text-center font-medium" /></td>
                  <td className="p-2 border-l border-slate-100"><input type="text" className="w-full border-none focus:ring-0 text-sm text-center font-bold text-green-700" /></td>
                  <td className="p-2 border-l border-slate-100"><input type="text" className="w-full border-none focus:ring-0 text-sm text-center" placeholder="%" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3. Analysis & Evaluation */}
      <section>
        <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-100 pb-2 mb-4 flex items-center">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs mr-2">2</span>
          Đánh giá & Bài học kinh nghiệm (Act)
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Đánh giá chung về hiệu quả</label>
            <textarea rows={3} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Đề án đã đạt được mục tiêu đề ra chưa? Những lợi ích mang lại là gì?"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Những tồn tại/Khó khăn</label>
            <textarea rows={2} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder=""></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bài học kinh nghiệm & Hướng phát triển tiếp theo</label>
            <textarea rows={3} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Cần duy trì hoạt động nào? Có mở rộng đề án không?"></textarea>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="standardize" className="rounded text-primary-600 focus:ring-primary-500" />
            <label htmlFor="standardize" className="text-sm text-slate-700">Đề xuất chuẩn hóa thành quy trình thường quy (SOP)</label>
          </div>
        </div>
      </section>

      {/* Attachments */}
      <section>
        <label className="block text-sm font-medium text-slate-700 mb-2">Tài liệu minh chứng đính kèm</label>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
          <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Kéo thả file báo cáo chi tiết, hình ảnh, biểu đồ tại đây</p>
          <p className="text-xs text-slate-400 mt-1">(Hỗ trợ: .doc, .pdf, .xlsx, .jpg)</p>
        </div>
      </section>
    </div>
  </div>
);
