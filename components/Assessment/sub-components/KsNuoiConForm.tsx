import React, { useState } from 'react';
import {
  ArrowLeft, Save, User, Phone, MapPin, Calendar, Clock, Baby, Info
} from 'lucide-react';
import { KsNuoiConRecord } from '../types/ksNuoiCon';

interface Props {
  initialData?: KsNuoiConRecord;
  onSave: (data: KsNuoiConRecord) => void;
  onCancel: () => void;
  saving: boolean;
  isPublic?: boolean;
}

const DELIVERY_TYPES = [
  { value: 1, label: 'Đẻ thường' },
  { value: 2, label: 'Mổ đẻ' }
];

const OPTIONS = {
  see_policy: [
    'Khoa khám',
    'Phòng chờ sinh',
    'Khoa sau sinh',
    'Phòng tư vấn',
    'Nơi khác',
    'Không thấy'
  ],
  see_media: [
    'Khoa khám',
    'Phòng chờ sinh',
    'Khoa sau sinh',
    'Buồng bệnh',
    'Phòng tư vấn',
    'Khác',
    'Không thấy'
  ],
  consultation_time: [
    'Không tư vấn',
    'Khám thai',
    'Trước sinh',
    'Sau sinh',
    'Khác'
  ],
  reason_no_consult: [
    'Không khám tại BV',
    'Sinh cấp cứu',
    'NVYT bỏ qua',
    'Khác',
    'Có tư vấn'
  ],
  cord_cut: [
    'Cắt ngay',
    'Cắt chậm',
    'Không nhớ'
  ],
  skin_to_skin: [
    'Có',
    'Không'
  ],
  first_breastfeed: [
    'Ngay sau sinh',
    '< 30 phút',
    '< 1 giờ',
    '< 2 giờ',
    '2–24 giờ',
    '> 1 ngày',
    'Không bú mẹ',
    'Khác'
  ],
  support_person: [
    'Điều dưỡng/hộ sinh',
    'Bác sĩ',
    'Người nhà',
    'Khác',
    'Không hỗ trợ'
  ],
  support_type: [
    'Hướng dẫn bú',
    'Mát-xa vú',
    'Vắt sữa',
    'Thông tắc tia sữa',
    'Khác'
  ],
  other_food: [
    'Chỉ bú mẹ',
    'Nước',
    'Sữa mẹ khác',
    'Sữa công thức',
    'Khác'
  ],
  suggest_formula: [
    'Có',
    'Không'
  ]
};

export const KsNuoiConForm: React.FC<Props> = ({
  initialData,
  onSave,
  onCancel,
  saving,
  isPublic = false
}) => {
  const [formData, setFormData] = useState<KsNuoiConRecord>(
    initialData || {
      hospital: '',
      survey_date: new Date().toISOString().split('T')[0],
      department: '',
      department_code: '',
      patient_id: '',
      age: 0,
      phone: '',
      visit_count: 0,
      days_in_hospital: 0,
      birth_count: 0,
      delivery_type: null,
      baby_birth_date: new Date().toISOString().split('T')[0],
      see_policy: [],
      see_media: [],
      consultation_time: [],
      reason_no_consult: null,
      cord_cut: null,
      skin_to_skin: null,
      first_breastfeed: null,
      support_person: [],
      support_type: [],
      other_food: null,
      suggest_formula: null,
      benefits: '',
      exclusive_months: null,
      total_months: null,
      suggestions: ''
    }
  );

  const handleChange = (field: keyof KsNuoiConRecord, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleArray = (field: keyof KsNuoiConRecord, value: number) => {
    const currentArray = (formData[field] as number[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value].sort((a, b) => a - b);
    handleChange(field, newArray);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.hospital?.trim()) return alert('Chưa nhập thông tin: Bệnh viện');
    if (!formData.department?.trim()) return alert('Chưa nhập thông tin: Khoa');
    if (!formData.department_code?.trim()) return alert('Chưa nhập thông tin: Mã khoa');
    if (!formData.patient_id?.trim()) return alert('Chưa nhập thông tin: Mã người bệnh');
    if (!formData.age) return alert('Chưa nhập thông tin: Tuổi');
    if (!formData.phone?.trim()) return alert('Chưa nhập thông tin: Số điện thoại');
    if (formData.delivery_type === null) return alert('Chưa nhập thông tin: Hình thức sinh');

    // Section III validation
    if (!formData.see_policy?.length) return alert('Chưa chọn thông tin: Quy định NCBSM');
    if (!formData.see_media?.length) return alert('Chưa chọn thông tin: Tài liệu truyền thông');
    if (!formData.consultation_time?.length) return alert('Chưa chọn thông tin: Thời điểm được tư vấn');
    if (formData.reason_no_consult === null) return alert('Chưa chọn thông tin: Lý do không được tư vấn');
    if (formData.cord_cut === null) return alert('Chưa chọn thông tin: Thời điểm cắt dây rốn');
    if (formData.skin_to_skin === null) return alert('Chưa chọn thông tin: Da kề da');
    if (formData.first_breastfeed === null) return alert('Chưa chọn thông tin: Thời điểm bú lần đầu');
    if (!formData.support_person?.length) return alert('Chưa chọn thông tin: Người hỗ trợ bú');
    if (!formData.support_type?.length) return alert('Chưa chọn thông tin: Hình thức hỗ trợ');
    if (formData.other_food === null) return alert('Chưa chọn thông tin: Ăn thêm ngoài sữa mẹ');
    if (formData.suggest_formula === null) return alert('Chưa chọn thông tin: Gợi ý sữa công thức');

    // Section IV validation
    if (!formData.benefits?.trim()) return alert('Chưa nhập thông tin: Lợi ích của sữa mẹ');
    if (formData.exclusive_months === null) return alert('Chưa nhập thông tin: Dự định bú mẹ hoàn toàn');
    if (formData.total_months === null) return alert('Chưa nhập thông tin: Tổng thời gian bú');

    onSave(formData);
  };

  const themeColor = "#009900";

  return (
    <div className="w-full pb-20 animate-in fade-in duration-700 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="text-white p-6 md:p-10 rounded-3xl shadow-2xl text-center space-y-4 relative overflow-hidden mb-8 mx-auto max-w-6xl mt-4" style={{ backgroundColor: themeColor }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        {!isPublic && (
          <div className="flex justify-start mb-4 relative z-10">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 text-white/80 hover:text-white font-black text-[10px] uppercase transition-all"
            >
              <ArrowLeft size={16} /> Quay lại
            </button>
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase relative z-10">
          Phiếu Khảo sát thực hiện nuôi con bằng sữa mẹ
        </h1>
        <p className="text-sm opacity-90 max-w-2xl mx-auto font-medium relative z-10">
          Phiếu thu thập thông tin về thực hành nuôi con bằng sữa mẹ tại bệnh viện nhằm cải thiện chất lượng phục vụ và hỗ trợ mẹ bé tốt hơn.
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 px-4">
        {/* THÔNG TIN HÀNH CHÍNH */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#009900] rounded-full"></div>
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">I. Thông tin hành chính</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={12} /> Bệnh viện
              </label>
              <input
                type="text"
                value={formData.hospital}
                onChange={(e) => handleChange('hospital', e.target.value)}
                placeholder="Tên bệnh viện..."
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar size={12} /> Ngày khảo sát
              </label>
              <input
                type="date"
                value={formData.survey_date}
                onChange={(e) => handleChange('survey_date', e.target.value)}
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={12} /> Khoa
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="Tên khoa..."
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock size={12} /> Mã khoa
              </label>
              <input
                type="text"
                value={formData.department_code}
                onChange={(e) => handleChange('department_code', e.target.value)}
                placeholder="Mã khoa..."
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <User size={12} /> Mã người bệnh
              </label>
              <input
                type="text"
                value={formData.patient_id}
                onChange={(e) => handleChange('patient_id', e.target.value)}
                placeholder="Nhập mã NB..."
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </section>

        {/* THÔNG TIN NGƯỜI BỆNH */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#009900] rounded-full"></div>
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">II. Thông tin người bệnh & Trẻ</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <User size={12} /> Tuổi
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Phone size={12} /> Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="0xxx..."
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar size={12} /> Ngày sinh của trẻ
              </label>
              <input
                type="date"
                value={formData.baby_birth_date}
                onChange={(e) => handleChange('baby_birth_date', e.target.value)}
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider">Hình thức sinh</label>
              <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-200">
                {DELIVERY_TYPES.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange('delivery_type', opt.value)}
                    className={`flex-1 py-3 rounded-xl text-[13px] font-black uppercase transition-all ${formData.delivery_type === opt.value
                      ? 'bg-[#009900] text-white shadow-md'
                      : 'text-slate-500 hover:bg-slate-100'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock size={12} /> Lần nhập viện (lần)
              </label>
              <input type="number" value={formData.visit_count} onChange={e => handleChange('visit_count', parseInt(e.target.value))} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock size={12} /> Số ngày nằm viện
              </label>
              <input type="number" value={formData.days_in_hospital} onChange={e => handleChange('days_in_hospital', parseInt(e.target.value))} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Baby size={12} /> Số lần sinh
              </label>
              <input type="number" value={formData.birth_count} onChange={e => handleChange('birth_count', parseInt(e.target.value))} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none" />
            </div>
          </div>
        </section>

        {/* THỰC HÀNH NUÔI CON */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#009900] rounded-full"></div>
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">III. Thực hành nuôi con bằng sữa mẹ</h3>
          </div>

          <div className="space-y-12">
            {/* 1. see_policy */}
            <div className="space-y-4">
              <p className="text-[17px] font-black text-slate-800">1. Anh/Chị đã được nghe/thấy quy định nào về NCBSM tại bệnh viện? (Chọn nhiều)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {OPTIONS.see_policy.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleToggleArray('see_policy', idx + 1)}
                    className={`p-4 rounded-2xl border text-left text-sm font-bold transition-all flex items-start gap-3 ${formData.see_policy?.includes(idx + 1)
                      ? 'border-[#009900] bg-emerald-50 text-[#009900] ring-1 ring-[#009900]'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-emerald-200'
                      }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${formData.see_policy?.includes(idx + 1) ? 'bg-[#009900] border-[#009900]' : 'border-slate-300'}`}>
                      {formData.see_policy?.includes(idx + 1) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. see_media */}
            <div className="space-y-4">
              <p className="text-[17px] font-black text-slate-800">2. Anh/Chị thấy các tài liệu truyền thông về NCBSM ở đâu? (Chọn nhiều)</p>
              <div className="flex flex-wrap gap-2">
                {OPTIONS.see_media.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleToggleArray('see_media', idx + 1)}
                    className={`px-4 py-2 rounded-full border text-[13px] font-black uppercase transition-all ${formData.see_media?.includes(idx + 1)
                      ? 'border-[#009900] bg-[#009900] text-white shadow-md'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-300'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3 & 4. consultation_time & reason_no_consult */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-[17px] font-black text-slate-800">3. Anh/Chị được hướng dẫn/tư vấn về NCBSM khi nào? (Chọn nhiều)</p>
                <div className="grid grid-cols-1 gap-2">
                  {OPTIONS.consultation_time.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleArray('consultation_time', idx + 1)}
                      className={`p-4 rounded-2xl border text-left text-sm font-bold transition-all flex items-center gap-3 ${formData.consultation_time?.includes(idx + 1)
                        ? 'border-[#009900] bg-emerald-50 text-[#009900]'
                        : 'border-slate-100 bg-slate-50 text-slate-600'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${formData.consultation_time?.includes(idx + 1) ? 'bg-[#009900] border-[#009900]' : 'border-slate-300'}`}>
                        {formData.consultation_time?.includes(idx + 1) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[17px] font-black text-slate-800">4. Nếu không được hướng dẫn/tư vấn, lý do là gì?</p>
                <div className="grid grid-cols-1 gap-2">
                  {OPTIONS.reason_no_consult.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChange('reason_no_consult', idx + 1)}
                      className={`p-4 rounded-2xl border text-left text-sm font-bold transition-all ${formData.reason_no_consult === idx + 1
                        ? 'border-[#009900] bg-emerald-50 text-[#009900]'
                        : 'border-slate-100 bg-slate-50 text-slate-600'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5 & 6. cord_cut & skin_to_skin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-[17px] font-black text-slate-800">5. Thời điểm cắt dây rốn?</p>
                <div className="flex flex-col gap-2">
                  {OPTIONS.cord_cut.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChange('cord_cut', idx + 1)}
                      className={`p-4 rounded-2xl border text-left text-sm font-bold transition-all ${formData.cord_cut === idx + 1
                        ? 'border-[#009900] bg-emerald-50 text-[#009900]'
                        : 'border-slate-100 bg-slate-50 text-slate-600'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[17px] font-black text-slate-800">6. Tiếp xúc Da kề da ngay sau sinh?</p>
                <div className="flex flex-col gap-2">
                  {OPTIONS.skin_to_skin.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChange('skin_to_skin', idx + 1)}
                      className={`p-4 rounded-2xl border text-left text-sm font-bold transition-all ${formData.skin_to_skin === idx + 1
                        ? 'border-[#009900] bg-emerald-50 text-[#009900]'
                        : 'border-slate-100 bg-slate-50 text-slate-600'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 7. first_breastfeed */}
            <div className="space-y-4">
              <p className="text-[17px] font-black text-slate-800">7. Thời điểm cho trẻ bú lần đầu tiên?</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {OPTIONS.first_breastfeed.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChange('first_breastfeed', idx + 1)}
                    className={`p-4 rounded-2xl border text-left text-[13px] font-black uppercase transition-all ${formData.first_breastfeed === idx + 1
                      ? 'border-[#009900] bg-[#009900] text-white shadow-lg'
                      : 'border-slate-100 bg-slate-50 text-slate-500'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 8 & 9. support_person & support_type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-[17px] font-black text-slate-800">8. Ai là người hỗ trợ Anh/Chị cho trẻ bú? (Chọn nhiều)</p>
                <div className="grid grid-cols-1 gap-2">
                  {OPTIONS.support_person.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleArray('support_person', idx + 1)}
                      className={`p-4 rounded-2xl border text-left text-xs font-bold transition-all flex items-center gap-3 ${formData.support_person?.includes(idx + 1)
                        ? 'border-[#009900] bg-emerald-50 text-[#009900]'
                        : 'border-slate-100 bg-slate-50 text-slate-600'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${formData.support_person?.includes(idx + 1) ? 'bg-[#009900] border-[#009900]' : 'border-slate-300'}`}>
                        {formData.support_person?.includes(idx + 1) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[17px] font-black text-slate-800">9. Anh/Chị được hỗ trợ bằng hình thức nào? (Chọn nhiều)</p>
                <div className="grid grid-cols-1 gap-2">
                  {OPTIONS.support_type.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleArray('support_type', idx + 1)}
                      className={`p-4 rounded-2xl border text-left text-xs font-bold transition-all flex items-center gap-3 ${formData.support_type?.includes(idx + 1)
                        ? 'border-[#009900] bg-emerald-50 text-[#009900]'
                        : 'border-slate-100 bg-slate-50 text-slate-600'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${formData.support_type?.includes(idx + 1) ? 'bg-[#009900] border-[#009900]' : 'border-slate-300'}`}>
                        {formData.support_type?.includes(idx + 1) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 10 & 11. other_food & suggest_formula */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-[17px] font-black text-slate-800">10. Anh/Chị có cho trẻ ăn thêm gì ngoài sữa mẹ không?</p>
                <div className="flex flex-wrap gap-2">
                  {OPTIONS.other_food.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChange('other_food', idx + 1)}
                      className={`px-6 py-3 rounded-2xl border text-sm font-black uppercase transition-all ${formData.other_food === idx + 1
                        ? 'bg-[#009900] border-[#009900] text-white'
                        : 'bg-white border-slate-200 text-slate-500'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[17px] font-black text-slate-800">11. Được gợi ý/khuyên dùng sữa công thức?</p>
                <div className="flex gap-2">
                  {OPTIONS.suggest_formula.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChange('suggest_formula', idx + 1)}
                      className={`flex-1 py-3 rounded-2xl border text-sm font-black uppercase transition-all ${formData.suggest_formula === idx + 1
                        ? 'bg-[#009900] border-[#009900] text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-500'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEEDBACK & SUGGESTIONS */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#009900] rounded-full"></div>
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">IV. Ý kiến và Đề xuất</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[17px] font-black text-slate-800">Lợi ích của sữa mẹ theo Anh/Chị?</label>
              <textarea
                value={formData.benefits}
                onChange={e => handleChange('benefits', e.target.value)}
                placeholder="Viết cảm nhận..."
                className="w-full min-h-[150px] bg-slate-50 p-6 rounded-3xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 transition-all shadow-inner resize-none"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[17px] font-black text-slate-800">Kiến nghị/Đóng góp cho bệnh viện?</label>
              <textarea
                value={formData.suggestions}
                onChange={e => handleChange('suggestions', e.target.value)}
                placeholder="Viết kiến nghị..."
                className="w-full min-h-[150px] bg-slate-50 p-6 rounded-3xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 transition-all shadow-inner resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider">Dự định cho trẻ bú mẹ hoàn toàn (tháng)</label>
              <input type="number" value={formData.exclusive_months ?? ''} onChange={e => handleChange('exclusive_months', parseInt(e.target.value) || 0)} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 font-black text-center text-emerald-600" />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider">Tổng thời gian dự định cho trẻ bú (tháng)</label>
              <input type="number" value={formData.total_months ?? ''} onChange={e => handleChange('total_months', parseInt(e.target.value) || 0)} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 font-black text-center text-emerald-600" />
            </div>
          </div>
        </section>

        {/* SAVE BUTTON */}
        <div className="flex justify-center pt-10">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-4 px-20 py-6 bg-[#009900] text-white rounded-[2rem] font-black text-sm uppercase shadow-2xl shadow-emerald-200 hover:scale-105 transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : <Save size={20} />}
            {saving ? 'Đang lưu...' : 'Lưu bản khảo sát'}
          </button>
        </div>
      </div>

      <div className="py-12 text-center text-slate-300">
        <p className="text-[9px] font-black uppercase tracking-[0.3em]">&copy; 2026 Bệnh viện Quân y - Hệ thống quản lý chất lượng</p>
      </div>
    </div>
  );
};
