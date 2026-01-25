import React from 'react';
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

export const Dashboard: React.FC = () => {
  const [stats, setStats] = React.useState({
    nhanSu: { total: 0, certified: 0 },
    vanBan: { total: 0, monthly: 0 },
    loading: true
  });

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const [nhanSuData, vanBanData] = await Promise.all([
          fetchNhanSuQlcl(),
          fetchThuVienVb()
        ]);

        // Calculate personnel stats
        const nsTotal = nhanSuData.length;
        const nsCertified = nhanSuData.filter(i => i.co_chung_chi).length;

        // Calculate document stats
        const vbTotal = vanBanData?.length || 0;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const vbMonthly = (vanBanData as any[])?.filter(i => {
          const createdAt = new Date(i.created_at || i.ngay_ban_hanh || '');
          return createdAt >= firstDayOfMonth;
        }).length || 0;

        setStats({
          nhanSu: { total: nsTotal, certified: nsCertified },
          vanBan: { total: vbTotal, monthly: vbMonthly },
          loading: false
        });
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
        setStats(s => ({ ...s, loading: false }));
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
      supabase.removeChannel(nsChannel);
      supabase.removeChannel(vbChannel);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Nhân sự QLCL"
          value={stats.loading ? "..." : stats.nhanSu.total.toString()}
          subtext={`Đã cấp chứng chỉ: ${stats.nhanSu.certified}`}
          icon={<Users className="w-6 h-6 text-primary-600" />}
          trend={stats.nhanSu.total > 0 ? `+${stats.nhanSu.total}` : undefined}
        />
        <StatCard
          title="Sự cố Y khoa (T6)"
          value="14"
          subtext="Đã xử lý: 10"
          icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
          trend="-8%"
          trendDown
        />
        <StatCard
          title="Tỉ lệ hài lòng"
          value="94.5%"
          subtext="Nội trú & Ngoại trú"
          icon={<Activity className="w-6 h-6 text-green-600" />}
          trend="+1.2%"
        />
        <StatCard
          title="Văn bản & Tài liệu"
          value={stats.loading ? "..." : stats.vanBan.total.toString()}
          subtext={`Mới trong tháng: ${stats.vanBan.monthly}`}
          icon={<FileText className="w-6 h-6 text-purple-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts - 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary-500" />
              Xu hướng báo cáo sự cố (6 tháng)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataIncidents}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              Tỉ lệ tuân thủ quy trình (Tháng 6)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataCompliance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#106627" radius={[0, 4, 4, 0]} barSize={20} />
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
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Hoạt động gần đây</h3>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">Xem tất cả</button>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { action: "Đã phê duyệt", subject: "Kế hoạch cải tiến Khoa Nội Tiêu hóa", time: "2 giờ trước", user: "TS. Nguyễn Văn A" },
            { action: "Báo cáo mới", subject: "Sự cố nhầm lẫn thuốc (Mức nhẹ)", time: "4 giờ trước", user: "ĐD. Trần Thị B" },
            { action: "Cập nhật", subject: "Chỉ số kiểm soát nhiễm khuẩn T6/2024", time: "1 ngày trước", user: "Ban QLCL" },
          ].map((item, idx) => (
            <div key={idx} className="p-4 flex items-start space-x-3 hover:bg-slate-50 transition-colors">
              <div className="w-2 h-2 mt-2 rounded-full bg-primary-500"></div>
              <div>
                <p className="text-sm text-slate-800"><span className="font-medium">{item.user}</span> {item.action} <span className="font-medium text-slate-900">"{item.subject}"</span></p>
                <p className="text-xs text-slate-500 mt-1">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  trend?: string;
  trendDown?: boolean;
}> = ({ title, value, subtext, icon, trend, trendDown }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800 mt-1">{value}</h4>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className="p-2 bg-slate-50 rounded-lg">
        {icon}
      </div>
    </div>
    {trend && (
      <div className={`mt-4 text-xs font-medium flex items-center ${trendDown ? 'text-red-500' : 'text-green-500'}`}>
        <span>{trend}</span>
        <span className="text-slate-400 ml-1">so với tháng trước</span>
      </div>
    )}
  </div>
);