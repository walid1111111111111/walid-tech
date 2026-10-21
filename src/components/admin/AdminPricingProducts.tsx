import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD } from '../../utils/calculator';
import { Model, ProfileSeries, ProfileColor, GlassType, AccessoryOption } from '../../types';
import {
  DollarSign,
  Plus,
  Edit2,
  Check,
  Percent,
  Sliders,
  Layers,
  Sparkles,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';

export const AdminPricingProducts: React.FC = () => {
  const {
    models,
    updateModel,
    toggleModelActive,
    series,
    updateSeriesItem,
    colors,
    updateColorItem,
    glassTypes,
    updateGlassItem,
    options,
    updateOptionItem,
    batchAdjustPrices,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'models' | 'series' | 'glass' | 'colors' | 'options'>('models');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchPercent, setBatchPercent] = useState<number>(5);
  const [batchTarget, setBatchTarget] = useState<'all' | 'windows' | 'doors' | 'glass'>('all');
  const [batchSuccessToast, setBatchSuccessToast] = useState(false);

  // Edit item inline states
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<number>(0);

  const handleApplyBatchAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    batchAdjustPrices(batchPercent, batchTarget);
    setShowBatchModal(false);
    setBatchSuccessToast(true);
    setTimeout(() => setBatchSuccessToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#10161F]">إدارة الأسعار وقائمة المنتجات</h1>
          <p className="text-xs text-[#5B6675]">
            تعديل أسعار المتر المربع، أسعار البروفيل والزجاج والملحقات، وتطبيق التعديل الجماعي للأسعار.
          </p>
        </div>

        <button
          onClick={() => setShowBatchModal(true)}
          className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all self-start"
        >
          <Percent className="w-4 h-4" />
          <span>تعديل جماعي للأسعار (نسبة %)</span>
        </button>
      </div>

      {batchSuccessToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>تم تطبيق التعديل الجماعي للأسعار بنجاح! جميع الحسابات الجديدة ستعتمد الأسعار المحدثة.</span>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex gap-2 border-b border-[#DDE3EA] pb-2 overflow-x-auto">
        {[
          { id: 'models' as const, label: 'النماذج والتصاميم' },
          { id: 'series' as const, label: 'سلاسل البروفيل' },
          { id: 'glass' as const, label: 'أنواع الزجاج' },
          { id: 'colors' as const, label: 'ألوان الـ PVC' },
          { id: 'options' as const, label: 'الملحقات والإكسسوارات' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSubTab === tab.id
                ? 'bg-[#0B4F9E] text-white shadow-xs'
                : 'bg-white border border-[#DDE3EA] text-[#5B6675] hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub Tab: Models */}
      {activeSubTab === 'models' && (
        <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-extrabold text-base text-[#10161F]">قائمة النماذج والأسعار الأساسية</h3>
            <span className="text-xs text-[#5B6675]">سعر المتر المربع أو سعر ثابت للقطعة</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map(m => {
              const isEditing = editingModelId === m.id;
              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    m.isActive ? 'border-[#DDE3EA] bg-white' : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-black text-sm text-[#10161F]">{m.name}</h4>
                      <span className="text-[11px] text-[#5B6675]">{m.categoryName} • فتح {m.openingType}</span>
                    </div>

                    <button
                      onClick={() => toggleModelActive(m.id)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all ${
                        m.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {m.isActive ? 'متاح للزبائن' : 'مخفي'}
                    </button>
                  </div>

                  <p className="text-xs text-[#5B6675] leading-relaxed line-clamp-2">
                    {m.description}
                  </p>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-gray-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#5B6675] block text-[11px]">حدود المقاسات:</span>
                      <strong className="text-gray-800">
                        عرض {m.minWidth}-{m.maxWidth} سم × ارتفاع {m.minHeight}-{m.maxHeight} سم
                      </strong>
                    </div>

                    <div className="text-left">
                      <span className="text-[#5B6675] block text-[11px]">
                        {m.priceType === 'fixed' ? 'السعر الثابت:' : 'سعر المتر المربع:'}
                      </span>
                      {isEditing ? (
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="number"
                            value={editPriceValue}
                            onChange={(e) => setEditPriceValue(Number(e.target.value))}
                            className="w-24 text-xs py-1 px-2 border rounded-md font-bold text-center"
                          />
                          <button
                            onClick={() => {
                              if (m.priceType === 'fixed') {
                                updateModel({ ...m, fixedPrice: editPriceValue });
                              } else {
                                updateModel({ ...m, basePriceSqm: editPriceValue });
                              }
                              setEditingModelId(null);
                            }}
                            className="p-1 rounded-md bg-[#1E9E5A] text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <strong className="text-sm font-black text-[#0B4F9E]">
                            {m.priceType === 'fixed' ? formatDZD(m.fixedPrice || 0) : formatDZD(m.basePriceSqm)}
                          </strong>
                          <button
                            onClick={() => {
                              setEditingModelId(m.id);
                              setEditPriceValue(m.priceType === 'fixed' ? m.fixedPrice || 0 : m.basePriceSqm);
                            }}
                            className="p-1 text-gray-400 hover:text-[#0B4F9E]"
                            title="تعديل السعر"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub Tab: Profile Series */}
      {activeSubTab === 'series' && (
        <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-extrabold text-base text-[#10161F]">سلاسل البروفيل ومواصفات العزل</h3>
            <span className="text-xs text-[#5B6675]">سماكة الغرف والزيادة السعرية</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {series.map(s => (
              <div key={s.id} className="p-5 rounded-2xl border border-[#DDE3EA] bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-[#10161F]">{s.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#0B4F9E] font-bold">
                    {s.frameDepthMm} ملم
                  </span>
                </div>

                <p className="text-xs text-[#5B6675]">{s.description}</p>

                <div className="space-y-2 text-xs pt-2 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-[#5B6675]">الزيادة السعرية:</span>
                    <strong className="text-[#0B4F9E]">{formatDZD(s.pricePerSqmExtra)} / م²</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B6675]">معامل التكلفة للمالك:</span>
                    <strong className="text-gray-800">{s.costFactor}x</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B6675]">نسبة الهدر في القص:</span>
                    <strong className="text-amber-700">{Math.round(s.scrapRate * 100)}%</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-[#5B6675] mb-1">
                    تعديل فارق السعر (دج/م²):
                  </label>
                  <input
                    type="number"
                    value={s.pricePerSqmExtra}
                    onChange={(e) => updateSeriesItem({ ...s, pricePerSqmExtra: Number(e.target.value) })}
                    className="w-full text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[#DDE3EA]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub Tab: Glass Types */}
      {activeSubTab === 'glass' && (
        <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-extrabold text-base text-[#10161F]">أنواع الزجاج والتكلفة وسعر البيع</h3>
            <span className="text-xs text-[#5B6675]">يحدد الربح للمتر المربع</span>
          </div>

          <div className="space-y-3">
            {glassTypes.map(g => (
              <div
                key={g.id}
                className="p-4 rounded-2xl border border-[#DDE3EA] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-black text-sm text-[#10161F]">{g.name}</h4>
                  <p className="text-[#5B6675] text-xs mt-0.5">{g.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div>
                    <span className="text-[#5B6675] block text-[11px]">سعر البيع للزبون:</span>
                    <input
                      type="number"
                      value={g.pricePerSqm}
                      onChange={(e) => updateGlassItem({ ...g, pricePerSqm: Number(e.target.value) })}
                      className="w-28 font-black text-sm text-[#0B4F9E] py-1 px-2 rounded-lg border border-[#DDE3EA]"
                    />
                  </div>
                  <div>
                    <span className="text-[#5B6675] block text-[11px]">سعر شراء المتر (تكلفة):</span>
                    <input
                      type="number"
                      value={g.costPerSqm}
                      onChange={(e) => updateGlassItem({ ...g, costPerSqm: Number(e.target.value) })}
                      className="w-28 font-bold text-sm text-gray-700 py-1 px-2 rounded-lg border border-[#DDE3EA]"
                    />
                  </div>
                  <div className="text-left">
                    <span className="text-[#5B6675] block text-[11px]">هامش ربح الزجاج:</span>
                    <strong className="text-sm font-black text-[#1E9E5A]">
                      +{formatDZD(g.pricePerSqm - g.costPerSqm)} / م²
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub Tab: Colors */}
      {activeSubTab === 'colors' && (
        <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-extrabold text-base text-[#10161F]">ألوان الـ PVC ونسب الزيادة</h3>
            <span className="text-xs text-[#5B6675]">نسبة مئوية تضاف لسعر النافذة</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {colors.map(c => (
              <div key={c.id} className="p-4 rounded-2xl border border-[#DDE3EA] bg-white flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-xl border border-gray-300 shadow-xs block shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div>
                    <h4 className="font-black text-xs sm:text-sm text-[#10161F]">{c.name}</h4>
                    <span className="text-[11px] text-[#5B6675]">كود: {c.hex}</span>
                  </div>
                </div>

                <div className="text-left">
                  <span className="text-[11px] text-[#5B6675] block">نسبة الزيادة (%):</span>
                  <input
                    type="number"
                    value={c.priceMarkupPercent}
                    onChange={(e) => updateColorItem({ ...c, priceMarkupPercent: Number(e.target.value) })}
                    className="w-16 font-black text-xs text-center py-1 rounded-lg border border-[#DDE3EA]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub Tab: Options */}
      {activeSubTab === 'options' && (
        <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-extrabold text-base text-[#10161F]">الملحقات والإكسسوارات الإضافية</h3>
            <span className="text-xs text-[#5B6675]">شباك حشرات، شتر، أقفال وقضبان</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {options.map(opt => (
              <div key={opt.id} className="p-4 rounded-2xl border border-[#DDE3EA] bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-[#10161F]">{opt.name}</h4>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold">
                    {opt.calcType === 'fixed' ? 'سعر ثابت للقطعة' : 'حسب المتر المربع'}
                  </span>
                </div>

                <p className="text-xs text-[#5B6675]">{opt.description}</p>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 text-xs">
                  <div>
                    <label className="text-[#5B6675] block text-[11px] mb-1">سعر البيع (دج):</label>
                    <input
                      type="number"
                      value={opt.price}
                      onChange={(e) => updateOptionItem({ ...opt, price: Number(e.target.value) })}
                      className="w-full font-black text-[#0B4F9E] py-1.5 px-2 rounded-lg border border-[#DDE3EA]"
                    />
                  </div>
                  <div>
                    <label className="text-[#5B6675] block text-[11px] mb-1">تكلفة الشراء للمالك:</label>
                    <input
                      type="number"
                      value={opt.cost}
                      onChange={(e) => updateOptionItem({ ...opt, cost: Number(e.target.value) })}
                      className="w-full font-bold text-gray-700 py-1.5 px-2 rounded-lg border border-[#DDE3EA]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Price Modifier Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-[#10161F] flex items-center gap-2">
              <Percent className="w-5 h-5 text-amber-500" />
              <span>تعديل جماعي للأسعار</span>
            </h3>
            <p className="text-xs text-[#5B6675]">
              زيادة أو تخفيض الأسعار بنسبة مئوية موحدة (مثلاً لمواكبة تغيّر أسعار المواد الخام).
            </p>

            <form onSubmit={handleApplyBatchAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#10161F] mb-1">نسبة التعديل (%):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    value={batchPercent}
                    onChange={(e) => setBatchPercent(Number(e.target.value))}
                    placeholder="+5 أو -5"
                    className="flex-1 text-lg font-black text-center py-2 px-3 rounded-xl border border-[#DDE3EA]"
                  />
                  <span className="font-bold text-base">%</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#10161F] mb-1">الفئة المستهدفة:</label>
                <select
                  value={batchTarget}
                  onChange={(e) => setBatchTarget(e.target.value as any)}
                  className="w-full py-2.5 px-3 rounded-xl border border-[#DDE3EA] font-semibold"
                >
                  <option value="all">كل المنتجات والنوافذ والأبواب والزجاج</option>
                  <option value="windows">نوافذ الـ PVC فقط</option>
                  <option value="doors">أبواب الـ PVC فقط</option>
                  <option value="glass">الزجاج فقط</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                >
                  تطبيق التعديل
                </button>
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
