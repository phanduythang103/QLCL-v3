import React, { useState } from 'react';
import { Edit2, FileUp, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import { BaiHocLienTuc, CauHoi, addBaiKiemTra } from '../readDaoTaoLienTuc';

async function parseQuiz(file: File): Promise<CauHoi[]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
  const questions = rows.map((row, index) => {
    const noi_dung = String(row['Nội dung câu hỏi'] || row['Nội dung'] || row.noi_dung_cau_hoi || row.noi_dung || row['Câu hỏi'] || row.cau_hoi || row['Question Text'] || row.Question || '').trim();
    const lua_chon = ['A', 'B', 'C', 'D'].map(key => String(row[key] || row[key.toLowerCase()] || '').trim()).filter(Boolean);
    const answer = String(row['Đáp án'] || row.dap_an || row.Answer || '').trim().toUpperCase();
    const dap_an_dung = /^[A-D]$/.test(answer) ? answer.charCodeAt(0) - 65 : Number(answer) - 1;
    if (!noi_dung || /^\d+$/.test(noi_dung) || lua_chon.length < 2 || dap_an_dung < 0 || dap_an_dung >= lua_chon.length) {
      throw new Error(`Dòng ${index + 2} không đúng định dạng.`);
    }
    return { noi_dung, lua_chon, dap_an_dung, giai_thich: String(row['Giải thích'] || row.giai_thich || '') };
  });
  if (!questions.length) throw new Error('File chưa có câu hỏi.');
  return questions;
}

export function EditContinuousTraining({ item, onClose, onSaved }: {
  item: BaiHocLienTuc;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(item.tieu_de);
  const [description, setDescription] = useState(item.mo_ta || '');
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [quizFile, setQuizFile] = useState<File | null>(null);
  const [passingScore, setPassingScore] = useState(item.bai_kiem_tra ? item.bai_kiem_tra.diem_dat : 80);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return alert('Vui lòng nhập tên khóa học.');
    if (lessonFile && !/\.(pdf|doc|docx|ppt|pptx)$/i.test(lessonFile.name)) {
      return alert('Chỉ hỗ trợ Word, PDF hoặc PowerPoint.');
    }
    setSaving(true);
    let uploadedPath: string | null = null;
    try {
      let fileFields = { file_path: item.file_path, file_name: item.file_name, file_type: item.file_type };
      if (lessonFile) {
        uploadedPath = `${Date.now()}_${lessonFile.name.replace(/[^\w.-]+/g, '_')}`;
        const { error } = await supabase.storage.from('dao_tao_lien_tuc').upload(uploadedPath, lessonFile);
        if (error) throw error;
        fileFields = { file_path: uploadedPath, file_name: lessonFile.name, file_type: lessonFile.type };
      }

      const { error: updateError } = await supabase.from('dtlt_bai_hoc').update({
        tieu_de: title.trim(),
        mo_ta: description.trim(),
        ...fileFields,
      }).eq('id', item.id);
      if (updateError) throw updateError;

      if (quizFile || item.bai_kiem_tra) {
        await addBaiKiemTra({
          bai_hoc_id: item.id,
          tieu_de: `Kiểm tra: ${title.trim()}`,
          diem_dat: passingScore,
          thoi_gian_phut: item.bai_kiem_tra ? item.bai_kiem_tra.thoi_gian_phut : 30,
          cau_hoi: quizFile ? await parseQuiz(quizFile) : item.bai_kiem_tra!.cau_hoi,
        });
      }

      if (uploadedPath && item.file_path !== uploadedPath) {
        supabase.storage.from('dao_tao_lien_tuc').remove([item.file_path]).then(({ error }: { error: any }) => {
          if (error) console.error('Không thể xóa file bài học cũ:', error);
        });
      }
      onSaved();
    } catch (error: any) {
      if (uploadedPath) await supabase.storage.from('dao_tao_lien_tuc').remove([uploadedPath]);
      alert(`Không thể cập nhật khóa học: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
    <div className="mx-auto mt-8 max-w-2xl rounded-2xl bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b p-4">
        <div><p className="text-xs font-bold text-green-700">ĐÀO TẠO LIÊN TỤC</p><h3 className="text-lg font-black">Sửa khóa học</h3></div>
        <button onClick={onClose}><X /></button>
      </header>
      <div className="space-y-4 p-5">
        <label className="block"><span className="mb-1 block text-sm font-bold">Tên khóa học *</span><input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-lg border p-2.5" /></label>
        <label className="block"><span className="mb-1 block text-sm font-bold">Mô tả</span><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border p-2.5" /></label>
        <label className="block rounded-xl border-2 border-dashed p-5 text-center">
          <FileUp className="mx-auto text-green-600" />
          <b>{lessonFile ? lessonFile.name : `File hiện tại: ${item.file_name}`}</b>
          <p className="text-xs text-slate-500">Không chọn file mới để giữ nguyên file hiện tại.</p>
          <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" className="mt-3 block w-full text-sm" onChange={e => setLessonFile(e.target.files?.[0] || null)} />
        </label>
        <label className="block rounded-xl border p-4">
          <b>Thay file trắc nghiệm</b>
          <p className="my-2 text-xs text-slate-500">Không chọn file mới để giữ nguyên câu hỏi hiện tại.</p>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={e => setQuizFile(e.target.files?.[0] || null)} />
        </label>
        {(quizFile || item.bai_kiem_tra) && <label className="block"><b>Điểm đạt (%)</b><input type="number" min="0" max="100" value={passingScore} onChange={e => setPassingScore(Number(e.target.value))} className="ml-3 w-24 rounded border p-2" /></label>}
        <button disabled={saving} onClick={save} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white disabled:opacity-50">
          <Edit2 size={18} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  </div>;
}
