import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { StaffSatisfactionForm } from './Assessment/sub-components/StaffSatisfactionForm';
import { InpatientSatisfactionForm } from './Assessment/sub-components/InpatientSatisfactionForm';
import { OutpatientSatisfactionForm } from './Assessment/sub-components/OutpatientSatisfactionForm';
import { KsNuoiConForm } from './Assessment/sub-components/KsNuoiConForm';
import { KsMeSinhConForm } from './Assessment/sub-components/KsMeSinhConForm';
import { staffSatisfactionService } from './Assessment/services/staffSatisfactionService';
import { inpatientSatisfactionService } from './Assessment/services/inpatientSatisfactionService';
import { outpatientSatisfactionService } from './Assessment/services/outpatientSatisfactionService';
import { ksNuoiConService } from './Assessment/services/ksNuoiConService';
import { ksMeSinhConService } from './Assessment/services/ksMeSinhConService';
import { ZaloBrowserOverlay } from './ZaloBrowserOverlay';

interface PublicConfig {
  survey_type: 'staff' | 'inpatient' | 'outpatient' | 'ks_nuoi_con' | 'ks_me_sinh_con';
  is_public: boolean;
  survey_name: string;
}

const EXTERNAL_BROWSER_SURVEY_TYPES = ['staff', 'outpatient', 'ks_nuoi_con'];
const EXTERNAL_BROWSER_SLUGS = ['nvyt-2026', 'ngoaitru-2026', 'nuoi-con-sua-me'];

const isInAppBrowser = () => {
  const ua = navigator.userAgent || '';
  let sessionDetected = false;

  try {
    sessionDetected = sessionStorage.getItem('inapp_browser_detected') === 'true';
  } catch (err) {
    sessionDetected = false;
  }

  return Boolean(
    (window as any).__INAPP_DETECTED ||
    sessionDetected ||
    /Zalo|ZaloBrowser|; wv\)/i.test(ua)
  );
};

export const PublicSurveyPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [timedOut, setTimedOut] = useState(false);
  const cleanSlug = (slug || '').trim().toLowerCase();
  const shouldOpenExternallyBySlug = EXTERNAL_BROWSER_SLUGS.includes(cleanSlug);
  const shouldOpenExternallyByType = config ? EXTERNAL_BROWSER_SURVEY_TYPES.includes(config.survey_type) : false;
  const shouldShowBrowserOverlay = isInAppBrowser() && (shouldOpenExternallyBySlug || shouldOpenExternallyByType);

  // Clean up Zalo/UTM parameters if present
  useEffect(() => {
    try {
      const search = location.search;
      if (search && (search.includes('zarsrc') || search.includes('utm_') || search.includes('fbclid'))) {
        // Create a URLSearchParams object to safely manage params
        const params = new URLSearchParams(search);
        const paramsToRemove = ['zarsrc', 'utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
        let hasChanged = false;

        paramsToRemove.forEach(p => {
          if (params.has(p)) {
            params.delete(p);
            hasChanged = true;
          }
        });

        if (hasChanged) {
          const newSearch = params.toString();
          const cleanUrl = location.pathname + (newSearch ? `?${newSearch}` : '') + location.hash;
          console.log('🧹 Cleaning tracking parameters, redirecting to:', cleanUrl);

          // Use replace to avoid polluting history
          navigate(cleanUrl, { replace: true });
        }
      }
    } catch (err) {
      console.error('⚠️ URL cleaning in component failed:', err);
    }
  }, [location.search, location.pathname, location.hash, navigate]);

  const fetchConfig = async (retryCount = 0) => {
    if (!slug) return;

    if (!supabase) {
      console.error('❌ Supabase client not initialized');
      setError('Hệ thống đang bận. Vui lòng thử lại sau.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setTimedOut(false);

    const timeoutId = setTimeout(() => {
      setTimedOut(true);
    }, 15000); // 15s timeout

    try {
      const { data, error } = await supabase
        .from('survey_public_configs')
        .select('survey_type, is_public, survey_name')
        .eq('slug', cleanSlug)
        .single();

      clearTimeout(timeoutId);

      if (error || !data) {
        // Nếu lỗi và chưa thử lại quá 3 lần, hãy thử lại tự động
        if (retryCount < 2) {
          console.log(`🔄 Retrying fetch... (${retryCount + 1})`);
          setTimeout(() => fetchConfig(retryCount + 1), 1000);
          return;
        }
        throw new Error('Survey not found');
      }

      if (!data.is_public) {
        setError('Khảo sát này hiện đang đóng.');
        setLoading(false);
        return;
      }

      setConfig(data as PublicConfig);
      setLoading(false);
    } catch (err) {
      clearTimeout(timeoutId);
      if (retryCount < 2) {
        setTimeout(() => fetchConfig(retryCount + 1), 1000);
      } else {
        console.error('Error fetching survey config:', err);
        setError('Không thể tải khảo sát. Vui lòng kiểm tra mạng hoặc quét lại mã.');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [slug]);

  const handleSave = async (data: any) => {
    if (!config) return;
    setSaving(true);
    try {
      if (config.survey_type === 'staff') {
        await staffSatisfactionService.saveSurvey(data);
      } else if (config.survey_type === 'inpatient') {
        await inpatientSatisfactionService.createInpatientSurvey(data);
      } else if (config.survey_type === 'outpatient') {
        await outpatientSatisfactionService.createOutpatientSurvey(data);
      } else if (config.survey_type === 'ks_nuoi_con') {
        await ksNuoiConService.create(data);
      } else if (config.survey_type === 'ks_me_sinh_con') {
        await ksMeSinhConService.create(data);
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Error saving survey:', err);
      alert('Không thể gửi khảo sát. Vui lòng thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  if (shouldShowBrowserOverlay) {
    return <ZaloBrowserOverlay />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        {!timedOut ? (
          <>
            <Loader2 className="animate-spin text-[#059669] mb-4" size={40} />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[13px]">Đang tải khảo sát...</p>
          </>
        ) : (
          <>
            <AlertCircle className="text-amber-500 mb-4" size={48} />
            <h3 className="text-xl font-black text-slate-800 uppercase mb-2">Kết nối chậm</h3>
            <p className="text-slate-500 mb-6 max-w-xs">Việc tải khảo sát đang mất nhiều thời gian hơn dự kiến.</p>
            <button
              onClick={() => fetchConfig()}
              className="px-8 py-3 bg-[#059669] text-white rounded-xl font-bold uppercase text-[11px] tracking-widest shadow-lg shadow-emerald-100"
            >
              Thử tải lại
            </button>
          </>
        )}
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="text-rose-500" size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Thông báo</h2>
        <p className="text-slate-500 max-w-md mx-auto font-medium">{error || 'Khảo sát không khả dụng.'}</p>
        <button
          onClick={() => window.location.href = window.location.origin}
          className="mt-8 px-8 py-3 bg-slate-800 text-white rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-slate-900 transition-all"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#059669] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-8 animate-bounce">
          <CheckCircle2 className="text-white" size={48} />
        </div>
        <h2 className="text-3xl md:text-4xl font-black mb-4 uppercase tracking-tight">Gửi thành công!</h2>
        <p className="text-white/80 max-w-lg mx-auto text-lg font-medium leading-relaxed">
          Xin chân thành cảm ơn ý kiến đóng góp của Anh/Chị.
          Ý kiến của Anh/Chị sẽ giúp Bệnh viện Quân y cải thiện chất lượng phục vụ tốt hơn.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-12 px-10 py-4 bg-white text-[#059669] rounded-2xl font-black uppercase text-sm tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
        >
          Gửi thêm phiếu mới
        </button>
        <p className="mt-20 text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
          &copy; 2026 Bệnh viện Quân y - Hệ thống QLCL
        </p>
      </div>
    );
  }

  // Render the specific form
  return (
    <div className="min-h-screen bg-slate-50">
      {config.survey_type === 'staff' && (
        <StaffSatisfactionForm
          onSave={handleSave}
          onCancel={() => { }}
          saving={saving}
          isPublic={true}
        />
      )}
      {config.survey_type === 'inpatient' && (
        <InpatientSatisfactionForm
          onSave={handleSave}
          onCancel={() => { }}
          saving={saving}
          isPublic={true}
        />
      )}
      {config.survey_type === 'outpatient' && (
        <OutpatientSatisfactionForm
          onSave={handleSave}
          onCancel={() => { }}
          saving={saving}
          isPublic={true}
        />
      )}
      {config.survey_type === 'ks_nuoi_con' && (
        <KsNuoiConForm
          onSave={handleSave}
          onCancel={() => { }}
          saving={saving}
          isPublic={true}
        />
      )}
      {config.survey_type === 'ks_me_sinh_con' && (
        <KsMeSinhConForm
          onSave={handleSave}
          onCancel={() => { }}
          saving={saving}
          isPublic={true}
        />
      )}
    </div>
  );
};
