import React, { useState, useEffect } from 'react';
import { fetchChiSoQlcl, ChiSoQlcl } from '../readChiSoQlcl';
import { VAPModule } from './VAPModule';
import { KtcmModule } from './KtcmModule';
import { PtLoai2Module } from './PtLoai2Module';
import { NKVMModule } from './NKVMModule';
import { SeriousIncidentModule } from './SeriousIncidentModule';
import { FacilitySecurityModule } from './FacilitySecurityModule';
import { ExamTimeModule } from './ExamTimeModule';
import { LengthOfStayModule } from './LengthOfStayModule';
import { BedUsageModule } from './BedUsageModule';
import { ORUsageModule } from './ORUsageModule';
import { NurseRatioModule } from './NurseRatioModule';
import { HandHygieneModule } from './HandHygieneModule';
import IndicatorConfigModule from './IndicatorConfigModule';
import IndicatorOverviewModule from './IndicatorOverviewModule';
import { useIndicators } from './IndicatorsContext';
import { IndicatorCategory } from '../types';

export const IndicatorsModule: React.FC = () => {
  const { category, setCategory } = useIndicators();
  const [indicators, setIndicators] = useState<ChiSoQlcl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCategoryTitle = (cat: IndicatorCategory) => {
    switch (cat) {
      case 'KTCM': return 'Thực hiện kỹ thuật chuyên môn theo tuyến';
      case 'SURGERY_II': return 'Phẫu thuật loại II trở lên';
      case 'SSI': return 'Nhiễm khuẩn vết mổ';
      case 'VAP': return 'Viêm phổi do nhiễm khuẩn bệnh viện';
      case 'SEVERE_INCIDENT': return 'Sự cố y khoa nghiêm trọng';
      case 'SEVERE_NON_MEDICAL': return 'Sự cố ngoài y khoa nghiêm trọng';
      case 'AVG_EXAM_TIME': return 'Thời gian khám bệnh trung bình';
      case 'AVG_STAY_TIME': return 'Thời gian nằm viện trung bình';
      case 'BED_USAGE': return 'Tỷ lệ sử dụng giường';
      case 'OR_USAGE': return 'Tỷ lệ sử dụng phòng mổ';
      case 'NURSE_PATIENT_RATIO': return 'Tỷ lệ Điều dưỡng trên người bệnh';
      case 'HAND_HYGIENE': return 'Tỷ lệ tuân thủ vệ sinh tay';
      case 'INDICATOR_CONFIG': return 'Cấu hình chỉ số chất lượng';
      case 'OVERVIEW': return 'Tổng quan Chỉ số QLCL';
      default: return null;
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChiSoQlcl();
      setIndicators(data);
    } catch (err) {
      setError('Không thể tải dữ liệu chỉ số. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          {category && category !== 'OVERVIEW' && category !== 'SURGERY_II' && category !== 'KTCM' && category !== 'SSI' && category !== 'VAP' && category !== 'SEVERE_INCIDENT' && category !== 'AVG_EXAM_TIME' && category !== 'AVG_STAY_TIME' && category !== 'BED_USAGE' && category !== 'OR_USAGE' && category !== 'NURSE_PATIENT_RATIO' && category !== 'HAND_HYGIENE' && category !== 'INDICATOR_CONFIG' && category !== 'SEVERE_NON_MEDICAL' && (
            <h2 className="hidden md:block text-main-title font-bold text-[#059669] uppercase animate-in fade-in slide-in-from-left-4 duration-300">
              {getCategoryTitle(category)}
            </h2>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      {category === 'VAP' ? (
        <VAPModule />
      ) : category === 'KTCM' ? (
        <KtcmModule />
      ) : category === 'SURGERY_II' ? (
        <PtLoai2Module />
      ) : category === 'SSI' ? (
        <NKVMModule />
      ) : category === 'SEVERE_INCIDENT' ? (
        <SeriousIncidentModule />
      ) : category === 'SEVERE_NON_MEDICAL' ? (
        <FacilitySecurityModule />
      ) : category === 'AVG_EXAM_TIME' ? (
        <ExamTimeModule />
      ) : category === 'AVG_STAY_TIME' ? (
        <LengthOfStayModule />
      ) : category === 'BED_USAGE' ? (
        <BedUsageModule />
      ) : category === 'OR_USAGE' ? (
        <ORUsageModule />
      ) : category === 'NURSE_PATIENT_RATIO' ? (
        <NurseRatioModule />
      ) : category === 'HAND_HYGIENE' ? (
        <HandHygieneModule />
      ) : category === 'INDICATOR_CONFIG' ? (
        <IndicatorConfigModule />
      ) : (
        <IndicatorOverviewModule />
      )}
    </div>
  );
};
