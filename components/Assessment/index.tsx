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

const naturalSort = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

export const AssessmentModule: React.FC = () => {
  const {
    isAdmin, user, uDept,
    activeTab, setActiveTab,
    viewMode, setViewMode,
    sheetList, loading, saving,
    groupedCriteria, criteria, results, setResults,
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

  const handleBack = () => {
    if (viewMode !== 'LIST') {
      setViewMode('LIST');
      return;
    }

    setActiveTab(null);
  };

  React.useEffect(() => {
    const handleMobileBack = (event: Event) => {
      if (isSubModuleActive) return;
      if (viewMode !== 'LIST') {
        event.preventDefault();
        setViewMode('LIST');
        return;
      }
      if (activeTab !== null) {
        event.preventDefault();
        setActiveTab(null);
      }
    };

    window.addEventListener('app-mobile-back', handleMobileBack);
    return () => window.removeEventListener('app-mobile-back', handleMobileBack);
  }, [activeTab, isSubModuleActive, setActiveTab, setViewMode, viewMode]);

  const handleScoreChange = (ma: string, field: any, value: any) => {
    setResults(prev => {
      const nextResults = {
        ...prev,
        [ma]: {
          ...prev[ma],
          [field]: value
        }
      };

      if (field !== 'dat_muc' || value !== 'Đạt') return nextResults;

      const currentItem = criteria.find(item => item.ma_tieu_muc === ma);
      if (!currentItem) return nextResults;

      const itemsInSameCriterion = criteria
        .filter(item =>
          item.phan === currentItem.phan &&
          item.chuong === currentItem.chuong &&
          item.tieu_chi === currentItem.tieu_chi &&
          item.ma_tieu_muc
        )
        .sort((a, b) => naturalSort(a.ma_tieu_muc!, b.ma_tieu_muc!));
      const currentIndex = itemsInSameCriterion.findIndex(item => item.ma_tieu_muc === ma);
      if (currentIndex <= 0) return nextResults;

      itemsInSameCriterion.slice(0, currentIndex).forEach(item => {
        const itemCode = item.ma_tieu_muc!;
        nextResults[itemCode] = {
          ...prev[itemCode],
          dat_muc: 'Đạt'
        };
      });

      return nextResults;
    });
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
          <div className="hidden lg:grid lg:grid-cols-4 gap-6">
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

          {/* Tablet & Mobile Function Grid */}
          <div className="lg:hidden rounded-[2rem] border border-slate-50 bg-white p-4 shadow-xl shadow-slate-200/40">
            <div className="function-icon-grid">
              {navItems.filter(i => i.show).map((item, index) => {
                const palette = [
                  { bg: 'bg-emerald-300', icon: 'text-emerald-500' },
                  { bg: 'bg-blue-300', icon: 'text-blue-500' },
                  { bg: 'bg-amber-300', icon: 'text-amber-500' },
                  { bg: 'bg-pink-300', icon: 'text-pink-500' },
                ][index % 4];

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="function-icon-tile"
                  >
                    <span className={`function-icon-box ${palette.bg}`}>
                      {React.cloneElement(item.icon as any, { size: 28, className: palette.icon })}
                    </span>
                    <span className="function-icon-label">{item.name}</span>
                  </button>
                );
              })}
            </div>
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
            onEdit={(() => {
              const sheet = sheetList.find(item => item.phieu_id === viewingPhieuId);
              return sheet && (
                (user?.id && sheet.nguoi_tao_id === user.id) ||
                (!sheet.nguoi_tao_id && sheet.nguoi_danh_gia?.trim().toLowerCase() === user?.full_name?.trim().toLowerCase())
              )
                ? () => handleEditSheet(sheet)
                : undefined;
            })()}
            sheetInfo={sheetList.find(s => s.phieu_id === viewingPhieuId)}
          />
        ) : activeTab !== null ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'CRITERIA_83' && <Criteria83DataView onBack={handleBack} />}

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
                onBack={handleBack}
              />
            )}

            {activeTab === 'ASSESSMENT_REPORTS' && (
              <AssessmentReports
                setViewMode={setViewMode}
                onSubModuleChange={setIsSubModuleActive}
                onBack={handleBack}
              />
            )}

            {activeTab === 'QUALITY_ASSESSMENT' && (
              <AssessmentList
                sheetList={sheetList}
                loading={loading}
                uDept={uDept}
                isAdmin={isAdmin}
                currUserId={user?.id}
                currUserName={user?.full_name}
                assessmentType="UNIT"
                onAddNew={handleAddNew}
                onEdit={handleEditSheet}
                onView={handleViewSheet}
                onDelete={handleDeleteSheet}
                onBack={handleBack}
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
