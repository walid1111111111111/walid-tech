import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Save, Check, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { settings, updateSettings, resetAllData } = useApp();
  const [formData, setFormData] = useState({ ...settings });
  const [saveToast, setSaveToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleReset = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إعادة تعيين كافة البيانات إلى الحالة الافتراضية؟')) {
      resetAllData();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs">
        <h1 className="text-2xl font-black text-[#10161F]">الإعدادات العامة للورشة والنظام</h1>
        <p className="text-xs text-[#5B6675] mt-1">
          تخصيص هوية الورشة، أرقام الهاتف، السجل التجاري، نسبة الضريبة، والشروط القانونية المطبوعة على عروض الأسعار.
        </p>
      </div>

      {saveToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>تم حفظ الإعدادات وتحديث بيانات الفواتير وعروض الأسعار فوراً!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-5 text-xs">
        <h3 className="font-extrabold text-base text-[#10161F] pb-2 border-b border-gray-100">
          بيانات الورشة والتواصل
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-[#10161F] mb-1">اسم الورشة أو المؤسسة: *</label>
            <input
              type="text"
              required
              value={formData.workshopName}
              onChange={(e) => setFormData({ ...formData, workshopName: e.target.value })}
              className="w-full py-2.5 px-3 rounded-xl border border-[#DDE3EA] font-bold text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-[#10161F] mb-1">رقم الهاتف: *</label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full py-2.5 px-3 rounded-xl border border-[#DDE3EA] font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-[#10161F] mb-1">البريد الإلكتروني:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full py-2.5 px-3 rounded-xl border border-[#DDE3EA]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#10161F] mb-1">الولاية:</label>
            <input
              type="text"
              value={formData.wilaya}
              onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
              className="w-full py-2.5 px-3 rounded-xl border border-[#DDE3EA]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-[#10161F] mb-1">العنوان الكامل:</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full py-2.5 px-3 rounded-xl border border-[#DDE3EA]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-[#10161F] mb-1">الرقم الجبائي والسجل التجاري (NIF / RC / NIS):</label>
            <input
              type="text"
              value={formData.taxRegistrationNumber}
              onChange={(e) => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
              className="w-full py-2.5 px-3 rounded-xl border border-[#DDE3EA] font-mono text-xs"
            />
          </div>
        </div>

        <h3 className="font-extrabold text-base text-[#10161F] pt-4 pb-2 border-b border-gray-100">
          معايير التسعير والضرائب
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-[#10161F] mb-1">العملة الافتراضية:</label>
            <input
              type="text"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full py-2.5 px-3 rounded-xl border border-[#DDE3EA] font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-[#10161F] mb-1">مدة صلاحية عرض السعر (أيام):</label>
            <input
              type="number"
              value={formData.quoteValidityDays}
              onChange={(e) => setFormData({ ...formData, quoteValidityDays: Number(e.target.value) })}
              className="w-full py-2.5 px-3 rounded-xl border border-[#DDE3EA] font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-[#10161F] mb-1">وحدة القياس الافتراضية:</label>
            <select
              value={formData.defaultUnit}
              onChange={(e) => setFormData({ ...formData, defaultUnit: e.target.value as any })}
              className="w-full py-2.5 px-3 rounded-xl border border-[#DDE3EA] font-bold"
            >
              <option value="cm">سنتيمتر (سم)</option>
              <option value="mm">مليمتر (ملم)</option>
            </select>
          </div>
        </div>

        {/* TVA */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="tvaToggle"
              checked={formData.tvaEnabled}
              onChange={(e) => setFormData({ ...formData, tvaEnabled: e.target.checked })}
              className="w-4 h-4 text-[#0B4F9E] rounded-sm"
            />
            <label htmlFor="tvaToggle" className="cursor-pointer">
              <strong className="block font-bold text-[#10161F]">تفعيل ضريبة القيمة المضافة (TVA)</strong>
              <span className="text-[#5B6675] text-[11px]">
                تطبيق الضريبة في كشوفات عروض الأسعار والفواتير الرسمية.
              </span>
            </label>
          </div>

          {formData.tvaEnabled && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#10161F]">نسبة TVA:</span>
              <input
                type="number"
                value={formData.tvaRate}
                onChange={(e) => setFormData({ ...formData, tvaRate: Number(e.target.value) })}
                className="w-16 py-1 px-2 rounded-lg border border-gray-300 font-bold text-center"
              />
              <span>%</span>
            </div>
          )}
        </div>

        {/* Legal Disclaimer & Terms */}
        <div className="space-y-3 pt-2">
          <div>
            <label className="block font-bold text-[#10161F] mb-1">الملاحظة القانونية على عرض السعر:</label>
            <textarea
              rows={2}
              value={formData.legalDisclaimer}
              onChange={(e) => setFormData({ ...formData, legalDisclaimer: e.target.value })}
              className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#10161F] mb-1">شروط الضمان والتنفيذ:</label>
            <textarea
              rows={2}
              value={formData.warrantyAndTerms}
              onChange={(e) => setFormData({ ...formData, warrantyAndTerms: e.target.value })}
              className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA]"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <button
            type="submit"
            className="w-full sm:w-auto py-3 px-8 rounded-xl bg-[#0B4F9E] hover:bg-[#083A75] text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>حفظ التعديلات</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1.5 p-2 hover:bg-red-50 rounded-xl"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة البيانات الافتراضية الأصلية</span>
          </button>
        </div>
      </form>
    </div>
  );
};
