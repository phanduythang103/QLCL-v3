import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  uploadTrainingMaterial,
  getMaterialsByCourse,
  convertMaterialToELearning,
} from '../../../services/trainingService';

export default function TrainingMaterialManager() {
  const { courseId } = useParams();

  const [materials, setMaterials] = useState([]);
  const [file, setFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [convertingId, setConvertingId] = useState(null);

  async function loadMaterials() {
    const data = await getMaterialsByCourse(courseId);
    setMaterials(data);
  }

  useEffect(() => {
    loadMaterials();
  }, [courseId]);

  async function handleUpload() {
    if (!file) {
      alert('Chưa chọn file');
      return;
    }

    try {
      setLoadingUpload(true);
      await uploadTrainingMaterial(file, courseId);
      setFile(null);
      await loadMaterials();
      alert('Đã upload tài liệu và trích xuất text');
    } catch (err) {
      console.error(err);
      alert('Lỗi upload: ' + err.message);
    } finally {
      setLoadingUpload(false);
    }
  }

  async function handleConvert(materialId) {
    const ok = confirm(
      'AI sẽ xử lý tài liệu này và chuyển thành bài giảng điện tử dạng section. Tiếp tục?'
    );

    if (!ok) return;

    try {
      setConvertingId(materialId);
      await convertMaterialToELearning(materialId);
      await loadMaterials();
      alert('Đã chuyển tài liệu thành bài giảng điện tử');
    } catch (err) {
      console.error(err);
      alert('Lỗi chuyển đổi AI: ' + err.message);
    } finally {
      setConvertingId(null);
    }
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Quản lý tài liệu học</h1>

      <div className="border rounded p-4 mb-6 bg-white">
        <div className="font-semibold mb-2">Upload file quy trình gốc</div>

        <input
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          onClick={handleUpload}
          disabled={loadingUpload}
          className="ml-3 bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loadingUpload ? 'Đang tải...' : 'Upload'}
        </button>
      </div>

      <div className="space-y-3">
        {materials.map((item) => (
          <div key={item.id} className="border rounded p-4 bg-white">
            <div className="font-semibold">{item.title}</div>

            <div className="text-sm text-gray-500 mt-1">
              File: {item.file_name} | Loại: {item.file_type} | Trạng thái:{' '}
              {item.convert_status}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={item.file_url}
                target="_blank"
                rel="noreferrer"
                className="bg-gray-200 text-gray-900 px-3 py-2 rounded"
              >
                Xem quy trình gốc
              </a>

              <button
                onClick={() => handleConvert(item.id)}
                disabled={
                  convertingId === item.id ||
                  item.convert_status === 'uploaded_no_text'
                }
                className="bg-green-600 text-white px-3 py-2 rounded disabled:opacity-50"
              >
                {convertingId === item.id
                  ? 'AI đang chuyển đổi...'
                  : 'AI chuyển thành bài giảng'}
              </button>

              <a
                href={`/admin/training/lessons/${courseId}`}
                className="bg-purple-600 text-white px-3 py-2 rounded"
              >
                Xem bài giảng đã tạo
              </a>
            </div>

            {item.convert_status === 'uploaded_no_text' && (
              <div className="mt-3 text-sm text-red-600">
                File này chưa trích xuất được text. Với PowerPoint, nên xuất sang
                PDF rồi upload. Với PDF scan ảnh cần OCR.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}