import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD } from '../../utils/calculator';
import { Order, OrderStatus } from '../../types';
import { WindowSvgPreview } from '../common/WindowSvgPreview';
import { Window3DPreview } from '../common/Window3DPreview';
import { ProjectHubModal, ProjectHubData } from '../common/ProjectHubModal';
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Printer,
  FileSpreadsheet,
  Plus,
  CreditCard,
  MessageSquare,
  Shield,
  Layers,
  Wrench,
  Percent,
  X,
  Send,
  AlertTriangle,
  Box,
  Sparkles,
} from 'lucide-react';

const orderStatuses: { key: OrderStatus; label: string; color: string }[] = [
  { key: 'new', label: 'جديد', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { key: 'reviewing', label: 'قيد المراجعة', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { key: 'inspected', label: 'تمت المعاينة', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { key: 'confirmed', label: 'مؤكد', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { key: 'fabrication', label: 'قيد التصنيع', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { key: 'ready', label: 'جاهز', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { key: 'installed', label: 'تم التركيب', color: 'bg-emerald-200 text-emerald-900 border-emerald-300' },
  { key: 'cancelled', label: 'ملغى', color: 'bg-rose-100 text-rose-800 border-rose-200' },
];

export const AdminOrders: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    addPaymentToOrder,
    adjustOrderPrice,
    addMessageToOrder,
    selectedOrderForModal,
    setSelectedOrderForModal,
    setPrintableOrderModalData,
    settings,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(selectedOrderForModal);
  const [viewing3DItem, setViewing3DItem] = useState<any | null>(null);
  const [selectedProjectForHub, setSelectedProjectForHub] = useState<ProjectHubData | null>(null);

  const orderToProjectHub = (ord: Order): ProjectHubData => {
    return {
      id: ord.id,
      projectNumber: `PRJ-${ord.orderNumber.replace('CMD-', '')}`,
      devisNumber: ord.quoteId || `DEV-${ord.orderNumber.replace('CMD-', '')}`,
      invoiceNumber: `FAC-${ord.orderNumber.replace('CMD-', '')}`,
      title: `مشروع: ${ord.customerName} (${ord.customerWilaya})`,
      customerName: ord.customerName,
      customerPhone: ord.customerPhone,
      customerWilaya: ord.customerWilaya,
      customerAddress: ord.customerAddress,
      createdAt: ord.createdAt,
      validUntil: ord.updatedAt || new Date().toISOString(),
      status: ord.status,
      items: ord.items,
      subtotalDZD: ord.subtotalDZD,
      discountDZD: ord.discountDZD,
      discountReason: ord.discountReason,
      tvaRatePercent: ord.tvaAmountDZD > 0 ? 19 : 0,
      deliveryInstallationFeeDZD: ord.deliveryInstallationFeeDZD,
      paidAmountDZD: ord.paidAmountDZD,
      payments: ord.payments || [],
      notes: ord.customerNotes,
    };
  };

  // Payment Recording Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'ccp_baridimob' | 'bank_check'>('cash');
  const [paymentNote, setPaymentNote] = useState('');

  // Discount Modal State
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState('');

  // Admin reply chat
  const [replyText, setReplyText] = useState('');

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone.includes(searchTerm) ||
      o.customerWilaya.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingOrder || paymentAmount <= 0) return;

    addPaymentToOrder(viewingOrder.id, {
      amountDZD: paymentAmount,
      date: new Date().toISOString().split('T')[0],
      method: paymentMethod,
      note: paymentNote,
    });

    // Update local viewing instance
    const updated = orders.find(o => o.id === viewingOrder.id);
    if (updated) setViewingOrder(updated);

    setShowPaymentModal(false);
    setPaymentAmount(0);
    setPaymentNote('');
  };

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingOrder) return;

    adjustOrderPrice(viewingOrder.id, discountAmount, discountReason);
    const updated = orders.find(o => o.id === viewingOrder.id);
    if (updated) setViewingOrder(updated);

    setShowDiscountModal(false);
  };

  const handleSendAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingOrder || !replyText.trim()) return;

    addMessageToOrder(viewingOrder.id, replyText.trim(), 'owner');
    setReplyText('');
    const updated = orders.find(o => o.id === viewingOrder.id);
    if (updated) setViewingOrder(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-[#10161F]">إدارة الطلبات والمقايسة الفنية</h1>
            <p className="text-xs text-[#5B6675]">
              متابعة أوامر التصنيع، جداول قص البروفيل والزجاج (BOM)، الدفعات، وتغيير الحالات.
            </p>
          </div>
          <span className="text-xs font-bold text-[#0B4F9E] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 self-start">
            إجمالي {orders.length} طلب
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-gray-100">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث برقم الطلب، اسم الزبون، الهاتف، أو الولاية..."
              className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-[#DDE3EA] text-xs font-medium focus:border-[#0B4F9E] focus:ring-1 focus:ring-[#0B4F9E]"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-[#DDE3EA] text-xs font-bold text-[#10161F] focus:border-[#0B4F9E]"
            >
              <option value="all">جميع الحالات ({orders.length})</option>
              {orderStatuses.map(st => (
                <option key={st.key} value={st.key}>
                  {st.label} ({orders.filter(o => o.status === st.key).length})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-[#DDE3EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-[#F8FAFC] text-[#5B6675] border-b border-[#DDE3EA]">
              <tr>
                <th className="py-3 px-4 font-bold">الطلب</th>
                <th className="py-3 px-4 font-bold">الزبون</th>
                <th className="py-3 px-4 font-bold">الهاتف والموقع</th>
                <th className="py-3 px-4 font-bold">تغيير الحالة</th>
                <th className="py-3 px-4 font-bold">المبلغ الإجمالي</th>
                <th className="py-3 px-4 font-bold">المدفوع</th>
                <th className="py-3 px-4 font-bold">المتبقي</th>
                <th className="py-3 px-4 font-bold text-center">المقايسة (BOM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    لا توجد طلبات تطابق معايير البحث.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(ord => {
                  const statusObj = orderStatuses.find(s => s.key === ord.status) || orderStatuses[0];
                  return (
                    <tr key={ord.id} className="hover:bg-blue-50/20 transition-all">
                      <td className="py-3 px-4 font-black text-[#0B4F9E]">
                        {ord.orderNumber}
                        <span className="block text-[10px] text-gray-400 font-normal">
                          {new Date(ord.createdAt).toLocaleDateString('ar-DZ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-[#10161F] block">{ord.customerName}</strong>
                        {ord.wantsInspectionVisit && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-xs font-semibold">
                            طلب معاينة موقع
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#5B6675]">
                        <span className="block font-semibold text-gray-700">{ord.customerPhone}</span>
                        <span>{ord.customerWilaya}</span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={ord.status}
                          onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className={`py-1 px-2.5 rounded-lg border font-bold text-xs cursor-pointer ${statusObj.color}`}
                        >
                          {orderStatuses.map(st => (
                            <option key={st.key} value={st.key}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 font-black text-[#10161F]">
                        {formatDZD(ord.grandTotalDZD)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#1E9E5A]">
                        {formatDZD(ord.paidAmountDZD)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#D62F3A]">
                        {formatDZD(ord.remainingAmountDZD)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedProjectForHub(orderToProjectHub(ord))}
                            className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#0B4F9E] to-[#1E9E5A] hover:opacity-95 text-white font-extrabold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95"
                            title="فتح ملف المشروع الكامل (Devis • Liste • ورقة القص • Facture)"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>ملف المشروع</span>
                          </button>
                          <button
                            onClick={() => setViewingOrder(ord)}
                            className="py-1.5 px-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#10161F] font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>المقايسة</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Order & Technical BOM Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-[#DDE3EA] space-y-6 relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xl text-[#0B4F9E]">{viewingOrder.orderNumber}</span>
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#0B4F9E]">
                    {orderStatuses.find(s => s.key === viewingOrder.status)?.label}
                  </span>
                </div>
                <p className="text-xs text-[#5B6675] mt-1">
                  الزبون: {viewingOrder.customerName} ({viewingOrder.customerPhone}) - {viewingOrder.customerWilaya}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedProjectForHub(orderToProjectHub(viewingOrder));
                  }}
                  className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#0B4F9E] to-[#1E9E5A] hover:opacity-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  title="فتح ملف المشروع الكامل"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>ملف المشروع (Devis • Débit • القص • Facture)</span>
                </button>
                <button
                  onClick={() => setPrintableOrderModalData(viewingOrder)}
                  className="py-2 px-3 rounded-xl bg-blue-50 text-[#0B4F9E] hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة ورقة العمل والـ BOM</span>
                </button>
                <button
                  onClick={() => setViewingOrder(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions Row: Payments & Discounts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#F8FAFC] border border-gray-100">
              <div>
                <span className="text-[11px] text-[#5B6675] block">إجمالي الطلب:</span>
                <span className="text-lg font-black text-[#10161F]">{formatDZD(viewingOrder.grandTotalDZD)}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#5B6675] block">المبلغ المدفوع:</span>
                <span className="text-lg font-black text-[#1E9E5A]">{formatDZD(viewingOrder.paidAmountDZD)}</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="py-2 px-3.5 rounded-xl bg-[#1E9E5A] hover:bg-[#15803D] text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تسجيل دفعة / عربون</span>
                </button>
                <button
                  onClick={() => {
                    setDiscountAmount(viewingOrder.discountDZD || 0);
                    setShowDiscountModal(true);
                  }}
                  className="py-2 px-3 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs"
                >
                  تعديل السعر / خصم
                </button>
              </div>
            </div>

            {/* Technical Bill of Materials (BOM) Section - OWNER ONLY */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-extrabold text-base text-[#10161F] flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#0B4F9E]" />
                  <span>المقايسة الفنية وجداول التقطيع (BOM - خاص بالمالك)</span>
                </h3>
                <span className="text-[11px] bg-red-50 text-[#D62F3A] font-bold px-2 py-0.5 rounded-md border border-red-100">
                  سري للمالك فقط
                </span>
              </div>

              {/* Items Breakdown */}
              {viewingOrder.items.map((it, idx) => {
                const bom = it.technicalBOM;
                return (
                  <div key={`admin-bom-item-${it.id || ''}-${idx}`} className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
                      <div>
                        <strong className="text-sm text-[#10161F]">{idx + 1}. {it.modelName} ({it.quantity} قطع)</strong>
                        <span className="text-xs text-[#5B6675] mr-2">
                          أبعاد: {it.width} × {it.height} {it.unit} | عدد الضلف: {it.sashes}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-xs text-[#5B6675]">
                          تكلفة تصنيع البند: <strong className="text-blue-700">{formatDZD(bom.totalMaterialCostDZD * it.quantity)}</strong>
                          <span className="mx-2">•</span>
                          ربح مقدر: <strong className="text-emerald-700">{formatDZD(bom.estimatedProfitDZD)}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewing3DItem(it)}
                          className="py-1 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0B4F9E] font-bold text-xs flex items-center gap-1 border border-blue-200 transition-all cursor-pointer active:scale-95"
                        >
                          <Box className="w-3.5 h-3.5" />
                          <span>معاينة 3D</span>
                        </button>
                      </div>
                    </div>

                    {/* BOM Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100">
                        <span className="text-[#5B6675] block text-[11px]">بروفيل الحلق (الإطار):</span>
                        <strong className="text-[#0B4F9E] text-sm">{bom.frameLengthM} م</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100">
                        <span className="text-[#5B6675] block text-[11px]">بروفيل الضلف ({it.sashes}):</span>
                        <strong className="text-[#0B4F9E] text-sm">{bom.sashLengthM} م</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100">
                        <span className="text-[#5B6675] block text-[11px]">قضبان كاملة 6 م (شراء):</span>
                        <strong className="text-amber-800 text-sm">
                          {bom.barsRequired6m} قضبان (بقايا: {bom.scrapWasteM} م)
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-[#5B6675] block text-[11px]">حديد التقوية المجلفن:</span>
                        <strong className="text-gray-800 text-sm">{bom.steelReinforcementM} م</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-cyan-50/50 border border-cyan-100">
                        <span className="text-[#5B6675] block text-[11px]">مساحة الزجاج الصافية:</span>
                        <strong className="text-cyan-800 text-sm">{bom.glassAreaSqm} م²</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-cyan-50/50 border border-cyan-100">
                        <span className="text-[#5B6675] block text-[11px]">مقاس قص الزجاج الواحد:</span>
                        <strong className="text-cyan-800 text-sm">
                          {bom.glassCutDimensions.widthCm} × {bom.glassCutDimensions.heightCm} سم ({bom.glassCutDimensions.quantity} ألواح)
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-[#5B6675] block text-[11px]">جوانات المطاط EPDM:</span>
                        <strong className="text-gray-800 text-sm">{bom.gasketsLengthM} م</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-[#5B6675] block text-[11px]">المفصلات والعجلات:</span>
                        <strong className="text-gray-800 text-sm">
                          {bom.hingesCount > 0 ? `${bom.hingesCount} مفصلة` : ''}
                          {bom.rollersCount > 0 ? `${bom.rollersCount} عجلات` : ''}
                          {bom.locksHandlesCount > 0 ? ` + ${bom.locksHandlesCount} أقفال` : ''}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Direct Messages Inside Order */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h4 className="font-bold text-sm text-[#10161F] flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#0B4F9E]" />
                <span>المحادثة المباشرة مع الزبون</span>
              </h4>

              <div className="h-40 overflow-y-auto space-y-2 p-3 rounded-2xl bg-[#F8FAFC] border border-gray-100 text-xs">
                {viewingOrder.messages.map(m => (
                  <div key={m.id} className={`flex flex-col ${m.sender === 'owner' ? 'items-start' : 'items-end'}`}>
                    <div className={`p-2.5 rounded-xl max-w-[80%] ${m.sender === 'owner' ? 'bg-[#0B4F9E] text-white' : 'bg-white border text-gray-800'}`}>
                      <span className="text-[10px] opacity-75 font-bold block">{m.senderName}:</span>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendAdminReply} className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="الرد على الزبون مباشرة..."
                  className="flex-1 py-2 px-3 rounded-xl border border-[#DDE3EA] text-xs"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="py-2 px-4 rounded-xl bg-[#0B4F9E] text-white font-bold text-xs flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال الرد</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Sub-modal */}
      {showPaymentModal && viewingOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-[#10161F]">تسجيل دفعة للطلب {viewingOrder.orderNumber}</h3>
            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#10161F] mb-1">المبلغ (دج):</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={viewingOrder.remainingAmountDZD}
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  placeholder={`المتبقي: ${viewingOrder.remainingAmountDZD}`}
                  className="w-full text-base font-extrabold py-2 px-3 rounded-xl border border-[#DDE3EA]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#10161F] mb-1">طريقة الدفع:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA] font-semibold"
                >
                  <option value="cash">نقداً (Espèces)</option>
                  <option value="ccp_baridimob">تحويل بريدي / بريدي موب BaridiMob</option>
                  <option value="bank_check">شيك بنكي (Chèque bancaire)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#10161F] mb-1">ملاحظة:</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="عربون، دفعة ثانية، تسديد كلي..."
                  className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#1E9E5A] text-white font-bold"
                >
                  حفظ الدفعة
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Discount Sub-modal */}
      {showDiscountModal && viewingOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-[#10161F]">تعديل السعر أو إضافة خصم</h3>
            <form onSubmit={handleApplyDiscount} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#10161F] mb-1">قيمة الخصم (دج):</label>
                <input
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full text-base font-extrabold py-2 px-3 rounded-xl border border-[#DDE3EA]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#10161F] mb-1">سبب الخصم (مسجل في السجل):</label>
                <input
                  type="text"
                  required
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="مثال: تخفيض مشروع كبير، زبون وفي..."
                  className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0B4F9E] text-white font-bold"
                >
                  تأكيد التعديل
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3D Prototype Modal for Workshop Owner */}
      {viewing3DItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-[#DDE3EA] space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-[#0B4F9E]" />
                <h3 className="text-base font-bold text-[#10161F]">
                  معاينة النموذج الأولي ثلاثي الأبعاد: {viewing3DItem.modelName}
                </h3>
              </div>
              <button
                onClick={() => setViewing3DItem(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <Window3DPreview
              width={viewing3DItem.width}
              height={viewing3DItem.height}
              unit={viewing3DItem.unit}
              sashes={viewing3DItem.sashes}
              openingType={viewing3DItem.openingType}
              colorHex={viewing3DItem.colorHex || '#FFFFFF'}
              glassTypeName={viewing3DItem.glassTypeName || ''}
              sashConfigs={viewing3DItem.sashConfigs}
              showDimensions={true}
              className="w-full h-84 sm:h-96"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#5B6675] bg-gray-50 p-3 rounded-2xl">
              <div>
                <span>المقاسات المعتمدة: </span>
                <strong className="text-[#10161F]">{viewing3DItem.width} × {viewing3DItem.height} {viewing3DItem.unit}</strong>
                <span className="mx-2">•</span>
                <span>الضلف: </span>
                <strong className="text-[#10161F]">{viewing3DItem.sashes}</strong>
                <span className="mx-2">•</span>
                <span>اللون: </span>
                <strong className="text-[#10161F]">{viewing3DItem.colorName || 'أبيض'}</strong>
              </div>
              <button
                onClick={() => setViewing3DItem(null)}
                className="py-1.5 px-4 rounded-xl bg-[#0B4F9E] text-white font-bold text-xs hover:bg-[#083A75] transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Project Hub Modal for Workshop Owner */}
      {selectedProjectForHub && (
        <ProjectHubModal
          project={selectedProjectForHub}
          onClose={() => setSelectedProjectForHub(null)}
          onUpdateProject={(updated) => {
            setSelectedProjectForHub(updated);
          }}
        />
      )}
    </div>
  );
};
