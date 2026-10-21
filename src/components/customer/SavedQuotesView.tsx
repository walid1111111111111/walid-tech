import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD } from '../../utils/calculator';
import { Bookmark, ArrowRight, Trash2, Calendar, FileText } from 'lucide-react';

export const SavedQuotesView: React.FC = () => {
  const { savedQuotes, loadSavedQuote, deleteSavedQuote, setActiveCustomerTab, setPrintableQuoteModalData } = useApp();

  if (savedQuotes.length === 0) {
    return (
      <div className="py-16 px-4 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <Bookmark className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h2 className="text-xl font-extrabold text-[#10161F]">لا توجد عروض أسعار محفوظة</h2>
        <p className="text-xs sm:text-sm text-[#5B6675] mt-2 mb-6">
          عندما تقوم بحفظ أي عرض سعر من سلة العروض، سيظهر هنا حتى تتمكن من مقارنته وتعديله أو طباعته لاحقاً دون الحاجة للاتصال بالإنترنت.
        </p>
        <button
          onClick={() => setActiveCustomerTab('calculator')}
          className="py-3 px-6 rounded-2xl bg-[#0B4F9E] text-white font-bold text-sm shadow-md"
        >
          إنشاء عرض سعر جديد
        </button>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#DDE3EA]">
        <div>
          <h1 className="text-2xl font-black text-[#10161F]">عروض الأسعار المحفوظة</h1>
          <p className="text-xs text-[#5B6675]">
            العروض التقديرية المخزنة على جهازك للرجوع إليها في أي وقت.
          </p>
        </div>
        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
          {savedQuotes.length} عروض محفوظة
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedQuotes.map(quote => (
          <div
            key={quote.id}
            className="bg-white rounded-3xl p-5 border border-[#DDE3EA] shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="font-extrabold text-sm text-[#0B4F9E]">{quote.quoteNumber}</span>
                <span className="text-[11px] text-[#5B6675] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(quote.createdAt).toLocaleDateString('ar-DZ')}
                </span>
              </div>

              <div className="py-2 space-y-1 text-xs text-[#5B6675]">
                <p className="font-semibold text-[#10161F]">
                  عدد البنود: {quote.items.length} ({quote.items.reduce((a, b) => a + b.quantity, 0)} قطعة)
                </p>
                <div className="text-[11px] text-gray-500 line-clamp-2">
                  {quote.items.map(i => `${i.modelName} (${i.width}×${i.height})`).join('، ')}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[#5B6675]">المبلغ التقديري:</span>
                <span className="text-lg font-black text-[#0B4F9E]">
                  {formatDZD(quote.grandTotalDZD)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => loadSavedQuote(quote)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#0B4F9E] hover:bg-[#083A75] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>استرجاع وتعديل</span>
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                </button>

                <button
                  onClick={() => setPrintableQuoteModalData(quote)}
                  className="p-2 rounded-xl border border-[#DDE3EA] hover:bg-gray-50 text-gray-700"
                  title="طباعة PDF"
                >
                  <FileText className="w-4 h-4" />
                </button>

                <button
                  onClick={() => deleteSavedQuote(quote.id)}
                  className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-red-100"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
