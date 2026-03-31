import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, Sparkles, Plus, Edit2, Trash2, 
  CheckCircle2, AlertCircle, Save, X, Loader2, 
  Key, MessageSquare, Info, ChevronRight, ChevronDown 
} from 'lucide-react';
import { 
  fetchAiConfigs, addAiConfig, updateAiConfig, deleteAiConfig, setActiveAiConfig,
  fetchPromptConfigs, upsertPromptConfig, AiConfig, PromptConfig 
} from '../../readCauHinhAi';

const AiConfigTable: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MODELS' | 'PROMPTS'>('MODELS');
  const [aiConfigs, setAiConfigs] = useState<AiConfig[]>([]);
  const [promptConfigs, setPromptConfigs] = useState<PromptConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Form states
  const [showAiModal, setShowAiModal] = useState(false);
  const [editingAi, setEditingAi] = useState<AiConfig | null>(null);
  const [aiForm, setAiForm] = useState<Partial<AiConfig>>({
    provider: 'Google',
    model_name: 'gemini-1.5-flash',
    api_key: '',
    description: '',
    is_active: false
  });

  const [editingPrompt, setEditingPrompt] = useState<PromptConfig | null>(null);
  const [promptForm, setPromptForm] = useState<Partial<PromptConfig>>({
    module_key: '',
    prompt_name: '',
    prompt_text: '',
    is_active: true
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [aiData, promptData] = await Promise.all([
        fetchAiConfigs(),
        fetchPromptConfigs()
      ]);
      setAiConfigs(aiData);
      setPromptConfigs(promptData);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAi) {
        await updateAiConfig(editingAi.id, aiForm);
        setMessage('Cập nhật thành công');
      } else {
        await addAiConfig(aiForm as Omit<AiConfig, 'id' | 'created_at'>);
        setMessage('Thêm mới thành công');
      }
      setShowAiModal(false);
      setEditingAi(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteAi = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa cấu hình này?')) return;
    setLoading(true);
    try {
      await deleteAiConfig(id);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    setLoading(true);
    try {
      await setActiveAiConfig(id);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await upsertPromptConfig(promptForm as Omit<PromptConfig, 'id' | 'created_at'>);
      setMessage('Lưu Prompt thành công');
      setEditingPrompt(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('MODELS')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'MODELS' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Key size={14} /> Model & API Key
        </button>
        <button
          onClick={() => setActiveTab('PROMPTS')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'PROMPTS' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <MessageSquare size={14} /> Cấu hình Prompt
        </button>
      </div>

      {message && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={20} />
          <span className="text-sm font-bold uppercase">{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <span className="text-sm font-bold uppercase">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X size={18} /></button>
        </div>
      )}

      {activeTab === 'MODELS' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Danh sách Model AI</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Quản lý các kết nối API từ Google hoặc OpenAI</p>
            </div>
            <button
              onClick={() => {
                setEditingAi(null);
                setAiForm({ provider: 'Google', model_name: 'gemini-1.5-flash', api_key: '', description: '', is_active: false });
                setShowAiModal(true);
              }}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all active:scale-95"
            >
              <Plus size={16} /> Thêm Model mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Nhà cung cấp</th>
                  <th className="px-6 py-4">Tên Model</th>
                  <th className="px-6 py-4">API Key</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aiConfigs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">Chưa có cấu hình AI nào được tạo.</td>
                  </tr>
                ) : aiConfigs.map(config => (
                  <tr key={config.id} className={`hover:bg-slate-50 transition-colors ${config.is_active ? 'bg-primary-50/20' : ''}`}>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 rounded text-[10px] font-black uppercase ${config.provider === 'Google' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {config.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">{config.model_name}</td>
                    <td className="px-6 py-4">
                      <code className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-500 font-mono">
                        {config.api_key.substring(0, 4)}••••••••{config.api_key.substring(config.api_key.length - 4)}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleToggleActive(config.id)}
                          className={`w-12 h-6 rounded-full p-1 transition-colors ${config.is_active ? 'bg-primary-600' : 'bg-slate-200'}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 text-[10px] font-black uppercase">
                        <button
                          onClick={() => {
                            setEditingAi(config);
                            setAiForm(config);
                            setShowAiModal(true);
                          }}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg border border-amber-100"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteAi(config.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Danh mục Prompt</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Các Prompt được cấu hình riêng cho từng module</p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[500px] custom-scrollbar">
              {promptConfigs.map(p => (
                <button
                  key={p.module_key}
                  onClick={() => {
                    setEditingPrompt(p);
                    setPromptForm(p);
                  }}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-all flex items-center justify-between border-l-4 ${editingPrompt?.module_key === p.module_key ? 'border-primary-600 bg-primary-50/30' : 'border-transparent'}`}
                >
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{p.prompt_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{p.module_key}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
              ))}
              <button
                onClick={() => {
                  setEditingPrompt(null);
                  setPromptForm({ module_key: '', prompt_name: '', prompt_text: '', is_active: true });
                }}
                className="w-full p-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-primary-600 hover:bg-slate-50 transition-colors"
              >
                <Plus size={14} /> Thêm Prompt mới
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                  {editingPrompt ? `Sửa: ${editingPrompt.prompt_name}` : 'Thêm Prompt mới'}
                </h3>
              </div>
              {editingPrompt && (
                <button onClick={handleSavePrompt} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all active:scale-95">
                  <Save size={14} /> Lưu Prompt
                </button>
              )}
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Module Key</label>
                <input
                  type="text"
                  value={promptForm.module_key}
                  onChange={e => setPromptForm({...promptForm, module_key: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-100 outline-none"
                  placeholder="VD: RCA_ANALYSIS"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên Prompt</label>
                <input
                  type="text"
                  value={promptForm.prompt_name}
                  onChange={e => setPromptForm({...promptForm, prompt_name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-100 outline-none"
                  placeholder="VD: Phân tích RCA sự cố y khoa"
                />
              </div>
              <div className="flex-1 min-h-[300px] flex flex-col">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nội dung câu lệnh (Instruction)</label>
                <textarea
                  value={promptForm.prompt_text}
                  onChange={e => setPromptForm({...promptForm, prompt_text: e.target.value})}
                  className="flex-1 w-full p-4 border border-slate-200 rounded-xl text-sm font-medium leading-relaxed focus:ring-2 focus:ring-primary-100 outline-none resize-none bg-slate-50/50 h-[300px]"
                  placeholder="Nhập hướng dẫn chi tiết cho AI..."
                />
                <div className="mt-2 p-3 bg-blue-50 rounded-lg flex gap-2 items-start">
                  <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-blue-700 uppercase leading-relaxed">
                    <strong>Gợi ý:</strong> Bạn có thể dùng các placeholder như <code>{"{tên_trường}"}</code> để AI tự điền thông tin tương ứng từ dữ liệu module.
                  </p>
                </div>
              </div>
              {!editingPrompt && (
                <button onClick={handleSavePrompt} className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 transition-all active:scale-95">
                  <Save size={16} /> Tạo Prompt mới
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Model Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                {editingAi ? 'Sửa cấu hình AI' : 'Thêm Model AI mới'}
              </h3>
              <button onClick={() => setShowAiModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveAi} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nhà cung cấp</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAiForm({...aiForm, provider: 'Google'})}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${aiForm.provider === 'Google' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}
                  >
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiForm({...aiForm, provider: 'OpenAI'})}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${aiForm.provider === 'OpenAI' ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}
                  >
                    OpenAI
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên Model</label>
                <div className="space-y-2">
                  <select
                    value={['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'].includes(aiForm.model_name || '') ? aiForm.model_name : 'custom'}
                    onChange={e => {
                      if (e.target.value !== 'custom') {
                        setAiForm({...aiForm, model_name: e.target.value});
                      }
                    }}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-100 outline-none bg-white"
                  >
                    <option value="" disabled>--- Chọn Model ---</option>
                    {aiForm.provider === 'Google' ? (
                      <>
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (Nhanh & Rẻ)</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Thông minh nhất)</option>
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash (Thế hệ mới)</option>
                      </>
                    ) : (
                      <>
                        <option value="gpt-4o">GPT-4o (Đa năng & Mạnh nhất)</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Tiết kiệm)</option>
                      </>
                    )}
                    <option value="custom">-- Nhập tên model tùy chỉnh --</option>
                  </select>

                  {(!['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'].includes(aiForm.model_name || '') || aiForm.model_name === 'custom') && (
                    <input
                      type="text"
                      value={aiForm.model_name === 'custom' ? '' : aiForm.model_name}
                      onChange={e => setAiForm({...aiForm, model_name: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-100 outline-none animate-in slide-in-from-top-1"
                      placeholder="VD: gpt-4o-mini hoặc gemini-pro"
                      required
                    />
                  )}
                </div>
                <p className="text-[9px] text-slate-400 mt-1 italic italic">
                  * Vui lòng nhập đúng mã model của nhà cung cấp (VD: gpt-4o, gemini-1.5-flash). Đừng nhập "GPT" hay "Gemini" chung chung.
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">API Key</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={aiForm.api_key}
                    onChange={e => setAiForm({...aiForm, api_key: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-100 outline-none"
                    placeholder="Dán mã API Key tại đây"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mô tả thêm</label>
                <textarea
                  value={aiForm.description}
                  onChange={e => setAiForm({...aiForm, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-100 outline-none h-20 resize-none"
                  placeholder="Ghi chú về mục đích sử dụng key này..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={14} /> : editingAi ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiConfigTable;
