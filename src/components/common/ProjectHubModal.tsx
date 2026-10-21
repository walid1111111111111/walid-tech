import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { QuoteItem, Order, Quote, OrderPayment, OrderStatus } from '../../types';
import { formatDZD } from '../../utils/calculator';
import { generateFullProjectOptimization, ProjectOptimizationReport, OptimizedBar } from '../../utils/cuttingOptimizer';
import { WindowSvgPreview } from './WindowSvgPreview';
import { Window3DPreview } from './Window3DPreview';
import {
  FileText,
  Layers,
  Scissors,
  Receipt,
  Printer,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Share2,
  Plus,
  DollarSign,
  Building,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Eye,
  Box,
  Wrench,
  Percent,
  Check,
  RotateCcw,
  Sliders,
} from 'lucide-react';

export interface ProjectHubData {
  id: string;
  projectNumber: string;
  devisNumber: string;
  invoiceNumber: string;
  title: string;
  customerName: string;
  customerPhone: string;
  customerWilaya: string;
  customerAddress: string;
  createdAt: string;
  validUntil: string;
  status: OrderStatus;
  items: QuoteItem[];
  subtotalDZD: number;
  discountDZD: number;
  discountReason?: string;
  tvaRatePercent: number; // 0 or 19%
  deliveryInstallationFeeDZD: number;
  paidAmountDZD: number;
  payments: OrderPayment[];
  notes?: string;
}

interface ProjectHubModalProps {
  project: ProjectHubData | null;
  onClose: () => void;
  onUpdateProject?: (updated: ProjectHubData) => void;
  initialTab?: 'devis' | 'products' | 'optimization' | 'invoice';
}

export const ProjectHubModal: React.FC<ProjectHubModalProps> = ({
  project,
  onClose,
  onUpdateProject,
  initialTab = 'devis',
}) => {
  const { settings, addPaymentToOrder, updateOrderStatus } = useApp();

  const [activeTab, setActiveTab] = useState<'devis' | 'products' | 'optimization' | 'invoice'>(initialTab);
  const [optProfileTab, setOptProfileTab] = useState<'frame' | 'sash' | 'mullion' | 'bead' | 'steel'>('frame');
  const [includeTva, setIncludeTva] = useState<boolean>(project?.tvaRatePercent ? project.tvaRatePercent > 0 : false);
  const [discountDZD, setDiscountDZD] = useState<number>(project?.discountDZD || 0);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState<boolean>(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState<'cash' | 'ccp_baridimob' | 'bank_check'>('cash');
  const [newPaymentNote, setNewPaymentNote] = useState<string>('');
  const [stockBarLengthMm, setStockBarLengthMm] = useState<number>(6000);
  const [sawKerfMm, setSawKerfMm] = useState<number>(3.5);

  if (!project || !project.items || project.items.length === 0) return null;

  // Real-time Automatic Project Calculations
  const calculations = useMemo(() => {
    const items = project.items;
    const subtotal = items.reduce((acc, it) => acc + it.itemSubtotalDZD, 0);
    const totalAreaSqm = Number(items.reduce((acc, it) => acc + (it.areaSqm * it.quantity), 0).toFixed(2));
    const totalWindowsCount = items.reduce((acc, it) => acc + it.quantity, 0);
    const totalSashesCount = items.reduce((acc, it) => acc + (it.sashes * it.quantity), 0);

    const discountedSubtotal = Math.max(0, subtotal - discountDZD);
    const tvaAmount = includeTva ? Math.round(discountedSubtotal * 0.19) : 0;
    const grandTotal = discountedSubtotal + tvaAmount + (project.deliveryInstallationFeeDZD || 0);
    const remainingBalance = Math.max(0, grandTotal - (project.paidAmountDZD || 0));

    // Manufacturing Material Costs & BOM
    const totalMaterialCost = items.reduce((acc, it) => acc + (it.technicalBOM.totalMaterialCostDZD * it.quantity), 0);
    const projectedProfit = Math.max(0, grandTotal - totalMaterialCost);
    const profitMarginPercent = grandTotal > 0 ? Number(((projectedProfit / grandTotal) * 100).toFixed(1)) : 0;

    return {
      subtotal,
      totalAreaSqm,
      totalWindowsCount,
      totalSashesCount,
      discountedSubtotal,
      tvaAmount,
      grandTotal,
      remainingBalance,
      totalMaterialCost,
      projectedProfit,
      profitMarginPercent,
    };
  }, [project.items, discountDZD, includeTva, project.deliveryInstallationFeeDZD, project.paidAmountDZD]);

  // Run Cutting Optimization Algorithm automatically
  const optimizationReport: ProjectOptimizationReport = useMemo(() => {
    return generateFullProjectOptimization(
      project.items,
      project.title || `مشروع ${project.customerName}`,
      stockBarLengthMm,
      sawKerfMm
    );
  }, [project.items, project.title, project.customerName, stockBarLengthMm, sawKerfMm]);

  // Print active document
  const handlePrint = () => {
    window.print();
  };

  // Record payment handler
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPaymentAmount <= 0) return;

    const newPayment: OrderPayment = {
      id: `pay-${Date.now()}`,
      amountDZD: Number(newPaymentAmount),
      date: new Date().toISOString(),
      method: newPaymentMethod,
      note: newPaymentNote || 'دفعة مسجلة في المشروع',
    };

    const updatedPayments = [...(project.payments || []), newPayment];
    const updatedPaid = (project.paidAmountDZD || 0) + Number(newPaymentAmount);

    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        paidAmountDZD: updatedPaid,
        payments: updatedPayments,
      });
    }

    // Also update order if project matches an order in context
    addPaymentToOrder(project.id, {
      amountDZD: Number(newPaymentAmount),
      date: new Date().toISOString(),
      method: newPaymentMethod,
      note: newPaymentNote,
    });

    setShowAddPaymentModal(false);
    setNewPaymentAmount(0);
    setNewPaymentNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full my-auto shadow-2xl border border-[#DDE3EA] overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Control Bar & Document Hub Switcher (Hidden on Print) */}
        <div className="no-print bg-[#083A75] text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base leading-tight">
                  {project.title || `مشروع: ${project.customerName}`}
                </h2>
                <span className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
                  {project.projectNumber || project.devisNumber}
                </span>
              </div>
              <p className="text-xs text-blue-200">
                حساب تلقائي شامل • عروض أسعار • جداول التقطيع • ورقة تحسين القص • الفاتورة
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddPaymentModal(true)}
              className="py-1.5 px-3 rounded-xl bg-[#1E9E5A] hover:bg-[#168048] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل دفعة</span>
            </button>
            <button
              onClick={handlePrint}
              className="py-1.5 px-3.5 rounded-xl bg-white text-[#0B4F9E] hover:bg-blue-50 font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة المستند الحالي</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Unified 4-Tab Navigation Bar (Hidden on Print) */}
        <div className="no-print bg-[#F3F6FA] px-4 py-2.5 border-b border-[#DDE3EA] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-gray-200 shadow-xs">
            {/* Tab 1: Devis */}
            <button
              onClick={() => setActiveTab('devis')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'devis'
                  ? 'bg-[#0B4F9E] text-white shadow-xs'
                  : 'text-[#5B6675] hover:text-[#10161F]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>1. عرض السعر (Devis)</span>
            </button>

            {/* Tab 2: Liste de Produits */}
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#0B4F9E] text-white shadow-xs'
                  : 'text-[#5B6675] hover:text-[#10161F]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>2. قائمة المنتجات والمواد (BOM)</span>
            </button>

            {/* Tab 3: Fiche d'Optimisation */}
            <button
              onClick={() => setActiveTab('optimization')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'optimization'
                  ? 'bg-[#0B4F9E] text-white shadow-xs'
                  : 'text-[#5B6675] hover:text-[#10161F]'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>3. ورقة تحسين القص (Optimisation)</span>
              <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                {optimizationReport.summary.overallEfficiencyPercent}%
              </span>
            </button>

            {/* Tab 4: Facture Finale */}
            <button
              onClick={() => setActiveTab('invoice')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'invoice'
                  ? 'bg-[#0B4F9E] text-white shadow-xs'
                  : 'text-[#5B6675] hover:text-[#10161F]'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>4. الفاتورة النهائية (Facture)</span>
            </button>
          </div>

          {/* Quick Metrics Header */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#5B6675]">
              الإجمالي: <strong className="text-[#0B4F9E] font-black">{formatDZD(calculations.grandTotal)}</strong>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-[#5B6675]">
              المسدد: <strong className="text-[#1E9E5A] font-bold">{formatDZD(project.paidAmountDZD || 0)}</strong>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-[#5B6675]">
              المتبقي: <strong className="text-[#D62F3A] font-bold">{formatDZD(calculations.remainingBalance)}</strong>
            </span>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 text-[#10161F] print:p-0 print:overflow-visible">
          {/* ========================================================================= */}
          {/* TAB 1: DEVIS (عرض سعر رسمي للزبون) */}
          {/* ========================================================================= */}
          {activeTab === 'devis' && (
            <div className="space-y-6 print:space-y-4">
              {/* Document Letterhead */}
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
                    <strong className="text-black font-bold">{project.devisNumber}</strong>
                  </div>
                  <div className="text-[11px] text-[#5B6675]">
                    <span>تاريخ التحرير: </span>
                    <strong className="text-black">{new Date(project.createdAt).toLocaleDateString('ar-DZ')}</strong>
                  </div>
                  <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-sm inline-block">
                    صالح حتى: {new Date(project.validUntil).toLocaleDateString('ar-DZ')}
                  </div>
                </div>
              </div>

              {/* Client and Project Info Card */}
              <div className="grid grid-cols-2 gap-4 bg-[#F8FAFC] p-4 rounded-2xl border border-[#DDE3EA] text-xs">
                <div>
                  <span className="text-[#5B6675] block font-bold mb-1">معلومات الزبون والمشروع:</span>
                  <p className="text-sm font-black text-[#10161F]">{project.customerName}</p>
                  <p className="text-[#5B6675]">الهاتف: {project.customerPhone}</p>
                  <p className="text-[#5B6675]">الموقع: {project.customerWilaya} - {project.customerAddress}</p>
                </div>
                <div className="text-left">
                  <span className="text-[#5B6675] block font-bold mb-1">الرقم الضريبي والسجل:</span>
                  <p className="text-[#5B6675]">س.ت (RC): {settings.rcNumber || '23/00-1928374B'}</p>
                  <p className="text-[#5B6675]">ر.ت.ج (NIF): {settings.nifNumber || '001928374650192'}</p>
                  <p className="text-[#5B6675]">رقم الحساب البنكي / CCP: {settings.bankAccount || '007 999 123456789 22'}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-[#DDE3EA] rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#0B4F9E] text-white font-bold">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">#</th>
                      <th className="py-2.5 px-3">النموذج والمواصفات الفنية</th>
                      <th className="py-2.5 px-3 text-center">المقاسات (سم)</th>
                      <th className="py-2.5 px-3 text-center">المساحة</th>
                      <th className="py-2.5 px-3 text-center">الكمية</th>
                      <th className="py-2.5 px-3 text-center">سعر الوحدة</th>
                      <th className="py-2.5 px-3 text-left">المجموع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE3EA]">
                    {project.items.map((it, idx) => (
                      <tr key={`devis-row-${it.id}-${idx}`} className="hover:bg-gray-50/50">
                        <td className="py-3 px-3 text-center font-bold text-gray-400">{idx + 1}</td>
                        <td className="py-3 px-3 space-y-1">
                          <strong className="text-sm font-extrabold text-[#10161F] block">{it.modelName}</strong>
                          <div className="text-[11px] text-[#5B6675] flex flex-wrap gap-2">
                            <span>السلسلة: {it.seriesName.split('(')[0]}</span>
                            <span>•</span>
                            <span>اللون: {it.colorName.split('(')[0]}</span>
                            <span>•</span>
                            <span>الزجاج: {it.glassTypeName.split('(')[0]}</span>
                            <span>•</span>
                            <span>الضلف: {it.sashes}</span>
                            {it.sashConfigs?.some(s => s.type === 'OB') && (
                              <span className="font-bold text-[#0B4F9E] bg-blue-50 px-1 rounded">مزود بنظام OB</span>
                            )}
                          </div>
                          {it.selectedOptionNames?.length > 0 && (
                            <div className="text-[10px] text-gray-500">
                              إضافات: {it.selectedOptionNames.join('، ')}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          {it.width} × {it.height} {it.unit}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-[#5B6675]">
                          {it.areaSqm} م²
                        </td>
                        <td className="py-3 px-3 text-center font-black">{it.quantity}</td>
                        <td className="py-3 px-3 text-center font-bold text-[#0B4F9E]">
                          {formatDZD(it.unitPriceDZD)}
                        </td>
                        <td className="py-3 px-3 text-left font-black text-[#10161F]">
                          {formatDZD(it.itemSubtotalDZD)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals & Signatures */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2">
                <div className="sm:col-span-7 space-y-3">
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
                    <strong>شروط التسليم والضمان:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-amber-800">
                      <li>تخضع المقاسات لمعاينة وتدقيق فني نهائي في موقع الورشة/البناء.</li>
                      <li>ضمان لمدة 10 سنوات على ثبات لون بروفيل الـ PVC وعوازل الهواء والماء.</li>
                      <li>مدة التصنيع والتسليم المعتادة: 7 إلى 15 يوماً من تاريخ دفع العربون.</li>
                      <li>الدفع: 40% عربون عند التأكيد، 40% عند بدء التركيب، و20% عند التسليم النهائي.</li>
                    </ul>
                  </div>

                  {/* Stamp & Signature */}
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center h-28 flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-gray-500">موافقة وتوقيع الزبون:</span>
                      <span className="text-[10px] text-gray-400">قرئ وصودق عليه</span>
                    </div>
                    <div className="border border-dashed border-blue-300 rounded-xl p-4 text-center h-28 flex flex-col justify-between bg-blue-50/20">
                      <span className="text-[11px] font-bold text-[#0B4F9E]">ختم وإمضاء ورشة التصنيع:</span>
                      <span className="text-[10px] text-gray-400">إدارة الورشة المعتمدة</span>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-5 bg-[#F8FAFC] p-4 rounded-2xl border border-[#DDE3EA] space-y-2 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-[#5B6675]">المجموع الصافي (HT):</span>
                    <strong className="font-bold text-[#10161F]">{formatDZD(calculations.subtotal)}</strong>
                  </div>

                  {discountDZD > 0 && (
                    <div className="flex justify-between py-1 text-[#D62F3A]">
                      <span>الخصم التجاري:</span>
                      <strong className="font-bold">- {formatDZD(discountDZD)}</strong>
                    </div>
                  )}

                  {includeTva && (
                    <div className="flex justify-between py-1 text-[#5B6675]">
                      <span>الرسم على القيمة المضافة (TVA 19%):</span>
                      <strong className="font-bold text-[#10161F]">{formatDZD(calculations.tvaAmount)}</strong>
                    </div>
                  )}

                  {project.deliveryInstallationFeeDZD > 0 && (
                    <div className="flex justify-between py-1 text-[#5B6675]">
                      <span>مصاريف النقل والتركيب:</span>
                      <strong className="font-bold text-[#10161F]">{formatDZD(project.deliveryInstallationFeeDZD)}</strong>
                    </div>
                  )}

                  <div className="border-t-2 border-[#0B4F9E] pt-2 mt-2 flex justify-between items-center text-sm font-black">
                    <span className="text-[#0B4F9E]">المبلغ الإجمالي (TTC):</span>
                    <span className="text-xl text-[#0B4F9E]">{formatDZD(calculations.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: LISTE DE PRODUITS (قائمة المنتجات ومواد التصنيع - BOM) */}
          {/* ========================================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-3 border-gray-200">
                <div>
                  <h3 className="text-base font-extrabold text-[#10161F] flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#0B4F9E]" />
                    <span>قائمة المنتجات والمقايسة التفصيلية (Liste des Produits & Fournitures)</span>
                  </h3>
                  <p className="text-xs text-[#5B6675]">
                    حساب دقيق لجميع قطاعات البروفيل، مقاسات تقطيع الزجاج، حديد التقوية، والإكسسوارات لكل بند
                  </p>
                </div>
                <div className="text-left text-xs">
                  <span className="text-[#5B6675]">إجمالي عدد القطع: </span>
                  <strong className="font-black text-[#10161F]">{calculations.totalWindowsCount} نافذة/باب</strong>
                  <span className="mx-2">•</span>
                  <span>المساحة الإجمالية: </span>
                  <strong className="font-black text-[#0B4F9E]">{calculations.totalAreaSqm} م²</strong>
                </div>
              </div>

              {/* Glass Cutting Schedule (جدول مقاسات تقطيع الزجاج للمورد) */}
              <div className="bg-white rounded-2xl border border-blue-200 shadow-xs overflow-hidden">
                <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-200 flex items-center justify-between">
                  <span className="font-black text-xs text-[#0B4F9E] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>جدول تقطيع الزجاج (Cahier de Débit Vitrage)</span>
                  </span>
                  <span className="text-[11px] text-[#5B6675]">جاهز للطباعة والإرسال لمورد الزجاج</span>
                </div>
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#F8FAFC] text-[#5B6675] font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-2 px-3 text-center">الرقم</th>
                      <th className="py-2 px-3">النموذج ومكان التركيب</th>
                      <th className="py-2 px-3 text-center">العرض (مم)</th>
                      <th className="py-2 px-3 text-center">الارتفاع (مم)</th>
                      <th className="py-2 px-3 text-center">عدد الألواح</th>
                      <th className="py-2 px-3">نوع الزجاج والمواصفات</th>
                      <th className="py-2 px-3 text-left">المساحة الإجمالية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {project.items.map((it, idx) => {
                      const cut = it.technicalBOM.glassCutDimensions;
                      const wMm = cut.widthCm * 10;
                      const hMm = cut.heightCm * 10;
                      const totalPanes = cut.quantity * it.quantity;
                      const area = ((wMm * hMm * totalPanes) / 1000000).toFixed(2);
                      return (
                        <tr key={`glass-cut-${it.id}-${idx}`} className="hover:bg-blue-50/30">
                          <td className="py-2.5 px-3 text-center font-bold text-gray-400">V-{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-[#10161F]">{it.modelName}</td>
                          <td className="py-2.5 px-3 text-center font-black text-[#0B4F9E]">{wMm} مم</td>
                          <td className="py-2.5 px-3 text-center font-black text-[#0B4F9E]">{hMm} مم</td>
                          <td className="py-2.5 px-3 text-center font-extrabold text-[#1E9E5A]">{totalPanes} لوح</td>
                          <td className="py-2.5 px-3 text-[#5B6675]">{it.glassTypeName}</td>
                          <td className="py-2.5 px-3 text-left font-bold text-gray-800">{area} م²</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Hardware and Accessories Schedule (جدول الإكسسوارات والمقابض) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Profiles & Steel Summary */}
                <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-gray-200 space-y-3">
                  <h4 className="font-extrabold text-[#10161F] flex items-center gap-1.5 border-b pb-2">
                    <Wrench className="w-4 h-4 text-[#0B4F9E]" />
                    <span>احتياجات البروفيل والحديد المجلفن:</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#5B6675]">إجمالي بروفيل الحلق (Dormant):</span>
                      <strong className="font-bold text-[#10161F]">
                        {project.items.reduce((acc, it) => acc + (it.technicalBOM.frameLengthM * it.quantity), 0).toFixed(1)} متر
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6675]">إجمالي بروفيل الضلف (Ouvrant):</span>
                      <strong className="font-bold text-[#10161F]">
                        {project.items.reduce((acc, it) => acc + (it.technicalBOM.sashLengthM * it.quantity), 0).toFixed(1)} متر
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6675]">إجمالي حديد التقوية المعدني:</span>
                      <strong className="font-bold text-[#10161F]">
                        {project.items.reduce((acc, it) => acc + (it.technicalBOM.steelReinforcementM * it.quantity), 0).toFixed(1)} متر
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6675]">أمتار جوانات المطاط (Joints EPDM):</span>
                      <strong className="font-bold text-[#10161F]">
                        {project.items.reduce((acc, it) => acc + (it.technicalBOM.gasketsLengthM * it.quantity), 0).toFixed(1)} متر
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Hardware & Mechanisms */}
                <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-gray-200 space-y-3">
                  <h4 className="font-extrabold text-[#10161F] flex items-center gap-1.5 border-b pb-2">
                    <Sliders className="w-4 h-4 text-[#1E9E5A]" />
                    <span>الإكسسوارات والمقابض (Quincaillerie):</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#5B6675]">المقابض المعدنية (Crémones / Poignées):</span>
                      <strong className="font-bold text-[#10161F]">
                        {project.items.reduce((acc, it) => acc + (it.technicalBOM.locksHandlesCount * it.quantity), 0)} مقبض
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6675]">مفصلات النوافذ (Paumelles):</span>
                      <strong className="font-bold text-[#10161F]">
                        {project.items.reduce((acc, it) => acc + (it.technicalBOM.hingesCount * it.quantity), 0)} مفصلة
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6675]">أطقم ميكانيزم القلاب (Kits Oscillo-Battant OB):</span>
                      <strong className="font-bold text-[#0B4F9E]">
                        {project.items.reduce((acc, it) => {
                          const obCount = (it.sashConfigs || []).filter(s => s.type === 'OB').length;
                          return acc + (obCount * it.quantity);
                        }, 0)} طقم OB
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5B6675]">عجلات السحب للجرار (Roulettes):</span>
                      <strong className="font-bold text-[#10161F]">
                        {project.items.reduce((acc, it) => acc + (it.technicalBOM.rollersCount * it.quantity), 0)} عجلة
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: FICHE D'OPTIMISATION (ورقة تحسين القص - 1D Cutting Stock Plan) */}
          {/* ========================================================================= */}
          {activeTab === 'optimization' && (
            <div className="space-y-6">
              {/* Header and Quick Stats */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-gray-200">
                <div>
                  <h3 className="text-base font-extrabold text-[#10161F] flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-[#0B4F9E]" />
                    <span>مخطط تحسين تقطيع القضبان (Plan d'Optimisation de Débit)</span>
                  </h3>
                  <p className="text-xs text-[#5B6675]">
                    خوارزمية ذكية لتقطيع قضبان الـ 6 أمتار بأقل نسبة هدر مع احتساب سمك منشار القص ({sawKerfMm} مم)
                  </p>
                </div>

                {/* Efficiency Badge */}
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-2xl">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-900">
                    كفاءة القص الإجمالية: <strong>{optimizationReport.summary.overallEfficiencyPercent}%</strong>
                  </span>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-gray-200">
                  <span className="text-[#5B6675] block text-[11px]">عدد القضبان 6 م المطلوبة:</span>
                  <strong className="text-lg font-black text-[#0B4F9E]">
                    {optimizationReport.summary.totalBars6m} قضبان
                  </strong>
                </div>
                <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-gray-200">
                  <span className="text-[#5B6675] block text-[11px]">إجمالي الأمتار المستهلكة:</span>
                  <strong className="text-lg font-black text-gray-800">
                    {optimizationReport.summary.totalLinearMeters} م
                  </strong>
                </div>
                <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200">
                  <span className="text-emerald-800 block text-[11px]">فضلات صالحة للاستعمال (&gt;1م):</span>
                  <strong className="text-lg font-black text-emerald-700">
                    {optimizationReport.summary.totalReusableDropsCount} قطع
                  </strong>
                </div>
                <div className="bg-red-50/50 p-3.5 rounded-2xl border border-red-200">
                  <span className="text-red-700 block text-[11px]">الهدر الضائع النهائي:</span>
                  <strong className="text-lg font-black text-red-700">
                    {optimizationReport.summary.totalScrapLossM} م
                  </strong>
                </div>
              </div>

              {/* Profile Category Switcher for Bars */}
              <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
                <button
                  onClick={() => setOptProfileTab('frame')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    optProfileTab === 'frame'
                      ? 'bg-[#0B4F9E] text-white shadow-xs'
                      : 'bg-gray-100 text-[#5B6675] hover:bg-gray-200'
                  }`}
                >
                  الحلق (Dormant) - {optimizationReport.categories.frame.barsCount} قضبان
                </button>
                <button
                  onClick={() => setOptProfileTab('sash')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    optProfileTab === 'sash'
                      ? 'bg-[#0B4F9E] text-white shadow-xs'
                      : 'bg-gray-100 text-[#5B6675] hover:bg-gray-200'
                  }`}
                >
                  الضلف (Ouvrant) - {optimizationReport.categories.sash.barsCount} قضبان
                </button>
                {optimizationReport.categories.mullion && (
                  <button
                    onClick={() => setOptProfileTab('mullion')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      optProfileTab === 'mullion'
                        ? 'bg-[#0B4F9E] text-white shadow-xs'
                        : 'bg-gray-100 text-[#5B6675] hover:bg-gray-200'
                    }`}
                  >
                    القائم الأوسط (Meneau)
                  </button>
                )}
                {optimizationReport.categories.beads && (
                  <button
                    onClick={() => setOptProfileTab('bead')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      optProfileTab === 'bead'
                        ? 'bg-[#0B4F9E] text-white shadow-xs'
                        : 'bg-gray-100 text-[#5B6675] hover:bg-gray-200'
                    }`}
                  >
                    حوابس الزجاج (Parcloses)
                  </button>
                )}
                {optimizationReport.categories.steel && (
                  <button
                    onClick={() => setOptProfileTab('steel')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      optProfileTab === 'steel'
                        ? 'bg-[#0B4F9E] text-white shadow-xs'
                        : 'bg-gray-100 text-[#5B6675] hover:bg-gray-200'
                    }`}
                  >
                    حديد التقوية المجلفن
                  </button>
                )}
              </div>

              {/* Graphical Cutting Bars Visualizer */}
              {(() => {
                const currentOpt =
                  optProfileTab === 'frame'
                    ? optimizationReport.categories.frame
                    : optProfileTab === 'sash'
                    ? optimizationReport.categories.sash
                    : optProfileTab === 'mullion'
                    ? optimizationReport.categories.mullion
                    : optProfileTab === 'bead'
                    ? optimizationReport.categories.beads
                    : optimizationReport.categories.steel;

                if (!currentOpt) return null;

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-[#5B6675]">
                      <span>{currentOpt.profileTypeName} (قضبان قياسية 6000 مم)</span>
                      <span>الكفاءة: {currentOpt.efficiencyPercent}%</span>
                    </div>

                    <div className="space-y-3">
                      {currentOpt.bars.map((bar) => (
                        <div
                          key={`bar-${bar.barIndex}`}
                          className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2"
                        >
                          {/* Bar Header */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black text-[#10161F]">
                              القضيب رقم #{bar.barIndex} (6.00 م)
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[#5B6675]">
                                مستغل: <strong>{bar.usedLengthMm} مم</strong>
                              </span>
                              <span className="text-gray-300">|</span>
                              <span
                                className={`font-bold px-2 py-0.5 rounded-md ${
                                  bar.isReusableDrop
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {bar.isReusableDrop ? 'فضلة صالحة' : 'سقط هدر'}: {bar.wasteMm} مم ({bar.wastePercent}%)
                              </span>
                            </div>
                          </div>

                          {/* Graphical Visual Segmented Bar */}
                          <div className="w-full h-11 bg-gray-100 rounded-xl overflow-hidden flex border border-gray-300 relative shadow-inner">
                            {bar.pieces.map((piece, pIdx) => {
                              const widthPercent = (piece.lengthMm / bar.stockLengthMm) * 100;
                              const colors = [
                                'bg-[#0B4F9E]',
                                'bg-[#0284C7]',
                                'bg-[#2563EB]',
                                'bg-[#3B82F6]',
                                'bg-[#60A5FA]',
                              ];
                              const pieceColor = colors[pIdx % colors.length];

                              return (
                                <div
                                  key={`piece-${bar.barIndex}-${pIdx}`}
                                  style={{ width: `${widthPercent}%` }}
                                  className={`h-full ${pieceColor} text-white flex flex-col items-center justify-center border-l-2 border-white px-1 text-[10px] font-bold overflow-hidden transition-all hover:brightness-110`}
                                  title={`${piece.label} | ${piece.lengthMm} مم | زوايا: ${piece.cutAngleLeft}°/${piece.cutAngleRight}°`}
                                >
                                  <span className="truncate">{piece.lengthMm} مم</span>
                                  <span className="text-[8px] opacity-80 truncate">{piece.cutAngleLeft}°</span>
                                </div>
                              );
                            })}

                            {/* Drop / Waste End Segment */}
                            {bar.wasteMm > 0 && (
                              <div
                                style={{ width: `${(bar.wasteMm / bar.stockLengthMm) * 100}%` }}
                                className={`h-full flex items-center justify-center text-[10px] font-bold px-1 ${
                                  bar.isReusableDrop
                                    ? 'bg-emerald-200 text-emerald-900 border-l border-emerald-400'
                                    : 'bg-red-100 text-red-800 border-l border-red-300'
                                }`}
                                title={bar.isReusableDrop ? 'فضلة قابلة لإعادة الاستخدام' : 'هدر ساقط'}
                              >
                                <span className="truncate">{bar.wasteMm} مم</span>
                              </div>
                            )}
                          </div>

                          {/* Text instructions list for this bar */}
                          <div className="text-[11px] text-[#5B6675] pt-1 flex flex-wrap gap-2">
                            <span className="font-bold text-[#10161F]">تسلسل القطع:</span>
                            {bar.pieces.map((p, i) => (
                              <span key={i} className="bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                                {i + 1}) {p.lengthMm} مم [{p.cutAngleLeft}°/{p.cutAngleRight}°] ({p.label})
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: FACTURE FINALE (الفاتورة النهائية الرسمية) */}
          {/* ========================================================================= */}
          {activeTab === 'invoice' && (
            <div className="space-y-6 print:space-y-4">
              {/* Invoice Letterhead */}
              <div className="flex items-start justify-between border-b-2 border-gray-900 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#0B4F9E] flex items-center justify-center p-2 text-white">
                    <img src="/icon.svg" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-[#10161F]">{settings.workshopName}</h1>
                    <p className="text-[11px] text-[#5B6675]">شركة تصنيع وتركيب نجارة الـ PVC والأشغال العامة</p>
                    <p className="text-[11px] text-[#5B6675]">{settings.address} - ولاية {settings.wilaya}</p>
                    <p className="text-[11px] font-bold text-[#0B4F9E]">الهاتف: {settings.phone}</p>
                  </div>
                </div>

                <div className="text-left space-y-1">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xl font-black text-gray-900">فاتورة بيع (FACTURE)</span>
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                        calculations.remainingBalance === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {calculations.remainingBalance === 0 ? 'مسددة بالكامل (Soldée)' : 'دفعة تحت الحساب (Acompte)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5B6675]">
                    <span>رقم الفاتورة: </span>
                    <strong className="text-black font-black text-sm">{project.invoiceNumber}</strong>
                  </div>
                  <div className="text-[11px] text-[#5B6675]">
                    <span>تاريخ الفاتورة: </span>
                    <strong className="text-black">{new Date().toLocaleDateString('ar-DZ')}</strong>
                  </div>
                </div>
              </div>

              {/* Customer and Tax Information Card */}
              <div className="grid grid-cols-2 gap-4 bg-[#F8FAFC] p-4 rounded-2xl border border-gray-200 text-xs">
                <div>
                  <span className="text-[#5B6675] block font-bold mb-1">فاتورة موجهة إلى:</span>
                  <p className="text-sm font-black text-[#10161F]">{project.customerName}</p>
                  <p className="text-[#5B6675]">رقم الهاتف: {project.customerPhone}</p>
                  <p className="text-[#5B6675]">العنوان: {project.customerWilaya} - {project.customerAddress}</p>
                </div>
                <div className="text-left">
                  <span className="text-[#5B6675] block font-bold mb-1">بيانات التعريف الضريبي للمؤسسة:</span>
                  <p className="text-[#5B6675]">س.ت (RC): {settings.rcNumber || '23/00-1928374B'}</p>
                  <p className="text-[#5B6675]">ر.ت.ج (NIF): {settings.nifNumber || '001928374650192'}</p>
                  <p className="text-[#5B6675]">ر.ت.إ (NIS): 001928374650192</p>
                  <p className="text-[#5B6675]">المادة الجبائية (AI): 23019283746</p>
                </div>
              </div>

              {/* Invoice Items Table */}
              <div className="border border-gray-300 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gray-900 text-white font-bold">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">الرقم</th>
                      <th className="py-2.5 px-3">بيان السلع والخدمات المصنعة</th>
                      <th className="py-2.5 px-3 text-center">الأبعاد</th>
                      <th className="py-2.5 px-3 text-center">الكمية</th>
                      <th className="py-2.5 px-3 text-center">سعر الوحدة (دج)</th>
                      <th className="py-2.5 px-3 text-left">المبلغ الإجمالي (دج)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {project.items.map((it, idx) => (
                      <tr key={`invoice-row-${it.id}-${idx}`}>
                        <td className="py-3 px-3 text-center font-bold text-gray-500">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <strong className="text-[#10161F] font-bold block">{it.modelName}</strong>
                          <span className="text-[11px] text-[#5B6675]">
                            بروفيل {it.seriesName} • لون {it.colorName} • {it.glassTypeName}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          {it.width} × {it.height} {it.unit}
                        </td>
                        <td className="py-3 px-3 text-center font-black">{it.quantity}</td>
                        <td className="py-3 px-3 text-center font-bold">{formatDZD(it.unitPriceDZD)}</td>
                        <td className="py-3 px-3 text-left font-black">{formatDZD(it.itemSubtotalDZD)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Payments Schedule & Financial Settlement */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2">
                <div className="sm:col-span-7 space-y-3">
                  <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-gray-200 text-xs space-y-2">
                    <span className="font-extrabold text-[#10161F] block border-b pb-1">
                      سجل الدفعات والمبالغ المسددة:
                    </span>
                    {project.payments && project.payments.length > 0 ? (
                      project.payments.map((p, pIdx) => (
                        <div key={p.id || pIdx} className="flex justify-between text-[#5B6675]">
                          <span>
                            دفعة #{pIdx + 1} ({new Date(p.date).toLocaleDateString('ar-DZ')}) - {p.method === 'cash' ? 'نقداً' : p.method === 'ccp_baridimob' ? 'بريدي موب/CCP' : 'شيك بنكي'}:
                          </span>
                          <strong className="text-[#1E9E5A]">{formatDZD(p.amountDZD)}</strong>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 italic">لم يتم تسجيل دفعات مسبقة حتى الآن.</p>
                    )}
                  </div>

                  {/* Stamp */}
                  <div className="border border-dashed border-gray-400 rounded-2xl p-4 text-center h-28 flex flex-col justify-between bg-gray-50/40">
                    <span className="text-xs font-bold text-gray-700">توقيع وختم المحاسبة والورشة المعتمدة:</span>
                    <span className="text-[10px] text-gray-400">حرر بحسن نية ووفقاً للأنظمة المعمول بها</span>
                  </div>
                </div>

                <div className="sm:col-span-5 bg-[#F8FAFC] p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-[#5B6675]">المبلغ الصافي (HT):</span>
                    <strong className="font-bold text-[#10161F]">{formatDZD(calculations.subtotal)}</strong>
                  </div>

                  {discountDZD > 0 && (
                    <div className="flex justify-between py-1 text-[#D62F3A]">
                      <span>تخفيض تجاري:</span>
                      <strong className="font-bold">- {formatDZD(discountDZD)}</strong>
                    </div>
                  )}

                  <div className="flex justify-between py-1 text-[#5B6675]">
                    <span>الرسم على القيمة المضافة (TVA):</span>
                    <strong className="font-bold text-[#10161F]">
                      {includeTva ? formatDZD(calculations.tvaAmount) : '0 دج (إعفاء)'}
                    </strong>
                  </div>

                  <div className="border-t border-gray-300 pt-2 flex justify-between items-center text-sm font-black">
                    <span className="text-gray-900">المبلغ الإجمالي (TTC):</span>
                    <span className="text-base font-black text-gray-900">{formatDZD(calculations.grandTotal)}</span>
                  </div>

                  <div className="flex justify-between py-1 text-[#1E9E5A] font-bold">
                    <span>المبلغ المسدد (Acompte):</span>
                    <span>{formatDZD(project.paidAmountDZD || 0)}</span>
                  </div>

                  <div className="border-t-2 border-[#D62F3A] pt-2 flex justify-between items-center text-base font-black text-[#D62F3A]">
                    <span>المبلغ المتبقي للدفع:</span>
                    <span>{formatDZD(calculations.remainingBalance)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Record Payment Sub-Modal */}
        {showAddPaymentModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#DDE3EA] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#1E9E5A]" />
                  <h3 className="font-bold text-base text-[#10161F]">تسجيل دفعة / عربون للمشروع</h3>
                </div>
                <button
                  onClick={() => setShowAddPaymentModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#10161F] mb-1">المبلغ المسدد (دج):</label>
                  <input
                    type="number"
                    min="1"
                    max={calculations.remainingBalance || 10000000}
                    required
                    value={newPaymentAmount || ''}
                    onChange={(e) => setNewPaymentAmount(Number(e.target.value))}
                    placeholder="مثال: 50000"
                    className="w-full text-lg font-black py-2.5 px-3 rounded-xl border border-[#DDE3EA] text-[#1E9E5A]"
                  />
                  <span className="text-[11px] text-[#5B6675] mt-1 block">
                    المبلغ المتبقي الإجمالي: {formatDZD(calculations.remainingBalance)}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-[#10161F] mb-1">طريقة الدفع:</label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                    className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA]"
                  >
                    <option value="cash">نقداً (Espèces)</option>
                    <option value="ccp_baridimob">بريدي موب / CCP</option>
                    <option value="bank_check">شيك بنكي (Chèque)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#10161F] mb-1">ملاحظة أو رقم الوصل:</label>
                  <input
                    type="text"
                    value={newPaymentNote}
                    onChange={(e) => setNewPaymentNote(e.target.value)}
                    placeholder="رقم العملية أو اسم الشخص المسلم..."
                    className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#1E9E5A] hover:bg-[#168048] text-white font-bold cursor-pointer"
                  >
                    تأكيد وتسجيل الدفعة
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddPaymentModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
