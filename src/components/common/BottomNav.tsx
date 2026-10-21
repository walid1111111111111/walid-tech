import React from 'react';
import { useApp } from '../../context/AppContext';
import { Calculator, ShoppingBag, ClipboardList, Bookmark, PhoneCall } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const {
    role,
    activeCustomerTab,
    setActiveCustomerTab,
    currentQuote,
    orders,
    savedQuotes,
  } = useApp();

  if (role !== 'customer') return null;

  const quoteCount = currentQuote.items.length;
  const ordersCount = orders.length;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DDE3EA] py-1.5 px-2 shadow-lg">
      <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
        {/* 1. Calculator */}
        <button
          onClick={() => setActiveCustomerTab('calculator')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-xs font-semibold transition-all ${
            activeCustomerTab === 'calculator'
              ? 'text-[#0B4F9E] font-bold scale-105'
              : 'text-[#5B6675] hover:text-[#10161F]'
          }`}
        >
          <Calculator className={`w-5 h-5 mb-0.5 ${activeCustomerTab === 'calculator' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] leading-tight">الحاسبة</span>
        </button>

        {/* 2. Basket / Quote */}
        <button
          onClick={() => setActiveCustomerTab('basket')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-xs font-semibold relative transition-all ${
            activeCustomerTab === 'basket'
              ? 'text-[#0B4F9E] font-bold scale-105'
              : 'text-[#5B6675] hover:text-[#10161F]'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 mb-0.5 ${activeCustomerTab === 'basket' ? 'stroke-[2.5]' : ''}`} />
            {quoteCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#1E9E5A] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {quoteCount}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-tight">سلة العرض</span>
        </button>

        {/* 3. My Orders */}
        <button
          onClick={() => setActiveCustomerTab('orders')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-xs font-semibold relative transition-all ${
            activeCustomerTab === 'orders'
              ? 'text-[#0B4F9E] font-bold scale-105'
              : 'text-[#5B6675] hover:text-[#10161F]'
          }`}
        >
          <div className="relative">
            <ClipboardList className={`w-5 h-5 mb-0.5 ${activeCustomerTab === 'orders' ? 'stroke-[2.5]' : ''}`} />
            {ordersCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {ordersCount}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-tight">طلباتي</span>
        </button>

        {/* 4. Saved Quotes */}
        <button
          onClick={() => setActiveCustomerTab('saved_quotes')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-xs font-semibold relative transition-all ${
            activeCustomerTab === 'saved_quotes'
              ? 'text-[#0B4F9E] font-bold scale-105'
              : 'text-[#5B6675] hover:text-[#10161F]'
          }`}
        >
          <div className="relative">
            <Bookmark className={`w-5 h-5 mb-0.5 ${activeCustomerTab === 'saved_quotes' ? 'stroke-[2.5]' : ''}`} />
            {savedQuotes.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {savedQuotes.length}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-tight">المحفوظات</span>
        </button>

        {/* 5. Contact */}
        <button
          onClick={() => setActiveCustomerTab('contact')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-xs font-semibold transition-all ${
            activeCustomerTab === 'contact'
              ? 'text-[#0B4F9E] font-bold scale-105'
              : 'text-[#5B6675] hover:text-[#10161F]'
          }`}
        >
          <PhoneCall className={`w-5 h-5 mb-0.5 ${activeCustomerTab === 'contact' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] leading-tight">اتصل بنا</span>
        </button>
      </div>
    </nav>
  );
};
