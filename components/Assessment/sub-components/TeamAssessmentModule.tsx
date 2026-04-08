import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, ListChecks, Users, Library, CheckCircle2, 
  TrendingUp, ArrowUpRight, ArrowDownRight, LayoutDashboard, ChevronRight,
  Settings, Search, Loader2, AlertCircle, ChevronDown, CheckSquare, Square, Plus
} from 'lucide-react';
import { assessmentService } from '../services';
import { AssessmentList } from './AssessmentList';
import { Data83tc, AssessmentSheet } from '../types';

type SubTab = 'OVERVIEW' | 'ASSESSMENT_LIST' | 'CONFIG';

interface Props {
  userTeams: string[];
  isAdmin: boolean;
  user: any;
  uDept: string;
  sheetList: AssessmentSheet[];
  loading: boolean;
  onAddNew: () => void;
  onEdit: (sheet: AssessmentSheet) => void;
  onView: (sheet: AssessmentSheet) => void;
  onDelete: (id: string) => void;
}

const naturalSort = (a: string, b: string) => (a || '').localeCompare(b || '', undefined, { numeric: true });

export const TeamAssessmentModule: React.FC<Props> = ({ 
    userTeams, isAdmin, user, uDept, sheetList, loading,
    onAddNew, onEdit, onView, onDelete 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('OVERVIEW');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(userTeams[0] || null);

  // Sync selected team when userTeams load or change
  useEffect(() => {
    if (userTeams.length > 0 && !selectedTeam) {
      setSelectedTeam(userTeams[0]);
    }
  }, [userTeams, selectedTeam]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Sub Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 backdrop-blur-sm rounded-2xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveSubTab('OVERVIEW')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'OVERVIEW' 
              ? 'bg-white text-[#009900] shadow-sm' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard size={14} /> Tổng quan
        </button>
        <button
          onClick={() => setActiveSubTab('ASSESSMENT_LIST')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'ASSESSMENT_LIST' 
              ? 'bg-white text-[#009900] shadow-sm' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ListChecks size={14} /> Danh sách đánh giá
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveSubTab('CONFIG')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'CONFIG' 
                ? 'bg-white text-[#009900] shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Settings size={14} /> Cấu hình chấm điểm
          </button>
        )}
      </div>

      {activeSubTab === 'OVERVIEW' && <OverviewView selectedTeam={selectedTeam} />}
      {activeSubTab === 'ASSESSMENT_LIST' && (
          <AssessmentList 
            sheetList={sheetList}
            loading={loading}
            uDept={selectedTeam || uDept}
            isAdmin={isAdmin}
            currUserId={user?.id}
            onAddNew={onAddNew}
            onEdit={onEdit}
            onView={onView}
            onDelete={onDelete}
          />
      )}
      {activeSubTab === 'CONFIG' && (
        <ConfigurationView 
          selectedTeam={selectedTeam} 
          userTeams={userTeams} 
          onTeamChange={setSelectedTeam} 
        />
      )}
    </div>
  );
};

const OverviewView = ({ selectedTeam }: { selectedTeam: string | null }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Stat Cards */}
      <StatCard 
        label="Tổng số tổ" 
        value="0" 
        icon={<Users className="text-blue-500" />} 
        trend="+0%" 
        color="blue"
      />
      <StatCard 
        label="Phiếu đánh giá" 
        value="0" 
        icon={<CheckCircle2 className="text-emerald-500" />} 
        trend="+0%" 
        color="emerald"
      />
      <StatCard 
        label="Tiêu chí đạt" 
        value="0%" 
        icon={<BarChart3 className="text-amber-500" />} 
        trend="stable" 
        color="amber"
      />
      <StatCard 
        label="Tiến độ" 
        value="0%" 
        icon={<Library className="text-indigo-500" />} 
        trend="N/A" 
        color="indigo"
      />

      {/* Main Stats Area */}
      <div className="md:col-span-2 lg:col-span-3 bg-white p-6 rounded-[2.25rem] border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[380px] flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
          <BarChart3 size={40} className="text-slate-200" />
        </div>
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Biểu đồ tổng quan theo tổ</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-sm">Dữ liệu chấm điểm của các tổ sẽ được tổng hợp và hiển thị trực quan tại đây</p>
        
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl text-left">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
             <div className="w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                <Users size={16} className="text-[#009900]" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Tổ trưởng</p>
                <p className="text-sm font-black text-slate-800">Chưa thiết lập</p>
             </div>
          </div>
          <div className="p-4 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center">
             <button className="text-[9px] font-black text-[#009900] uppercase hover:underline">Chi tiết báo cáo <ArrowUpRight size={12} className="inline ml-1"/></button>
          </div>
        </div>
      </div>

      {/* Side Profile/Info */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-gradient-to-br from-[#009900] to-[#0d6e39] p-6 rounded-[2.25rem] text-white shadow-2xl shadow-emerald-200/50">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Thông tin tổ</p>
          <h4 className="text-lg font-black mt-1 leading-tight">Vui lòng chọn tổ đánh giá</h4>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 bg-white/10 p-3.5 rounded-xl backdrop-blur-sm">
               <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs">?</div>
               <div>
                  <p className="text-[9px] font-black uppercase opacity-60">Số thành viên</p>
                  <p className="text-xs font-black">0 người</p>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.25rem] border border-slate-100 shadow-xl">
           <h5 className="text-[9px] font-black text-slate-800 uppercase tracking-widest mb-4">Hoạt động gần đây</h5>
           <div className="flex flex-col gap-6">
              <p className="text-xs text-slate-300 italic">Chưa có hoạt động nào được ghi nhận</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const AssessmentListView = ({ selectedTeam }: { selectedTeam: string | null }) => {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl min-h-[500px] flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center mb-6">
        <ListChecks size={32} className="text-[#009900]" />
      </div>
      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Danh sách các đợt chấm điểm</h3>
      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Tính năng đang trong quá trình nâng cấp và kết nối dữ liệu</p>
      
      <button className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-lg shadow-slate-200">
         Tải lại dữ liệu
      </button>
    </div>
  );
};

const ConfigurationView = ({ selectedTeam, userTeams, onTeamChange }: any) => {
  const [criteria, setCriteria] = useState<Data83tc[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPhan, setExpandedPhan] = useState<string[]>([]);
  const [expandedChuong, setExpandedChuong] = useState<string[]>([]);

  const loadData = async () => {
    if (!selectedTeam) return;
    setLoading(true);
    try {
      const all = await assessmentService.fetchCriteria();
      const filtered = all.filter(c => {
        const teams = (c.to_cham_diem || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        return teams.includes(selectedTeam.toLowerCase());
      });
      setCriteria(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTeam]);

  const groupedData = useMemo(() => {
    const filtered = criteria.filter(item => 
      !searchTerm || 
      item.tieu_muc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ma_tieu_muc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tieu_chi?.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
    return hierarchy;
  }, [criteria, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header & Filter */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-green-50 p-2.5 rounded-xl text-[#009900]">
            <Settings size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Danh mục tiêu chí theo tổ</h3>
              <span className="bg-[#009900] text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                {criteria.length} Mục
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Các mục được phân công cho {selectedTeam || 'Tổ của bạn'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-[#009900] hover:bg-green-50 transition-all disabled:opacity-50"
            title="Tải lại dữ liệu"
          >
            <Loader2 size={16} className={loading ? "animate-spin" : ""} />
          </button>
          {userTeams.length > 1 && (
            <select 
              value={selectedTeam || ''} 
              onChange={(e) => onTeamChange(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-green-500/20 transition-all cursor-pointer"
            >
              {userTeams.map((t: string) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              type="text" 
              placeholder="Tìm nội dung..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-green-500 w-48 md:w-64 transition-all"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-20 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center text-slate-300">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-xs font-black uppercase tracking-widest italic">Đang tải cấu hình...</p>
        </div>
      ) : Object.keys(groupedData).length === 0 ? (
        <div className="bg-white p-20 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center text-slate-300">
          <AlertCircle className="mb-4 opacity-20" size={48} />
          <p className="text-xs font-black uppercase tracking-widest italic">Không tìm thấy tiêu chí nào được phân công</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            {Object.keys(groupedData).sort(naturalSort).map(phan => (
              <div key={phan}>
                <div 
                  onClick={() => setExpandedPhan(prev => prev.includes(phan) ? prev.filter(p => p !== phan) : [...prev, phan])}
                  className="bg-slate-50/50 hover:bg-slate-100/50 px-6 py-4 flex items-center gap-3 cursor-pointer transition-colors border-b border-slate-100"
                >
                  {expandedPhan.includes(phan) ? <ChevronDown size={18} className="text-[#009900]" /> : <ChevronRight size={18} className="text-slate-400" />}
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{phan}</span>
                </div>
                {expandedPhan.includes(phan) && (
                  <div className="bg-white divide-y divide-slate-50">
                    {Object.keys(groupedData[phan]).sort(naturalSort).map(chuong => (
                      <div key={chuong} className="ml-4 border-l-2 border-slate-50">
                        <div 
                          onClick={() => setExpandedChuong(prev => prev.includes(chuong) ? prev.filter(c => c !== chuong) : [...prev, chuong])}
                          className="px-6 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          {expandedChuong.includes(chuong) ? <ChevronDown size={14} className="text-[#009900]" /> : <ChevronRight size={14} className="text-slate-400" />}
                          <span className="text-[10px] font-bold text-slate-600 uppercase italic tracking-tight">{chuong}</span>
                        </div>
                        {expandedChuong.includes(chuong) && (
                          <div className="divide-y divide-slate-50">
                            {Object.keys(groupedData[phan][chuong]).sort(naturalSort).map(tieuChi => (
                              <div key={tieuChi} className="ml-6 py-4 pr-6 border-t border-slate-50 first:border-0">
                                <p className="text-[10px] font-black text-[#009900] uppercase tracking-wider mb-3 leading-relaxed">{tieuChi}</p>
                                <div className="space-y-1 ml-4 overflow-hidden rounded-xl border border-slate-50">
                                   <table className="w-full text-left">
                                      <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[9px] h-10 border-b border-slate-50">
                                        <tr>
                                          <th className="px-4 w-16">Mã</th>
                                          <th className="px-2 w-[40%]">Nội dung tiểu mục</th>
                                          <th className="px-2">Phụ trách</th>
                                          <th className="px-2">Phối hợp</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                        {groupedData[phan][chuong][tieuChi].map((item: Data83tc) => (
                                          <tr key={item.id} className="hover:bg-slate-50/30 group/row">
                                            <td className="px-4 py-3 font-black text-slate-400 align-top">{item.ma_tieu_muc}</td>
                                            <td className="px-2 py-3 font-bold text-slate-700 leading-relaxed align-top">
                                               {item.tieu_muc}
                                            </td>
                                            <td className="px-2 py-3 align-top">
                                               {item.phu_trach ? (
                                                  <div className="flex flex-wrap gap-1">
                                                     {item.phu_trach.split(',').map(s => s.trim()).filter(Boolean).map(tag => (
                                                        <span key={tag} className="bg-emerald-50 text-[#008800] text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter">
                                                           {tag}
                                                        </span>
                                                     ))}
                                                  </div>
                                               ) : <span className="text-slate-300 italic text-[10px]">Chưa rõ</span>}
                                            </td>
                                            <td className="px-2 py-3 align-top">
                                               {item.don_vi_phoi_hop ? (
                                                  <div className="flex flex-wrap gap-1">
                                                     {item.don_vi_phoi_hop.split(',').map(s => s.trim()).filter(Boolean).map(tag => (
                                                        <span key={tag} className="bg-blue-50 text-blue-600 text-[9px] font-black px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-tighter">
                                                           {tag}
                                                        </span>
                                                     ))}
                                                  </div>
                                               ) : <span className="text-slate-300 italic text-[10px]">-</span>}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                   </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, trend, color }: any) => {
  const colorBgs: any = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${colorBgs[color]}`}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{label}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-xl font-black text-slate-800 tracking-tight leading-none">{value}</h4>
          {trend !== 'N/A' && (
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${
              trend === 'stable' ? 'bg-slate-50 text-slate-400' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
