import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Register service worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('SW registration skipped:', err);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      alert('لتثبيت التطبيق على جهازك، استخدم خيار "إضافة إلى الشاشة الرئيسية" من قائمة المتصفح.');
    }
  };

  if (!showBanner && !isIos) return null;

  return (
    <>
      {showBanner && (
        <div className="no-print bg-gradient-to-r from-[#0B4F9E] to-[#083A75] text-white py-2.5 px-4 shadow-md sticky top-18 z-30">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 p-1 flex items-center justify-center shrink-0">
                <img src="/icon.svg" alt="PWA" className="w-full h-full object-contain" />
              </div>
              <div>
                <strong className="block font-bold">ثبّت تطبيق تسعير ومقايسة PVC على جهازك</strong>
                <span className="text-blue-100 text-[11px]">يعمل دون اتصال بالإنترنت وسريع مثل التطبيقات الأصلية</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="py-1.5 px-3.5 rounded-xl bg-white text-[#0B4F9E] font-extrabold text-xs hover:bg-blue-50 transition-all flex items-center gap-1 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تثبيت التطبيق</span>
              </button>
              <button
                onClick={() => setShowBanner(false)}
                className="p-1 text-white/70 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-extrabold text-sm text-[#10161F]">التثبيت على أجهزة iPhone / iPad</h3>
              <button onClick={() => setShowIosGuide(false)} className="text-gray-400">✕</button>
            </div>

            <div className="space-y-3 text-gray-700">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0B4F9E] text-white flex items-center justify-center font-bold shrink-0">1</span>
                <div>اضغط على زر المشاركة <Share className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> في أسفل متصفح Safari.</div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0B4F9E] text-white flex items-center justify-center font-bold shrink-0">2</span>
                <div>مرر للأسفل واختر <strong>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong>.</div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0B4F9E] text-white flex items-center justify-center font-bold shrink-0">3</span>
                <div>اضغط على <strong>"إضافة" (Add)</strong> في الزاوية العلوية وسيظهر التطبيق على شاشتك فوراً!</div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#0B4F9E] text-white font-bold"
            >
              فهمت، شكراً
            </button>
          </div>
        </div>
      )}
    </>
  );
};
