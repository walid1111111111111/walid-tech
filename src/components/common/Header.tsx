import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calculator,
  ShoppingBag,
  Bell,
  ShieldCheck,
  User,
  Download,
  Settings,
  X,
  CheckCircle2,
  PhoneCall,
  Menu,
} from 'lucide-react';

interface HeaderProps {
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications }) => {
  const {
    role,
    setRole,
    settings,
    currentQuote,
    notifications,
    activeCustomerTab,
    setActiveCustomerTab,
    activeAdminTab,
    setActiveAdminTab,
  } = useApp();

  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead && (role === 'owner' ? n.recipient !== 'customer' : n.recipient !== 'owner')).length;
  const quoteItemsCount = currentQuote.items.length;

  const handleRoleToggle = () => {
    if (role === 'customer') {
      // Direct switch to owner with quick confirmation modal or instant switch
      setShowAdminPinModal(true);
    } else {
      setRole('customer');
    }
  };

  const confirmAdminAccess = () => {
    // Default PIN: 1234 or empty allows owner quick testing
    if (pinInput === '1234' || pinInput === '' || pinInput === 'admin') {
      setRole('owner');
      setShowAdminPinModal(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DDE3EA] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (role === 'customer') setActiveCustomerTab('calculator');
                  else setActiveAdminTab('dashboard');
                }}
                className="flex items-center gap-3 text-right focus:outline-hidden"
              >
                <div className="w-11 h-11 rounded-xl bg-[#0B4F9E] flex items-center justify-center shadow-md overflow-hidden p-1.5 shrink-0">
                  <img src="/icon.svg" alt="PVC" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="font-extrabold text-base sm:text-lg leading-tight text-[#10161F] flex items-center gap-2">
                    <span>{settings.workshopName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#0B4F9E] border border-blue-200">
                      PWA
                    </span>
                  </div>
                  <p className="text-xs text-[#5B6675] hidden sm:block">
                    {role === 'owner' ? 'لوحة تحكم صاحب الورشة والمقايسة الفنية' : 'تسعير فوري ومقايسة دقيقة لنوافذ وأبواب PVC'}
                  </p>
                </div>
              </button>
            </div>

            {/* Desktop Navigation / Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Customer Quick Nav (Desktop) */}
              {role === 'customer' && (
                <div className="hidden md:flex items-center gap-1 bg-[#F3F6FA] p-1 rounded-xl border border-[#DDE3EA]">
                  <button
                    onClick={() => setActiveCustomerTab('calculator')}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      activeCustomerTab === 'calculator'
                        ? 'bg-[#0B4F9E] text-white shadow-xs'
                        : 'text-[#5B6675] hover:text-[#10161F]'
                    }`}
                  >
                    حاسبة الأسعار
                  </button>
                  <button
                    onClick={() => setActiveCustomerTab('basket')}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold relative transition-all ${
                      activeCustomerTab === 'basket'
                        ? 'bg-[#0B4F9E] text-white shadow-xs'
                        : 'text-[#5B6675] hover:text-[#10161F]'
                    }`}
                  >
                    سلة العروض
                    {quoteItemsCount > 0 && (
                      <span className="mr-1.5 px-1.5 py-0.2 bg-[#1E9E5A] text-white text-[11px] rounded-full font-bold">
                        {quoteItemsCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveCustomerTab('orders')}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      activeCustomerTab === 'orders'
                        ? 'bg-[#0B4F9E] text-white shadow-xs'
                        : 'text-[#5B6675] hover:text-[#10161F]'
                    }`}
                  >
                    طلباتي
                  </button>
                  <button
                    onClick={() => setActiveCustomerTab('contact')}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      activeCustomerTab === 'contact'
                        ? 'bg-[#0B4F9E] text-white shadow-xs'
                        : 'text-[#5B6675] hover:text-[#10161F]'
                    }`}
                  >
                    اتصل بنا
                  </button>
                </div>
              )}

              {/* Basket button on mobile / quick badge */}
              {role === 'customer' && (
                <button
                  onClick={() => setActiveCustomerTab('basket')}
                  className="relative p-2.5 rounded-xl border border-[#DDE3EA] hover:bg-[#F3F6FA] text-[#10161F] transition-all"
                  title="سلة عروض الأسعار"
                >
                  <ShoppingBag className="w-5 h-5 text-[#0B4F9E]" />
                  {quoteItemsCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1E9E5A] text-white text-[11px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                      {quoteItemsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Notifications Button */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2.5 rounded-xl border border-[#DDE3EA] hover:bg-[#F3F6FA] text-[#10161F] transition-all"
                title="الإشعارات"
              >
                <Bell className="w-5 h-5 text-[#5B6675]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#D62F3A] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Role Switcher Pill */}
              <button
                onClick={handleRoleToggle}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all shadow-xs ${
                  role === 'owner'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-amber-500/20'
                    : 'bg-[#F3F6FA] hover:bg-[#E8EEF5] text-[#0B4F9E] border-[#DDE3EA]'
                }`}
              >
                {role === 'owner' ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>لوحة المالك</span>
                    <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-sm">خروج</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#0B4F9E]" />
                    <span className="hidden sm:inline">دخول المالك</span>
                    <span className="sm:hidden">المالك</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Access PIN Modal */}
      {showAdminPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#DDE3EA] relative">
            <button
              onClick={() => setShowAdminPinModal(false)}
              className="absolute top-4 left-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#10161F]">الدخول إلى لوحة المالك</h3>
              <p className="text-xs text-[#5B6675] mt-1">
                خاص بصاحب الورشة فقط لإدارة الأسعار، الأرباح، المقايسة والطلبات.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5B6675] mb-1.5 text-right">
                  رمز المرور السريع (الرمز الافتراضي: 1234 أو اضغط مباشرة)
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && confirmAdminAccess()}
                  placeholder="أدخل 1234"
                  className="w-full text-center tracking-widest text-lg font-bold py-2.5 px-3 rounded-xl border border-[#DDE3EA] focus:outline-hidden focus:border-[#0B4F9E] focus:ring-2 focus:ring-[#0B4F9E]/20"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-[#D62F3A] mt-1 text-right">
                    رمز المرور غير صحيح. جرب 1234
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={confirmAdminAccess}
                  className="flex-1 py-3 rounded-xl bg-[#0B4F9E] hover:bg-[#083A75] text-white font-bold text-sm shadow-md transition-all"
                >
                  تأكيد الدخول
                </button>
                <button
                  onClick={() => setShowAdminPinModal(false)}
                  className="px-4 py-3 rounded-xl bg-[#F3F6FA] hover:bg-[#E8EEF5] text-[#5B6675] font-semibold text-sm"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
