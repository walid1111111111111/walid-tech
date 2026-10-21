import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD } from '../../utils/calculator';
import { Order } from '../../types';
import { Printer, X, Wrench, ShieldAlert } from 'lucide-react';

interface PrintableOrderModalProps {
  order: Order | null;
  onClose: () => void;
}

export const PrintableOrderModal: React.FC<PrintableOrderModalProps> = ({ order, onClose }) => {
  const { settings } = useApp();

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full my-auto shadow-2xl border border-[#DDE3EA] overflow-hidden flex flex-col">
        {/* Top Control Bar */}
        <div className="no-print bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">أمر تشغيل وورقة عمل الورشة (Fiche de Débit & BOM)</span>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
              {order.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="py-1.5 px-4 rounded-xl bg-[#0B4F9E] hover:bg-[#083A75] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة ورقة العمل للورشة</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div className="p-6 sm:p-10 text-xs text-gray-900 space-y-6 print:p-0">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black">{settings.workshopName}</h1>
                <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-xs font-bold">
                  بطاقة تصنيع داخلية
                </span>
              </div>
              <p className="text-[11px] text-gray-600">جدول تقطيع البروفيل والزجاج وقائمة المواد (BOM)</p>
            </div>

            <div className="text-left space-y-0.5">
              <strong className="text-base font-black block">أمر عمل: {order.orderNumber}</strong>
              <span className="text-[11px] text-gray-600 block">
                تاريخ الطلب: {new Date(order.createdAt).toLocaleDateString('ar-DZ')}
              </span>
              <span className="text-[11px] font-bold text-blue-700 block">
                الزبون: {order.customerName} ({order.customerPhone})
              </span>
              <span className="text-[10px] text-gray-500 block">الموقع: {order.customerWilaya} - {order.customerAddress}</span>
            </div>
          </div>

          {/* Items Cut List */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm border-b border-gray-300 pb-1 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-[#0B4F9E]" />
              <span>تفاصيل التقطيع والمواد لكل بند:</span>
            </h3>

            {order.items.map((it, idx) => {
              const bom = it.technicalBOM;
              return (
                <div key={`print-order-bom-${it.id || ''}-${idx}`} className="p-4 rounded-xl border border-gray-300 space-y-3 print-break-inside-avoid">
                  <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg font-bold">
                    <span>
                      بند {idx + 1}: {it.modelName} ({it.quantity} قطع)
                    </span>
                    <span>
                      المقاس: {it.width} × {it.height} {it.unit} | {it.sashes} ضلف | {it.colorName.split('(')[0]}
                    </span>
                  </div>

                  <table className="w-full text-right border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-gray-50 border-y border-gray-200 text-gray-700">
                        <th className="py-1.5 px-2">العنصر الفني</th>
                        <th className="py-1.5 px-2">طريقة الحساب / المواصفة</th>
                        <th className="py-1.5 px-2">الطول / الكمية الصافية</th>
                        <th className="py-1.5 px-2">القضبان والمشتريات (مع الهدر)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="py-1.5 px-2 font-bold">بروفيل الحلق (Cadre)</td>
                        <td className="py-1.5 px-2">2 × (W + H)</td>
                        <td className="py-1.5 px-2 font-bold">{bom.frameLengthM} م</td>
                        <td className="py-1.5 px-2 text-gray-700" rowSpan={2}>
                          قضبان 6 م المطلوبة: <strong>{bom.barsRequired6m} قضبان</strong>
                          <br />
                          بقايا القطع: {bom.scrapWasteM} م (هدر 8%)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-bold">بروفيل الضلفة (Ouvrant)</td>
                        <td className="py-1.5 px-2">2 × (W_sash + H_sash) × {it.sashes}</td>
                        <td className="py-1.5 px-2 font-bold">{bom.sashLengthM} م</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-bold">ألواح الزجاج ({it.glassTypeName.split('(')[0]})</td>
                        <td className="py-1.5 px-2">
                          أبعاد القص الصافية: <strong>{bom.glassCutDimensions.widthCm} × {bom.glassCutDimensions.heightCm} سم</strong>
                        </td>
                        <td className="py-1.5 px-2 font-bold">{bom.glassAreaSqm} م²</td>
                        <td className="py-1.5 px-2">عدد الألواح: {bom.glassCutDimensions.quantity * it.quantity} لوح</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-bold">حديد التقوية المجلفن (Renfort)</td>
                        <td className="py-1.5 px-2">داخل حجرات الحلق والضلف</td>
                        <td className="py-1.5 px-2 font-bold">{bom.steelReinforcementM} م</td>
                        <td className="py-1.5 px-2">سماكة 1.2 ملم مجلفن</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-bold">الإكسسوارات والمطاط</td>
                        <td className="py-1.5 px-2">
                          جوانات: {bom.gasketsLengthM} م | أقفال ومقابض: {bom.locksHandlesCount}
                        </td>
                        <td className="py-1.5 px-2" colSpan={2}>
                          {bom.hingesCount > 0 ? `${bom.hingesCount} مفصلات` : ''}
                          {bom.rollersCount > 0 ? `${bom.rollersCount} عجلات جرار` : ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-300 text-center text-xs print-break-inside-avoid">
            <div>
              <span className="font-bold block mb-12">مسؤول التقطيع والتجميع بالورشة</span>
              <span className="text-gray-400 text-[10px]">توقيع الفني</span>
            </div>
            <div>
              <span className="font-bold block mb-12">مراقبة الجودة والتسليم</span>
              <span className="text-gray-400 text-[10px]">اعتماد صاحب الورشة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
