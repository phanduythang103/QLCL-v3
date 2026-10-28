import React, { useState } from 'react';
import { StaffSatisfactionSurvey } from '../types/staffSatisfaction';
import {
  STAFF_BANG_CAP, STAFF_CHUYEN_MON, STAFF_PHAM_VI, STAFF_SECTIONS, STAFF_VI_TRI, ChoiceOption,
} from '../types/staffSatisfactionMauByt';
import { firstUnanswered } from './PatientSatisfactionMauByt';
import { PaperFormShell } from './SurveyPaperKit';
import { StaffSurveyPaper } from './StaffSurveyPaper';

interface Props {
  initialData?: StaffSatisfactionSurvey;
  readOnly?: boolean;
  onSave: (data: StaffSatisfactionSurvey) => void;
  onCancel: () => void;
  saving: boolean;
  isPublic?: boolean;
}

export const StaffSatisfactionForm: React.FC<Props> = ({
  initialData,
  readOnly = false,
  onSave,
  onCancel,
  saving,
  isPublic = false
}) => {
  const [formData, setFormData] = useState<StaffSatisfactionSurvey>(initialData || {});

  const handleChange = (field: string, value: any) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /** Lựa chọn "Khác" phải ghi rõ; lựa chọn khác thì xoá phần ghi rõ cũ */
  const otherOf = (field: 'chuyen_mon' | 'bang_cap' | 'vi_tri' | 'pham_vi', options: ChoiceOption[]) =>
    options.find(o => o.value === formData[field])?.other ? (formData[`${field}_other`] || '').trim() : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = formData;

    if (!d.gender) return alert('Chưa nhập thông tin: A1. Giới tính');
    if (!d.age) return alert('Chưa nhập thông tin: A2. Tuổi');
    const choices: [keyof StaffSatisfactionSurvey, string, ChoiceOption[] | null][] = [
      ['chuyen_mon', 'A3. Chuyên môn đào tạo chính', STAFF_CHUYEN_MON],
      ['bang_cap', 'A4. Bằng cấp cao nhất', STAFF_BANG_CAP],
      ['nam_nganh_y', 'A5. Số năm công tác trong ngành Y', null],
      ['nam_tai_bv', 'A6. Số năm công tác tại bệnh viện', null],
      ['vi_tri', 'A7. Vị trí công tác hiện tại', STAFF_VI_TRI],
      ['pham_vi', 'A8. Phạm vi hoạt động chuyên môn', STAFF_PHAM_VI],
      ['kiem_nhiem', 'A9. Kiêm nhiệm', null],
      ['so_lan_truc', 'A10. Số lần trực trong một tháng', null],
    ];
    for (const [field, label, options] of choices) {
      if (d[field] == null || d[field] === '') return alert(`Chưa nhập thông tin: ${label}`);
      if (options?.find(o => o.value === d[field])?.other && !(d as any)[`${field}_other`]?.trim()) {
        return alert(`Vui lòng ghi rõ lựa chọn "Khác" ở câu ${label}`);
      }
    }

    const missing = firstUnanswered(STAFF_SECTIONS, d);
    if (missing) return alert(`Chưa đánh giá câu ${missing.code.toUpperCase()}: ${missing.text}`);

    onSave({
      ...d,
      chuyen_mon_other: otherOf('chuyen_mon', STAFF_CHUYEN_MON),
      bang_cap_other: otherOf('bang_cap', STAFF_BANG_CAP),
      vi_tri_other: otherOf('vi_tri', STAFF_VI_TRI),
      pham_vi_other: otherOf('pham_vi', STAFF_PHAM_VI),
    });
  };

  return (
    <PaperFormShell isPublic={isPublic} readOnly={readOnly} saving={saving} onCancel={onCancel} onSubmit={handleSubmit}>
      <StaffSurveyPaper data={formData} readOnly={readOnly} onChange={handleChange} />
    </PaperFormShell>
  );
};
