import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ModelCategory,
  Model,
  ProfileSeries,
  ProfileColor,
  GlassType,
  AccessoryOption,
  Unit,
  SashConfig,
  SashFunction,
} from '../../types';
import { WindowSvgPreview } from '../common/WindowSvgPreview';
import { Window3DPreview } from '../common/Window3DPreview';
import { calculateAreaSqm, calculateQuoteItem, formatDZD, convertToCm, convertFromCm } from '../../utils/calculator';
import {
  Layers,
  Sparkles,
  Shield,
  Palette,
  Check,
  AlertTriangle,
  Plus,
  ArrowRight,
  Info,
  Maximize2,
  Sliders,
  DollarSign,
  HelpCircle,
  Wind,
  RotateCw,
  Box,
} from 'lucide-react';

export const CalculatorView: React.FC = () => {
  const {
    models,
    series,
    colors,
    glassTypes,
    options,
    settings,
    addItemToQuote,
    setActiveCustomerTab,
  } = useApp();

  // Active form state
  const [selectedCategory, setSelectedCategory] = useState<ModelCategory>('window');
  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    const first = models.find(m => m.categoryId === 'window') || models[0];
    return first?.id || '';
  });
  const [unit, setUnit] = useState<Unit>(settings.defaultUnit || 'cm');
  const [width, setWidth] = useState<number>(140);
  const [height, setHeight] = useState<number>(120);
  const [sashes, setSashes] = useState<number>(2);
  const [activeSashIndex, setActiveSashIndex] = useState<number>(0);
  const [sashConfigs, setSashConfigs] = useState<SashConfig[]>([
    { id: 0, type: 'OB', openingSide: 'left' },
    { id: 1, type: 'OF', openingSide: 'right' },
  ]);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(() => series[1]?.id || series[0]?.id || '');
  const [selectedColorId, setSelectedColorId] = useState<string>(() => colors[0]?.id || '');
  const [selectedGlassId, setSelectedGlassId] = useState<string>(() => glassTypes[0]?.id || '');
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [itemNote, setItemNote] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [previewMode, setPreviewMode] = useState<'3d' | '2d'>('3d');

  // Available models for active category
  const filteredModels = useMemo(() => {
    return models.filter(m => m.categoryId === selectedCategory && m.isActive);
  }, [models, selectedCategory]);

  // Current selected entities
  const selectedModel = useMemo(() => {
    return models.find(m => m.id === selectedModelId) || filteredModels[0] || models[0];
  }, [models, selectedModelId, filteredModels]);

  const selectedSeries = useMemo(() => {
    return series.find(s => s.id === selectedSeriesId) || series[0];
  }, [series, selectedSeriesId]);

  const selectedColor = useMemo(() => {
    return colors.find(c => c.id === selectedColorId) || colors[0];
  }, [colors, selectedColorId]);

  const selectedGlass = useMemo(() => {
    return glassTypes.find(g => g.id === selectedGlassId) || glassTypes[0];
  }, [glassTypes, selectedGlassId]);

  const selectedOptions = useMemo(() => {
    return options.filter(o => selectedOptionIds.includes(o.id));
  }, [options, selectedOptionIds]);

  // Validation & Suggestions
  const dimensionValidation = useMemo(() => {
    if (!selectedModel) return { isValid: true, message: null, suggestion: null };

    const wCm = convertToCm(width, unit);
    const hCm = convertToCm(height, unit);

    if (!wCm || wCm <= 0 || !hCm || hCm <= 0) {
      return { isValid: false, message: 'يرجى إدخال أبعاد صحيحة (العرض والارتفاع).', suggestion: null };
    }

    if (wCm < selectedModel.minWidth) {
      return {
        isValid: false,
        message: `الحد الأدنى لعرض هذا النموذج هو ${convertFromCm(selectedModel.minWidth, unit)} ${unit}.`,
        suggestion: null,
      };
    }
    if (wCm > selectedModel.maxWidth) {
      return {
        isValid: false,
        message: `الحد الأقصى لعرض هذا النموذج هو ${convertFromCm(selectedModel.maxWidth, unit)} ${unit}.`,
        suggestion: sashes < 4 ? 'نقترح زيادة عدد الضلف (مثلاً 3 أو 4 ضلف) لضمان متانة الحركة وتوزيع الوزن.' : null,
      };
    }

    if (hCm < selectedModel.minHeight) {
      return {
        isValid: false,
        message: `الحد الأدنى لارتفاع هذا النموذج هو ${convertFromCm(selectedModel.minHeight, unit)} ${unit}.`,
        suggestion: null,
      };
    }
    if (hCm > selectedModel.maxHeight) {
      return {
        isValid: false,
        message: `الحد الأقصى لارتفاع هذا النموذج هو ${convertFromCm(selectedModel.maxHeight, unit)} ${unit}.`,
        suggestion: 'للارتفاعات الكبيرة، يُفضل إضافة جزء علوي ثابت (Imposte) لدعم الهيكل.',
      };
    }

    // Sash width sanity check
    const perSashWidth = wCm / (sashes || 1);
    if (perSashWidth > 130 && selectedModel.openingType === 'sliding') {
      return {
        isValid: true,
        message: null,
        suggestion: `عرض الضلفة الواحدة كبير (${Math.round(perSashWidth)} سم). يُنصح بزيادة عدد الضلف للحصول على انسيابية ممتازة.`,
      };
    }

    return { isValid: true, message: null, suggestion: null };
  }, [selectedModel, width, height, unit, sashes]);

  // Helper to change sashes count and maintain or regenerate sash configs
  const handleSashesChange = (newSashes: number) => {
    setSashes(newSashes);
    if (activeSashIndex >= newSashes) {
      setActiveSashIndex(0);
    }
    setSashConfigs(prev => {
      return Array.from({ length: newSashes }).map((_, i) => {
        if (prev[i]) return prev[i];
        const isFirst = i === 0;
        let defaultType: SashFunction = 'OF';
        if (selectedModel?.openingType === 'tilt_turn' || (selectedModel?.openingType === 'casement' && isFirst)) {
          defaultType = 'OB';
        } else if (selectedModel?.openingType === 'sliding' || selectedModel?.openingType === 'door_sliding') {
          defaultType = 'SLIDE';
        } else if (selectedModel?.openingType === 'fixed') {
          defaultType = 'FIX';
        }
        return {
          id: i,
          type: defaultType,
          openingSide: i % 2 === 0 ? 'left' : 'right',
        };
      });
    });
  };

  const updateCurrentSashConfig = (updates: Partial<SashConfig>) => {
    setSashConfigs(prev =>
      prev.map((s, idx) => (idx === activeSashIndex ? { ...s, ...updates } : s))
    );
  };

  // Real-time Calculated Quote Item
  const calculatedItem = useMemo(() => {
    if (!selectedModel || !selectedSeries || !selectedColor || !selectedGlass) return null;
    return calculateQuoteItem({
      model: selectedModel,
      series: selectedSeries,
      color: selectedColor,
      glass: selectedGlass,
      selectedOptions,
      width,
      height,
      unit,
      sashes,
      sashConfigs,
      quantity,
      settings,
    });
  }, [selectedModel, selectedSeries, selectedColor, selectedGlass, selectedOptions, width, height, unit, sashes, sashConfigs, quantity, settings]);

  // Handle Model Category Change
  const handleCategorySelect = (cat: ModelCategory) => {
    setSelectedCategory(cat);
    const available = models.filter(m => m.categoryId === cat && m.isActive);
    if (available.length > 0) {
      setSelectedModelId(available[0].id);
      handleSashesChange(available[0].defaultSashes || 1);
    }
  };

  // Toggle Option
  const toggleOption = (id: string) => {
    setSelectedOptionIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Add to basket
  const handleAddToBasket = () => {
    if (!calculatedItem) return;
    const itemWithNote = { ...calculatedItem, note: itemNote, sashConfigs };
    addItemToQuote(itemWithNote);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#0B4F9E] to-[#083A75] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-xs mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>تسعير فوري ومقايسة تقنية دقيقة 100%</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
            حاسبة تسعير نوافذ وأبواب PVC
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 max-w-2xl leading-relaxed">
            اختر نوع الفتحة والمقاسات وسلسلة البروفيل والزجاج مع إمكانية تخصيص كل ضلفة بنظام الفتح القلاب والمفصلي (OB) واحصل على عرض سعر تقديري فوري بالدينار الجزائري.
          </p>
        </div>
      </div>

      {/* Main Grid: Steps on the Right/Main, Live SVG & Price on the Left/Sticky */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live 2D Schematic & Real-Time Price Card (Sticky on Large Screens) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-22 order-1 lg:order-2">
          {/* Dynamic 2D / 3D Visualization Box */}
          <div className="bg-white rounded-3xl p-5 border border-[#DDE3EA] shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-base text-[#10161F] flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-[#0B4F9E]" />
                <span>معاينة النموذج الأولي</span>
              </h3>

              {/* 2D / 3D Toggle Switcher */}
              <div className="flex items-center bg-[#F3F6FA] p-1 rounded-xl border border-gray-200/80">
                <button
                  type="button"
                  onClick={() => setPreviewMode('3d')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewMode === '3d'
                      ? 'bg-[#0B4F9E] text-white shadow-xs'
                      : 'text-[#5B6675] hover:text-[#10161F]'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>مجسم 3D</span>
                  <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-1 rounded-xs">جديد</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('2d')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewMode === '2d'
                      ? 'bg-[#0B4F9E] text-white shadow-xs'
                      : 'text-[#5B6675] hover:text-[#10161F]'
                  }`}
                >
                  <span>مخطط 2D</span>
                </button>
              </div>
            </div>

            {previewMode === '3d' ? (
              <Window3DPreview
                width={width}
                height={height}
                unit={unit}
                sashes={sashes}
                openingType={selectedModel?.openingType || 'sliding'}
                colorHex={selectedColor?.hex || '#FFFFFF'}
                glassTypeName={selectedGlass?.name || ''}
                sashConfigs={sashConfigs}
                activeSashIndex={activeSashIndex}
                onSelectSash={(idx) => setActiveSashIndex(idx)}
                showDimensions={true}
                className="w-full h-80 sm:h-96"
              />
            ) : (
              <WindowSvgPreview
                width={width}
                height={height}
                unit={unit}
                sashes={sashes}
                openingType={selectedModel?.openingType || 'sliding'}
                colorHex={selectedColor?.hex || '#FFFFFF'}
                glassTypeName={selectedGlass?.name || ''}
                sashConfigs={sashConfigs}
                activeSashIndex={activeSashIndex}
                onSelectSash={(idx) => setActiveSashIndex(idx)}
                allowOpenSimulation={true}
                className="w-full bg-[#F3F6FA]"
              />
            )}

            {/* Validation Feedback */}
            {dimensionValidation.message && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D62F3A]" />
                <span>{dimensionValidation.message}</span>
              </div>
            )}
            {dimensionValidation.suggestion && (
              <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#0B4F9E]" />
                <span>{dimensionValidation.suggestion}</span>
              </div>
            )}
          </div>

          {/* Pricing Summary Card */}
          {calculatedItem && (
            <div className="bg-white rounded-3xl p-5 border-2 border-[#0B4F9E]/20 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DDE3EA]">
                <div>
                  <span className="text-xs font-semibold text-[#5B6675]">السعر التقديري للقطعة</span>
                  <div className="text-2xl sm:text-3xl font-black text-[#0B4F9E]">
                    {formatDZD(calculatedItem.unitPriceDZD)}
                  </div>
                </div>
                {quantity > 1 && (
                  <div className="text-left">
                    <span className="text-xs font-semibold text-[#5B6675]">الإجمالي ({quantity} قطع)</span>
                    <div className="text-xl sm:text-2xl font-black text-[#1E9E5A]">
                      {formatDZD(calculatedItem.itemSubtotalDZD)}
                    </div>
                  </div>
                )}
              </div>

              {/* Spec pills summary */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-[#F3F6FA] border border-[#DDE3EA]">
                  <span className="text-[#5B6675] block">المساحة الفعلية</span>
                  <span className="font-bold text-[#10161F]">{calculatedItem.areaSqm} م²</span>
                </div>
                <div className="p-2 rounded-xl bg-[#F3F6FA] border border-[#DDE3EA]">
                  <span className="text-[#5B6675] block">المساحة المحاسبية</span>
                  <span className="font-bold text-[#10161F]">
                    {calculatedItem.accountingAreaSqm} م²
                    {calculatedItem.accountingAreaSqm > calculatedItem.areaSqm && (
                      <span className="text-[10px] text-amber-600 block">(الحد الأدنى 1 م²)</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-1.5 text-xs text-[#5B6675] bg-[#F8FAFC] p-3 rounded-xl border border-gray-100">
                <div className="flex justify-between">
                  <span>النموذج:</span>
                  <span className="font-semibold text-[#10161F]">{selectedModel.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>سلسلة البروفيل:</span>
                  <span className="font-semibold text-[#10161F]">{selectedSeries.name.split('(')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span>لون البروفيل:</span>
                  <span className="font-semibold text-[#10161F]">{selectedColor.name.split('(')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span>نوع الزجاج:</span>
                  <span className="font-semibold text-[#10161F]">{selectedGlass.name.split('(')[0]}</span>
                </div>
                {selectedOptions.length > 0 && (
                  <div className="flex justify-between">
                    <span>الإضافات:</span>
                    <span className="font-semibold text-[#10161F]">{selectedOptions.length} إضافات مختارة</span>
                  </div>
                )}
              </div>

              {/* Legal Disclaimer Note from PRD */}
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-800 leading-snug">
                <span className="font-bold">ملاحظة قانونية: </span>
                {settings.legalDisclaimer}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleAddToBasket}
                  disabled={!dimensionValidation.isValid}
                  className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                    dimensionValidation.isValid
                      ? 'bg-[#0B4F9E] hover:bg-[#083A75] text-white hover:shadow-lg active:scale-98'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span>إضافة إلى سلة عروض الأسعار</span>
                </button>

                <button
                  onClick={() => {
                    handleAddToBasket();
                    setActiveCustomerTab('basket');
                  }}
                  disabled={!dimensionValidation.isValid}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#1E9E5A] hover:bg-[#15803D] text-white flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <span>متابعة عرض السعر وإرسال الطلب</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>

              {/* Toast alert */}
              {showSuccessToast && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>تمت إضافة البند إلى سلة العرض بنجاح!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Step-by-Step Configuration Form */}
        <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
          {/* Step 1: Category Selection */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DDE3EA] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#0B4F9E] font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-[#0B4F9E]/10 flex items-center justify-center text-xs">1</span>
              <span>اختيار الفئة الرئيسية</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'window' as ModelCategory, label: 'نوافذ PVC', icon: '🪟' },
                { id: 'door' as ModelCategory, label: 'أبواب وشرفات', icon: '🚪' },
                { id: 'facade' as ModelCategory, label: 'واجهات ثابتة', icon: '🏛️' },
                { id: 'shutter' as ModelCategory, label: 'شتر رولو', icon: '🪚' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedCategory === cat.id
                      ? 'border-[#0B4F9E] bg-blue-50/60 ring-2 ring-[#0B4F9E]/20 text-[#0B4F9E] font-extrabold shadow-xs'
                      : 'border-[#DDE3EA] hover:bg-gray-50 text-[#10161F] font-semibold'
                  }`}
                >
                  <span className="text-xl block mb-1">{cat.icon}</span>
                  <span className="text-xs sm:text-sm">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Model Selection */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DDE3EA] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#0B4F9E] font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-[#0B4F9E]/10 flex items-center justify-center text-xs">2</span>
              <span>اختيار نموذج التصميم ونظام الفتح</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredModels.map(model => (
                <div
                  key={model.id}
                  onClick={() => {
                    setSelectedModelId(model.id);
                    setSashes(model.defaultSashes || 1);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all relative ${
                    selectedModelId === model.id
                      ? 'border-[#0B4F9E] bg-blue-50/50 ring-2 ring-[#0B4F9E]/20'
                      : 'border-[#DDE3EA] hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#10161F]">{model.name}</h4>
                      {model.nameFr && <p className="text-[11px] text-[#5B6675]">{model.nameFr}</p>}
                    </div>
                    {selectedModelId === model.id && (
                      <span className="w-5 h-5 rounded-full bg-[#0B4F9E] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5B6675] mt-2 line-clamp-2 leading-relaxed">
                    {model.description}
                  </p>
                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-semibold text-[#0B4F9E]">
                    <span>
                      {model.priceType === 'fixed'
                        ? `${formatDZD(model.fixedPrice || 0)} (سعر ثابت)`
                        : `ابتداءً من ${formatDZD(model.basePriceSqm)} / م²`}
                    </span>
                    <span className="text-gray-400">
                      ضلف: {model.allowedSashes.join('، ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3 & 4: Dimensions, Sashes, Unit & Quantity */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DDE3EA] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#0B4F9E] font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-[#0B4F9E]/10 flex items-center justify-center text-xs">3</span>
                <span>المقاسات وعدد الضلف والكمية</span>
              </div>

              {/* Unit Toggle */}
              <div className="flex items-center gap-1 bg-[#F3F6FA] p-1 rounded-xl border border-[#DDE3EA] text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    if (unit !== 'cm') {
                      setWidth(Math.round(width / 10));
                      setHeight(Math.round(height / 10));
                      setUnit('cm');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    unit === 'cm' ? 'bg-[#0B4F9E] text-white shadow-xs' : 'text-[#5B6675]'
                  }`}
                >
                  سنتيمتر (سم)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (unit !== 'mm') {
                      setWidth(width * 10);
                      setHeight(height * 10);
                      setUnit('mm');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    unit === 'mm' ? 'bg-[#0B4F9E] text-white shadow-xs' : 'text-[#5B6675]'
                  }`}
                >
                  مليمتر (ملم)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Width Input */}
              <div>
                <label className="block text-xs font-bold text-[#10161F] mb-1.5">
                  العرض ({unit}):
                  <span className="text-[#5B6675] font-normal mr-1">
                    [بين {convertFromCm(selectedModel.minWidth, unit)} و {convertFromCm(selectedModel.maxWidth, unit)}]
                  </span>
                </label>
                <input
                  type="number"
                  value={width || ''}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  min={convertFromCm(selectedModel.minWidth, unit)}
                  max={convertFromCm(selectedModel.maxWidth, unit)}
                  className="w-full text-lg font-bold text-center py-2.5 px-3 rounded-2xl border border-[#DDE3EA] focus:border-[#0B4F9E] focus:ring-2 focus:ring-[#0B4F9E]/20"
                />
              </div>

              {/* Height Input */}
              <div>
                <label className="block text-xs font-bold text-[#10161F] mb-1.5">
                  الارتفاع ({unit}):
                  <span className="text-[#5B6675] font-normal mr-1">
                    [بين {convertFromCm(selectedModel.minHeight, unit)} و {convertFromCm(selectedModel.maxHeight, unit)}]
                  </span>
                </label>
                <input
                  type="number"
                  value={height || ''}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min={convertFromCm(selectedModel.minHeight, unit)}
                  max={convertFromCm(selectedModel.maxHeight, unit)}
                  className="w-full text-lg font-bold text-center py-2.5 px-3 rounded-2xl border border-[#DDE3EA] focus:border-[#0B4F9E] focus:ring-2 focus:ring-[#0B4F9E]/20"
                />
              </div>
            </div>

            {/* Sashes & Quantity Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Sashes selection */}
              <div>
                <label className="block text-xs font-bold text-[#10161F] mb-1.5">
                  عدد الضلف:
                </label>
                <div className="flex gap-2">
                  {selectedModel.allowedSashes.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleSashesChange(n)}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-extrabold transition-all ${
                        sashes === n
                          ? 'border-[#0B4F9E] bg-[#0B4F9E] text-white shadow-xs'
                          : 'border-[#DDE3EA] hover:bg-gray-50 text-[#10161F]'
                      }`}
                    >
                      {n} {n === 1 ? 'ضلفة' : n === 2 ? 'ضلفتين' : 'ضلف'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-[#10161F] mb-1.5">
                  الكمية (عدد القطع المماثلة):
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-xl border border-[#DDE3EA] hover:bg-gray-100 flex items-center justify-center font-bold text-lg text-[#10161F]"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="flex-1 text-center font-extrabold text-base py-2 rounded-xl border border-[#DDE3EA]"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-xl border border-[#DDE3EA] hover:bg-gray-100 flex items-center justify-center font-bold text-lg text-[#10161F]"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Per-Sash Configuration Panel & OB Feature */}
            <div className="pt-4 border-t border-[#DDE3EA] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#10161F] flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#0B4F9E]" />
                  <span>التحكم في أجزاء وضلف النافذة ونظام الـ OB (المفصلي والقلاب)</span>
                </span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  الضلفة المحددة: {activeSashIndex + 1}
                </span>
              </div>

              {/* Sash Selection Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {Array.from({ length: sashes }).map((_, idx) => {
                  const cfg = sashConfigs[idx] || { type: 'OF', openingSide: 'left' };
                  const isCurrent = activeSashIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSashIndex(idx)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        isCurrent
                          ? 'border-[#0B4F9E] bg-[#0B4F9E] text-white shadow-sm'
                          : 'border-[#DDE3EA] bg-white hover:bg-gray-50 text-[#10161F]'
                      }`}
                    >
                      <span>الضلفة {idx + 1}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isCurrent
                          ? 'bg-white/20 text-white'
                          : cfg.type === 'OB'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {cfg.type === 'OB' ? 'قلاب OB' : cfg.type === 'OF' ? 'مفصلي OF' : cfg.type === 'FIX' ? 'ثابتة' : 'جرار'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Configuration of the active sash */}
              {sashConfigs[activeSashIndex] && (
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-gray-200 space-y-3">
                  <div className="text-xs text-[#5B6675]">
                    اختر نظام الفتح المناسب لـ <strong className="text-[#10161F]">الضلفة {activeSashIndex + 1}</strong>:
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* OB Option */}
                    <button
                      type="button"
                      onClick={() => updateCurrentSashConfig({ type: 'OB' })}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                        sashConfigs[activeSashIndex]?.type === 'OB'
                          ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/30 text-amber-950 font-bold shadow-xs'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-amber-700 flex items-center gap-1">
                          <Wind className="w-3.5 h-3.5" />
                          <span>قلاب OB</span>
                        </span>
                        {sashConfigs[activeSashIndex]?.type === 'OB' && (
                          <Check className="w-3.5 h-3.5 text-amber-700 stroke-[3]" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 block leading-tight">
                        فتح علوي للتهوية + فتح جانبي كامل (Oscillo-Battant)
                      </span>
                      <span className="text-[10px] font-extrabold text-amber-700 block mt-2">
                        +3,800 دج (آلية كاملة)
                      </span>
                    </button>

                    {/* OF Option */}
                    <button
                      type="button"
                      onClick={() => updateCurrentSashConfig({ type: 'OF' })}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                        sashConfigs[activeSashIndex]?.type === 'OF'
                          ? 'border-[#0B4F9E] bg-blue-50/70 ring-2 ring-[#0B4F9E]/20 text-[#0B4F9E] font-bold shadow-xs'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-[#0B4F9E]">مفصلي OF</span>
                        {sashConfigs[activeSashIndex]?.type === 'OF' && (
                          <Check className="w-3.5 h-3.5 text-[#0B4F9E] stroke-[3]" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 block leading-tight">
                        فتح جانبي عادي 90-180 درجة للداخل
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 block mt-2">
                        سعر قياسي
                      </span>
                    </button>

                    {/* FIX Option */}
                    <button
                      type="button"
                      onClick={() => updateCurrentSashConfig({ type: 'FIX' })}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                        sashConfigs[activeSashIndex]?.type === 'FIX'
                          ? 'border-gray-800 bg-gray-100 ring-2 ring-gray-400 text-gray-900 font-bold shadow-xs'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-gray-800">ثابتة FIX</span>
                        {sashConfigs[activeSashIndex]?.type === 'FIX' && (
                          <Check className="w-3.5 h-3.5 text-gray-800 stroke-[3]" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 block leading-tight">
                        زجاج ثابت لا يفتح، عزل صوتي مثالي
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 block mt-2">
                        -800 دج (توفير إكسسوارات)
                      </span>
                    </button>

                    {/* SLIDE Option */}
                    <button
                      type="button"
                      onClick={() => updateCurrentSashConfig({ type: 'SLIDE' })}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                        sashConfigs[activeSashIndex]?.type === 'SLIDE'
                          ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20 text-emerald-800 font-bold shadow-xs'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-emerald-700">جرار SLIDE</span>
                        {sashConfigs[activeSashIndex]?.type === 'SLIDE' && (
                          <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 block leading-tight">
                        انزلاق جانبي على سكة وعجلات
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 block mt-2">
                        سعر قياسي
                      </span>
                    </button>
                  </div>

                  {/* Secondary opening side controls for operable sashes */}
                  {(sashConfigs[activeSashIndex]?.type === 'OB' || sashConfigs[activeSashIndex]?.type === 'OF') && (
                    <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[#5B6675] font-semibold">جهة المفصلات والمقبض:</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => updateCurrentSashConfig({ openingSide: 'left' })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              sashConfigs[activeSashIndex]?.openingSide === 'left'
                                ? 'bg-[#0B4F9E] text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            يسار
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCurrentSashConfig({ openingSide: 'right' })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              sashConfigs[activeSashIndex]?.openingSide === 'right'
                                ? 'bg-[#0B4F9E] text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            يمين
                          </button>
                        </div>
                      </div>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!sashConfigs[activeSashIndex]?.hasMoustiquaire}
                          onChange={(e) => updateCurrentSashConfig({ hasMoustiquaire: e.target.checked })}
                          className="w-4 h-4 text-[#0B4F9E] rounded-sm"
                        />
                        <span className="text-gray-700 font-semibold text-[11px]">
                          شباك حشرات (Moustiquaire) خاص بهذه الضلفة (+2,800 دج)
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Step 5: Profile Series & Color */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DDE3EA] shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#0B4F9E] font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-[#0B4F9E]/10 flex items-center justify-center text-xs">4</span>
              <span>سلسلة البروفيل ولون الـ PVC</span>
            </div>

            {/* Series Cards */}
            <div>
              <span className="text-xs font-semibold text-[#5B6675] block mb-2">نوع وسلسلة البروفيل:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {series.map(s => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSeriesId(s.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      selectedSeriesId === s.id
                        ? 'border-[#0B4F9E] bg-blue-50/60 ring-2 ring-[#0B4F9E]/20'
                        : 'border-[#DDE3EA] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-[#10161F]">{s.name.split('(')[0]}</span>
                      {selectedSeriesId === s.id && <Check className="w-3.5 h-3.5 text-[#0B4F9E]" />}
                    </div>
                    <span className="text-[11px] text-[#5B6675] block mt-1">سماكة {s.frameDepthMm} ملم</span>
                    <span className="text-[11px] font-bold text-[#0B4F9E] block mt-2">
                      {s.pricePerSqmExtra === 0 ? 'بدون إضافة' : `+${formatDZD(s.pricePerSqmExtra)} / م²`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Colors Palette */}
            <div>
              <span className="text-xs font-semibold text-[#5B6675] block mb-2">لون البروفيل:</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {colors.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColorId(c.id)}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      selectedColorId === c.id
                        ? 'border-[#0B4F9E] ring-2 ring-[#0B4F9E]/20 bg-blue-50/40'
                        : 'border-[#DDE3EA] hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-full border border-gray-300 shadow-xs block"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-xs font-bold text-[#10161F] truncate w-full text-center">
                      {c.name.split('(')[0]}
                    </span>
                    <span className="text-[10px] text-[#5B6675]">
                      {c.priceMarkupPercent === 0 ? 'سعر قياسي' : `+${c.priceMarkupPercent}%`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 6: Glass Types & Additional Accessories */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DDE3EA] shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#0B4F9E] font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-[#0B4F9E]/10 flex items-center justify-center text-xs">5</span>
              <span>نوع الزجاج والملحقات الاختيارية</span>
            </div>

            {/* Glass Types */}
            <div>
              <span className="text-xs font-semibold text-[#5B6675] block mb-2">نوع الزجاج:</span>
              <div className="space-y-2">
                {glassTypes.map(g => (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGlassId(g.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedGlassId === g.id
                        ? 'border-[#0B4F9E] bg-blue-50/60 ring-2 ring-[#0B4F9E]/20'
                        : 'border-[#DDE3EA] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center">
                        {selectedGlassId === g.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#0B4F9E]" />
                        )}
                      </div>
                      <div>
                        <span className="font-extrabold text-xs sm:text-sm text-[#10161F] block">{g.name}</span>
                        <span className="text-xs text-[#5B6675] line-clamp-1">{g.description}</span>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#0B4F9E] shrink-0">
                      {formatDZD(g.pricePerSqm)} / م²
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Extra Accessories / Options */}
            <div>
              <span className="text-xs font-semibold text-[#5B6675] block mb-2">خيارات وملحقات إضافية:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {options.map(opt => {
                  const isChecked = selectedOptionIds.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => toggleOption(opt.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        isChecked
                          ? 'border-[#0B4F9E] bg-blue-50/50 ring-1 ring-[#0B4F9E]/20'
                          : 'border-[#DDE3EA] hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 text-[#0B4F9E] rounded-md border-gray-300 focus:ring-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#10161F]">{opt.name}</span>
                        </div>
                        <p className="text-[11px] text-[#5B6675] mt-0.5">{opt.description}</p>
                        <span className="text-xs font-extrabold text-[#1E9E5A] block mt-1.5">
                          +{formatDZD(opt.price)} {opt.calcType === 'sqm' ? '/ م²' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Item Custom Note */}
            <div>
              <label className="block text-xs font-semibold text-[#5B6675] mb-1">
                ملاحظة خاصة بهذه الفتحة (مثلاً: نافذة المطبخ، صالون الطابق الأول...):
              </label>
              <input
                type="text"
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                placeholder="أدخل موقع النافذة أو ملاحظة للفني"
                className="w-full text-xs py-2 px-3 rounded-xl border border-[#DDE3EA] focus:border-[#0B4F9E] focus:ring-1 focus:ring-[#0B4F9E]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
