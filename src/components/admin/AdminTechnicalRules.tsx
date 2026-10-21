import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Ruler, ShieldCheck, Check, Sliders, Info, RotateCcw } from 'lucide-react';

export const AdminTechnicalRules: React.FC = () => {
  const { settings, updateSettings, series, updateSeriesItem } = useApp();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [standardBarLength, setStandardBarLength] = useState(settings.standardBarLengthM || 6.0);
  const [scrapPercentage, setScrapPercentage] = useState(settings.scrapWastePercentage || 8);
  const [minBillableArea, setMinBillableArea] = useState(settings.minBillableAreaSqm || 1.0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      standardBarLengthM: Number(standardBarLength),
      scrapWastePercentage: Number(scrapPercentage),
      minBillableAreaSqm: Number(minBillableArea),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 self-start w-fit mb-2">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>قواعد المقايسة الفنية وحساب الكميات (BOM)</span>
        </div>
        <h1 className="text-2xl font-black text-[#10161F]">إعدادات القص ومعادلات الـ BOM</h1>
        <p className="text-xs text-[#5B6675] mt-1 max-w-2xl leading-relaxed">
          تتحكم هذه القواعد في كيفية تقسيم قضبان البروفيل 6 متر وحساب مساحات قص الزجاج وأطوال حديد التقوية ونسبة الهدر في الورشة بدقة.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>تم حفظ القواعد الفنية بنجاح وتطبيقها على حسابات القص الفورية!</span>
        </div>
      )}

      {/* Main Parameters Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-[#10161F] pb-2 border-b border-gray-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#0B4F9E]" />
            <span>معايير القص العامة</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-[#10161F] mb-1">
              طول قضيب البروفيل القياسي (متر):
            </label>
            <input
              type="number"
              step="0.1"
              value={standardBarLength}
              onChange={(e) => setStandardBarLength(Number(e.target.value))}
              className="w-full font-black text-sm py-2 px-3 rounded-xl border border-[#DDE3EA]"
            />
            <span className="text-[11px] text-[#5B6675] mt-1 block">
              القيمة القياسية المعتمدة في مصانع البروفيل هي 6.0 أمتار (6000 ملم).
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#10161F] mb-1">
              نسبة الهدر في القص والشطف (Scrap Rate %):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                value={scrapPercentage}
                onChange={(e) => setScrapPercentage(Number(e.target.value))}
                className="flex-1 font-black text-sm py-2 px-3 rounded-xl border border-[#DDE3EA]"
              />
              <span className="font-bold text-sm">%</span>
            </div>
            <span className="text-[11px] text-[#5B6675] mt-1 block">
              تُضاف تلقائياً للأطوال الصافية لتعويض شطف الزوايا بزاوية 45° وبواقي التقطيع (عادة بين 7% و 10%).
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#10161F] mb-1">
              الحد الأدنى للمساحة المحاسبية (م²):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={minBillableArea}
                onChange={(e) => setMinBillableArea(Number(e.target.value))}
                className="flex-1 font-black text-sm py-2 px-3 rounded-xl border border-[#DDE3EA]"
              />
              <span className="font-bold text-sm">م²</span>
            </div>
            <span className="text-[11px] text-[#5B6675] mt-1 block">
              للنوافذ الصغيرة (أقل من 1 م²)، يتم احتساب 1 م² على الأقل لتغطية تكاليف الإكسسوارات والعمالة الثابتة.
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#0B4F9E] hover:bg-[#083A75] text-white font-bold text-xs shadow-md transition-all"
          >
            حفظ وتطبيق القواعد
          </button>
        </form>

        {/* Technical Explanations Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-[#10161F] pb-2 border-b border-gray-100 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#0B4F9E]" />
            <span>معادلات التقطيع المعتمدة في النظام</span>
          </h3>

          <div className="space-y-3 text-xs text-[#5B6675]">
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-gray-100 space-y-1">
              <strong className="text-[#10161F] block">1. بروفيل الحلق (Cadre):</strong>
              <code className="text-[#0B4F9E] font-bold block dir-ltr text-right">
                Frame Length = 2 × (Width + Height)
              </code>
              <p className="text-[11px]">محيط فتحة الحائط بالكامل مع قص الزوايا 45 درجة.</p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-gray-100 space-y-1">
              <strong className="text-[#10161F] block">2. بروفيل الضلف (Ouvrant):</strong>
              <code className="text-[#0B4F9E] font-bold block dir-ltr text-right">
                Sash Length = 2 × (SashWidth + SashHeight) × N
              </code>
              <p className="text-[11px]">محيط كل ضلفة مضروباً في عدد الضلف (N) مع احتساب التداخل للجرار.</p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-gray-100 space-y-1">
              <strong className="text-[#10161F] block">3. مقاس قص الزجاج الصافي:</strong>
              <code className="text-[#0B4F9E] font-bold block dir-ltr text-right">
                Glass Width = SashWidth - ProfileRebate (50mm)
              </code>
              <p className="text-[11px]">خصم سماكة بروفيل الضلفة ومجرى الجوان لتحديد أبعاد لوح الزجاج الصافي.</p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-gray-100 space-y-1">
              <strong className="text-[#10161F] block">4. حديد التقوية المجلفن (Renfort):</strong>
              <code className="text-[#0B4F9E] font-bold block dir-ltr text-right">
                Steel Length = Total Net Profile × 88%
              </code>
              <p className="text-[11px]">يُوضع داخل حجرات الـ PVC لتوفير متانة ضد الرياح والضغط العالي.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
