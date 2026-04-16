import React, { useState } from 'react';
import {
  ArrowLeft, Save, User, Phone, MapPin, Calendar, Info, Star, ChevronRight
} from 'lucide-react';
import { KsMeSinhConRecord } from '../types/ksMeSinhCon';

interface Props {
  initialData?: KsMeSinhConRecord;
  onSave: (data: KsMeSinhConRecord) => void;
  onCancel: () => void;
  saving: boolean;
  isPublic?: boolean;
}

const SECTION_MAP = [
  { id: 'EA', title: 'Khả năng tiếp cận', questions: [{ id: 'ea1', text: 'Biển chỉ dẫn rõ ràng' }, { id: 'ea2', text: 'Dễ gọi nhân viên khi cần' }] },
  { id: 'EB', title: 'Quy trình khám', questions: [{ id: 'eb1', text: 'Thủ tục dễ dàng' }, { id: 'eb2', text: 'Thời gian chờ hợp lý' }] },
  { id: 'EC', title: 'Tư vấn', questions: [{ id: 'ec1', text: 'Thông tin trước sinh đầy đủ' }, { id: 'ec2', text: 'Tư vấn nguy cơ' }, { id: 'ec3', text: 'Hướng dẫn chăm sóc sau sinh' }] },
  {
    id: 'ED', title: 'Cơ sở vật chất', questions: [
      { id: 'ed1', text: 'Giường sạch, không nằm ghép' }, { id: 'ed2', text: 'Chăn ga sạch' }, { id: 'ed3', text: 'Nhà vệ sinh sạch' },
      { id: 'ed4', text: 'Buồng bệnh thoáng' }, { id: 'ed5', text: 'Đảm bảo riêng tư' }, { id: 'ed6', text: 'Dịch vụ tiện ích tốt' }
    ]
  },
  {
    id: 'EE', title: 'Thái độ nhân viên', questions: [
      { id: 'ee1', text: 'Bác sĩ giao tiếp tốt' }, { id: 'ee2', text: 'Điều dưỡng giao tiếp tốt' }, { id: 'ee3', text: 'Nhân viên phục vụ tốt' }, { id: 'ee4', text: 'Không gợi ý bồi dưỡng' }
    ]
  },
  {
    id: 'EG', title: 'Chuyên môn', questions: [
      { id: 'eg1', text: 'Bác sĩ chuyên môn tốt' }, { id: 'eg2', text: 'Điều dưỡng chăm sóc tốt' }, { id: 'eg3', text: 'Phối hợp tốt' }
    ]
  },
  {
    id: 'EH', title: 'Kết quả', questions: [
      { id: 'eh1', text: 'Sinh an toàn' }, { id: 'eh2', text: 'Hướng dẫn thuốc đầy đủ' }, { id: 'eh3', text: 'Chi phí hợp lý' }
    ]
  },
];

export const KsMeSinhConForm: React.FC<Props> = ({
  initialData, onSave, onCancel, saving, isPublic = false
}) => {
  const [formData, setFormData] = useState<KsMeSinhConRecord>(
    initialData || {
      hospital: '',
      survey_date: new Date().toISOString().split('T')[0],
      departments: '',
      department_code: '',
      mother_id: '',
      age: 25,
      phone: '',
      days_in_hospital: 3,
      visit_count: 1,
      bhyt: 1,
      birth_method: 1,
      prenatal_check: 1,
      satisfaction_percent: 100,
      return_intent: 5,
      note: ''
    }
  );

  const handleChange = (field: keyof KsMeSinhConRecord, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const themeColor = "#009900";

  return (
    <div className="w-full pb-20 animate-in fade-in duration-700 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className={`bg-[${themeColor}] text-white p-6 md:p-10 rounded-3xl shadow-2xl text-center space-y-4 relative overflow-hidden mb-8 mx-auto max-w-6xl mt-4`}>
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
          Phiếu Khảo Sát Ý Kiến Người Mẹ Sinh Con tại bệnh viện
        </h1>
        <p className="text-sm opacity-90 max-w-2xl mx-auto font-medium relative z-10">
          Khảo sát trải nghiệm người mẹ sinh con tại bệnh viện nhằm cải thiện chất lượng phục vụ.
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 px-4">
        {/* I. THÔNG TIN HÀNH CHÍNH */}
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
                <User size={12} /> Mã số người mẹ
              </label>
              <input
                type="text"
                value={formData.mother_id}
                onChange={(e) => handleChange('mother_id', e.target.value)}
                placeholder="Nhập mã..."
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider">Khoa điều trị</label>
                <input type="text" value={formData.departments} onChange={e => handleChange('departments', e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider">Mã khoa</label>
                <input type="text" value={formData.department_code} onChange={e => handleChange('department_code', e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none" />
              </div>
            </div>
          </div>
        </section>

        {/* II. THÔNG TIN NGƯỜI BỆNH */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#009900] rounded-full"></div>
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">II. Thông tin người bệnh</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider">Tuổi</label>
              <input type="number" value={formData.age} onChange={e => handleChange('age', parseInt(e.target.value))} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider">Số điện thoại</label>
              <input type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider">Lần nhập viện</label>
              <input type="number" value={formData.visit_count} onChange={e => handleChange('visit_count', parseInt(e.target.value))} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-wider">Số ngày nằm viện</label>
              <input type="number" value={formData.days_in_hospital} onChange={e => handleChange('days_in_hospital', parseInt(e.target.value))} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <p className="text-[13px] font-black text-slate-400 uppercase tracking-wider">Sử dụng BHYT</p>
              <div className="flex gap-2">
                {[1, 2].map(v => (
                  <button key={v} type="button" onClick={() => handleChange('bhyt', v)} className={`flex-1 py-3 rounded-xl text-[13px] font-black uppercase transition-all ${formData.bhyt === v ? 'bg-[#009900] text-white shadow-md' : 'bg-slate-50 text-slate-500'}`}>
                    {v === 1 ? 'Có' : 'Không'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[13px] font-black text-slate-400 uppercase tracking-wider">Cách sinh</p>
              <select value={formData.birth_method} onChange={e => handleChange('birth_method', parseInt(e.target.value))} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-bold outline-none">
                <option value={1}>Đẻ thường</option>
                <option value={2}>Mổ cấp cứu</option>
                <option value={3}>Mổ có chuẩn bị</option>
                <option value={4}>Khác</option>
              </select>
              {formData.birth_method === 4 && <input type="text" value={formData.birth_method_other} onChange={e => handleChange('birth_method_other', e.target.value)} placeholder="Mô tả cách sinh..." className="mt-2 w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs outline-none" />}
            </div>
            <div className="space-y-4">
              <p className="text-[13px] font-black text-slate-400 uppercase tracking-wider">Khám thai</p>
              <select value={formData.prenatal_check} onChange={e => handleChange('prenatal_check', parseInt(e.target.value))} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-bold outline-none">
                <option value={1}>Có khám</option>
                <option value={2}>Chỉ đến sinh</option>
                <option value={3}>Không nhớ</option>
              </select>
              {formData.prenatal_check === 1 && <input type="text" value={formData.prenatal_check_other} onChange={e => handleChange('prenatal_check_other', e.target.value)} placeholder="Khám ở đâu/bao nhiêu lần..." className="mt-2 w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs outline-none" />}
            </div>
          </div>
        </section>

        {/* III. ĐÁNH GIÁ DỊCH VỤ */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#009900] rounded-full"></div>
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">III. Đánh giá dịch vụ</h3>
          </div>

          <div className="space-y-12">
            {SECTION_MAP.map(section => (
              <div key={section.id} className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                  <h4 className="font-black text-slate-800 uppercase text-sm tracking-wider">{section.id}. {section.title}</h4>
                  <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <span>Rất kém</span>
                    <div className="w-20 h-0.5 bg-slate-200"></div>
                    <span>Rất tốt</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {section.questions.map(q => (
                    <div key={q.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white rounded-[1.5rem] border border-slate-50 hover:border-emerald-100 hover:bg-emerald-50/10 transition-all gap-4">
                      <span className="text-[17px] font-bold text-slate-700">{q.text}</span>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleChange(q.id as any, val)}
                            className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${(formData as any)[q.id] === val
                              ? 'bg-[#009900] text-white shadow-lg scale-110'
                              : 'bg-slate-100 text-slate-400 hover:bg-emerald-100'
                              }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* IV. ĐÁNH GIÁ CHUNG */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#009900] rounded-full"></div>
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">IV. Đánh giá chung</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Star size={16} className="text-amber-400 fill-amber-400" /> Mức đáp ứng (%)
              </label>
              <input
                type="range" min="0" max="100"
                value={formData.satisfaction_percent}
                onChange={e => handleChange('satisfaction_percent', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#009900]"
              />
              <div className="text-center font-black text-2xl text-emerald-600">{formData.satisfaction_percent}%</div>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-black text-slate-800">Quay lại bệnh viện</label>
              <select value={formData.return_intent} onChange={e => handleChange('return_intent', parseInt(e.target.value))} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-bold outline-none">
                <option value={1}>Không quay lại</option>
                <option value={2}>Ít lựa chọn</option>
                <option value={3}>Chuyển viện khác</option>
                <option value={4}>Có thể quay lại</option>
                <option value={5}>Chắc chắn quay lại</option>
                <option value={6}>Khác</option>
              </select>
              {formData.return_intent === 6 && <input type="text" value={formData.return_intent_other} onChange={e => handleChange('return_intent_other', e.target.value)} placeholder="Lý do khác..." className="mt-2 w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs outline-none" />}
            </div>
          </div>

          <div className="space-y-4 pt-6">
            <label className="text-sm font-black text-slate-800">Ý kiến thêm</label>
            <textarea
              value={formData.note}
              onChange={e => handleChange('note', e.target.value)}
              placeholder="Góp ý thêm..."
              className="w-full min-h-[120px] bg-slate-50 p-6 rounded-3xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 transition-all shadow-inner resize-none"
            />
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
    </div>
  );
};
