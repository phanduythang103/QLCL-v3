import React, { useEffect, useState } from 'react';
import { 
  Globe, QrCode, Link2, Copy, Check, Save, Unlink, Loader2, AlertCircle, 
  ExternalLink, MousePointer2, RefreshCw, Printer
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface SurveyConfig {
  id: string;
  survey_type: string;
  survey_name: string;
  is_public: boolean;
  slug: string;
}

export const SurveyPublicConfig: React.FC = () => {
  const [configs, setConfigs] = useState<SurveyConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [showQrIds, setShowQrIds] = useState<Set<string>>(new Set());
  
  // Domain configuration as requested
  const publicBaseUrl = 'https://qlcl103.pro.vn/khao-sat';
  const localBaseUrl = `${window.location.origin}/khao-sat`;

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('survey_public_configs')
        .select('*')
        .order('survey_type');
      
      if (error) throw error;
      setConfigs(data || []);
    } catch (err) {
      console.error('Error fetching survey configs:', err);
      setMessage({ text: 'Không thể tải cấu hình khảo sát.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublic = async (config: SurveyConfig) => {
    setSavingId(config.id);
    try {
      const { error } = await supabase
        .from('survey_public_configs')
        .update({ is_public: !config.is_public, updated_at: new Date().toISOString() })
        .eq('id', config.id);

      if (error) throw error;
      
      setConfigs(prev => prev.map(c => 
        c.id === config.id ? { ...c, is_public: !c.is_public } : c
      ));
      setMessage({ text: `Đã ${!config.is_public ? 'mở' : 'đóng'} public cho ${config.survey_name}`, type: 'success' });
    } catch (err) {
      console.error('Error updating public status:', err);
      setMessage({ text: 'Lỗi khi cập nhật trạng thái.', type: 'error' });
    } finally {
      setSavingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleUpdateSlug = async (id: string, newSlug: string) => {
    setSavingId(id);
    try {
      const { error } = await supabase
        .from('survey_public_configs')
        .update({ slug: newSlug.trim().toLowerCase(), updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      setConfigs(prev => prev.map(c => 
        c.id === id ? { ...c, slug: newSlug.trim().toLowerCase() } : c
      ));
      setMessage({ text: 'Cập nhật mã link thành công!', type: 'success' });
    } catch (err) {
      console.error('Error updating slug:', err);
      setMessage({ text: 'Lỗi: Mã link này có thể đã tồn tại.', type: 'error' });
    } finally {
      setSavingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const toggleQr = (id: string) => {
    setShowQrIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (slug: string) => {
    const fullUrl = `${publicBaseUrl}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const getQrUrl = (slug: string) => {
    const fullUrl = encodeURIComponent(`${publicBaseUrl}/${slug}`);
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${fullUrl}&margin=10`;
  };
  
  const handlePrint = (config: SurveyConfig) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrUrl = getQrUrl(config.slug);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>In mã QR - ${config.survey_name}</title>
          <style>
            @page { size: auto; margin: 0mm; }
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
              background: #f8fafc;
            }
            .card {
              background: white;
              border: 3px solid #009900;
              border-radius: 50px;
              padding: 50px;
              width: 350px;
              text-align: center;
              box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.1);
            }
            .hospital {
              font-weight: 900;
              text-transform: uppercase;
              font-size: 18px;
              margin-bottom: 30px;
              color: #0f172a;
              letter-spacing: -0.025em;
            }
            .qr-container {
              background: white;
              padding: 15px;
              border-radius: 24px;
              display: inline-block;
              border: 1px solid #f1f5f9;
            }
            .qr-img {
              width: 250px;
              height: 250px;
              display: block;
            }
            .survey-name {
              font-weight: 900;
              text-transform: uppercase;
              font-size: 14px;
              margin-top: 30px;
              color: #009900;
              line-height: 1.5;
              letter-spacing: 0.025em;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="hospital">Bệnh viện Quân y 103</div>
            <div class="qr-container">
              <img src="${qrUrl}" class="qr-img" />
            </div>
            <div class="survey-name">${config.survey_name}</div>
          </div>
          <script>
            // Wait for image to load before printing
            const img = document.querySelector('img');
            if (img.complete) {
              window.print();
              setTimeout(() => window.close(), 500);
            } else {
              img.onload = () => {
                window.print();
                setTimeout(() => window.close(), 500);
              };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-[#009900]" size={40} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Đang tải cấu hình...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#009900]">
            <Globe size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Cấu hình Khảo sát Public</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Quản lý link truy cập và mã QR cho các khảo sát hài lòng</p>
          </div>
        </div>
        <button 
          onClick={fetchConfigs}
          className="p-3 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-[#009900]"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span className="text-xs font-black uppercase tracking-tight">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {configs.map((config) => (
          <div key={config.id} className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col md:flex-row">
            {/* Left Info Section */}
            <div className="p-8 flex-1 space-y-6 border-b md:border-b-0 md:border-r border-slate-50">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    config.is_public ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {config.is_public ? 'Đang mở (Public)' : 'Đang đóng'}
                  </span>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight pt-2">{config.survey_name}</h3>
                </div>
                
                <button
                  onClick={() => handleTogglePublic(config)}
                  disabled={savingId === config.id}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all focus:outline-none ${
                    config.is_public ? 'bg-[#009900]' : 'bg-slate-300'
                  }`}
                >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-lg ${
                    config.is_public ? 'translate-x-9' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Link2 size={12} /> Đường dẫn khảo sát (Slug)
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-slate-50 rounded-2xl border border-slate-100 px-4 group focus-within:border-[#009900] transition-all">
                    <span className="text-slate-400 text-xs font-bold font-mono border-r border-slate-200 pr-3 mr-3 whitespace-nowrap">https://qlcl103.pro.vn/khao-sat/</span>
                    <input 
                      type="text"
                      defaultValue={config.slug}
                      onBlur={(e) => {
                        if (e.target.value !== config.slug) handleUpdateSlug(config.id, e.target.value);
                      }}
                      className="flex-1 bg-transparent py-4 text-sm font-black text-slate-800 outline-none placeholder:text-slate-300"
                      placeholder="nhap-ma-link"
                    />
                  </div>
                  <button 
                    onClick={() => copyToClipboard(config.slug)}
                    className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#009900] hover:border-[#009900] transition-all relative group"
                  >
                    {copiedSlug === config.slug ? <Check size={20} className="text-[#009900]" /> : <Copy size={20} />}
                    {copiedSlug === config.slug && (
                      <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-800 text-white text-[10px] font-black rounded-lg uppercase tracking-widest animate-in fade-in zoom-in duration-200">Đã chép</span>
                    )}
                  </button>
                  <a 
                    href={`${localBaseUrl}/${config.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#009900] hover:border-[#009900] transition-all"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
              </div>

              {/* Toggle QR Button */}
              <div className="pt-4 flex justify-between items-center border-t border-slate-50">
                <button 
                  onClick={() => toggleQr(config.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    showQrIds.has(config.id) 
                      ? 'bg-slate-800 text-white shadow-lg' 
                      : 'bg-emerald-50 text-[#009900] hover:bg-emerald-100'
                  }`}
                >
                  <QrCode size={14} />
                  {showQrIds.has(config.id) ? 'Ẩn mã QR' : 'Hiện mã QR & In'}
                </button>
              </div>
            </div>

            {/* Right QR Section (QR Card) - Conditionally Visible */}
            {showQrIds.has(config.id) && (
              <div className="p-8 bg-slate-50/50 w-full md:w-72 flex flex-col items-center justify-center gap-6 text-center animate-in slide-in-from-right-4 duration-500">
                <div className="relative group">
                  {/* Visual Glow */}
                  <div className="absolute inset-x-0 -inset-y-4 bg-[#009900]/10 rounded-[3rem] blur-2xl group-hover:bg-[#009900]/15 transition-all duration-500" />
                  
                  {/* The QR Card */}
                  <div id={`qr-card-${config.id}`} className="relative bg-white p-6 rounded-[2.5rem] border-2 border-slate-200 shadow-2xl transition-all hover:shadow-emerald-100 duration-500 flex flex-col items-center gap-4 w-56">
                    {/* Hospital Name (Top) */}
                    <div className="text-[10px] font-black text-slate-900 uppercase tracking-tighter text-center leading-tight bg-slate-50 py-2 px-3 rounded-xl w-full border border-slate-100">
                      Bệnh viện Quân y 103
                    </div>
                    
                    {/* QR Image (Middle) */}
                    <div className="p-2 border border-slate-50 rounded-2xl bg-white shadow-inner">
                      <img 
                        src={getQrUrl(config.slug)} 
                        alt="Survey QR Code" 
                        className="w-32 h-32 object-contain"
                      />
                    </div>
                    
                    {/* Survey Name (Bottom) */}
                    <div className="text-[9px] font-black text-[#009900] uppercase tracking-tight text-center leading-[1.3] px-2 min-h-[32px] flex items-center justify-center">
                      {config.survey_name}
                    </div>

                    {!config.is_public && (
                      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm rounded-[2.5rem] flex flex-col items-center justify-center text-white p-6 z-10">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-3">
                          <Unlink size={20} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-center leading-relaxed opacity-90">Mã QR vô hiệu khi chưa Public</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã QR Khảo sát</p>
                  <div className="flex flex-col gap-2">
                    <a 
                      href={getQrUrl(config.slug)} 
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        config.is_public ? 'text-[#009900] hover:bg-emerald-50 hover:border-[#009900]' : 'text-slate-300 pointer-events-none'
                      }`}
                    >
                      Mở ảnh QR <ExternalLink size={10} />
                    </a>
                    <button 
                      onClick={() => handlePrint(config)}
                      className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#009900] rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-100 transition-all hover:scale-105 active:scale-95 ${
                        config.is_public ? '' : 'opacity-50 pointer-events-none'
                      }`}
                    >
                      In thẻ QR <Printer size={10} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-4 items-start">
        <div className="w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-200">
          <QrCode size={20} />
        </div>
        <div>
          <h4 className="text-xs font-black text-amber-900 uppercase tracking-tight">Hướng dẫn sử dụng QR Code</h4>
          <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider leading-relaxed pt-1">
            Sau khi mở trạng thái <span className="font-black text-[#009900]">Public</span>, mã link và QR Code sẽ có hiệu lực. Bạn có thể in mã QR này dán tại khoa/phòng hoặc đặt tại quầy làm thủ tục để người bệnh dễ dàng quét và thực hiện khảo sát.
          </p>
        </div>
      </div>
    </div>
  );
};
