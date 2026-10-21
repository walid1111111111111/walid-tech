import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD } from '../../utils/calculator';
import { Quote } from '../../types';
import { Printer, X, Download, ShieldCheck } from 'lucide-react';

interface PrintableQuoteModalProps {
  quote: Quote | null;
  onClose: () => void;
}

export const PrintableQuoteModal: React.FC<PrintableQuoteModalProps> = ({ quote, onClose }) => {
  const { settings } = useApp();

  if (!quote) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-auto shadow-2xl border border-[#DDE3EA] overflow-hidden flex flex-col">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print bg-[#083A75] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">معاينة عرض السعر الرسمي (Devis)</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{quote.quoteNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-1.5 px-4 rounded-xl bg-[#1E9E5A] hover:bg-[#15803D] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ بتنسيق PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 text-xs text-[#10161F] space-y-6 print:p-0 print:text-black">
          {/* Document Header */}
          <div className="flex items-start justify-between border-b-2 border-[#0B4F9E] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#0B4F9E] flex items-center justify-center p-2 text-white">
                <img src="/icon.svg" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black text-[#0B4F9E]">{settings.workshopName}</h1>
                <p className="text-[11px] text-[#5B6675]">تصنيع وتركيب نوافذ وأبواب PVC العصرية عالية العزل</p>
                <p className="text-[11px] text-[#5B6675]">{settings.address} - ولاية {settings.wilaya}</p>
                <p className="text-[11px] font-bold text-[#0B4F9E]">هاتف: {settings.phone}</p>
              </div>
            </div>

            <div className="text-left space-y-1">
              <span className="text-lg font-black text-[#0B4F9E] block">كشف عرض سعر (DEVIS)</span>
              <div className="text-[11px] text-[#5B6675]">
                <span>رقم العرض: </span>
                <strong className="text-black">{quote.quoteNumber}</strong>
              </div>
              <div className="text-[11px] text-[#5B6675]">
                <span>تاريخ التحرير: </span>
                <strong className="text-black">{new Date(quote.createdAt).toLocaleDateString('ar-DZ')}</strong>
              </div>
              <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-sm inline-block">
                صالح حتى: {new Date(quote.validUntil).toLocaleDateString('ar-DZ')}
              </div>
            </div>
          </div>

          {/* Legal Identifiers */}
          <div className="text-[10px] text-gray-500 flex justify-between border-b border-gray-100 pb-2">
            <span>{settings.taxRegistrationNumber}</span>
            <span>العملة المعتمدة: الدينار الجزائري ({settings.currency})</span>
          </div>

          {/* Items Table */}
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#F3F6FA] text-[#0B4F9E] border-y border-[#DDE3EA]">
                <th className="py-2.5 px-3 font-extrabold">#</th>
                <th className="py-2.5 px-3 font-extrabold">بيان البند والنموذج</th>
                <th className="py-2.5 px-3 font-extrabold">الأبعاد (سم)</th>
                <th className="py-2.5 px-3 font-extrabold">المساحة</th>
                <th className="py-2.5 px-3 font-extrabold">الكمية</th>
                <th className="py-2.5 px-3 font-extrabold">سعر الوحدة</th>
                <th className="py-2.5 px-3 font-extrabold text-left">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quote.items.map((it, idx) => (
                <tr key={`quote-row-${it.id || ''}-${idx}`} className="print-break-inside-avoid">
                  <td className="py-2.5 px-3 font-bold text-gray-500">{idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <strong className="block text-[#10161F] text-xs">{it.modelName}</strong>
                    <span className="text-[10px] text-gray-600 block">
                      بروفيل: {it.seriesName.split('(')[0]} | اللون: {it.colorName.split('(')[0]} | زجاج: {it.glassTypeName.split('(')[0]}
                    </span>
                    {it.selectedOptionNames.length > 0 && (
                      <span className="text-[10px] text-[#1E9E5A] block">
                        ملحقات: {it.selectedOptionNames.join('، ')}
                      </span>
                    )}
                    {it.note && <span className="text-[10px] text-gray-400 italic block">ملاحظة: {it.note}</span>}
                  </td>
                  <td className="py-2.5 px-3 font-semibold">{it.width} × {it.height} {it.unit}</td>
                  <td className="py-2.5 px-3">{it.areaSqm} م²</td>
                  <td className="py-2.5 px-3 font-bold">{it.quantity}</td>
                  <td className="py-2.5 px-3 font-bold">{formatDZD(it.unitPriceDZD)}</td>
                  <td className="py-2.5 px-3 font-black text-[#0B4F9E] text-left">{formatDZD(it.itemSubtotalDZD)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Totals */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-72 space-y-2 border-t-2 border-gray-200 pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">المجموع قبل الخصم:</span>
                <span className="font-bold">{formatDZD(quote.subtotalDZD)}</span>
              </div>
              {quote.discountDZD > 0 && (
                <div className="flex justify-between text-xs text-red-600">
                  <span>الخصم:</span>
                  <span className="font-bold">-{formatDZD(quote.discountDZD)}</span>
                </div>
              )}
              {quote.tvaEnabled && (
                <div className="flex justify-between text-xs">
                  <span>الضريبة TVA ({quote.tvaRate}%):</span>
                  <span className="font-bold">{formatDZD(quote.tvaAmountDZD)}</span>
                </div>
              )}
              {quote.installationDeliveryFeeDZD > 0 && (
                <div className="flex justify-between text-xs">
                  <span>التوصيل والتركيب:</span>
                  <span className="font-bold">{formatDZD(quote.installationDeliveryFeeDZD)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black pt-2 border-t border-gray-300 text-[#0B4F9E]">
                <span>المبلغ الإجمالي التقديري:</span>
                <span>{formatDZD(quote.grandTotalDZD)}</span>
              </div>
            </div>
          </div>

          {/* Legal Notice & Terms (PRD Section 4.2 & 6.8) */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1.5 text-[10px] text-gray-600 leading-relaxed print-break-inside-avoid">
            <div className="font-bold text-gray-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0B4F9E]" />
              <span>ملاحظة قانونية وشروط الضمان:</span>
            </div>
            <p>{settings.legalDisclaimer}</p>
            <p>{settings.warrantyAndTerms}</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-200 text-center text-xs print-break-inside-avoid">
            <div>
              <span className="font-bold block mb-12">توقيع وموافقة الزبون</span>
              <span className="text-gray-400 text-[10px]">قرئ وقُبل (Lu et approuvé)</span>
            </div>
            <div>
              <span className="font-bold block mb-12">ختم وتوقيع الورشة</span>
              <span className="text-gray-400 text-[10px]">{settings.workshopName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
