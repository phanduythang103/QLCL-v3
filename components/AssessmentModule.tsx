import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  ClipboardList, Award, ChevronRight, FileCheck, Star,
  Upload, Plus, FileSpreadsheet, Search, Filter, Download,
  MoreHorizontal, CheckCircle2, AlertCircle, Paperclip,
  UserPlus, FileText, Printer, Save, Eye, Edit2, Trash2, RefreshCw,
  LayoutGrid, ListFilter, XCircle, ChevronDown, ChevronUp, AlertTriangle,
  Camera, Image as ImageIcon, Type, Minus, Plus as PlusIcon
} from 'lucide-react';
import {
  fetchBoTieuChuan, BoTieuChuan, deleteBoTieuChuan,
  fetchKetQuaDanhGia, KetQuaDanhGia
} from '../readDanhGiaChatLuong';
import { fetchData83, addData83Bulk, updateData83, deleteData83, Data83 } from '../readData83';
import { fetchDonVi, saveKqDanhGia83Bulk, uploadEvidenceImage, KqDanhGia83, DonVi, fetchAssessmentSheets, fetchKqByPhieuId, deletePhieuDanhGia, AssessmentSheet } from '../readKqDanhGia83';
import { useAuth } from '../contexts/AuthContext';

// --- Helper Functions ---

const naturalSort = (a: string, b: string) => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

// --- Types ---

type AssessmentTab = 'CRITERIA_83' | 'BASIC' | 'QUALITY_ASSESSMENT';

export const AssessmentModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AssessmentTab>('CRITERIA_83');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const headers = ["phan", "chuong", "tieu_chi", "muc", "ma_tieu_muc", "tieu_muc", "nhom"];
    const templateData = [
      {
        phan: "PHẦN A: HƯỚNG ĐẾN NGƯỜI BỆNH",
        chuong: "Chương A1: Thiết lập hệ thống thụ lý và giải quyết ý kiến phản hồi của người bệnh",
        tieu_chi: "A1.1: Người bệnh được chỉ dẫn rõ ràng, đón tiếp niềm nở...",
        muc: "Mức 1",
        ma_tieu_muc: "A1.1-1.1",
        tieu_muc: "Có sơ đồ bệnh viện và các bảng biển chỉ dẫn được đặt tại các vị trí dễ quan sát.",
        nhom: "A"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DanhMuc83");

    // Auto-size columns
    const colWidths = headers.map(() => ({ wch: 20 }));
    colWidths[1] = { wch: 40 }; // chuong
    colWidths[2] = { wch: 40 }; // tieu_chi
    colWidths[5] = { wch: 80 }; // tieu_muc
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, "Mau_DanhMuc83_TieuChi.xlsx");
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        alert("Vui lòng tải lên file Excel (.xlsx hoặc .xls)");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

          if (jsonData.length > 0) {
            const confirmMsg = `Hệ thống đã đọc được ${jsonData.length} dòng dữ liệu.\n\nBạn có muốn nhập dữ liệu này vào bảng data83 không?`;
            if (confirm(confirmMsg)) {
              // Ensure fields are lowercase to match Supabase
              const cleanedData = jsonData.map(item => ({
                phan: item.phan || item.Phan,
                chuong: item.chuong || item.Chuong,
                tieu_chi: item.tieu_chi || item.Tieu_chi,
                muc: item.muc || item.Muc,
                ma_tieu_muc: item.ma_tieu_muc || item.Ma_tieu_muc,
                tieu_muc: item.tieu_muc || item.Tieu_muc,
                nhom: item.nhom || item.Nhom
              }));

              await addData83Bulk(cleanedData);
              alert("Đã nhập dữ liệu danh mục 83 tiêu chí thành công!");
              window.location.reload();
            }
          } else {
            alert("File Excel không có dữ liệu hoặc không đúng định dạng mẫu.");
          }
        } catch (err: any) {
          console.error("Lỗi xử lý file Excel:", err);
          alert(`Lỗi: ${err.message || "Không thể xử lý file Excel này."}`);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Đánh giá Chất lượng Bệnh viện</h2>
          <p className="text-sm text-slate-500">Tự đánh giá, chấm điểm dựa trên danh mục bảng data83.</p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
          />
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            <Download size={16} /> Tải file mẫu Excel
          </button>
          <button
            onClick={handleFileUpload}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors shadow-sm"
          >
            <Upload size={16} /> Upload Danh mục Excel
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-slate-100 p-1 rounded-xl inline-flex mb-2">
        <button
          onClick={() => setActiveTab('CRITERIA_83')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'CRITERIA_83'
            ? 'bg-white text-primary-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <Award size={18} />
          Danh mục 83 Tiêu chí (data83)
        </button>
        <button
          onClick={() => setActiveTab('BASIC')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'BASIC'
            ? 'bg-white text-primary-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <ClipboardList size={18} />
          Bộ Tiêu chuẩn Cơ bản
        </button>
        <button
          onClick={() => setActiveTab('QUALITY_ASSESSMENT')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'QUALITY_ASSESSMENT'
            ? 'bg-white text-primary-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <FileCheck size={18} />
          Chấm điểm Tiêu chí CLBV
        </button>
      </div>

      {/* Content Rendering */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'CRITERIA_83' && <Criteria83Data83View />}
        {activeTab === 'BASIC' && <BasicStandardsView />}
        {activeTab === 'QUALITY_ASSESSMENT' && <QualityAssessmentView />}
      </div>
    </div>
  );
};

// --- View 1: Bộ 83 Tiêu chí (Sử dụng trực tiếp bảng data83) ---
const Criteria83Data83View = () => {
  const [dataList, setDataList] = useState<Data83[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPhan, setFilterPhan] = useState("");
  const [filterChuong, setFilterChuong] = useState("");
  const [filterNhom, setFilterNhom] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchData83();
      setDataList(items);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu từ bảng data83.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Logic
  const filteredData = useMemo(() => {
    const list = dataList.filter(item => {
      // 1. Search filter
      const matchesSearch = !searchTerm ||
        item.tieu_muc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ma_tieu_muc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tieu_chi?.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Phan filter
      const matchesPhan = !filterPhan || item.phan === filterPhan;

      // 3. Chuong filter
      const matchesChuong = !filterChuong || item.chuong === filterChuong;

      // 4. Nhom filter (Partial match requested: TMHC should match "TMHC, QLCL")
      const matchesNhom = !filterNhom || (item.nhom && item.nhom.toLowerCase().includes(filterNhom.toLowerCase()));

      return matchesSearch && matchesPhan && matchesChuong && matchesNhom;
    });

    // Natural sort by ma_tieu_muc
    return list.sort((a, b) => naturalSort(a.ma_tieu_muc || "", b.ma_tieu_muc || ""));
  }, [dataList, searchTerm, filterPhan, filterChuong, filterNhom]);

  // Unique values for filters
  const uniquePhan = useMemo(() => [...new Set(dataList.map(d => d.phan).filter(Boolean))], [dataList]);

  // Dependent unique values for Chương
  const uniqueChuong = useMemo(() => {
    const listForChuong = filterPhan
      ? dataList.filter(d => d.phan === filterPhan)
      : dataList;
    return [...new Set(listForChuong.map(d => d.chuong).filter(Boolean))];
  }, [dataList, filterPhan]);

  // Reset filterChuong if it's not in the new uniqueChuong list when filterPhan changes
  useEffect(() => {
    if (filterChuong && !uniqueChuong.includes(filterChuong)) {
      setFilterChuong("");
    }
  }, [filterPhan, uniqueChuong, filterChuong]);

  // Unique Nhoms (Handling combined values like "TMHC, QLCL")
  const uniqueNhom = useMemo(() => {
    const rawNhoms = dataList.map(d => d.nhom).filter(Boolean) as string[];
    const splitNhoms = rawNhoms.flatMap(n => n.split(',').map(s => s.trim()));
    return [...new Set(splitNhoms)].sort();
  }, [dataList]);

  const handleDeleteItem = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mục này không?")) {
      try {
        await deleteData83(id);
        setDataList(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        alert("Lỗi khi xóa dữ liệu.");
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterPhan("");
    setFilterChuong("");
    setFilterNhom("");
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
          <LayoutGrid size={18} className="text-primary-600" />
          <h3>Bộ lọc danh mục</h3>
          {(searchTerm || filterPhan || filterChuong || filterNhom) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition-colors"
            >
              <XCircle size={14} /> Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-1.5 font-bold">
            <label className="text-[11px] text-slate-500 uppercase flex items-center gap-1.5"><Search size={12} />Tìm kiếm nhanh</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nhập mã, tên tiểu mục..."
                className="w-full pl-3 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          {/* Filter Phần */}
          <div className="space-y-1.5 font-bold">
            <label className="text-[11px] text-slate-500 uppercase flex items-center gap-1.5"><ListFilter size={12} />Lọc theo Phần</label>
            <select
              value={filterPhan}
              onChange={(e) => setFilterPhan(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 bg-white"
            >
              <option value="">Tất cả các Phần</option>
              {uniquePhan.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Filter Chương */}
          <div className="space-y-1.5 font-bold">
            <label className="text-[11px] text-slate-500 uppercase flex items-center gap-1.5"><ListFilter size={12} />Lọc theo Chương</label>
            <select
              value={filterChuong}
              onChange={(e) => setFilterChuong(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 bg-white"
            >
              <option value="">Tất cả các Chương</option>
              {uniqueChuong.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Filter Nhóm */}
          <div className="space-y-1.5 font-bold">
            <label className="text-[11px] text-slate-500 uppercase flex items-center gap-1.5"><Filter size={12} />Lọc theo Nhóm</label>
            <select
              value={filterNhom}
              onChange={(e) => setFilterNhom(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 bg-white"
            >
              <option value="">Tất cả các Nhóm</option>
              {uniqueNhom.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-primary-600" size={20} />
            <h3 className="font-bold text-slate-800">Bộ 83 Tiêu chí (data83)</h3>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Hiển thị <span className="text-primary-700 font-bold">{filteredData.length}</span> / {dataList.length} kết quả
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-[#108545] text-white font-bold uppercase text-[10px] tracking-wider whitespace-nowrap hidden md:table-header-group">
              <tr>
                <th className="px-4 py-4">Phần</th>
                <th className="px-4 py-4">Chương</th>
                <th className="px-4 py-4 min-w-[200px]">Tiêu chí</th>
                <th className="px-4 py-4 text-center">Mức</th>
                <th className="px-4 py-4">Mã TM</th>
                <th className="px-4 py-4 min-w-[300px]">Nội dung tiểu mục</th>
                <th className="px-4 py-4 text-center">Nhóm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">Đang tải dữ liệu từ bảng data83...</td></tr>
              ) : error ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-red-500 font-medium">Lỗi: {error}</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">Không tìm thấy dữ liệu nào khớp với bộ lọc.</td></tr>
              ) : filteredData.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-slate-50 transition-colors group flex flex-col md:table-row border-b md:border-b-0 border-slate-100 last:border-0 p-4 md:p-0">
                  <td className="px-4 py-2 md:py-4 align-top text-[10px] text-slate-400 md:text-slate-500 font-medium leading-relaxed max-w-full md:max-w-[120px] order-1 hidden md:table-cell italic">{item.phan}</td>
                  <td className="px-4 py-2 md:py-4 align-top text-[10px] text-slate-400 md:text-slate-500 leading-relaxed max-w-full md:max-w-[150px] order-2 hidden md:table-cell italic">{item.chuong}</td>

                  {/* Mobile Row 1: Tieu Chi + Muc */}
                  <td className="px-4 py-2 md:py-4 align-top order-3 flex justify-between items-center md:table-cell">
                    <span className="text-[#108545] font-bold text-[11px] md:text-xs">{item.tieu_chi}</span>
                    <span className="md:hidden inline-block px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] font-bold border border-amber-200 uppercase">
                      {item.muc}
                    </span>
                  </td>

                  {/* Desktop Muc Column */}
                  <td className="hidden md:table-cell px-4 py-4 text-center align-top">
                    <span className="inline-block px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold border border-amber-200 uppercase">
                      {item.muc}
                    </span>
                  </td>

                  {/* Mobile Row 2: Ma TM + Content */}
                  <td className="px-4 py-1 md:py-4 align-top order-4 border-t border-slate-50 md:border-t-0 md:table-cell" colSpan={2}>
                    <div className="flex flex-col md:flex-none">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-[10px] md:text-[10px] font-mono text-primary-600 md:text-slate-600 font-bold whitespace-nowrap">
                          {item.ma_tieu_muc}
                        </span>
                        <span className="text-slate-700 font-medium leading-relaxed text-xs">
                          {item.tieu_muc}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Nhóm & Thao tác */}
                  <td className="px-4 py-2 md:py-4 text-left md:text-center align-top font-bold text-slate-500 md:text-slate-600 text-[10px] md:text-xs order-7">
                    <span className="md:hidden text-slate-400 font-normal mr-2">Nhóm:</span>{item.nhom}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>Tổng số: <span className="font-bold text-slate-700">{filteredData.length}</span> / {dataList.length} mục</span>
            {filteredData.length < dataList.length && (
              <span className="text-primary-600 font-bold underline cursor-pointer" onClick={clearFilters}>Bỏ lọc</span>
            )}
          </div>
          <button onClick={loadData} className="flex items-center gap-1.5 text-primary-600 hover:text-primary-800 font-bold">
            <RefreshCw size={14} /> Làm mới dữ liệu
          </button>
        </div>
      </div>
    </div>
  );
};

// --- View 2: Bộ Tiêu chuẩn Cơ bản ---
const BasicStandardsView = () => {
  const [standards, setStandards] = useState<BoTieuChuan[]>([]);
  const [evaluations, setEvaluations] = useState<KetQuaDanhGia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stdData, evalData] = await Promise.all([
        fetchBoTieuChuan(),
        fetchKetQuaDanhGia()
      ]);
      setStandards(stdData);
      setEvaluations(evalData);
    } catch (err) {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa bộ tiêu chuẩn này?')) {
      try {
        await deleteBoTieuChuan(id);
        loadData();
      } catch (err) {
        console.error('Lỗi xóa:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* List of Standards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Danh mục Bộ tiêu chuẩn chất lượng</h3>
            <p className="text-sm text-slate-500">Các bộ tiêu chuẩn xây dựng riêng cho từng lĩnh vực.</p>
          </div>
          <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium shadow-sm">
            <Plus size={16} /> Thêm bộ tiêu chuẩn mới
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#108545] text-white font-bold border-b border-[#0d6e39] uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Mã & Tên bộ tiêu chuẩn</th>
                <th className="px-6 py-4">Đơn vị phụ trách</th>
                <th className="px-6 py-4">Tần suất đánh giá</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
              )}
              {error && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-red-600">{error}</td></tr>
              )}
              {!loading && !error && standards.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">Chưa có bộ tiêu chuẩn nào</td></tr>
              )}
              {!loading && !error && standards.map(std => (
                <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{std.ten_tieu_chuan}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">{std.ma_tieu_chuan}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 text-slate-700">
                      <UserPlus size={14} className="text-slate-400" />
                      {std.don_vi_phu_trach || 'Chưa phân công'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                      {std.tan_suat || 'Chưa xác định'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${std.trang_thai === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {std.trang_thai === 'ACTIVE' ? 'Đang áp dụng' : 'Ngừng áp dụng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 text-primary-600 hover:bg-primary-50 rounded" title="Xem"><Eye size={16} /></button>
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Sửa"><Edit2 size={16} /></button>
                      <button
                        onClick={() => handleDelete(std.id!)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Xóa"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Evaluations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm uppercase">Kết quả chấm điểm gần đây</h3>
          <div className="flex gap-2">
            <button className="p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-300 transition-colors"><Search size={14} /></button>
            <button className="p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-300 transition-colors"><Filter size={14} /></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#108545] text-white font-bold text-xs uppercase border-b border-[#0d6e39]">
              <tr>
                <th className="px-6 py-3">Đơn vị được đánh giá</th>
                <th className="px-6 py-3">Bộ tiêu chuẩn áp dụng</th>
                <th className="px-6 py-3">Ngày đánh giá</th>
                <th className="px-6 py-3 text-center">Điểm số</th>
                <th className="px-6 py-3 text-right">Kết quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
              )}
              {!loading && evaluations.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">Chưa có kết quả đánh giá nào</td></tr>
              )}
              {!loading && evaluations.map(evalItem => (
                <tr key={evalItem.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-bold text-slate-800">{evalItem.don_vi_duoc_danh_gia}</td>
                  <td className="px-6 py-3 text-slate-600">{evalItem.ten_tieu_chuan}</td>
                  <td className="px-6 py-3 text-slate-500 text-xs">
                    {evalItem.ngay_danh_gia ? new Date(evalItem.ngay_danh_gia).toLocaleDateString('vi-VN') : ''}
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-primary-600">{evalItem.diem_so}/100</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${evalItem.ket_qua === 'Đạt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {evalItem.ket_qua}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 text-center flex justify-between items-center">
          <span className="text-xs text-slate-500">{evaluations.length} kết quả đánh giá</span>
          <button onClick={loadData} className="text-sm text-primary-600 hover:underline font-medium flex items-center gap-1">
            <RefreshCw size={12} /> Làm mới dữ liệu
          </button>
        </div>
      </div>
    </div>
  );
};

// --- View 3: Chấm điểm Tiêu chí CLBV ---
const QualityAssessmentView = () => {
  const [criteriaList, setCriteriaList] = useState<Data83[]>([]);
  const [units, setUnits] = useState<DonVi[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  // Mode: LIST or FORM
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [sheetList, setSheetList] = useState<AssessmentSheet[]>([]);
  const [editingPhieuId, setEditingPhieuId] = useState<string | null>(null);

  // Assessment Form Header
  const [ngayDanhGia, setNgayDanhGia] = useState(new Date().toISOString().split('T')[0]);
  const [nguoiDanhGia, setNguoiDanhGia] = useState(user?.full_name || "");
  const [donViDuocDanhGia, setDonViDuocDanhGia] = useState("");

  // Filters
  const [filterNhom, setFilterNhom] = useState("");

  // Exanded Groups
  const [expandedPhan, setExpandedPhan] = useState<string | null>(null);
  const [expandedChuong, setExpandedChuong] = useState<string | null>(null);
  const [expandedTieuChi, setExpandedTieuChi] = useState<string | null>(null);

  // Appearance
  const [fontSize, setFontSize] = useState(13);

  // Results State: Record<ma_tieu_muc, ScoreData>
  const [results, setResults] = useState<Record<string, {
    dat: boolean,
    khong_dat: boolean,
    khong_danh_gia: boolean,
    dat_muc: string,
    ghi_chu: string,
    hinh_anh_minh_chung: string[]
  }>>({});

  const loadSheetList = async () => {
    try {
      const sheets = await fetchAssessmentSheets();
      setSheetList(sheets);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [data83, du] = await Promise.all([fetchData83(), fetchDonVi()]);
        setCriteriaList(data83);
        setUnits(du);
        await loadSheetList();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const uniqueNhom = useMemo(() => {
    const rawNhoms = criteriaList.map(d => d.nhom).filter(Boolean) as string[];
    const splitNhoms = rawNhoms.flatMap(n => n.split(',').map(s => s.trim()));
    return [...new Set(splitNhoms)].sort();
  }, [criteriaList]);

  // Hierarchical Data Structure
  const groupedData = useMemo(() => {
    if (!filterNhom) return {};

    // 1. Filter by nhom
    const filtered = criteriaList.filter(item =>
      item.nhom && item.nhom.toLowerCase().includes(filterNhom.toLowerCase())
    );

    // 2. Build Hierarchy
    const hierarchy: any = {};
    filtered.forEach(item => {
      const p = item.phan || "Khác";
      const c = item.chuong || "Khác";
      const tc = item.tieu_chi || "Khác";

      if (!hierarchy[p]) hierarchy[p] = {};
      if (!hierarchy[p][c]) hierarchy[p][c] = {};
      if (!hierarchy[p][c][tc]) hierarchy[p][c][tc] = [];

      hierarchy[p][c][tc].push(item);
    });

    // 3. Sort ma_tieu_muc within each criterion
    Object.keys(hierarchy).forEach(p => {
      Object.keys(hierarchy[p]).forEach(c => {
        Object.keys(hierarchy[p][c]).forEach(tc => {
          hierarchy[p][c][tc].sort((a: Data83, b: Data83) => naturalSort(a.ma_tieu_muc || "", b.ma_tieu_muc || ""));
        });
      });
    });

    return hierarchy;
  }, [criteriaList, filterNhom]);

  const stats = useMemo(() => {
    let chaptersCount = 0;
    let criteriaCount = 0;
    let subItemsCount = 0;

    Object.keys(groupedData).forEach(p => {
      chaptersCount += Object.keys(groupedData[p]).length;
      Object.keys(groupedData[p]).forEach(c => {
        criteriaCount += Object.keys(groupedData[p][c]).length;
        Object.keys(groupedData[p][c]).forEach(tc => {
          subItemsCount += groupedData[p][c][tc].length;
        });
      });
    });

    return { chaptersCount, criteriaCount, subItemsCount };
  }, [groupedData]);

  const handleScoreChange = (maTieuMuc: string, field: string, value: any) => {
    setResults(prev => {
      const current = prev[maTieuMuc] || {
        dat: false,
        khong_dat: false,
        khong_danh_gia: false,
        dat_muc: "",
        ghi_chu: "",
        hinh_anh_minh_chung: []
      };
      const updated = { ...current, [field]: value };

      // Mutual exclusion for Dat/KhongDat/KhongDanhGia
      if (field === 'dat' && value === true) {
        updated.khong_dat = false;
        updated.khong_danh_gia = false;
      }
      if (field === 'khong_dat' && value === true) {
        updated.dat = false;
        updated.khong_danh_gia = false;
      }
      if (field === 'khong_danh_gia' && value === true) {
        updated.dat = false;
        updated.khong_dat = false;
      }

      return { ...prev, [maTieuMuc]: updated };
    });
  };

  const handleImageUpload = async (maTieuMuc: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      const publicUrl = await uploadEvidenceImage(file);
      setResults(prev => {
        const current = prev[maTieuMuc] || {
          dat: false,
          khong_dat: false,
          khong_danh_gia: false,
          dat_muc: "",
          ghi_chu: "",
          hinh_anh_minh_chung: []
        };
        return {
          ...prev,
          [maTieuMuc]: {
            ...current,
            hinh_anh_minh_chung: [...current.hinh_anh_minh_chung, publicUrl]
          }
        };
      });
    } catch (err) {
      console.error("Upload error:", err);
      alert("Lỗi khi tải ảnh lên.");
    }
  };

  const removeImage = (maTieuMuc: string, urlToRemove: string) => {
    setResults(prev => {
      const current = prev[maTieuMuc];
      if (!current) return prev;
      return {
        ...prev,
        [maTieuMuc]: {
          ...current,
          hinh_anh_minh_chung: current.hinh_anh_minh_chung.filter(url => url !== urlToRemove)
        }
      };
    });
  };

  const calculateLevel = (items: Data83[]) => {
    let currentMaxLevel = 0;

    // Group items by level (extracted from item.muc e.g. "Mức 1")
    const itemsByLevel: Record<number, Data83[]> = {};
    items.forEach(item => {
      const levelMatch = item.muc?.match(/\d+/);
      const levelNum = levelMatch ? parseInt(levelMatch[0]) : 0;
      if (!itemsByLevel[levelNum]) itemsByLevel[levelNum] = [];
      itemsByLevel[levelNum].push(item);
    });

    const sortedLevels = Object.keys(itemsByLevel).map(Number).sort((a, b) => a - b);

    for (const level of sortedLevels) {
      const levelItems = itemsByLevel[level];
      const allPassedOrNotEval = levelItems.every(item => {
        const res = results[item.ma_tieu_muc!] || { dat: false, khong_dat: false, khong_danh_gia: false };
        return res.dat === true || res.khong_danh_gia === true;
      });

      const anyFailed = levelItems.some(item => {
        const res = results[item.ma_tieu_muc!] || { dat: false, khong_dat: false, khong_danh_gia: false };
        return res.khong_dat === true;
      });

      if (allPassedOrNotEval) {
        currentMaxLevel = level;
      } else if (anyFailed) {
        // Stop here and keep the previous max level
        break;
      } else {
        // Not all passed but none failed (maybe some are empty) - keep current or stop?
        // Usually, need all to be chosen to proceed.
        break;
      }
    }
    return currentMaxLevel > 0 ? `Mức ${currentMaxLevel}` : "Bản điểm";
  };

  const isItemVisible = (items: Data83[], currentIndex: number) => {
    // A criterion item is visible only if ALL previous items in the SAME criterion are NOT "Khong Dat"
    for (let i = 0; i < currentIndex; i++) {
      const prevResult = results[items[i].ma_tieu_muc!] || { khong_dat: false };
      if (prevResult.khong_dat) return false;
    }
    return true;
  };

  const handleEditSheet = async (sheet: AssessmentSheet) => {
    setLoading(true);
    try {
      const results = await fetchKqByPhieuId(sheet.phieu_id);
      // Map results back to the form state
      const initialResults: any = {};
      results.forEach(r => {
        initialResults[r.ma_tieu_muc] = {
          dat: r.dat,
          khong_dat: r.khong_dat,
          khong_danh_gia: r.khong_danh_gia,
          dat_muc: r.dat_muc,
          ghi_chu: r.ghi_chu || "",
          hinh_anh_minh_chung: r.hinh_anh_minh_chung || []
        };
      });
      setResults(initialResults);
      setEditingPhieuId(sheet.phieu_id);
      setNgayDanhGia(sheet.ngay_danh_gia);
      setNguoiDanhGia(sheet.nguoi_danh_gia);
      setDonViDuocDanhGia(sheet.don_vi_duoc_danh_gia);
      setFilterNhom(sheet.nhom || "");
      setViewMode('FORM');
    } catch (err) {
      console.error(err);
      alert("Không thể tải thông tin phiếu.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSheet = async (phieuId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ phiếu đánh giá này không?")) {
      try {
        await deletePhieuDanhGia(phieuId);
        await loadSheetList();
        alert("Đã xóa thành công.");
      } catch (err) {
        alert("Lỗi khi xóa phiếu.");
      }
    }
  };

  const handleAddNew = () => {
    setEditingPhieuId(null);
    setResults({});
    setDonViDuocDanhGia("");
    setNguoiDanhGia(user?.full_name || "");
    setFilterNhom("");
    setViewMode('FORM');
  };

  const handleSaveAssessment = async () => {
    if (!nguoiDanhGia || !donViDuocDanhGia) {
      alert("Vui lòng nhập đầy đủ thông tin: Người đánh giá và Đơn vị được đánh giá.");
      return;
    }

    setSaving(true);
    try {
      const allPayload: KqDanhGia83[] = [];
      const phieuId = editingPhieuId || crypto.randomUUID();

      // Iterate through the grouped data structure to gather payload
      Object.keys(groupedData).forEach(p => {
        Object.keys(groupedData[p]).forEach(c => {
          Object.keys(groupedData[p][c]).forEach(tc => {
            const items = groupedData[p][c][tc];
            const autoLevel = calculateLevel(items);

            items.forEach((item: Data83) => {
              const res = results[item.ma_tieu_muc!] || { dat: false, khong_dat: false, khong_danh_gia: false, dat_muc: "", ghi_chu: "", hinh_anh_minh_chung: [] };
              allPayload.push({
                phieu_id: phieuId,
                nguoi_tao_id: user?.id,
                ngay_danh_gia: ngayDanhGia,
                nguoi_danh_gia: nguoiDanhGia,
                don_vi_duoc_danh_gia: donViDuocDanhGia,
                phan: item.phan,
                chuong: item.chuong,
                ma_tieu_muc: item.ma_tieu_muc!,
                tieu_muc: item.tieu_muc,
                nhom: item.nhom,
                dat: res.dat,
                khong_dat: res.khong_dat,
                khong_danh_gia: res.khong_danh_gia,
                dat_muc: autoLevel, // Save calculated level
                ghi_chu: res.ghi_chu,
                hinh_anh_minh_chung: res.hinh_anh_minh_chung
              });
            });
          });
        });
      });

      if (allPayload.length === 0) {
        alert("Không có dữ liệu để lưu.");
        setSaving(false);
        return;
      }

      // Nếu đang sửa, ta xóa cũ đi trước khi thêm mới (với cùng batchId)
      if (editingPhieuId) {
        await deletePhieuDanhGia(editingPhieuId);
      }

      await saveKqDanhGia83Bulk(allPayload);
      alert("Đã lưu kết quả đánh giá thành công!");
      await loadSheetList();
      setViewMode('LIST');
    } catch (err) {
      alert("Lỗi khi lưu kết quả đánh giá.");
    } finally {
      setSaving(false);
    }
  };

  if (viewMode === 'LIST') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Danh sách Phiếu đánh giá 83 tiêu chí</h3>
            <p className="text-sm text-slate-500">Quản lý các đợt đánh giá đã thực hiện.</p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl hover:bg-primary-700 font-bold transition-all shadow-lg active:scale-95"
          >
            <Plus size={20} /> Tạo phiếu mới
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Ngày đánh giá</th>
                <th className="px-6 py-4">Đơn vị</th>
                <th className="px-6 py-4 text-center">Tiến độ</th>
                <th className="px-6 py-4 text-center">Người đánh giá</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sheetList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">Chưa có phiếu đánh giá nào.</td>
                </tr>
              ) : (
                sheetList.map((sheet) => {
                  const isAdmin = user?.role === 'Quản trị viên';
                  const isOwner = user?.id === sheet.nguoi_tao_id || user?.full_name === sheet.nguoi_danh_gia;
                  const canEdit = isAdmin || isOwner;

                  return (
                    <tr key={sheet.phieu_id} className="hover:bg-primary-50/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-slate-700">{new Date(sheet.ngay_danh_gia).toLocaleDateString('vi-VN')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{sheet.don_vi_duoc_danh_gia}</span>
                          <span className="text-[10px] text-primary-600 font-bold uppercase">Nhóm: {sheet.nhom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-black text-primary-700">{Math.round((sheet.passed_criteria / sheet.total_criteria) * 100)}%</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">({sheet.passed_criteria}/{sheet.total_criteria} đạt)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-bold text-slate-600">{sheet.nguoi_danh_gia}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEditSheet(sheet)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all" title="Xem/Sửa">
                            <Edit2 size={18} />
                          </button>
                          {canEdit && (
                            <button onClick={() => handleDeleteSheet(sheet.phieu_id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Xóa">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {sheetList.map((sheet) => {
            const isAdmin = user?.role === 'Quản trị viên';
            const isOwner = user?.id === sheet.nguoi_tao_id || user?.full_name === sheet.nguoi_danh_gia;
            const canEdit = isAdmin || isOwner;

            return (
              <div key={sheet.phieu_id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                  <div>
                    <p className="text-xs font-black text-primary-600 uppercase tracking-widest">{new Date(sheet.ngay_danh_gia).toLocaleDateString('vi-VN')}</p>
                    <p className="text-base font-black text-slate-800">{sheet.don_vi_duoc_danh_gia}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Người đánh giá: {sheet.nguoi_danh_gia}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary-700">{Math.round((sheet.passed_criteria / sheet.total_criteria) * 100)}%</p>
                    <p className="text-[9px] text-slate-400 font-bold">Tỉ lệ đạt</p>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Nhóm {sheet.nhom}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditSheet(sheet)} className="p-2 bg-white text-primary-600 border border-slate-100 rounded-lg shadow-sm">
                      <Edit2 size={16} />
                    </button>
                    {canEdit && (
                      <button onClick={() => handleDeleteSheet(sheet.phieu_id)} className="p-2 bg-white text-red-500 border border-slate-100 rounded-lg shadow-sm">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <button onClick={() => setViewMode('LIST')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors py-2 px-3 hover:bg-slate-100 rounded-lg">
          <XCircle size={18} /> Quay lại danh sách
        </button>
        <div className="h-4 w-px bg-slate-200"></div>
        <p className="text-sm font-bold text-slate-800">
          {editingPhieuId ? 'Sửa phiếu đánh giá' : 'Tạo phiếu đánh giá mới'}
        </p>
      </div>

      {/* Assessment Info Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Thông tin Phiếu đánh giá</h3>
            <p className="text-xs text-slate-500">Nhập thông tin chung trước khi tiến hành chấm điểm</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5 font-bold">
            <label className="text-[11px] text-slate-500 uppercase">Ngày đánh giá</label>
            <input
              type="date"
              value={ngayDanhGia}
              onChange={(e) => setNgayDanhGia(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 font-bold"
            />
          </div>
          <div className="space-y-1.5 font-bold">
            <label className="text-[11px] text-slate-500 uppercase">Người đánh giá</label>
            <input
              type="text"
              placeholder="Nhập tên người đánh giá..."
              value={nguoiDanhGia}
              onChange={(e) => setNguoiDanhGia(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 font-bold"
            />
          </div>
          <div className="space-y-1.5 font-bold">
            <label className="text-[11px] text-slate-500 uppercase">Đơn vị được đánh giá</label>
            <select
              value={donViDuocDanhGia}
              onChange={(e) => setDonViDuocDanhGia(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 font-bold"
            >
              <option value="">-- Chọn đơn vị --</option>
              {units.map(u => (
                <option key={u.id} value={u.ten_don_vi}>{u.ten_don_vi}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Criteria Filter & Hierarchical List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto font-bold">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <span className="text-sm text-slate-600">Lọc theo Nhóm phụ trách:</span>
            </div>
            <select
              value={filterNhom}
              onChange={(e) => {
                setFilterNhom(e.target.value);
                setExpandedPhan(null);
                setExpandedChuong(null);
                setExpandedTieuChi(null);
              }}
              className="flex-1 md:w-64 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 bg-white font-bold"
            >
              <option value="">-- Chọn nhóm để bắt đầu --</option>
              {uniqueNhom.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {filterNhom && (
          <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Thống kê lọc:</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <LayoutGrid size={14} className="text-primary-500" />
                <span>Số chương: <span className="text-primary-600">{stats.chaptersCount}</span></span>
              </div>
              <div className="h-3 w-px bg-slate-200"></div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <ListFilter size={14} className="text-blue-500" />
                <span>Số tiêu chí: <span className="text-blue-600">{stats.criteriaCount}</span></span>
              </div>
              <div className="h-3 w-px bg-slate-200"></div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <FileText size={14} className="text-orange-500" />
                <span>Số tiểu mục: <span className="text-orange-600">{stats.subItemsCount}</span></span>
              </div>
            </div>
          </div>
        )}

        {/* Font Size & Tool Bar */}
        <div className="px-4 py-2 border-b border-slate-100 bg-white flex justify-end items-center gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 border-r border-slate-200 flex items-center gap-1">
              <Type size={12} /> Cỡ chữ
            </span>
            <button
              onClick={() => setFontSize(Math.max(10, fontSize - 1))}
              className="p-1 px-2 hover:bg-white rounded transition-colors text-slate-600 hover:text-primary-600"
              title="Giảm cỡ chữ"
            >
              <Minus size={14} />
            </button>
            <span className="text-xs font-bold text-primary-700 min-w-[24px] text-center">{fontSize}</span>
            <button
              onClick={() => setFontSize(Math.min(20, fontSize + 1))}
              className="p-1 px-2 hover:bg-white rounded transition-colors text-slate-600 hover:text-primary-600"
              title="Tăng cỡ chữ"
            >
              <PlusIcon size={14} />
            </button>
          </div>
        </div>

        {/* Hierarchical UI */}
        <div className="p-4 space-y-4">
          {!filterNhom ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
              <LayoutGrid size={48} className="opacity-20" />
              <p className="italic font-medium">Vui lòng chọn Nhóm đơn vị phụ trách để bắt đầu chấm điểm</p>
            </div>
          ) : Object.keys(groupedData).length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic font-medium">Không tìm thấy tiêu chí nào cho nhóm này</div>
          ) : (
            Object.keys(groupedData).map(phanName => (
              <div key={phanName} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setExpandedPhan(expandedPhan === phanName ? null : phanName)}
                  className={`w-full flex items-center justify-between px-5 py-3.5 text-left font-bold transition-colors ${expandedPhan === phanName ? 'bg-primary-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <span className="uppercase text-xs tracking-wide">{phanName}</span>
                  {expandedPhan === phanName ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expandedPhan === phanName && (
                  <div className="p-3 bg-slate-50 space-y-3">
                    {Object.keys(groupedData[phanName]).map(chuongName => (
                      <div key={chuongName} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => setExpandedChuong(expandedChuong === chuongName ? null : chuongName)}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left font-bold transition-colors text-sm ${expandedChuong === chuongName ? 'bg-slate-100 text-primary-700' : 'text-slate-600 hover:bg-slate-50/80'
                            }`}
                        >
                          <span>{chuongName}</span>
                          {expandedChuong === chuongName ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {expandedChuong === chuongName && (
                          <div className="divide-y divide-slate-100">
                            {Object.keys(groupedData[phanName][chuongName]).map(tcName => {
                              const items = groupedData[phanName][chuongName][tcName];
                              const level = calculateLevel(items);
                              const isExpandedTC = expandedTieuChi === tcName;

                              return (
                                <div key={tcName} className="bg-white">
                                  <div
                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 gap-3"
                                  >
                                    <div
                                      className="flex-1 cursor-pointer group"
                                      onClick={() => setExpandedTieuChi(isExpandedTC ? null : tcName)}
                                    >
                                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 group-hover:text-primary-600 transition-colors">
                                        {isExpandedTC ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        {tcName}
                                      </h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] uppercase font-bold text-slate-400">Đạt mức:</span>
                                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${level.includes("Mức") ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                                        }`}>
                                        {level}
                                      </span>
                                    </div>
                                  </div>

                                  {isExpandedTC && (
                                    <div className="overflow-x-auto bg-slate-50/30">
                                      <table className="w-full text-xs text-left border-t border-slate-100">
                                        <thead className="bg-[#108545]/10 text-[#108545] font-bold uppercase text-[9px]">
                                          <tr>
                                            <th className="px-4 py-2.5 w-[110px] text-center">Mã TM & Mức</th>
                                            <th className="px-4 py-2.5">Nội dung & Đánh giá mức độ đạt được</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {items.map((item: Data83, idx: number) => {
                                            const isVisible = isItemVisible(items, idx);
                                            if (!isVisible) return null;

                                            const res = results[item.ma_tieu_muc!] || {
                                              dat: false,
                                              khong_dat: false,
                                              khong_danh_gia: false,
                                              ghi_chu: "",
                                              hinh_anh_minh_chung: []
                                            };

                                            const levelNum = item.muc?.match(/\d+/)?.[0] || "";

                                            return (
                                              <tr key={item.id} className="hover:bg-white transition-colors animate-in slide-in-from-left-1 duration-300">
                                                <td className="px-4 py-4 align-top text-center border-r border-slate-50">
                                                  <div className="flex flex-col items-center gap-2">
                                                    <span className="font-mono text-slate-500 font-bold" style={{ fontSize: Math.max(9, fontSize - 3) + 'px' }}>
                                                      {item.ma_tieu_muc}
                                                    </span>
                                                    <span className="inline-block px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded text-[9px] font-bold border border-primary-200">
                                                      Mức {levelNum}
                                                    </span>
                                                  </div>
                                                </td>
                                                <td className="px-4 py-4 align-top">
                                                  <div className="flex flex-col gap-4">
                                                    {/* Row 1: Content */}
                                                    <div className="text-slate-800 font-bold leading-relaxed" style={{ fontSize: fontSize + 'px' }}>
                                                      {item.tieu_muc}
                                                    </div>

                                                    {/* Row 2: Action Bar */}
                                                    <div className="flex flex-wrap items-center gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                                      {/* Status Buttons */}
                                                      <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                                        <button
                                                          onClick={() => handleScoreChange(item.ma_tieu_muc!, 'dat', !res.dat)}
                                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${res.dat ? 'bg-green-600 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                          <CheckCircle2 size={14} /> Đạt
                                                        </button>
                                                        <button
                                                          onClick={() => handleScoreChange(item.ma_tieu_muc!, 'khong_dat', !res.khong_dat)}
                                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${res.khong_dat ? 'bg-red-600 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                          <XCircle size={14} /> K.Đạt
                                                        </button>
                                                        <button
                                                          onClick={() => handleScoreChange(item.ma_tieu_muc!, 'khong_danh_gia', !res.khong_danh_gia)}
                                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${res.khong_danh_gia ? 'bg-slate-600 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                          <AlertCircle size={14} /> K.ĐG
                                                        </button>
                                                      </div>

                                                      {/* Ghi chú */}
                                                      <div className="flex-1 min-w-[200px]">
                                                        <textarea
                                                          rows={1}
                                                          placeholder="Nhập ghi chú quan sát..."
                                                          value={res.ghi_chu}
                                                          onChange={(e) => handleScoreChange(item.ma_tieu_muc!, 'ghi_chu', e.target.value)}
                                                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] focus:ring-1 focus:ring-primary-500/20 resize-none min-h-[36px]"
                                                          style={{ fontSize: Math.max(10, fontSize - 2) + 'px' }}
                                                        />
                                                      </div>

                                                      {/* Minh chứng - Thêm ảnh */}
                                                      <div className="flex items-center gap-2">
                                                        <div className="flex flex-wrap gap-1.5">
                                                          {res.hinh_anh_minh_chung?.map((url, i) => (
                                                            <div key={i} className="relative group w-10 h-10 border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                                              <img src={url} alt="Minh chứng" className="w-full h-full object-cover" />
                                                              <button
                                                                onClick={() => removeImage(item.ma_tieu_muc!, url)}
                                                                className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                              >
                                                                <XCircle size={10} />
                                                              </button>
                                                            </div>
                                                          ))}
                                                        </div>
                                                        <label className="w-10 h-10 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-primary-600 hover:border-primary-400 cursor-pointer transition-all bg-white hover:bg-white shadow-sm active:scale-95">
                                                          <Camera size={16} />
                                                          <input
                                                            type="file"
                                                            accept="image/*"
                                                            capture="environment"
                                                            multiple
                                                            className="hidden"
                                                            onChange={(e) => handleImageUpload(item.ma_tieu_muc!, e)}
                                                          />
                                                        </label>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                          {items.some((_item: any, idx: number) => !isItemVisible(items, idx)) && (
                                            <tr className="bg-red-50/50">
                                              <td colSpan={2} className="px-4 py-8 text-center text-red-500 font-bold italic">
                                                <div className="flex flex-col items-center justify-center gap-2 opacity-70">
                                                  <AlertTriangle size={24} className="animate-pulse" />
                                                  <span>Các tiểu mục tiếp theo bị ẩn do có một mục đánh giá "KHÔNG ĐẠT" ở phía trên.</span>
                                                </div>
                                              </td>
                                            </tr>
                                          )}
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
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div className="text-xs text-slate-500 font-medium">
            Phân hệ: <span className="text-primary-600 font-bold uppercase">Bảng 83 tiêu chí CLBV</span>
          </div>
          <button
            onClick={handleSaveAssessment}
            disabled={saving || !filterNhom}
            className={`flex items-center gap-2 px-10 py-3 rounded-xl text-sm font-bold transition-all shadow-md ${!filterNhom || saving ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#108545] text-white hover:bg-[#0d6e39] active:scale-95'
              }`}
          >
            {saving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            Hoàn tất & Lưu phiếu đánh giá
          </button>
        </div>
      </div>
    </div>
  );
};