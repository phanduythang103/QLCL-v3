import React from 'react';
import {
  CheckCircle2, FileText, ListFilter, Users2
} from 'lucide-react';
import { useAssessment } from './hooks/useAssessment';
import { AssessmentList } from './sub-components/AssessmentList';
import { AssessmentDetail } from './sub-components/AssessmentDetail';
import { AssessmentForm } from './sub-components/AssessmentForm';
import { Criteria83DataView } from './sub-components/Criteria83DataView';
import { AssessmentReports } from './sub-components/AssessmentReports';
import { TeamAssessmentModule } from './sub-components/TeamAssessmentModule';
import { TeamSelectModal } from './sub-components/TeamSelectModal';
import { ActiveTab } from './types';

export const AssessmentModule: React.FC = () => {
  const {
    isAdmin, user, uDept,
    activeTab, setActiveTab,
    viewMode, setViewMode,
    sheetList, loading, saving,
    groupedCriteria, results, setResults,
    editingPhieuId, viewingPhieuId, viewingData,
    units, fontSize, setFontSize,
    ngayDanhGia, setNgayDanhGia,
    nguoiDanhGia, setNguoiDanhGia,
    donViDuocDanhGia, setDonViDuocDanhGia,
    expandedPhan, setExpandedPhan,
    expandedChuong, setExpandedChuong,
    expandedTieuChi, setExpandedTieuChi,
    userTeams, showTeamSelect, setShowTeamSelect,
    handleAddNew, handleEditSheet, handleViewSheet, handleSaveAssessment,
    handleStartAssessment, handleDeleteSheet
  } = useAssessment();

  const [isSubModuleActive, setIsSubModuleActive] = React.useState(false);

  const handleScoreChange = (ma: string, field: any, value: any) => {
    setResults(prev => ({
      ...prev,
      [ma]: {
        ...prev[ma],
        [field]: value
      }
    }));
  };

  const navItems = [
    {
      id: 'QUALITY_ASSESSMENT' as ActiveTab,
      name: 'Chấm điểm 83 Tiêu chí',
      description: 'Thực hiện đánh giá chất lượng bệnh viện theo Bộ tiêu chí 83 tiêu chí của Bộ Y tế.',
      icon: <CheckCircle2 size={32} />,
      color: '#34d399',
      bgColor: '#ecfdf5',
      show: true
    },
    {
      id: 'ASSESSMENT_REPORTS' as ActiveTab,
      name: 'Các bộ tiêu chuẩn khác',
      description: 'Đánh giá theo các bộ tiêu chuẩn chuyên ngành, tiêu chuẩn quốc tế và quy trình nội bộ.',
      icon: <FileText size={32} />,
      color: '#60a5fa',
      bgColor: '#eff6ff',
      show: true
    },
    {
      id: 'TEAM_ASSESSMENT' as ActiveTab,
      name: 'Chấm điểm theo tổ',
      description: 'Phối hợp đánh giá chất lượng theo các tổ chuyên môn được phân công.',
      icon: <Users2 size={32} />,
      color: '#fbbf24',
      bgColor: '#fffbeb',
      show: isAdmin || userTeams.length > 0
    },
    {
      id: 'CRITERIA_83' as ActiveTab,
      name: 'Danh mục 83 Tiêu chí',
      description: 'Quản lý và tra cứu chi tiết nội dung Bộ tiêu chí 83 tiêu chí chất lượng.',
      icon: <ListFilter size={32} />,
      color: '#f472b6',
      bgColor: '#fdf2f8',
      show: isAdmin
    }
  ];

  return (
    <div className="space-y-6 min-h-[600px]">
      {/* Navigation Dashboard - Shown when activeTab is null and in LIST mode */}
      {viewMode === 'LIST' && activeTab === null && (
        <div className="animate-in fade-in zoom-in-95 duration-700">
          {/* Desktop Dashboard */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {navItems.filter(i => i.show).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-left flex flex-col items-start gap-6 group"
              >
                <div
                  className="p-4 rounded-2xl shadow-sm transition-transform group-hover:scale-110"
                  style={{ backgroundColor: item.bgColor, color: item.color }}
                >
                  {item.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="font-black text-slate-800 uppercase text-sm tracking-tight">{item.name}</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{item.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Mobile Dashboard */}
          <div className="md:hidden bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-50">
            <div className="grid grid-cols-2 gap-y-12 gap-x-6">
              {navItems.filter(i => i.show).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="flex flex-col items-center gap-4 text-center active:scale-95 transition-all group"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300"
                    style={{ backgroundColor: item.bgColor, color: item.color }}
                  >
                    {React.cloneElement(item.icon as any, { size: 32 })}
                  </div>
                  <span className="font-black text-slate-700 uppercase text-[10px] leading-tight tracking-tighter px-1">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header with Back button when in sub-module */}
      {viewMode === 'LIST' && activeTab !== null && (
        <div className="flex items-center justify-between mb-4 animate-in slide-in-from-left-4 duration-500">
          <button
            onClick={() => setActiveTab(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-[#009900] font-black text-[10px] uppercase transition-all bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm"
          >
            <CheckCircle2 size={14} /> Quay lại Menu Đánh giá
          </button>

          <div className="flex items-center gap-2 bg-[#009900]/5 text-[#009900] px-4 py-2 rounded-xl border border-[#009900]/10">
            <span className="font-black text-[10px] uppercase truncate max-w-[150px] md:max-w-none">
              {navItems.find(i => i.id === activeTab)?.name}
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={viewMode === 'LIST' ? "min-h-[400px]" : ""}>
        {viewMode === 'FORM' ? (
          <AssessmentForm
            ngayDanhGia={ngayDanhGia}
            setNgayDanhGia={setNgayDanhGia}
            nguoiDanhGia={nguoiDanhGia}
            setNguoiDanhGia={setNguoiDanhGia}
            donViDuocDanhGia={donViDuocDanhGia}
            setDonViDuocDanhGia={setDonViDuocDanhGia}
            units={units}
            fontSize={fontSize}
            setFontSize={setFontSize}
            groupedCriteria={groupedCriteria}
            results={results}
            onScoreChange={handleScoreChange}
            onSave={handleSaveAssessment}
            onCancel={() => setViewMode('LIST')}
            saving={saving}
            isAdmin={isAdmin}
            expandedPhan={expandedPhan}
            setExpandedPhan={setExpandedPhan}
            expandedChuong={expandedChuong}
            setExpandedChuong={setExpandedChuong}
            expandedTieuChi={expandedTieuChi}
            setExpandedTieuChi={setExpandedTieuChi}
          />
        ) : viewMode === 'DETAIL' && viewingPhieuId ? (
          <AssessmentDetail
            phieuId={viewingPhieuId}
            data={viewingData}
            onClose={() => setViewMode('LIST')}
            sheetInfo={sheetList.find(s => s.phieu_id === viewingPhieuId)}
          />
        ) : activeTab !== null ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'CRITERIA_83' && <Criteria83DataView />}

            {activeTab === 'TEAM_ASSESSMENT' && (
              <TeamAssessmentModule
                userTeams={userTeams}
                isAdmin={isAdmin}
                user={user}
                uDept={uDept}
                sheetList={sheetList}
                loading={loading}
                onAddNew={handleAddNew}
                onEdit={handleEditSheet}
                onView={handleViewSheet}
                onDelete={(id: string) => {
                  if (confirm("Xác nhận xóa phiếu chấm điểm của tổ?")) {
                    handleDeleteSheet(id);
                  }
                }}
              />
            )}

            {activeTab === 'ASSESSMENT_REPORTS' && (
              <AssessmentReports
                setViewMode={setViewMode}
                onSubModuleChange={setIsSubModuleActive}
              />
            )}

            {activeTab === 'QUALITY_ASSESSMENT' && (
              <AssessmentList
                sheetList={sheetList}
                loading={loading}
                uDept={uDept}
                isAdmin={isAdmin}
                currUserId={user?.id}
                onAddNew={handleAddNew}
                onEdit={handleEditSheet}
                onView={handleViewSheet}
                onDelete={handleDeleteSheet}
              />
            )}
          </div>
        ) : null}
      </div>

      {/* Team Selection Modal */}
      {showTeamSelect && (
        <TeamSelectModal
          teams={userTeams}
          onSelect={handleStartAssessment}
          onClose={() => setShowTeamSelect(false)}
          hidePersonalOption={activeTab === 'TEAM_ASSESSMENT'}
        />
      )}
    </div>
  );
};
