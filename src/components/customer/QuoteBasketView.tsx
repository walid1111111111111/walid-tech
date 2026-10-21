import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD } from '../../utils/calculator';
import { WindowSvgPreview } from '../common/WindowSvgPreview';
import { Window3DPreview } from '../common/Window3DPreview';
import { ProjectHubModal, ProjectHubData } from '../common/ProjectHubModal';
import { QuoteItem } from '../../types';
import {
  ShoppingBag,
  Trash2,
  Copy,
  Plus,
  Printer,
  Share2,
  Bookmark,
  Send,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Phone,
  User,
  Calendar,
  FileText,
  Percent,
  Box,
  Eye,
  X,
  Sparkles,
  Scissors,
  Receipt,
  Layers,
} from 'lucide-react';

export const QuoteBasketView: React.FC = () => {
  const [preview3DItem, setPreview3DItem] = useState<QuoteItem | null>(null);
  const [showProjectHub, setShowProjectHub] = useState<boolean>(false);
  const {
    currentQuote,
    removeQuoteItem,
    addItemToQuote,
    clearQuote,
    saveCurrentQuote,
    createOrderFromQuote,
    setActiveCustomerTab,
    settings,
    setPrintableQuoteModalData,
  } = useApp();

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerWilaya, setCustomerWilaya] = useState(settings.wilaya || 'وهران');
  const [customerAddress, setCustomerAddress] = useState('');
  const [wantsInspectionVisit, setWantsInspectionVisit] = useState(true);
  const [customerNotes, setCustomerNotes] = useState('');
  const [orderSubmittedSuccess, setOrderSubmittedSuccess] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  const items = currentQuote.items;
  const totalItemsCount = items.reduce((acc, it) => acc + it.quantity, 0);

  const activeProjectData: ProjectHubData = useMemo(() => {
    return {
      id: currentQuote.id,
      projectNumber: `PRJ-${currentQuote.quoteNumber.replace('DEV-', '')}`,
      devisNumber: currentQuote.quoteNumber,
      invoiceNumber: `FAC-${currentQuote.quoteNumber.replace('DEV-', '')}`,
      title: `مشروع تصنيع نوافذ PVC (${currentQuote.items.length} بنود)`,
      customerName: customerName || 'زبون الورشة المحترم',
      customerPhone: customerPhone || settings.phone,
      customerWilaya: customerWilaya || settings.wilaya,
      customerAddress: customerAddress || 'موقع المشروع',
      createdAt: currentQuote.createdAt,
      validUntil: currentQuote.validUntil,
      status: 'new',
      items: currentQuote.items,
      subtotalDZD: currentQuote.subtotalDZD,
      discountDZD: currentQuote.discountDZD,
      discountReason: currentQuote.discountReason,
      tvaRatePercent: 0,
      deliveryInstallationFeeDZD: currentQuote.deliveryInstallationFeeDZD,
      paidAmountDZD: 0,
      payments: [],
      notes: customerNotes,
    };
  }, [currentQuote, customerName, customerPhone, customerWilaya, customerAddress, customerNotes, settings]);

  // Duplicate an item
  const handleDuplicateItem = (item: typeof items[0]) => {
    const duplicated = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      note: item.note ? `${item.note} (نسخة)` : 'نسخة مكررة',
    };
    addItemToQuote(duplicated);
  };

  // Save quote
  const handleSaveQuote = () => {
    saveCurrentQuote();
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 2500);
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    const summaryText = `*عرض سعر نوافذ وأبواب PVC - ${settings.workshopName}*%0A` +
      `رقم العرض: ${currentQuote.quoteNumber}%0A` +
      `عدد البنود: ${items.length} (${totalItemsCount} قطعة)%0A` +
      `الإجمالي التقديري: ${currentQuote.grandTotalDZD.toLocaleString('ar-DZ')} دج%0A` +
      `تاريخ الصلاحية: 15 يوماً%0A` +
      `للتواصل مع الورشة: ${settings.phone}`;
    window.open(`https://wa.me/?text=${summaryText}`, '_blank');
  };

  // Copy shareable link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyLinkSuccess(true);
    setTimeout(() => setCopyLinkSuccess(false), 2000);
  };

  // Submit Order
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;

    createOrderFromQuote({
      name: customerName,
      phone: customerPhone,
      wilaya: customerWilaya,
      address: customerAddress,
      inspectionVisit: wantsInspectionVisit,
      notes: customerNotes,
    });

    setOrderSubmittedSuccess(true);
    setTimeout(() => {
      setShowOrderModal(false);
      setOrderSubmittedSuccess(false);
      setActiveCustomerTab('orders');
    }, 1500);
  };

  if (items.length === 0) {
    return (
      <div className="py-16 px-4 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-200 text-[#0B4F9E] flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h2 className="text-xl font-extrabold text-[#10161F]">سلة عروض الأسعار فارغة</h2>
        <p className="text-xs sm:text-sm text-[#5B6675] mt-2 mb-6">
          لم تقم بإضافة أي نوافذ أو أبواب بعد. توجه للحاسبة واختر مقاساتك ومواصفاتك لتحصل على تسعير فوري.
        </p>
        <button
          onClick={() => setActiveCustomerTab('calculator')}
          className="py-3 px-6 rounded-2xl bg-[#0B4F9E] hover:bg-[#083A75] text-white font-bold text-sm shadow-md transition-all inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>فتح الحاسبة وإضافة بند جديد</span>
        </button>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#DDE3EA] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0B4F9E] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              {currentQuote.quoteNumber}
            </span>
            <span className="text-xs text-[#5B6675]">
              صالح لمدة {settings.quoteValidityDays} يوماً
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#10161F] mt-1">
            سلة عروض الأسعار والمقايسة
          </h1>
          <p className="text-xs text-[#5B6675] mt-0.5">
            تحتوي على {items.length} بنود بإجمالي {totalItemsCount} قطعة.
          </p>
        </div>

        {/* Action icons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveCustomerTab('calculator')}
            className="py-2.5 px-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0B4F9E] font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة بند آخر</span>
          </button>

          <button
            onClick={handleSaveQuote}
            className="p-2.5 rounded-xl border border-[#DDE3EA] hover:bg-gray-50 text-[#10161F] transition-all"
            title="حفظ العرض في الذاكرة"
          >
            <Bookmark className="w-4 h-4 text-amber-600" />
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="p-2.5 rounded-xl border border-[#DDE3EA] hover:bg-emerald-50 text-emerald-600 transition-all"
            title="مشاركة عبر واتساب"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowProjectHub(true)}
            className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#0B4F9E] to-[#1E9E5A] hover:opacity-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            title="فتح ملف المشروع الكامل"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>ملف المشروع (Devis • Liste • ورقة القص • Facture)</span>
          </button>

          <button
            onClick={() => setPrintableQuoteModalData(currentQuote)}
            className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-gray-50 border border-[#DDE3EA] text-[#0B4F9E] font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة Devis</span>
          </button>
        </div>
      </div>

      {saveSuccessToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>تم حفظ عرض السعر في محفوظات جهازك بنجاح! يمكنك استرجاعه في أي وقت.</span>
        </div>
      )}

      {/* Main Grid: Items List on Right, Order & Price Summary on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="bg-white rounded-3xl p-5 border border-[#DDE3EA] shadow-xs hover:border-gray-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#0B4F9E] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base text-[#10161F]">{item.modelName}</h3>
                    {item.note && (
                      <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-0.5 font-medium">
                        ملاحظة: {item.note}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => handleDuplicateItem(item)}
                    className="p-2 rounded-xl text-[#5B6675] hover:text-[#0B4F9E] hover:bg-blue-50 transition-all"
                    title="تكرار / نسخ هذا البند"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeQuoteItem(item.id)}
                    className="p-2 rounded-xl text-[#5B6675] hover:text-[#D62F3A] hover:bg-red-50 transition-all"
                    title="حذف البند"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Item Details Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* SVG Mini thumbnail & 3D button */}
                <div className="sm:col-span-4 bg-[#F3F6FA] p-2.5 rounded-2xl border border-[#DDE3EA] flex flex-col gap-2">
                  <WindowSvgPreview
                    width={item.width}
                    height={item.height}
                    unit={item.unit}
                    sashes={item.sashes}
                    openingType={item.openingType}
                    colorHex={item.colorHex}
                    glassTypeName={item.glassTypeName}
                    showDimensions={false}
                    className="max-h-36"
                  />
                  <button
                    type="button"
                    onClick={() => setPreview3DItem(item)}
                    className="w-full py-1.5 px-2 rounded-xl bg-white hover:bg-blue-50 text-[#0B4F9E] border border-blue-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-98"
                  >
                    <Box className="w-3.5 h-3.5 text-[#0B4F9E]" />
                    <span>معاينة ثلاثية الأبعاد 3D</span>
                  </button>
                </div>

                {/* Specs details */}
                <div className="sm:col-span-8 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[#5B6675]">
                    <div>
                      <span className="block text-[11px]">الأبعاد والمساحة:</span>
                      <strong className="text-[#10161F]">
                        {item.width} × {item.height} {item.unit} ({item.areaSqm} م²)
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[11px]">عدد الضلف:</span>
                      <strong className="text-[#10161F]">{item.sashes} ضلف</strong>
                    </div>
                    <div>
                      <span className="block text-[11px]">سلسلة البروفيل:</span>
                      <strong className="text-[#10161F]">{item.seriesName.split('(')[0]}</strong>
                    </div>
                    <div>
                      <span className="block text-[11px]">اللون المختار:</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-gray-300"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <strong className="text-[#10161F]">{item.colorName.split('(')[0]}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <span className="block text-[11px] text-[#5B6675]">الزجاج:</span>
                    <strong className="text-[#10161F]">{item.glassTypeName}</strong>
                  </div>

                  {item.selectedOptionNames.length > 0 && (
                    <div>
                      <span className="block text-[11px] text-[#5B6675]">الملحقات:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.selectedOptionNames.map(optName => (
                          <span
                            key={optName}
                            className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium"
                          >
                            + {optName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing line */}
                  <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[#5B6675] text-[11px]">سعر الوحدة: </span>
                      <span className="font-extrabold text-[#10161F] text-sm">
                        {formatDZD(item.unitPriceDZD)}
                      </span>
                      <span className="text-gray-400 mr-2">× {item.quantity} قطع</span>
                    </div>
                    <div className="text-base font-black text-[#0B4F9E]">
                      {formatDZD(item.itemSubtotalDZD)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Clear Basket */}
          <div className="text-left">
            <button
              onClick={clearQuote}
              className="text-xs text-red-600 hover:text-red-700 font-semibold p-2 hover:bg-red-50 rounded-xl"
            >
              إفراغ سلة العرض بالكامل
            </button>
          </div>
        </div>

        {/* Financial Summary & Order CTA Card */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-22">
          <div className="bg-white rounded-3xl p-6 border-2 border-[#0B4F9E]/20 shadow-md space-y-4">
            <h3 className="font-extrabold text-lg text-[#10161F] pb-3 border-b border-[#DDE3EA]">
              ملخص عرض السعر
            </h3>

            <div className="space-y-2.5 text-xs text-[#5B6675]">
              <div className="flex justify-between">
                <span>مجموع البنود ({totalItemsCount} قطعة):</span>
                <span className="font-bold text-[#10161F]">{formatDZD(currentQuote.subtotalDZD)}</span>
              </div>

              {currentQuote.discountDZD > 0 && (
                <div className="flex justify-between text-[#D62F3A]">
                  <span>الخصم المطبق:</span>
                  <span className="font-bold">-{formatDZD(currentQuote.discountDZD)}</span>
                </div>
              )}

              {currentQuote.tvaEnabled && (
                <div className="flex justify-between">
                  <span>الضريبة TVA ({currentQuote.tvaRate}%):</span>
                  <span className="font-bold text-[#10161F]">{formatDZD(currentQuote.tvaAmountDZD)}</span>
                </div>
              )}

              {currentQuote.installationDeliveryFeeDZD > 0 && (
                <div className="flex justify-between">
                  <span>رسوم التوصيل والتركيب:</span>
                  <span className="font-bold text-[#10161F]">{formatDZD(currentQuote.installationDeliveryFeeDZD)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#DDE3EA] flex items-baseline justify-between">
                <span className="font-black text-sm text-[#10161F]">الإجمالي النهائي التقديري:</span>
                <span className="font-black text-2xl text-[#0B4F9E]">
                  {formatDZD(currentQuote.grandTotalDZD)}
                </span>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-3 rounded-2xl bg-[#F3F6FA] border border-[#DDE3EA] text-[11px] text-[#5B6675] leading-relaxed">
              <span className="font-bold text-[#10161F]">ملاحظة مهمة: </span>
              {settings.legalDisclaimer}
            </div>

            {/* Direct Project Hub Trigger */}
            <button
              type="button"
              onClick={() => setShowProjectHub(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0B4F9E] via-[#083A75] to-[#1E9E5A] hover:opacity-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>ملف المشروع الكامل (Devis • Liste • القص • Facture)</span>
            </button>

            {/* Submit Order Trigger */}
            <button
              onClick={() => setShowOrderModal(true)}
              className="w-full py-4 px-4 rounded-2xl bg-[#1E9E5A] hover:bg-[#15803D] text-white font-black text-base shadow-lg shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span>اطلب هذا العرض الآن</span>
            </button>

            <button
              onClick={() => setPrintableQuoteModalData(currentQuote)}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-gray-50 border border-[#DDE3EA] text-[#0B4F9E] font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>معاينة كشف العرض الرسمي (Devis PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Order Submission Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#DDE3EA] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-extrabold text-[#10161F]">إرسال طلب العرض للورشة</h3>
                <p className="text-xs text-[#5B6675] mt-0.5">
                  سيتواصل معك فريق الورشة لتأكيد الموعد والمعاينة الميدانية.
                </p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {orderSubmittedSuccess ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-lg font-bold text-[#10161F]">تم إرسال طلبك بنجاح!</h4>
                <p className="text-xs text-[#5B6675]">
                  تم تسجيل الطلب في نظام الورشة وإرسال إشعار للمالك. جاري تحويلك إلى صفحة طلباتي...
                </p>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit} className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-bold text-[#10161F] mb-1">
                    الاسم الكامل: *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute right-3 top-3.5" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="مثال: يوسف معمري"
                      className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-[#DDE3EA] text-xs font-medium focus:border-[#0B4F9E] focus:ring-1 focus:ring-[#0B4F9E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#10161F] mb-1">
                    رقم الهاتف: *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute right-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="05 / 06 / 07 ..."
                      className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-[#DDE3EA] text-xs font-medium focus:border-[#0B4F9E] focus:ring-1 focus:ring-[#0B4F9E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#10161F] mb-1">
                      الولاية:
                    </label>
                    <input
                      type="text"
                      value={customerWilaya}
                      onChange={(e) => setCustomerWilaya(e.target.value)}
                      placeholder="وهران، الجزائر، قسنطينة..."
                      className="w-full py-2.5 px-3 rounded-xl border border-[#DDE3EA] text-xs font-medium focus:border-[#0B4F9E] focus:ring-1 focus:ring-[#0B4F9E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#10161F] mb-1">
                      العنوان / الحي:
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-gray-400 absolute right-3 top-3.5" />
                      <input
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="البلدية والشارع..."
                        className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-[#DDE3EA] text-xs font-medium focus:border-[#0B4F9E] focus:ring-1 focus:ring-[#0B4F9E]"
                      />
                    </div>
                  </div>
                </div>

                {/* Inspection Visit Request */}
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="inspectionCheck"
                    checked={wantsInspectionVisit}
                    onChange={(e) => setWantsInspectionVisit(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#0B4F9E] rounded-sm border-gray-300"
                  />
                  <label htmlFor="inspectionCheck" className="text-xs text-[#10161F] cursor-pointer">
                    <strong className="block font-bold">أرغب في زيارة معاينة وأخذ القياسات بالموقع</strong>
                    <span className="text-[#5B6675] text-[11px]">
                      يقوم فني من الورشة بزيارة ورشتكم/منزلكم لضبط القياسات الميليمترية بدقة.
                    </span>
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-[#10161F] mb-1">
                    ملاحظات أو استفسارات إضافية:
                  </label>
                  <textarea
                    rows={2}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="أي تفاصيل حول الموقع، الطابق، أوقات الاتصال المناسبة..."
                    className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA] text-xs font-medium focus:border-[#0B4F9E] focus:ring-1 focus:ring-[#0B4F9E]"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl bg-[#1E9E5A] hover:bg-[#15803D] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>تأكيد وإرسال الطلب</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 3D Item Preview Modal */}
      {preview3DItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-[#DDE3EA] space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-[#0B4F9E]" />
                <h3 className="text-base font-bold text-[#10161F]">
                  معاينة النموذج الأولي 3D: {preview3DItem.modelName}
                </h3>
              </div>
              <button
                onClick={() => setPreview3DItem(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <Window3DPreview
              width={preview3DItem.width}
              height={preview3DItem.height}
              unit={preview3DItem.unit}
              sashes={preview3DItem.sashes}
              openingType={preview3DItem.openingType}
              colorHex={preview3DItem.colorHex}
              glassTypeName={preview3DItem.glassTypeName}
              sashConfigs={preview3DItem.sashConfigs}
              showDimensions={true}
              className="w-full h-80 sm:h-96"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5B6675] bg-gray-50 p-3 rounded-2xl">
              <div>
                <span>المقاسات: </span>
                <strong className="text-[#10161F]">{preview3DItem.width} × {preview3DItem.height} {preview3DItem.unit}</strong>
                <span className="mx-2">•</span>
                <span>الضلف: </span>
                <strong className="text-[#10161F]">{preview3DItem.sashes}</strong>
                <span className="mx-2">•</span>
                <span>اللون: </span>
                <strong className="text-[#10161F]">{preview3DItem.colorName}</strong>
              </div>
              <button
                onClick={() => setPreview3DItem(null)}
                className="py-1.5 px-4 rounded-xl bg-[#0B4F9E] text-white font-bold text-xs hover:bg-[#083A75] transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Project Hub Modal (Devis, Liste de Produits, Fiche d'Optimisation, Facture) */}
      {showProjectHub && (
        <ProjectHubModal
          project={activeProjectData}
          onClose={() => setShowProjectHub(false)}
        />
      )}
    </div>
  );
};
