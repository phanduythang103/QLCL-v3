import React, { useState, useEffect, useMemo } from 'react';
import {
    ChevronRight, ChevronDown, CheckSquare, Square,
    Users, Briefcase, Save, RefreshCw, Search,
    CheckCircle2, AlertCircle, Loader2, X, Building2, Copy,
    Eye, LayoutList
} from 'lucide-react';
import { fetchData83tc, batchUpdateData83tc, Data83tc } from '../readData83tc';
import { fetchDmDonVi, DmDonVi } from '../readDmDonVi';
import { supabase } from '../supabaseClient';

const naturalSort = (a: string, b: string) => {
    return (a || '').localeCompare(b || '', undefined, { numeric: true, sensitivity: 'base' });
};

// --- Specialized Component: Unit Detail Modal ---
const UnitDetailModal: React.FC<{
    unitCode: string;
    data: { phan: string; chuong: string; tieu_chi: string; items: Data83tc[] }[];
    onClose: () => void;
    onRemoveChapter: (phan: string, chuong: string) => void;
}> = ({ unitCode, data, onClose, onRemoveChapter }) => {
    // Re-group for green hierarchical display
    const byPhan: Record<string, Record<string, Record<string, Data83tc[]>>> = {};
    data.forEach(g => {
        if (!byPhan[g.phan]) byPhan[g.phan] = {};
        if (!byPhan[g.phan][g.chuong]) byPhan[g.phan][g.chuong] = {};
        byPhan[g.phan][g.chuong][g.tieu_chi] = g.items;
    });

    const totalItems = data.reduce((acc, g) => acc + g.items.length, 0);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-[#059669] to-[#007700] p-8 text-white relative shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute right-5 top-5 bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-5">
                        <div className="bg-white/20 p-4 rounded-2xl">
                            <LayoutList size={32} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-white/70 uppercase tracking-[0.2em] mb-1 leading-none">Chi tiết cấu hình đơn vị</p>
                            <h3 className="text-3xl font-black uppercase tracking-tight">{unitCode}</h3>
                            <div className="flex gap-4 mt-3">
                                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">{Object.keys(byPhan).length} Phần</span>
                                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">{totalItems} Tiểu mục được phân công</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content - Heirarchy */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    <div className="space-y-6">
                        {Object.keys(byPhan).sort(naturalSort).map(phan => (
                            <div key={phan} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
                                    <ChevronDown size={18} className="text-[#059669]" />
                                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{phan}</span>
                                </div>
                                <div className="p-4 space-y-4">
                                    {Object.keys(byPhan[phan]).sort(naturalSort).map(chuong => (
                                        <div key={chuong} className="ml-2 border-l-2 border-slate-50 pl-4 py-1 group/chuong relative">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-[11px] font-black text-slate-400 uppercase italic leading-relaxed">{chuong}</p>
                                                <button
                                                    onClick={() => onRemoveChapter(phan, chuong)}
                                                    className="opacity-0 group-hover/chuong:opacity-100 flex items-center gap-1.5 bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[9px] font-black uppercase hover:bg-red-100 transition-all border border-red-100"
                                                    title="Gỡ đơn vị khỏi chương này"
                                                >
                                                    <X size={10} /> Xóa chương
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                {Object.keys(byPhan[phan][chuong]).sort(naturalSort).map(tieuChi => (
                                                    <div key={tieuChi} className="flex gap-4">
                                                        <div className="mt-1 shrink-0 bg-green-50 p-1.5 rounded-lg text-[#059669]">
                                                            <CheckCircle2 size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-[#059669] uppercase tracking-tight mb-1">{tieuChi}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 italic">
                                                                {byPhan[phan][chuong][tieuChi].length} tiểu mục phụ trách trực tiếp
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 shrink-0 bg-white text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase italic tabular-nums">
                        Dữ liệu được cập nhật từ hệ thống quản lý chất lượng 83 tiêu chí
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- Sub-component: MultiSelect (Generic version) ---
const MultiSelect: React.FC<{
    label: string;
    options: { value: string; label: string }[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
}> = ({ label, options, selectedValues, onChange, placeholder, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        opt.value.toLowerCase().includes(search.toLowerCase())
    );

    const toggleOption = (val: string) => {
        if (selectedValues.includes(val)) {
            onChange(selectedValues.filter(v => v !== val));
        } else {
            onChange([...selectedValues, val]);
        }
    };

    return (
        <div className="space-y-2 relative">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block ml-1">{label}</label>
            <div
                className={`min-h-[48px] p-2 border border-slate-200 rounded-xl bg-white cursor-pointer flex flex-wrap gap-2 transition-all ${isOpen ? 'ring-2 ring-green-500/20 border-green-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {selectedValues.length === 0 ? (
                    <span className="text-slate-400 text-sm font-bold ml-2 py-1">{placeholder || 'Chọn...'}</span>
                ) : (
                    selectedValues.map(val => {
                        const opt = options.find(o => o.value === val);
                        return (
                            <div key={val} className="bg-green-100 text-[#008800] px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 border border-green-200 uppercase">
                                {opt?.label || val}
                                <X
                                    size={12}
                                    className="cursor-pointer hover:text-red-500"
                                    onClick={(e) => { e.stopPropagation(); toggleOption(val); }}
                                />
                            </div>
                        );
                    })
                )}
            </div>
            {isOpen && !disabled && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-[110] overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <input
                            type="text"
                            placeholder="Tìm kiếm đơn vị..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-green-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-xs italic">Không tìm thấy đơn vị nào</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    onClick={(e) => { e.stopPropagation(); toggleOption(opt.value); }}
                                    className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${selectedValues.includes(opt.value) ? 'bg-green-50' : ''}`}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-slate-800 uppercase">{opt.label}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{opt.value}</span>
                                    </div>
                                    {selectedValues.includes(opt.value) && <CheckCircle2 size={16} className="text-[#059669]" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Component ---
const Criteria83Config: React.FC = () => {
    const [dataList, setDataList] = useState<Data83tc[]>([]);
    const [units, setUnits] = useState<DmDonVi[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [expandedPhan, setExpandedPhan] = useState<string[]>([]);
    const [expandedChuong, setExpandedChuong] = useState<string[]>([]);
    const [expandedTieuChi, setExpandedTieuChi] = useState<string[]>([]);

    const [showBatchModal, setShowBatchModal] = useState(false);
    const [configTarget, setConfigTarget] = useState<'KHOA' | 'TO'>('KHOA'); // Toggle selection
    const [batchForm, setBatchForm] = useState<{ phu_trach: string[]; to_cham_diem: string[]; don_vi_phoi_hop: string[] }>({
        phu_trach: [],
        to_cham_diem: [],
        don_vi_phoi_hop: []
    });
    const [isClearPhuTrach, setIsClearPhuTrach] = useState(false);
    const [isClearToChamDiem, setIsClearToChamDiem] = useState(false);
    const [isClearDonViPhoiHop, setIsClearDonViPhoiHop] = useState(false);
    const [teams, setTeams] = useState<string[]>([]);

    const [activeTab, setActiveTab] = useState<'config' | 'summary'>('config');
    const [searchTerm, setSearchTerm] = useState('');

    // Tab 2 copy state
    const [selectedSummaryUnits, setSelectedSummaryUnits] = useState<string[]>([]);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [copyTargetUnits, setCopyTargetUnits] = useState<string[]>([]);
    const [copying, setCopying] = useState(false);
    const [copyModalKhoi, setCopyModalKhoi] = useState<string>('Tất cả');

    // Unit detail view state
    const [viewingUnitDetail, setViewingUnitDetail] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [data, unitData, teamsRes] = await Promise.all([
                fetchData83tc(),
                fetchDmDonVi(),
                supabase.from('assessment_team_members').select('team_name')
            ]);
            setDataList(data);
            setUnits(unitData);

            const uniqueTeams = Array.from(new Set((teamsRes.data || []).map((t: any) => t.team_name))).filter(Boolean);
            setTeams(uniqueTeams as string[]);
        } catch (err) {
            console.error('Lỗi tải dữ liệu 83tc:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const groupedData = useMemo(() => {
        const filtered = dataList.filter(item =>
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
        Object.keys(hierarchy).forEach(p => {
            Object.keys(hierarchy[p]).forEach(c => {
                Object.keys(hierarchy[p][c]).forEach(tc => {
                    hierarchy[p][c][tc].sort((a: Data83tc, b: Data83tc) => naturalSort(a.ma_tieu_muc || "", b.ma_tieu_muc || ""));
                });
            });
        });
        return hierarchy;
    }, [dataList, searchTerm]);

    const unitGroupedData = useMemo(() => {
        const configured = dataList.filter(item => item.phu_trach || item.to_cham_diem);
        const byTarget: Record<string, Data83tc[]> = {};

        configured.forEach(item => {
            const depts = (item.phu_trach || '').split(',').map(s => s.trim()).filter(Boolean);
            const teams = (item.to_cham_diem || '').split(',').map(s => s.trim()).filter(Boolean);

            // Collect all unique targets for this item
            const allTargets = Array.from(new Set([...depts, ...teams]));
            allTargets.forEach(target => {
                if (!byTarget[target]) byTarget[target] = [];
                byTarget[target].push(item);
            });
        });

        const result: Record<string, { phan: string; chuong: string; tieu_chi: string; items: Data83tc[] }[]> = {};
        Object.keys(byTarget).sort(naturalSort).forEach(target => {
            const grouped: Record<string, Record<string, Record<string, Data83tc[]>>> = {};
            byTarget[target].forEach(item => {
                const p = item.phan || 'Khác';
                const c = item.chuong || 'Khác';
                const tc = item.tieu_chi || 'Khác';
                if (!grouped[p]) grouped[p] = {};
                if (!grouped[p][c]) grouped[p][c] = {};
                if (!grouped[p][c][tc]) grouped[p][c][tc] = [];
                grouped[p][c][tc].push(item);
            });
            result[target] = [];
            Object.keys(grouped).sort(naturalSort).forEach(p => {
                Object.keys(grouped[p]).sort(naturalSort).forEach(c => {
                    Object.keys(grouped[p][c]).sort(naturalSort).forEach(tc => {
                        result[target].push({ phan: p, chuong: c, tieu_chi: tc, items: grouped[p][c][tc] });
                    });
                });
            });
        });
        return result;
    }, [dataList]);

    const toggleSelectAll = (ids: number[], checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
        } else {
            setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
        }
    };

    const handleCopyToOtherUnits = async () => {
        if (selectedSummaryUnits.length === 0 || copyTargetUnits.length === 0) return;
        setCopying(true);
        try {
            const seenIds = new Set<number>();
            const allItems: Data83tc[] = [];
            selectedSummaryUnits.forEach(unitCode => {
                (unitGroupedData[unitCode] || []).forEach(group => {
                    group.items.forEach(item => {
                        if (item.id && !seenIds.has(item.id)) {
                            seenIds.add(item.id);
                            allItems.push(item);
                        }
                    });
                });
            });
            for (const item of allItems) {
                const currentCodes = (item.phu_trach || '').split(',').map(s => s.trim()).filter(Boolean);
                const toAdd = copyTargetUnits.filter(code => !currentCodes.includes(code));
                if (toAdd.length > 0) {
                    const merged = [...currentCodes, ...toAdd].join(', ');
                    await batchUpdateData83tc([item.id!], { phu_trach: merged });
                }
            }
            await loadData();
            setShowCopyModal(false);
            setCopyTargetUnits([]);
            setSelectedSummaryUnits([]);
            alert(`Đã cấu hình thêm ${copyTargetUnits.length} đơn vị cho ${allItems.length} tiêu mục.`);
        } catch (err) {
            console.error('Lỗi sao chép cấu hình:', err);
            alert('Có lỗi xảy ra khi sao chép cấu hình.');
        } finally {
            setCopying(false);
        }
    };

    const handleRemoveEntireTarget = async (targetCode: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa toàn bộ cấu hình phân công cho "${targetCode}"?`)) return;
        setUpdating(true);
        try {
            const allItemsForTarget: Data83tc[] = [];
            Object.values(unitGroupedData[targetCode] || []).forEach(group => {
                group.items.forEach(item => allItemsForTarget.push(item));
            });

            const tasks = allItemsForTarget.map(item => {
                const updates: any = {};
                // Remove from phu_trach
                const pts = (item.phu_trach || '').split(',').map(s => s.trim()).filter(s => s && s !== targetCode);
                updates.phu_trach = pts.length > 0 ? pts.join(', ') : null;

                // Remove from to_cham_diem
                const tos = (item.to_cham_diem || '').split(',').map(s => s.trim()).filter(s => s && s !== targetCode);
                updates.to_cham_diem = tos.length > 0 ? tos.join(', ') : null;

                return supabase.from('data83tc').update(updates).eq('id', item.id);
            });

            await Promise.all(tasks);
            await loadData();
            alert(`Đã xóa toàn bộ cấu hình cho ${targetCode}`);
        } catch (err) {
            console.error('Lỗi khi xóa cấu hình:', err);
            alert('Có lỗi xảy ra khi xóa cấu hình.');
        } finally {
            setUpdating(false);
        }
    };

    const handleRemoveChapterTarget = async (targetCode: string, phan: string, chuong: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa "${targetCode}" khỏi chương "${chuong}"?`)) return;
        setUpdating(true);
        try {
            const chapterItems = (unitGroupedData[targetCode] || [])
                .filter(g => g.phan === phan && g.chuong === chuong)
                .flatMap(g => g.items);

            const tasks = chapterItems.map(item => {
                const updates: any = {};
                const pts = (item.phu_trach || '').split(',').map(s => s.trim()).filter(s => s && s !== targetCode);
                updates.phu_trach = pts.length > 0 ? pts.join(', ') : null;

                const tos = (item.to_cham_diem || '').split(',').map(s => s.trim()).filter(s => s && s !== targetCode);
                updates.to_cham_diem = tos.length > 0 ? tos.join(', ') : null;

                return supabase.from('data83tc').update(updates).eq('id', item.id);
            });

            await Promise.all(tasks);
            await loadData();
            // Refresh modal data if it's open
            if (viewingUnitDetail === targetCode) {
                // The unitGroupedData will naturally update since it depends on dataList
            }
        } catch (err) {
            console.error('Lỗi khi xóa chương:', err);
            alert('Có lỗi xảy ra khi xóa.');
        } finally {
            setUpdating(false);
        }
    };

    const handleBatchUpdate = async () => {
        if (selectedIds.length === 0) return;
        setUpdating(true);
        try {
            // Need unique updates for each record if appending
            const tasks: Promise<any>[] = [];

            for (const id of selectedIds) {
                const item = dataList.find(d => d.id === id);
                if (!item) continue;

                const updates: any = {};

                if (configTarget === 'KHOA') {
                    if (isClearPhuTrach) {
                        updates.phu_trach = null;
                    } else if (batchForm.phu_trach.length > 0) {
                        const existing = (item.phu_trach || '').split(',').map(s => s.trim()).filter(Boolean);
                        const merged = Array.from(new Set([...existing, ...batchForm.phu_trach]));
                        updates.phu_trach = merged.join(', ');
                    }
                } else {
                    if (isClearToChamDiem) {
                        updates.to_cham_diem = null;
                        updates.phu_trach = null;
                    } else if (batchForm.to_cham_diem.length > 0) {
                        // Update to_cham_diem
                        const existingTo = (item.to_cham_diem || '').split(',').map(s => s.trim()).filter(Boolean);
                        const mergedTo = Array.from(new Set([...existingTo, ...batchForm.to_cham_diem]));
                        updates.to_cham_diem = mergedTo.join(', ');

                        // ALSO update phu_trach as requested by user
                        const existingPT = (item.phu_trach || '').split(',').map(s => s.trim()).filter(Boolean);
                        const mergedPT = Array.from(new Set([...existingPT, ...batchForm.to_cham_diem]));
                        updates.phu_trach = mergedPT.join(', ');
                    }
                }

                if (isClearDonViPhoiHop) {
                    updates.don_vi_phoi_hop = null;
                } else if (batchForm.don_vi_phoi_hop.length > 0) {
                    const existing = (item.don_vi_phoi_hop || '').split(',').map(s => s.trim()).filter(Boolean);
                    const merged = Array.from(new Set([...existing, ...batchForm.don_vi_phoi_hop]));
                    updates.don_vi_phoi_hop = merged.join(', ');
                }

                if (Object.keys(updates).length > 0) {
                    tasks.push(supabase.from('data83tc').update(updates).eq('id', id));
                }
            }

            if (tasks.length > 0) {
                await Promise.all(tasks);
                await loadData();
            }

            setSelectedIds([]);
            setShowBatchModal(false);
            setBatchForm({ phu_trach: [], to_cham_diem: [], don_vi_phoi_hop: [] });
            setIsClearPhuTrach(false);
            setIsClearToChamDiem(false);
            setIsClearDonViPhoiHop(false);
        } catch (err: any) {
            console.error('❌ Lỗi cập nhật hàng loạt:', err);
            const detailedError = err?.message || err?.details || 'Lỗi không xác định';
            alert(`Có lỗi xảy ra khi cập nhật: ${detailedError}\n\nVui lòng đảm bảo cột 'to_cham_diem' đã được thêm vào database.`);
        } finally {
            setUpdating(false);
        }
    };

    if (loading && dataList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>Đang tải danh mục 83 tiêu chí...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Tab Bar */}
            <div className="flex w-full flex-wrap gap-1 rounded-xl bg-slate-100 p-1 sm:w-fit">
                <button
                    onClick={() => setActiveTab('config')}
                    className={`flex-1 rounded-lg px-4 py-2 text-xs font-black uppercase transition-all sm:flex-none sm:px-5 ${activeTab === 'config' ? 'bg-white text-[#059669] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <span className="flex items-center justify-center gap-2"><CheckSquare size={14} /> Cấu hình chi tiết</span>
                </button>
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 rounded-lg px-4 py-2 text-xs font-black uppercase transition-all sm:flex-none sm:px-5 ${activeTab === 'summary' ? 'bg-white text-[#059669] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <span className="flex items-center justify-center gap-2"><Building2 size={14} /> Danh sách đã cấu hình</span>
                </button>
            </div>

            {/* ===== TAB 1: CẤU HÌNH CHI TIẾT ===== */}
            {activeTab === 'config' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input type="text" placeholder="Tìm kiếm tiêu chí..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-bold bg-white" />
                        </div>
                        <button onClick={loadData} className="p-2.5 text-slate-500 hover:text-[#059669] hover:bg-green-50 rounded-xl border border-slate-200 transition-all shadow-sm bg-white" title="Tải lại dữ liệu">
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col gap-3 shadow-xl sticky top-4 z-40 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#059669] p-2 rounded-lg"><CheckSquare size={20} /></div>
                                <div>
                                    <p className="font-black text-sm uppercase">Đã chọn {selectedIds.length} mục</p>
                                    <p className="text-slate-400 text-xs font-bold italic">Sẵn sàng cập nhật hàng loạt thông tin</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <button onClick={() => setSelectedIds([])} className="px-4 py-2 text-slate-400 hover:text-white font-bold text-xs uppercase">Hủy chọn</button>
                                <button onClick={() => setShowBatchModal(true)} className="bg-[#059669] hover:bg-[#008800] text-white px-6 py-2 rounded-xl font-black text-xs uppercase transition-all shadow-lg flex items-center justify-center gap-2">
                                    <Users size={16} /> Cập nhật hàng loạt
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <h3 className="text-sm font-black text-black uppercase tracking-wider">Danh mục chi tiết</h3>
                            <div className="text-[10px] text-slate-400 font-bold italic uppercase">Nhấn vào tiêu đề để mở rộng/thu gọn</div>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {Object.keys(groupedData).length === 0 ? (
                                <div className="p-20 text-center text-slate-400">
                                    <AlertCircle className="mx-auto mb-2 opacity-20" size={48} />
                                    <p className="font-bold italic">Không tìm thấy tiêu chí nào phù hợp</p>
                                </div>
                            ) : (
                                Object.keys(groupedData).sort(naturalSort).map(phan => (
                                    <div key={phan}>
                                        <div onClick={() => setExpandedPhan(prev => prev.includes(phan) ? prev.filter(p => p !== phan) : [...prev, phan])}
                                            className="bg-slate-50/80 hover:bg-slate-100/80 px-6 py-4 flex items-center gap-3 cursor-pointer transition-colors border-b border-slate-100">
                                            {expandedPhan.includes(phan) ? <ChevronDown size={18} className="text-[#059669]" /> : <ChevronRight size={18} className="text-slate-400" />}
                                            <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{phan}</span>
                                            <span className="ml-auto bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400">{Object.keys(groupedData[phan]).length} Chương</span>
                                        </div>
                                        {expandedPhan.includes(phan) && (
                                            <div className="bg-white divide-y divide-slate-50">
                                                {Object.keys(groupedData[phan]).sort(naturalSort).map(chuong => (
                                                    <div key={chuong} className="ml-4 border-l-2 border-slate-100">
                                                        <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                                                            onClick={() => setExpandedChuong(prev => prev.includes(chuong) ? prev.filter(c => c !== chuong) : [...prev, chuong])}>
                                                            <div className="flex items-center gap-3">
                                                                <div onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const allChuongIds = Object.values(groupedData[phan][chuong]).flat().map((i: any) => i.id).filter(Boolean);
                                                                    const isChuongSelected = allChuongIds.every((id: any) => selectedIds.includes(id));
                                                                    toggleSelectAll(allChuongIds, !isChuongSelected);
                                                                }} className={`p-1 rounded transition-all ${
                                                                    (() => {
                                                                        const allChuongIds = Object.values(groupedData[phan][chuong]).flat().map((i: any) => i.id).filter(Boolean);
                                                                        return allChuongIds.every((id: any) => selectedIds.includes(id)) ? 'text-[#059669]' : 'text-slate-300 hover:text-slate-400';
                                                                    })()
                                                                }`}>
                                                                    {(() => {
                                                                        const allChuongIds = Object.values(groupedData[phan][chuong]).flat().map((i: any) => i.id).filter(Boolean);
                                                                        return allChuongIds.every((id: any) => selectedIds.includes(id)) ? <CheckSquare size={16} /> : <Square size={16} />;
                                                                    })()}
                                                                </div>
                                                                {expandedChuong.includes(chuong) ? <ChevronDown size={16} className="text-[#059669]" /> : <ChevronRight size={16} className="text-slate-400" />}
                                                                <span className="text-xs font-black text-slate-600 uppercase italic leading-relaxed">{chuong}</span>
                                                            </div>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Chọn nhanh theo Chương</span>
                                                        </div>
                                                        {expandedChuong.includes(chuong) && (
                                                            <div className="divide-y divide-slate-50">
                                                                {Object.keys(groupedData[phan][chuong]).sort(naturalSort).map(tieuChi => {
                                                                    const items = groupedData[phan][chuong][tieuChi];
                                                                    const allIds = items.map((i: any) => i.id);
                                                                    const isAllSelected = allIds.every((id: number) => selectedIds.includes(id));
                                                                    return (
                                                                        <div key={tieuChi} className="ml-6 mb-2">
                                                                            <div className="flex items-center px-6 py-3 bg-green-50/30 hover:bg-green-50/50 rounded-lg mr-4 transition-colors">
                                                                                <button onClick={() => toggleSelectAll(allIds, !isAllSelected)}
                                                                                    className={`mr-3 p-1 rounded transition-all ${isAllSelected ? 'text-[#059669]' : 'text-slate-300 hover:text-slate-400'}`}>
                                                                                    {isAllSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                                                                </button>
                                                                                <div onClick={() => setExpandedTieuChi(prev => prev.includes(tieuChi) ? prev.filter(t => t !== tieuChi) : [...prev, tieuChi])}
                                                                                    className="flex-1 flex items-center gap-3 cursor-pointer">
                                                                                    {expandedTieuChi.includes(tieuChi) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                                                    <span className="text-xs font-black text-[#059669] uppercase tracking-tight">{tieuChi}</span>
                                                                                    <span className="text-[10px] text-slate-400 font-bold bg-white px-2 py-0.5 rounded border border-slate-100">{items.length} tiểu mục</span>
                                                                                </div>
                                                                            </div>
                                                                            {expandedTieuChi.includes(tieuChi) && (
                                                                                <div className="mt-2 mr-0 overflow-x-auto rounded-xl border border-slate-100 md:mr-4">
                                                                                    <table className="w-full min-w-[760px] text-xs text-left">
                                                                                        <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] h-10 border-b border-slate-100">
                                                                                            <tr>
                                                                                                <th className="w-10 px-4"></th>
                                                                                                <th className="px-4 py-2">Mã & Nội dung tiểu mục</th>
                                                                                                <th className="px-4 py-2 w-48">Đơn vị chủ trì</th>
                                                                                                <th className="px-4 py-2 w-48">Tổ chấm điểm</th>
                                                                                                <th className="px-4 py-2 w-48">Đơn vị phối hợp</th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody className="divide-y divide-slate-50">
                                                                                            {items.map((item: Data83tc) => (
                                                                                                <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.includes(item.id!) ? 'bg-green-50/20' : ''}`}>
                                                                                                    <td className="px-4 py-3">
                                                                                                        <button onClick={() => setSelectedIds(prev => prev.includes(item.id!) ? prev.filter(id => id !== item.id!) : [...prev, item.id!])}
                                                                                                            className={`p-1 rounded transition-all ${selectedIds.includes(item.id!) ? 'text-[#059669]' : 'text-slate-300 hover:text-slate-400'}`}>
                                                                                                            {selectedIds.includes(item.id!) ? <CheckSquare size={16} /> : <Square size={16} />}
                                                                                                        </button>
                                                                                                    </td>
                                                                                                    <td className="px-4 py-3">
                                                                                                        <div className="flex flex-col">
                                                                                                            <span className="font-black text-slate-400 mb-0.5">{item.ma_tieu_muc}</span>
                                                                                                            <span className="font-bold text-slate-700 leading-relaxed text-[11px]">{item.tieu_muc}</span>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="px-4 py-3">
                                                                                                        {item.phu_trach ? (
                                                                                                            <div className="flex items-center gap-2 bg-green-100/50 text-[#008800] px-2 py-1 rounded-lg border border-green-200">
                                                                                                                <Users size={12} />
                                                                                                                <span className="font-black text-[10px] uppercase truncate max-w-[150px]">{item.phu_trach}</span>
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <span className="text-slate-300 italic font-bold text-[10px]">Chưa chọn</span>
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td className="px-4 py-3">
                                                                                                        {item.to_cham_diem ? (
                                                                                                            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100">
                                                                                                                <LayoutList size={12} />
                                                                                                                <span className="font-black text-[10px] uppercase truncate max-w-[150px]">{item.to_cham_diem}</span>
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <span className="text-slate-300 italic font-bold text-[10px]">Chưa chọn</span>
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td className="px-4 py-3">
                                                                                                        {item.don_vi_phoi_hop ? (
                                                                                                            <div className="flex items-center gap-2 bg-slate-100 text-slate-600 px-2 py-1 rounded-lg border border-slate-200">
                                                                                                                <Briefcase size={12} />
                                                                                                                <span className="font-black text-[10px] uppercase truncate max-w-[150px]">{item.don_vi_phoi_hop}</span>
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <span className="text-slate-300 italic font-bold text-[10px]">Chưa chọn</span>
                                                                                                        )}
                                                                                                    </td>
                                                                                                </tr>
                                                                                            ))}
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
                    </div>
                </div>
            )}

            {/* ===== TAB 2: DANH SÁCH ĐÃ CẤU HÌNH (Table View) ===== */}
            {activeTab === 'summary' && (
                <div className="space-y-4">
                    {/* Selection Action Bar (Existing Copy logic) */}
                    {selectedSummaryUnits.length > 0 && (
                        <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col gap-3 shadow-xl sticky top-4 z-40 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-600 p-2 rounded-lg"><CheckSquare size={20} /></div>
                                <div>
                                    <p className="font-black text-sm uppercase">Đã chọn {selectedSummaryUnits.length} đơn vị</p>
                                    <p className="text-slate-400 text-xs font-bold italic">{selectedSummaryUnits.join(', ')}</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <button onClick={() => setSelectedSummaryUnits([])} className="px-4 py-2 text-slate-400 hover:text-white font-bold text-xs uppercase">Hủy chọn</button>
                                <button
                                    onClick={() => { setCopyTargetUnits([]); setShowCopyModal(true); }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-black text-xs uppercase transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Copy size={14} /> Cấu hình cho khoa khác
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
                        <table className="w-full min-w-[720px] text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 w-12">
                                        <button
                                            onClick={() => {
                                                const allCodes = Object.keys(unitGroupedData);
                                                setSelectedSummaryUnits(selectedSummaryUnits.length === allCodes.length ? [] : allCodes);
                                            }}
                                            className="text-slate-400 hover:text-[#059669]"
                                        >
                                            {selectedSummaryUnits.length === Object.keys(unitGroupedData).length && Object.keys(unitGroupedData).length > 0
                                                ? <CheckSquare size={18} className="text-[#059669]" />
                                                : <Square size={18} />}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Tên đơn vị</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Đã cấu hình</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.keys(unitGroupedData).length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center text-slate-400">
                                            <AlertCircle className="mx-auto mb-3 opacity-20" size={48} />
                                            <p className="font-bold italic">Chưa có tiêu chí nào được phân công cấu hình</p>
                                        </td>
                                    </tr>
                                ) : (
                                    Object.keys(unitGroupedData).map(unitCode => {
                                        const groups = unitGroupedData[unitCode];
                                        const unitName = units.find(u => u.ma_don_vi === unitCode)?.ten_don_vi || "";

                                        // Stats calculation
                                        const nPhan = new Set(groups.map(g => g.phan)).size;
                                        const nChuong = new Set(groups.map(g => g.chuong)).size;
                                        const nTieuChi = new Set(groups.map(g => g.tieu_chi)).size;
                                        const nTieuMuc = groups.reduce((acc, g) => acc + g.items.length, 0);

                                        const isSelected = selectedSummaryUnits.includes(unitCode);

                                        return (
                                            <tr key={unitCode} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => setSelectedSummaryUnits(prev => prev.includes(unitCode) ? prev.filter(u => u !== unitCode) : [...prev, unitCode])}
                                                        className={`transition-colors ${isSelected ? 'text-blue-600' : 'text-slate-300 hover:text-slate-400'}`}
                                                    >
                                                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${
                                                            isSelected
                                                                ? 'bg-blue-100 text-blue-600'
                                                                : units.some(u => u.ma_don_vi === unitCode) ? 'bg-green-50 text-[#059669]' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                            {units.some(u => u.ma_don_vi === unitCode) ? <Building2 size={16} /> : <Users size={16} />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-black text-xs uppercase tracking-tight text-slate-800">{unitCode}</p>
                                                                {!units.some(u => u.ma_don_vi === unitCode) && (
                                                                    <span className="bg-blue-100 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Tổ chấm điểm</span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{unitName}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border border-slate-200">
                                                            {nPhan} Phần
                                                        </span>
                                                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border border-slate-200">
                                                            {nChuong} Chương
                                                        </span>
                                                        <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border border-blue-100">
                                                            {nTieuChi} Tiêu chí
                                                        </span>
                                                        <span className="bg-green-50 text-[#008800] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border border-green-100">
                                                            {nTieuMuc} Tiểu mục
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const ids = groups.flatMap(g => g.items.map(i => i.id)).filter(Boolean) as number[];
                                                                setSelectedIds(ids);
                                                                setActiveTab('config');
                                                            }}
                                                            className="p-2 bg-white hover:bg-slate-50 text-blue-600 rounded-xl border border-slate-200 transition-all shadow-sm"
                                                            title="Sửa cấu hình (Chọn tất cả tiêu chí của đơn vị này)"
                                                        >
                                                            <Copy size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveEntireTarget(unitCode)}
                                                            className="p-2 bg-white hover:bg-red-50 text-red-600 rounded-xl border border-slate-200 transition-all shadow-sm"
                                                            title="Xóa toàn bộ cấu hình đơn vị này"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setViewingUnitDetail(unitCode)}
                                                            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl border border-slate-200 font-black text-[10px] uppercase transition-all shadow-sm group"
                                                        >
                                                            <Eye size={14} className="text-[#059669]" />
                                                            Chi tiết
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ===== BATCH UPDATE MODAL (Tab 1) ===== */}
            {showBatchModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                        <div className="bg-[#059669] p-6 text-white text-center relative">
                            <button onClick={() => setShowBatchModal(false)} className="absolute right-4 top-4 hover:bg-white/20 p-1 rounded-lg transition-colors"><X size={20} /></button>
                            <Users className="mx-auto mb-3 opacity-80" size={40} />
                            <h3 className="text-xl font-black uppercase">Cập nhật hàng loạt</h3>
                            <p className="text-white/70 text-xs font-bold italic mt-1 uppercase">Đang tác động {selectedIds.length} bản ghi</p>
                        </div>
                        <div className="max-h-[70vh] space-y-6 overflow-y-auto p-5 sm:space-y-8 sm:p-8">
                            {/* Toggle switch between Khoa and Tổ */}
                            <div className="flex p-1 bg-slate-100 rounded-xl">
                                <button
                                    onClick={() => setConfigTarget('KHOA')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase transition-all ${configTarget === 'KHOA' ? 'bg-white text-[#059669] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <Building2 size={14} /> Các Khoa/Phòng
                                </button>
                                <button
                                    onClick={() => setConfigTarget('TO')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase transition-all ${configTarget === 'TO' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <Users size={14} /> Các Tổ chấm điểm
                                </button>
                            </div>

                            {configTarget === 'KHOA' ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Đơn vị Chủ trì</h4>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input type="checkbox" className="hidden" checked={isClearPhuTrach} onChange={(e) => { setIsClearPhuTrach(e.target.checked); if (e.target.checked) setBatchForm(f => ({ ...f, phu_trach: [] })); }} />
                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${isClearPhuTrach ? 'bg-red-500 border-red-500 text-white' : 'border-slate-300 group-hover:border-red-400'}`}>{isClearPhuTrach && <CheckCircle2 size={12} />}</div>
                                            <span className={`text-[10px] font-black uppercase ${isClearPhuTrach ? 'text-red-500' : 'text-slate-400'}`}>Xóa dữ liệu</span>
                                        </label>
                                    </div>
                                    <MultiSelect
                                        label=""
                                        options={units.map(u => ({ value: u.ma_don_vi, label: u.ten_don_vi }))}
                                        selectedValues={batchForm.phu_trach}
                                        onChange={(vals) => setBatchForm(prev => ({ ...prev, phu_trach: vals }))}
                                        disabled={isClearPhuTrach}
                                        placeholder="Chọn đơn vị chủ trì..."
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tổ phụ trách</h4>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input type="checkbox" className="hidden" checked={isClearToChamDiem} onChange={(e) => { setIsClearToChamDiem(e.target.checked); if (e.target.checked) setBatchForm(f => ({ ...f, to_cham_diem: [] })); }} />
                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${isClearToChamDiem ? 'bg-red-500 border-red-500 text-white' : 'border-slate-300 group-hover:border-red-400'}`}>{isClearToChamDiem && <CheckCircle2 size={12} />}</div>
                                            <span className={`text-[10px] font-black uppercase ${isClearToChamDiem ? 'text-red-500' : 'text-slate-400'}`}>Xóa dữ liệu</span>
                                        </label>
                                    </div>
                                    <MultiSelect
                                        label=""
                                        options={teams.map(t => ({ value: t, label: t }))}
                                        selectedValues={batchForm.to_cham_diem}
                                        onChange={(vals) => setBatchForm(prev => ({ ...prev, to_cham_diem: vals }))}
                                        disabled={isClearToChamDiem}
                                        placeholder="Chọn tổ chấm điểm..."
                                    />
                                </div>
                            )}

                            {configTarget === 'KHOA' && (
                                <>
                                    <div className="h-px bg-slate-100" />
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Đơn vị phối hợp</h4>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input type="checkbox" className="hidden" checked={isClearDonViPhoiHop} onChange={(e) => { setIsClearDonViPhoiHop(e.target.checked); if (e.target.checked) setBatchForm(f => ({ ...f, don_vi_phoi_hop: [] })); }} />
                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${isClearDonViPhoiHop ? 'bg-red-50 border-red-500 text-white' : 'border-slate-300 group-hover:border-red-400'}`}>{isClearDonViPhoiHop && <CheckCircle2 size={12} />}</div>
                                                <span className={`text-[10px] font-black uppercase ${isClearDonViPhoiHop ? 'text-red-500' : 'text-slate-400'}`}>Xóa dữ liệu</span>
                                            </label>
                                        </div>
                                        <MultiSelect
                                            label=""
                                            options={units.map(u => ({ value: u.ma_don_vi, label: u.ten_don_vi }))}
                                            selectedValues={batchForm.don_vi_phoi_hop}
                                            onChange={(vals) => setBatchForm(prev => ({ ...prev, don_vi_phoi_hop: vals }))}
                                            disabled={isClearDonViPhoiHop}
                                            placeholder="Chọn các đơn vị phối hợp..."
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
                                <button onClick={() => setShowBatchModal(false)} className="flex-1 px-6 py-4 border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase hover:bg-slate-50 transition-all">Hủy bỏ</button>
                                <button onClick={handleBatchUpdate} disabled={updating || (configTarget === 'KHOA' && !isClearPhuTrach && !isClearDonViPhoiHop && batchForm.phu_trach.length === 0 && batchForm.don_vi_phoi_hop.length === 0) || (configTarget === 'TO' && !isClearToChamDiem && batchForm.to_cham_diem.length === 0)}
                                    className="flex-[2] bg-[#059669] hover:bg-[#008800] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none">
                                    {updating ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    Xác nhận cập nhật
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* ===== COPY CONFIG MODAL (Tab 2) — full size with checkbox grid ===== */}
            {showCopyModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 max-h-[92vh]">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-5 text-white relative shrink-0 sm:px-8 sm:py-6">
                            <button onClick={() => setShowCopyModal(false)} className="absolute right-5 top-5 hover:bg-white/20 p-1.5 rounded-lg transition-colors"><X size={20} /></button>
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="bg-white/20 p-3 rounded-xl"><Copy size={28} /></div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-wide">Cấu hình cho khoa khác</h3>
                                    <p className="text-white/70 text-xs font-bold mt-0.5">
                                        Sao chép tiêu chí từ: <span className="font-black text-white">{selectedSummaryUnits.join(', ')}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Info notice */}
                        <div className="px-5 pt-5 pb-0 shrink-0 sm:px-8">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
                                <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
                                <p className="text-[11px] text-blue-700 font-bold">
                                    <span className="font-black uppercase">Ghi thêm – không ghi đè: </span>
                                    Đơn vị tích chọn sẽ được <strong>thêm vào</strong> cột Phụ trách. Dữ liệu hiện tại được giữ nguyên.
                                </p>
                            </div>
                        </div>

                        {/* Khoi Filter */}
                        <div className="px-5 pt-4 shrink-0 flex flex-wrap gap-1.5 items-center sm:px-8">
                            <span className="text-[10px] font-black text-slate-400 uppercase mr-1">Lọc theo khối:</span>
                            {['Tất cả', ...Array.from(new Set(units.map(u => u.khoi).filter(Boolean)))].sort().map(khoi => (
                                <button
                                    key={khoi}
                                    onClick={() => setCopyModalKhoi(khoi!)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all border ${
                                        copyModalKhoi === khoi
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'
                                    }`}
                                >
                                    {khoi === 'Tất cả' ? 'Tất cả' : khoi}
                                </button>
                            ))}
                        </div>

                        {/* Scrollable unit checkbox grid */}
                        <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0 sm:px-8">
                            <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Chọn đơn vị sẽ thêm vào Phụ trách</h4>
                                <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
                                    {copyTargetUnits.length > 0 && (
                                        <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full">{copyTargetUnits.length} đã chọn</span>
                                    )}
                                    <button
                                        onClick={() => {
                                            const currentFiltered = units.filter(u => copyModalKhoi === 'Tất cả' || u.khoi === copyModalKhoi).map(u => u.ma_don_vi);
                                            const allVisibleSelected = currentFiltered.every(code => copyTargetUnits.includes(code));

                                            if (allVisibleSelected) {
                                                // Unselect only the visible ones
                                                setCopyTargetUnits(prev => prev.filter(code => !currentFiltered.includes(code)));
                                            } else {
                                                // Select all visible ones (keep existing selections)
                                                setCopyTargetUnits(prev => Array.from(new Set([...prev, ...currentFiltered])));
                                            }
                                        }}
                                        className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase underline underline-offset-2"
                                    >
                                        {(() => {
                                            const currentFiltered = units.filter(u => copyModalKhoi === 'Tất cả' || u.khoi === copyModalKhoi).map(u => u.ma_don_vi);
                                            return currentFiltered.length > 0 && currentFiltered.every(code => copyTargetUnits.includes(code))
                                                ? 'Bỏ chọn tất cả (Khối này)'
                                                : 'Chọn tất cả (Khối này)';
                                        })()}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
                                {units
                                    .filter(u => copyModalKhoi === 'Tất cả' || u.khoi === copyModalKhoi)
                                    .map(unit => {
                                    const isChecked = copyTargetUnits.includes(unit.ma_don_vi);
                                    return (
                                        <button
                                            key={unit.ma_don_vi}
                                            onClick={() => setCopyTargetUnits(prev => prev.includes(unit.ma_don_vi) ? prev.filter(c => c !== unit.ma_don_vi) : [...prev, unit.ma_don_vi])}
                                            className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl border-2 text-center transition-all font-black text-[11px] uppercase tracking-wide cursor-pointer ${
                                                isChecked
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                                            }`}
                                        >
                                            {isChecked
                                                ? <CheckSquare size={14} className="shrink-0" />
                                                : <Square size={14} className="shrink-0 opacity-40" />
                                            }
                                            <span className="leading-tight break-all">{unit.ma_don_vi}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sticky footer */}
                        <div className="px-5 py-5 border-t border-slate-100 bg-slate-50 shrink-0 sm:px-8">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <button onClick={() => setShowCopyModal(false)} className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase hover:bg-white transition-all">Hủy bỏ</button>
                                <button
                                    onClick={handleCopyToOtherUnits}
                                    disabled={copying || copyTargetUnits.length === 0}
                                    className="flex-[3] bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
                                >
                                    {copying
                                        ? <><Loader2 className="animate-spin" size={16} /> Đang lưu...</>
                                        : <><Copy size={16} /> Xác nhận thêm {copyTargetUnits.length > 0 ? `${copyTargetUnits.length} đơn vị` : 'đơn vị'}</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== UNIT DETAIL MODAL (Tab 2) ===== */}
            {viewingUnitDetail && (
                <UnitDetailModal
                    unitCode={viewingUnitDetail}
                    data={unitGroupedData[viewingUnitDetail] || []}
                    onClose={() => setViewingUnitDetail(null)}
                    onRemoveChapter={(phan, chuong) => handleRemoveChapterTarget(viewingUnitDetail, phan, chuong)}
                />
            )}
        </div>
    );
};

// Placeholder for movement - will delete old location below

export default Criteria83Config;
