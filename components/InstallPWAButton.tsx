import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

/** Sự kiện beforeinstallprompt (Chrome/Edge/Android) — chưa có trong lib TS mặc định. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true);

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !(window as any).MSStream;

/**
 * Nút "Cài đặt ứng dụng" giúp người dùng thêm lối tắt ra màn hình chính (PWA).
 * - Android/Chrome/Edge/Desktop: gọi trực tiếp lời mời cài đặt của trình duyệt.
 * - iOS (Safari không hỗ trợ tự động): hiện hướng dẫn Chia sẻ → Thêm vào MH chính.
 * - Đã cài (chạy standalone) hoặc trình duyệt không hỗ trợ: nút tự ẩn.
 */
export const InstallPWAButton: React.FC<{ variant?: 'login' | 'sidebar' }> = ({ variant = 'login' }) => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(isStandalone());
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const ios = isIOS();

  // Đã cài rồi thì không hiện. Trên trình duyệt không phải iOS mà chưa có lời mời
  // (không cài được / đã cài) cũng ẩn để tránh nút "chết".
  if (installed) return null;
  if (!ios && !deferred) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      try {
        await deferred.userChoice;
      } catch { /* bỏ qua */ }
      setDeferred(null);
    } else if (ios) {
      setShowIosHelp(true);
    }
  };

  const btnClass =
    variant === 'sidebar'
      ? 'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[12px] font-bold uppercase tracking-wide transition-colors'
      : 'w-full flex items-center justify-center gap-2 mt-4 px-4 py-3 rounded-xl border-2 border-primary-600 text-primary-700 hover:bg-primary-50 font-bold uppercase text-label tracking-wide transition-colors';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={btnClass}
        aria-label="Cài đặt ứng dụng ra màn hình chính"
        title="Cài đặt ứng dụng ra màn hình chính"
      >
        <Download size={18} className="shrink-0" />
        <span>Cài đặt ứng dụng</span>
      </button>

      {showIosHelp && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={() => setShowIosHelp(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-title font-black text-black uppercase leading-tight">Cài đặt ứng dụng</h3>
              <button
                onClick={() => setShowIosHelp(false)}
                className="text-gray-400 hover:text-gray-700 shrink-0"
                aria-label="Đóng"
              >
                <X size={22} />
              </button>
            </div>
            <p className="text-[13px] text-gray-600 mb-4">
              Trên iPhone/iPad, hãy mở bằng <b>Safari</b> rồi làm theo 3 bước:
            </p>
            <ol className="space-y-3 text-[13px] text-gray-800">
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-[12px] shrink-0">1</span>
                <span className="flex items-center gap-1.5">Bấm nút <Share size={16} className="text-primary-700" /> <b>Chia sẻ</b></span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-[12px] shrink-0">2</span>
                <span className="flex items-center gap-1.5">Chọn <PlusSquare size={16} className="text-primary-700" /> <b>Thêm vào MH chính</b></span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-[12px] shrink-0">3</span>
                <span>Bấm <b>Thêm</b> ở góc trên bên phải</span>
              </li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
};
