import React, { useState } from 'react';
import { 
  Search, FileText, Download, Filter, Bookmark, Globe, Building, 
  Landmark, ShieldCheck, Eye, Link, PlayCircle, GraduationCap, 
  HelpCircle, CheckSquare, Youtube, Lightbulb, MessageCircle, 
  BookOpen, Video, Plus
} from 'lucide-react';
import { Document } from '../types';

// --- MOCK DATA ---

const MOCK_DOCS: Document[] = [
  { 
    id: '1', code: '15/2023/QH15', title: 'Luật Khám bệnh, chữa bệnh số 15/2023/QH15', 
    category: 'LEGAL', docType: 'Luật', field: 'Quản lý chung', 
    issuingAuthority: 'Quốc hội', effectiveDate: '01/01/2024', relatedCriteria: 'A1.1', status: 'ACTIVE'
  },
  { 
    id: '3', code: '19/2013/TT-BYT', title: 'Thông tư hướng dẫn thực hiện quản lý chất lượng dịch vụ khám bệnh, chữa bệnh', 
    category: 'MOH', docType: 'Thông tư', field: 'QLCL', 
    issuingAuthority: 'Bộ Y tế', effectiveDate: '12/07/2013', relatedCriteria: 'D1.1', status: 'ACTIVE'
  },
  { 
    id: '4', code: '43/2018/TT-BYT', title: 'Thông tư hướng dẫn phòng ngừa sự cố y khoa', 
    category: 'MOH', docType: 'Thông tư', field: 'An toàn người bệnh', 
    issuingAuthority: 'Bộ Y tế', effectiveDate: '01/03/2019', relatedCriteria: 'D2.1', status: 'ACTIVE'
  },
  { 
    id: '7', code: 'QT-KSNK-01', title: 'Quy trình rửa tay thường quy', 
    category: 'SOP', docType: 'Quy trình kỹ thuật', field: 'KSNK', 
    issuingAuthority: 'Khoa KSNK', effectiveDate: '01/01/2023', relatedCriteria: 'C8.1', status: 'ACTIVE'
  },
  { 
    id: '9', code: 'JCI-IPSG', title: '6 Mục tiêu An toàn người bệnh Quốc tế (IPSG)', 
    category: 'INTL', docType: 'Tài liệu tham khảo', field: 'JCI', 
    issuingAuthority: 'JCI', effectiveDate: '01/01/2024', relatedCriteria: 'A2.1', status: 'ACTIVE'
  },
];

const TRAINING_VIDEOS = [
  { id: 1, title: 'Hướng dẫn báo cáo Sự cố y khoa trên phần mềm', duration: '15:30', author: 'Ban QLCL', views: 1205, thumbnail: 'bg-blue-100' },
  { id: 2, title: 'Quy trình An toàn phẫu thuật (WHO Checklist)', duration: '22:15', author: 'Khoa PTGMHS', views: 890, thumbnail: 'bg-green-100' },
  { id: 3, title: '5 Khoảnh khắc vệ sinh tay (WHO Guidelines)', duration: '10:00', author: 'WHO Vietnam', views: 3400, thumbnail: 'bg-teal-100' },
  { id: 4, title: 'Kỹ năng giao tiếp ứng xử với người bệnh', duration: '45:00', author: 'Phòng Điều dưỡng', views: 1500, thumbnail: 'bg-purple-100' },
];

const QUIZZES = [
  { id: 1, title: 'Bài kiểm tra An toàn người bệnh cơ bản', questions: 20, time: '30 phút', attempts: 3, bestScore: 95 },
  { id: 2, title: 'Kiến thức về 83 Tiêu chí chất lượng', questions: 50, time: '60 phút', attempts: 1, bestScore: 70 },
  { id: 3, title: 'Quy trình Báo động đỏ (Code Red)', questions: 15, time: '15 phút', attempts: 0, bestScore: 0 },
];

const UNIT_TRAINING = [
  { id: 1, date: '12/06/2024', unit: 'Khoa Nội Tiêu hóa', content: 'Bình bệnh án, bình đơn thuốc', attendees: 15, status: 'Đã báo cáo' },
  { id: 2, date: '10/06/2024', unit: 'Khoa Ngoại Dã chiến', content: 'Tập huấn Quy trình KSNK vết mổ', attendees: 20, status: 'Đã báo cáo' },
];

const KNOWLEDGE_ARTICLES = [
  { id: 1, title: 'Kinh nghiệm triển khai 5S thành công tại Khoa Dược', category: 'Thực hành tốt', date: '01/06/2024', likes: 45 },
  { id: 2, title: 'Phân tích nguyên nhân gốc rễ (RCA): Bài học từ sự cố nhầm thuốc', category: 'Bài học kinh nghiệm', date: '28/05/2024', likes: 62 },
  { id: 3, title: 'Hỏi đáp: Xử lý thế nào khi người bệnh từ chối điều trị?', category: 'Hỏi đáp', date: '25/05/2024', likes: 30 },
];

type MainTab = 'LIBRARY' | 'TRAINING' | 'SHARING';

export const DocsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('LIBRARY');

  return (
    <div className="space-y-6">
      {/* Module Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-800">Văn bản - Đào tạo - Thư viện</h2>
           <p className="text-sm text-slate-500">Hệ thống tri thức Quản lý chất lượng Bệnh viện 103.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1">
           <button 
             onClick={() => setActiveTab('LIBRARY')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === 'LIBRARY' 
                ? 'bg-primary-600 text-white shadow-md shadow-primary-200 ring-1 ring-primary-600' 
                : 'text-primary-600 hover:bg-white hover:shadow-sm'
             }`}
           >
             <FileText size={18} /> Thư viện Văn bản
           </button>
           <button 
             onClick={() => setActiveTab('TRAINING')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === 'TRAINING' 
                ? 'bg-primary-600 text-white shadow-md shadow-primary-200 ring-1 ring-primary-600' 
                : 'text-primary-600 hover:bg-white hover:shadow-sm'
             }`}
           >
             <GraduationCap size={18} /> Đào tạo & E-Learning
           </button>
           <button 
             onClick={() => setActiveTab('SHARING')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === 'SHARING' 
                ? 'bg-primary-600 text-white shadow-md shadow-primary-200 ring-1 ring-primary-600' 
                : 'text-primary-600 hover:bg-white hover:shadow-sm'
             }`}
           >
             <Lightbulb size={18} /> Góc Chia sẻ
           </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'LIBRARY' && <DocumentLibrary />}
        {activeTab === 'TRAINING' && <TrainingCenter />}
        {activeTab === 'SHARING' && <KnowledgeSharing />}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: DOCUMENT LIBRARY ---
const DocumentLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [docCategory, setDocCategory] = useState('ALL');

  const CATEGORIES = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'LEGAL', label: 'Pháp lý', icon: <Landmark size={14} /> },
    { id: 'MOH', label: 'Bộ Y tế', icon: <ShieldCheck size={14} /> },
    { id: 'HOSPITAL', label: 'Nội bộ BV', icon: <Building size={14} /> },
    { id: 'SOP', label: 'Quy trình SOP', icon: <FileText size={14} /> },
    { id: 'INTL', label: 'Quốc tế', icon: <Globe size={14} /> },
  ];

  const filteredDocs = MOCK_DOCS.filter(doc => 
    (docCategory === 'ALL' || doc.category === docCategory) &&
    (doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || doc.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-4 justify-between bg-slate-50/50">
         <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setDocCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  docCategory === cat.id 
                    ? 'bg-primary-600 text-white border-primary-600' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
         </div>
         <div className="flex gap-2">
            <div className="relative w-full lg:w-64">
               <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
               <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Tìm số hiệu, trích yếu..." 
                 className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
               />
            </div>
         </div>
      </div>
      
      <div className="overflow-x-auto">
         <table className="w-full text-sm text-left">
           <thead className="bg-primary-600 text-white font-bold uppercase text-xs border-b border-primary-700">
             <tr>
               <th className="px-6 py-4">Số hiệu & Tên văn bản</th>
               <th className="px-6 py-4">Loại / Lĩnh vực</th>
               <th className="px-6 py-4">Nơi ban hành</th>
               <th className="px-6 py-4">Hiệu lực</th>
               <th className="px-6 py-4 text-right">Thao tác</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {filteredDocs.map((doc) => (
               <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                 <td className="px-6 py-4">
                   <div className="font-semibold text-slate-800 text-sm line-clamp-2" title={doc.title}>{doc.title}</div>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{doc.code}</span>
                      {doc.relatedCriteria && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">Tiêu chí {doc.relatedCriteria}</span>}
                   </div>
                 </td>
                 <td className="px-6 py-4">
                   <div className="text-slate-800">{doc.docType}</div>
                   <div className="text-xs text-slate-500">{doc.field}</div>
                 </td>
                 <td className="px-6 py-4 text-slate-600">{doc.issuingAuthority}</td>
                 <td className="px-6 py-4 text-slate-600">{doc.effectiveDate}</td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                 <button className="p-1.5 text-primary-600 hover:bg-primary-50 rounded" title="Xem"><Eye size={16} /></button>
                                 <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Sửa"><Edit2 size={16} /></button>
                                 <button className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Xóa"><Trash2 size={16} /></button>
                            </div>
                         </td>
               </tr>
             ))}
           </tbody>
         </table>
      </div>
      <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
         Hiển thị {filteredDocs.length} văn bản
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: TRAINING CENTER ---
const TrainingCenter = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       {/* Left Column: Video Library & Quizzes */}
       <div className="lg:col-span-2 space-y-6">
          {/* Section: Video Library */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                   <Youtube className="text-red-600" size={20} /> 
                   Video Đào tạo & Quy trình mẫu
                </h3>
                <button className="text-sm text-primary-600 hover:underline">Xem tất cả</button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TRAINING_VIDEOS.map(video => (
                  <div key={video.id} className="group cursor-pointer">
                     <div className={`aspect-video rounded-lg ${video.thumbnail} relative flex items-center justify-center mb-2 overflow-hidden`}>
                        <PlayCircle className="w-12 h-12 text-slate-900/50 group-hover:text-red-600 transition-colors z-10" />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">{video.duration}</span>
                     </div>
                     <h4 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-primary-700">{video.title}</h4>
                     <p className="text-xs text-slate-500 mt-1">{video.author} • {video.views} lượt xem</p>
                  </div>
                ))}
             </div>
          </section>

          {/* Section: Self-Study Quizzes */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                   <CheckSquare className="text-green-600" size={20} /> 
                   Ôn tập & Kiểm tra kiến thức
                </h3>
             </div>
             <div className="space-y-3">
                {QUIZZES.map(quiz => (
                   <div key={quiz.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-lg hover:border-primary-200 hover:bg-slate-50 transition-colors">
                      <div className="mb-2 sm:mb-0">
                         <h4 className="font-bold text-slate-800 text-sm">{quiz.title}</h4>
                         <div className="flex gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><HelpCircle size={12} /> {quiz.questions} câu hỏi</span>
                            <span className="flex items-center gap-1"><BookOpen size={12} /> {quiz.time}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         {quiz.bestScore > 0 ? (
                            <div className="text-right">
                               <span className="block text-xs text-slate-400">Kết quả tốt nhất</span>
                               <span className={`font-bold ${quiz.bestScore >= 80 ? 'text-green-600' : 'text-amber-600'}`}>{quiz.bestScore}/100</span>
                            </div>
                         ) : (
                            <span className="text-xs text-slate-400 italic">Chưa làm</span>
                         )}
                         <button className="px-4 py-2 bg-white border border-primary-200 text-primary-700 text-sm font-bold rounded-lg hover:bg-primary-600 hover:text-white transition-colors">
                            {quiz.attempts > 0 ? 'Làm lại' : 'Bắt đầu'}
                         </button>
                      </div>
                   </div>
                ))}
             </div>
          </section>
       </div>

       {/* Right Column: Unit Training Logs */}
       <div className="space-y-6">
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 text-sm uppercase flex items-center gap-2">
                   <Building size={18} className="text-indigo-600" />
                   Hồ sơ đào tạo tại đơn vị
                </h3>
             </div>
             <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 mb-4">
                <p>Các khoa/phòng cập nhật hoạt động tự đào tạo (bình bệnh án, sinh hoạt chuyên môn, tập huấn tại chỗ...) tại đây.</p>
             </div>
             
             <button className="w-full py-2 mb-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
                <Plus size={16} /> Đăng ký buổi đào tạo
             </button>

             <div className="space-y-4">
                {UNIT_TRAINING.map(item => (
                   <div key={item.id} className="relative pl-4 border-l-2 border-slate-200 pb-2">
                      <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border border-white"></div>
                      <p className="text-xs text-slate-400 font-mono mb-0.5">{item.date}</p>
                      <h4 className="text-sm font-bold text-slate-800">{item.unit}</h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.content}</p>
                      <div className="flex justify-between items-center mt-2">
                         <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{item.attendees} người tham gia</span>
                         <span className="text-[10px] text-green-600 font-bold">{item.status}</span>
                      </div>
                   </div>
                ))}
             </div>
             <button className="w-full mt-4 text-xs text-slate-500 hover:text-primary-600 text-center block">Xem lịch sử toàn viện</button>
          </section>
       </div>
    </div>
  );
};

// --- SUB-COMPONENT: KNOWLEDGE SHARING ---
const KnowledgeSharing = () => {
  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured Articles */}
          {KNOWLEDGE_ARTICLES.map(article => (
             <div key={article.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start justify-between mb-3">
                   <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${
                      article.category === 'Thực hành tốt' ? 'bg-green-100 text-green-700' : 
                      article.category === 'Bài học kinh nghiệm' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                   }`}>
                      {article.category}
                   </span>
                   <Bookmark className="text-slate-300 hover:text-primary-600 cursor-pointer" size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 hover:text-primary-700 cursor-pointer">{article.title}</h3>
                <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate-500">
                   <span>{article.date}</span>
                   <span className="flex items-center gap-1"><MessageCircle size={14} /> {article.likes} quan tâm</span>
                </div>
             </div>
          ))}
          
          {/* Add New Contribution Card */}
          <div className="bg-slate-50 p-5 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                <Plus size={24} className="text-primary-600" />
             </div>
             <h3 className="font-bold text-slate-700">Đóng góp bài viết</h3>
             <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Chia sẻ kinh nghiệm, mô hình hay của khoa phòng bạn</p>
          </div>
       </div>

       {/* FAQ Section */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
             <HelpCircle className="text-purple-600" /> Câu hỏi thường gặp (Q&A)
          </h3>
          <div className="divide-y divide-slate-100">
             <div className="py-3">
                <h4 className="font-medium text-slate-800 text-sm cursor-pointer hover:text-primary-600">Làm thế nào để đăng ký đề án cải tiến chất lượng mới?</h4>
                <p className="text-sm text-slate-500 mt-1 pl-4 border-l-2 border-slate-200">Các khoa phòng truy cập module "Cải tiến chất lượng", chọn "Lập kế hoạch mới" và điền theo mẫu PDCA. Sau khi lưu, Ban QLCL sẽ nhận được thông báo để duyệt.</p>
             </div>
             <div className="py-3">
                <h4 className="font-medium text-slate-800 text-sm cursor-pointer hover:text-primary-600">Thời gian báo cáo chỉ số chất lượng hàng tháng là khi nào?</h4>
                <p className="text-sm text-slate-500 mt-1 pl-4 border-l-2 border-slate-200">Hệ thống mở cổng nhập liệu từ ngày 25 đến ngày 30 hàng tháng. Sau thời gian này, dữ liệu sẽ bị khóa để tổng hợp báo cáo.</p>
             </div>
             <div className="py-3">
                <h4 className="font-medium text-slate-800 text-sm cursor-pointer hover:text-primary-600">Quên mật khẩu đăng nhập hệ thống thì liên hệ ai?</h4>
                <p className="text-sm text-slate-500 mt-1 pl-4 border-l-2 border-slate-200">Vui lòng liên hệ Ban Quản lý chất lượng (SĐT: 1234) hoặc Tổ Công nghệ thông tin để được cấp lại mật khẩu.</p>
             </div>
          </div>
          <button className="mt-4 text-sm text-primary-600 font-medium hover:underline">Xem thêm câu hỏi...</button>
       </div>
    </div>
  );
};
