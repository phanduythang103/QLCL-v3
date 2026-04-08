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

  return (
    <div className="space-y-6">
      {/* Navigation Tabs - Hidden in Form/Detail mode OR when a sub-module is active */}
      {viewMode === 'LIST' && !isSubModuleActive && (
        <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('QUALITY_ASSESSMENT')} 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${
              activeTab === 'QUALITY_ASSESSMENT' ? 'bg-[#009900] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 size={18} /> Chấm điểm 83 Tiêu chí
          </button>
          <button 
            onClick={() => setActiveTab('ASSESSMENT_REPORTS')} 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${
              activeTab === 'ASSESSMENT_REPORTS' ? 'bg-[#009900] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <FileText size={18} /> Các bộ tiêu chuẩn khác
          </button>
          {(isAdmin || userTeams.length > 0) && (
            <button 
              onClick={() => setActiveTab('TEAM_ASSESSMENT')} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${
                activeTab === 'TEAM_ASSESSMENT' ? 'bg-[#009900] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Users2 size={18} /> Chấm điểm theo tổ
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('CRITERIA_83')} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${
                activeTab === 'CRITERIA_83' ? 'bg-[#009900] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <ListFilter size={18} /> Danh mục 83 Tiêu chí
            </button>
          )}
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
        ) : (
          <>
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
          </>
        )}
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
