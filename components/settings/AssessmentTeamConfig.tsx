import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { fetchUsers } from '../../readUsers';
import { 
  Users, Users2, Shield, Plus, Edit2, Trash2, Check, X, 
  Search, ChevronDown, UserPlus, Group, Briefcase, Building 
} from 'lucide-react';

interface TeamMember {
  id: string;
  team_name: string;
  user_id: string;
  ho_ten: string;
  chuc_vu: string;
  don_vi: string;
  vai_tro: string;
  ghi_chu: string;
}

export const AssessmentTeamConfig: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    team_name: '',
    user_id: '',
    ho_ten: '',
    chuc_vu: '',
    don_vi: '',
    vai_tro: '',
    ghi_chu: ''
  });

  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Suggested roles and teams based on existing data
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>(['Tổ trưởng', 'Tổ viên', 'Thư ký']);
  const [teamSuggestions, setTeamSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadData();
    
    // Close dropdown on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersRes, usersData] = await Promise.all([
        supabase.from('assessment_team_members').select('*').order('team_name'),
        fetchUsers()
      ]);

      if (membersRes.error) throw membersRes.error;
      
      setMembers(membersRes.data || []);
      setUsers(usersData || []);

      // Extract unique roles and teams for suggestions
      const existingRoles = Array.from(new Set((membersRes.data || []).map((m: any) => m.vai_tro).filter(Boolean)));
      if (existingRoles.length > 0) {
        setRoleSuggestions(prev => Array.from(new Set([...prev, ...existingRoles as string[]])));
      }

      const existingTeams = Array.from(new Set((membersRes.data || []).map((m: any) => m.team_name).filter(Boolean)));
      setTeamSuggestions(existingTeams as string[]);

    } catch (err: any) {
      console.error('Error loading data:', err);
      setMessage({ text: 'Lỗi khi tải dữ liệu: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const [filterTeam, setFilterTeam] = useState<string | null>(null);

  const groupedMembers = useMemo(() => {
    const filtered = filterTeam 
      ? members.filter(m => m.team_name === filterTeam)
      : members;

    const groups: Record<string, TeamMember[]> = {};
    filtered.forEach(m => {
      if (!groups[m.team_name]) groups[m.team_name] = [];
      groups[m.team_name].push(m);
    });
    return groups;
  }, [members, filterTeam]);

  const handleAddAtTeam = (teamName: string) => {
    resetForm();
    setForm(f => ({ ...f, team_name: teamName }));
    setShowForm(true);
  };

  const handleUserSelect = (u: any) => {
    setForm(prev => ({
      ...prev,
      user_id: u.id,
      ho_ten: u.full_name,
      chuc_vu: u.chuc_vu || u.role || '', // Fallback to role if position is empty
      don_vi: u.department || ''
    }));
    setUserSearch(u.full_name);
    setShowUserDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.team_name || !form.ho_ten) {
      setMessage({ text: 'Vui lòng nhập Tên tổ và chọn Thành viên', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('assessment_team_members')
          .update(form)
          .eq('id', editingId);
        if (error) throw error;
        setMessage({ text: 'Cập nhật thành công!', type: 'success' });
      } else {
        const { error } = await supabase
          .from('assessment_team_members')
          .insert([form]);
        if (error) throw error;
        setMessage({ text: 'Thêm thành viên thành công!', type: 'success' });
      }

      resetForm();
      loadData();
    } catch (err: any) {
      setMessage({ text: 'Lỗi: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleEdit = (m: TeamMember) => {
    setForm({
      team_name: m.team_name,
      user_id: m.user_id,
      ho_ten: m.ho_ten,
      chuc_vu: m.chuc_vu,
      don_vi: m.don_vi,
      vai_tro: m.vai_tro,
      ghi_chu: m.ghi_chu
    });
    setUserSearch(m.ho_ten);
    setEditingId(m.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xác nhận xóa thành viên này khỏi tổ?')) return;
    
    try {
      const { error } = await supabase
        .from('assessment_team_members')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setMessage({ text: 'Đã xóa thành công', type: 'success' });
      loadData();
    } catch (err: any) {
      setMessage({ text: 'Lỗi: ' + err.message, type: 'error' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setForm({
      team_name: '',
      user_id: '',
      ho_ten: '',
      chuc_vu: '',
      don_vi: '',
      vai_tro: '',
      ghi_chu: ''
    });
    setUserSearch('');
    setEditingId(null);
    setShowForm(false);
  };

  const [expandedTeams, setExpandedTeams] = useState<string[]>([]);

  const toggleTeam = (teamName: string) => {
    setExpandedTeams(prev => 
      prev.includes(teamName) 
        ? prev.filter(t => t !== teamName) 
        : [...prev, teamName]
    );
  };

  // Expand all by default or keep as is? Let's default all to expanded on first load
  useEffect(() => {
    if (teamSuggestions.length > 0 && expandedTeams.length === 0) {
      setExpandedTeams(teamSuggestions);
    }
  }, [teamSuggestions]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-[#009900]/20 border-t-[#009900] rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Đang tải dữ liệu...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#009900]">
            <Users2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Danh sách tổ chấm điểm</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cấu hình các tổ và thành viên tham gia đánh giá chất lượng</p>
          </div>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#009900] text-white px-6 py-3 rounded-xl text-xs font-black uppercase shadow-lg shadow-emerald-100 hover:scale-105 transition-all active:scale-95"
          >
            <UserPlus size={16} /> Thêm thành viên
          </button>
        )}
      </div>

      {/* QUICK FILTERS */}
      <div className="flex items-center gap-2 px-2 overflow-x-auto no-scrollbar pb-2">
        <button 
          onClick={() => setFilterTeam(null)}
          className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${!filterTeam ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-200'}`}
        >
          Tất cả
        </button>
        {teamSuggestions.sort().map(team => (
          <button 
            key={team}
            onClick={() => setFilterTeam(team)}
            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterTeam === team ? 'bg-[#009900] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-200'}`}
          >
            {team}
          </button>
        ))}
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          <Check size={18} />
          <span className="text-xs font-black uppercase tracking-tight">{message.text}</span>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-8 animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight flex items-center gap-2">
              <Plus className="text-[#009900]" size={18} />
              {editingId ? 'Cập nhật thành viên' : 'Thêm thành viên vào tổ'}
            </h3>
            <button onClick={resetForm} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Tên Tổ */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Group size={12} /> Tên Tổ *
                </label>
                <input 
                  type="text"
                  required
                  list="team-list"
                  value={form.team_name}
                  onChange={e => setForm(f => ({ ...f, team_name: e.target.value }))}
                  placeholder="Ví dụ: Tổ 1, Tổ Nội khoa..."
                  className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm font-black outline-none focus:border-[#009900] transition-all"
                />
                <datalist id="team-list">
                  {teamSuggestions.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>

              {/* Tìm kiếm User */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Search size={12} /> Tìm người dùng (từ danh sách user) *
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    value={userSearch}
                    onChange={e => {
                      setUserSearch(e.target.value);
                      setShowUserDropdown(true);
                      // Clear fields if search is empty
                      if (!e.target.value) setForm(f => ({...f, user_id: '', ho_ten: '', chuc_vu: '', don_vi: ''}));
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    placeholder="Nhập tên để tìm..."
                    className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm font-black outline-none focus:border-[#009900] transition-all"
                  />
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  
                  {showUserDropdown && (
                    <div 
                      ref={userDropdownRef}
                      className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar"
                    >
                      {users
                        .filter(u => u.full_name?.toLowerCase().includes(userSearch.toLowerCase()))
                        .map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleUserSelect(u)}
                            className="w-full text-left p-4 hover:bg-emerald-50 transition-colors border-b border-slate-50 flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0">
                              {u.full_name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{u.full_name}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{u.department || 'Không rõ đơn vị'}</p>
                            </div>
                          </button>
                        ))}
                      {users.length > 0 && users.filter(u => u.full_name?.toLowerCase().includes(userSearch.toLowerCase())).length === 0 && (
                        <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Không tìm thấy</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Vai trò */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Shield size={12} /> Vai trò
                </label>
                <div className="relative group">
                  <input 
                    type="text"
                    list="role-list"
                    value={form.vai_tro}
                    onChange={e => setForm(f => ({ ...f, vai_tro: e.target.value }))}
                    placeholder="Trưởng đoàn, Thành viên..."
                    className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm font-black outline-none focus:border-[#009900] transition-all"
                  />
                  <datalist id="role-list">
                    {roleSuggestions.map(r => <option key={r} value={r} />)}
                  </datalist>
                </div>
              </div>

              {/* Tên - Readonly */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Họ và tên</label>
                <input readOnly value={form.ho_ten} className="w-full bg-slate-100/50 p-4 rounded-2xl border border-transparent text-sm font-black text-slate-500 cursor-not-allowed" />
              </div>

              {/* Chức vụ */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Briefcase size={12} /> Chức vụ
                </label>
                <input 
                  type="text"
                  value={form.chuc_vu}
                  onChange={e => setForm(f => ({ ...f, chuc_vu: e.target.value }))}
                  className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm font-black outline-none focus:border-[#009900] transition-all"
                />
              </div>

              {/* Đơn vị - Readonly */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Building size={12} /> Đơn vị
                </label>
                <input readOnly value={form.don_vi} className="w-full bg-slate-100/50 p-4 rounded-2xl border border-transparent text-sm font-black text-slate-500 cursor-not-allowed" />
              </div>
            </div>

            {/* Ghi chú */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ghi chú</label>
              <textarea 
                value={form.ghi_chu}
                onChange={e => setForm(f => ({ ...f, ghi_chu: e.target.value }))}
                rows={2}
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm font-black outline-none focus:border-[#009900] transition-all resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button"
                onClick={resetForm}
                className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 transition-all font-mono"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-[#009900] text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-emerald-100 hover:scale-105 transition-all disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Thêm vào tổ')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#009900] text-white">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Họ và tên / Vai trò</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Chức vụ & Đơn vị</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Ghi chú</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Lệnh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {Object.keys(groupedMembers).length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-5 text-slate-300">
                      <Users size={64} className="opacity-10" />
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em]">Không tìm thấy dữ liệu</p>
                        <p className="text-[9px] font-bold uppercase mt-1 opacity-50">Thêm thành viên mới để bắt đầu</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                Object.keys(groupedMembers).sort().map(team => {
                  const isExpanded = expandedTeams.includes(team);
                  return (
                    <React.Fragment key={team}>
                      {/* GROUP HEADER */}
                      <tr 
                        className="bg-slate-50/80 border-y border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors"
                        onClick={() => toggleTeam(team)}
                      >
                        <td colSpan={4} className="px-8 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                                <ChevronDown size={18} className="text-slate-400" />
                              </div>
                              <div className="bg-[#009900] p-1.5 rounded-lg text-white">
                                <Group size={14} />
                              </div>
                              <div>
                                 <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{team}</span>
                                 <span className="ml-3 bg-white px-2 py-0.5 rounded-md text-[9px] font-black text-slate-400 border border-slate-100">{groupedMembers[team].length} Thành viên</span>
                              </div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddAtTeam(team);
                              }}
                              className="flex items-center gap-1.5 bg-white text-[#009900] px-4 py-2 rounded-xl text-[9px] font-black uppercase border border-[#009900]/20 hover:bg-[#009900] hover:text-white transition-all shadow-sm group"
                            >
                              <Plus size={12} className="group-hover:scale-125 transition-transform" /> Thêm thành viên
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* MEMBERS IN GROUP */}
                      {isExpanded && groupedMembers[team].map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/30 transition-colors group/row animate-in fade-in slide-in-from-top-1 duration-200">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                                {m.ho_ten?.[0]}
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{m.ho_ten}</p>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                  m.vai_tro === 'Tổ trưởng' ? 'bg-amber-100 text-amber-700' : 
                                  m.vai_tro === 'Thư ký' ? 'bg-cyan-100 text-cyan-700' : 
                                  'bg-slate-100 text-slate-500'
                                }`}>
                                  {m.vai_tro || 'Tổ viên'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-[10px] font-black text-slate-600 uppercase mb-1">{m.chuc_vu || '-'}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{m.don_vi}</p>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-[10px] text-slate-500 font-bold italic max-w-xs truncate">{m.ghi_chu || '-'}</p>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEdit(m)}
                                className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-[#009900] hover:border-[#009900] transition-all shadow-sm"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(m.id)}
                                className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
