import React, { useMemo } from 'react';
import {
  Users,
  FileText,
  AlertTriangle,
  TrendingUp,
  Activity,
  CheckCircle,
  ClipboardList
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

// Static chart data - định nghĩa ngoài component để không recreate mỗi render
const dataIncidents = [
  { name: 'T1', count: 12 },
  { name: 'T2', count: 19 },
  { name: 'T3', count: 15 },
  { name: 'T4', count: 8 },
  { name: 'T5', count: 22 },
  { name: 'T6', count: 14 },
];

const dataCompliance = [
  { name: 'Vệ sinh tay', score: 85 },
  { name: 'Hồ sơ bệnh án', score: 92 },
  { name: '5S', score: 78 },
  { name: 'An toàn PT', score: 98 },
];

import { NotificationDashboard } from './NotificationDashboard';
import { fetchNhanSuQlcl } from '../readNhanSuQlcl';
import { fetchThuVienVb } from '../readThuVienVb';
import { supabase } from '../supabaseClient';
import DateRangeFilter from './DateRangeFilter';

// Tách StatCard ra ngoài để tránh re-render không cần thiết
const StatCard = React.memo<{
  title: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  trend?: string;
  trendDown?: boolean;
}>(({ title, value, subtext, icon, trend, trendDown }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 flex items-center justify-between group">
    <div className="flex flex-col gap-2">
      <div className="p-1.5 bg-slate-50 rounded-lg w-fit group-hover:bg-primary-50 transition-colors">
        {React.cloneElement(icon as any, { size: 18 })}
      </div>
      <div>
        <p className="text-[10px] font-black text-black/40 uppercase tracking-widest leading-none mb-1">{title}</p>
        {subtext && <p className="text-[9px] font-bold text-black/40 uppercase leading-none truncate max-w-[120px]">{subtext}</p>}
      </div>
    </div>
    <div className="flex flex-col items-end justify-center">
      <h4 className="text-3xl font-black text-black leading-none">{value}</h4>
      {trend && (
        <div className={`mt-1 text-[10px] font-black uppercase flex items-center gap-1 ${trendDown ? 'text-red-500' : 'text-[#009900]'}`}>
          <span>{trend}</span>
          {!trendDown && <TrendingUp size={10} />}
        </div>
      )}
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = React.useState({
    nhanSu: { total: 0, certified: 0 },
    vanBan: { total: 0, monthly: 0 },
    loading: true
  });

  const [dateFilter, setDateFilter] = React.useState({
    type: 'thisMonth',
    startDate: '',
    endDate: ''
  });

  const [selectedTeam, setSelectedTeam] = React.useState<string>('all');
  const [teams, setTeams] = React.useState<string[]>([]);

  // Calculate start/end dates based on filter type
  const activeDateRange = React.useMemo(() => {
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth(), 1);
    let end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (dateFilter.type === 'custom') {
      if (dateFilter.startDate) start = new Date(dateFilter.startDate);
      if (dateFilter.endDate) end = new Date(dateFilter.endDate);
    } else if (dateFilter.type === 'all') {
      return { start: null, end: null };
    } else {
      // Simple mapping for this demo, usually would use a utility
      const d = new Date();
      if (dateFilter.type === 'thisWeek') {
        const first = d.getDate() - d.getDay();
        start = new Date(d.setDate(first));
        end = new Date(d.setDate(first + 6));
      } else if (dateFilter.type === 'lastMonth') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
      }
      // ... more cases can be added
    }
    return { start, end };
  }, [dateFilter]);

  React.useEffect(() => {
    // Fetch unique teams
    supabase.from('assessment_team_members').select('team_name')
      .then(({ data }: { data: { team_name: string }[] | null }) => {
        const unique = Array.from(new Set((data || []).map((t: { team_name: string }) => t.team_name))).filter(Boolean);
        setTeams(unique as string[]);
      });
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      setStats(s => ({ ...s, loading: true }));
      try {
        // Parallel fetch với caching từ API
        const [nhanSuData, vanBanData] = await Promise.all([
          fetchNhanSuQlcl(),
          fetchThuVienVb()
        ]);

        if (!isMounted) return;

        // Apply filters locally for now to demonstrate, 
        // in production these would be Supabase query filters
        let filteredNS = nhanSuData;
        let filteredVB = vanBanData || [];

        if (activeDateRange.start) {
          filteredNS = filteredNS.filter(i => new Date(i.created_at || '') >= activeDateRange.start!);
          filteredVB = filteredVB.filter(i => new Date(i.created_at || '') >= activeDateRange.start!);
        }

        if (activeDateRange.end) {
          const endDate = new Date(activeDateRange.end);
          endDate.setHours(23, 59, 59, 999);
          filteredNS = filteredNS.filter(i => new Date(i.created_at || '') <= endDate);
          filteredVB = filteredVB.filter(i => new Date(i.created_at || '') <= endDate);
        }

        // Personnel stats
        const nsTotal = filteredNS.length;
        const nsCertified = filteredNS.filter(i => i.co_chung_chi).length;

        // Document stats
        const vbTotal = filteredVB.length;
        const vbMonthly = filteredVB.filter(i => {
          const createdAt = new Date(i.created_at || i.hieu_luc || '');
          const now = new Date();
          return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
        }).length;

        setStats({
          nhanSu: { total: nsTotal, certified: nsCertified },
          vanBan: { total: vbTotal, monthly: vbMonthly },
          loading: false
        });
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
        if (isMounted) setStats(s => ({ ...s, loading: false }));
      }
    };

    loadStats();

    // Setup Realtime subscriptions
    const nsChannel = supabase.channel('ns_stats_changes')
      .on('postgres_changes', { event: '*', table: 'nhan_su_qlcl', schema: 'public' }, loadStats)
      .subscribe();

    const vbChannel = supabase.channel('vb_stats_changes')
      .on('postgres_changes', { event: '*', table: 'thu_vien_vb', schema: 'public' }, loadStats)
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(nsChannel);
      supabase.removeChannel(vbChannel);
    };
  }, [activeDateRange, selectedTeam]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Filters Header */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl text-[#009900]">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Bảng điều khiển quản lý</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Thống kê dữ liệu chất lượng toàn bệnh viện</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Users size={14} className="text-slate-400" />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-transparent text-[11px] font-black uppercase tracking-tight outline-none cursor-pointer"
            >
              <option value="all">TẤT CẢ TỔ</option>
              {teams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <DateRangeFilter
            filter={dateFilter}
            onChange={setDateFilter}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Nhân sự QLCL"
          value={stats.loading ? "..." : stats.nhanSu.total.toString()}
          subtext={`Đã cấp chứng chỉ: ${stats.nhanSu.certified}`}
          icon={<Users className="text-[#009900]" />}
          trend={stats.nhanSu.total > 0 ? `+${stats.nhanSu.total}` : undefined}
        />
        <StatCard
          title="Sự cố Y khoa (T6)"
          value="14"
          subtext="Đã xử lý: 10"
          icon={<AlertTriangle className="text-amber-600" />}
          trend="-8%"
          trendDown
        />
        <StatCard
          title="Tỉ lệ hài lòng"
          value="94.5%"
          subtext="Nội trú & Ngoại trú"
          icon={<Activity className="text-green-600" />}
          trend="+1.2%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts - 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-section font-black text-black uppercase mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-[#009900]" />
              Xu hướng báo cáo sự cố (6 tháng)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataIncidents}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#009900" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-section font-black text-black uppercase mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-[#009900]" />
              Tỉ lệ tuân thủ quy trình (Tháng 6)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataCompliance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#009900" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Notifications - 1/3 width on large screens */}
        <div className="lg:col-span-1">
          <NotificationDashboard />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/30">
          <h3 className="text-label font-black text-black uppercase">Hoạt động gần đây</h3>
          <button className="text-table text-[#009900] hover:underline font-black uppercase">Xem tất cả</button>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { action: "Đã phê duyệt", subject: "Kế hoạch cải tiến Khoa Nội Tiêu hóa", time: "2 giờ trước", user: "TS. Nguyễn Văn A" },
            { action: "Báo cáo mới", subject: "Sự cố nhầm lẫn thuốc (Mức nhẹ)", time: "4 giờ trước", user: "ĐD. Trần Thị B" },
            { action: "Cập nhật", subject: "Chỉ số kiểm soát nhiễm khuẩn T6/2024", time: "1 ngày trước", user: "Ban QLCL" },
          ].map((item, idx) => (
            <div key={idx} className="p-4 flex items-start space-x-3 hover:bg-slate-50 transition-colors">
              <div className="w-2 h-2 mt-2 rounded-full bg-[#009900]"></div>
              <div>
                <p className="text-table text-black uppercase leading-relaxed"><span className="font-black">{item.user}</span> {item.action} <span className="font-black text-black">"{item.subject}"</span></p>
                <p className="text-table font-bold text-black/40 mt-1 uppercase">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};