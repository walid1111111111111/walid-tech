import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD } from '../../utils/calculator';
import { Order, OrderStatus } from '../../types';
import { ProjectHubModal, ProjectHubData } from '../common/ProjectHubModal';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Wrench,
  MessageSquare,
  Send,
  Eye,
  Calendar,
  CreditCard,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

const statusStepMap: Record<OrderStatus, { label: string; step: number; color: string }> = {
  new: { label: 'طلب جديد مستلم', step: 1, color: 'bg-blue-500' },
  reviewing: { label: 'قيد المراجعة', step: 2, color: 'bg-indigo-500' },
  inspected: { label: 'تمت المعاينة الميدانية', step: 3, color: 'bg-purple-500' },
  confirmed: { label: 'مؤكد ومُعتمد', step: 4, color: 'bg-cyan-500' },
  fabrication: { label: 'قيد التصنيع بالورشة', step: 5, color: 'bg-amber-500' },
  ready: { label: 'جاهز للتسليم', step: 6, color: 'bg-emerald-500' },
  installed: { label: 'تم التركيب بنجاح', step: 7, color: 'bg-emerald-600' },
  cancelled: { label: 'ملغى', step: 0, color: 'bg-rose-500' },
};

export const CustomerOrdersView: React.FC = () => {
  const { orders, addMessageToOrder, setActiveCustomerTab } = useApp();
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [chatMessage, setChatMessage] = useState('');
  const [viewingProjectHub, setViewingProjectHub] = useState<ProjectHubData | null>(null);

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

  const activeOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeOrder) return;

    addMessageToOrder(activeOrder.id, chatMessage.trim(), 'customer');
    setChatMessage('');
  };

  if (orders.length === 0) {
    return (
      <div className="py-16 px-4 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-gray-50 border border-gray-200 text-gray-400 flex items-center justify-center mx-auto mb-4">
          <ClipboardList className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h2 className="text-xl font-extrabold text-[#10161F]">لا توجد طلبات حالية</h2>
        <p className="text-xs sm:text-sm text-[#5B6675] mt-2 mb-6">
          عند إرسال عرض سعر كطلب، ستتمكن من تتبع مراحل المعاينة والتصنيع والتركيب والدفعات هنا مباشرة.
        </p>
        <button
          onClick={() => setActiveCustomerTab('calculator')}
          className="py-3 px-6 rounded-2xl bg-[#0B4F9E] text-white font-bold text-sm shadow-md"
        >
          إنشاء وحساب عرض سعر جديد
        </button>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#DDE3EA]">
        <div>
          <h1 className="text-2xl font-black text-[#10161F]">متابعة طلباتي</h1>
          <p className="text-xs text-[#5B6675]">
            تتبع مراحل تصنيع وتركيب النوافذ والأبواب والدفعات والتواصل المباشر مع صاحب الورشة.
          </p>
        </div>
        <span className="text-xs font-bold text-[#0B4F9E] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 self-start">
          لديك {orders.length} طلبات
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Orders list selector */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="font-extrabold text-sm text-[#5B6675]">قائمة الطلبات:</h3>
          {orders.map(ord => {
            const isSelected = ord.id === activeOrder?.id;
            const statusInfo = statusStepMap[ord.status] || { label: ord.status, color: 'bg-gray-400' };

            return (
              <div
                key={ord.id}
                onClick={() => setSelectedOrderId(ord.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                  isSelected
                    ? 'border-[#0B4F9E] bg-blue-50/50 ring-2 ring-[#0B4F9E]/20 shadow-xs'
                    : 'border-[#DDE3EA] bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[#10161F]">{ord.orderNumber}</span>
                  <span className="text-[11px] text-[#5B6675]">
                    {new Date(ord.createdAt).toLocaleDateString('ar-DZ')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2.5 py-0.5 rounded-full text-white font-bold text-[10px] ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  <span className="font-black text-[#0B4F9E] text-sm">
                    {formatDZD(ord.grandTotalDZD)}
                  </span>
                </div>

                <div className="text-[11px] text-[#5B6675] flex items-center justify-between pt-1 border-t border-gray-100">
                  <span>المدفوع: {formatDZD(ord.paidAmountDZD)}</span>
                  <span>المتبقي: {formatDZD(ord.remainingAmountDZD)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Order Detailed Tracking & Chat */}
        {activeOrder && (
          <div className="lg:col-span-8 space-y-6">
            {/* Status Progress Timeline */}
            <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <span className="text-xs font-bold text-[#5B6675]">تفاصيل ومراحل الطلب:</span>
                  <h2 className="text-xl font-black text-[#10161F]">{activeOrder.orderNumber}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setViewingProjectHub(orderToProjectHub(activeOrder))}
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#0B4F9E] to-[#1E9E5A] hover:opacity-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>ملف المشروع (Devis • Liste • Facture)</span>
                  </button>
                  <span
                    className={`px-3 py-1 rounded-full text-white text-xs font-bold ${
                      statusStepMap[activeOrder.status]?.color || 'bg-blue-600'
                    }`}
                  >
                    {statusStepMap[activeOrder.status]?.label}
                  </span>
                </div>
              </div>

              {/* Progress Milestones Bar */}
              <div className="relative pt-2">
                <div className="grid grid-cols-5 gap-1 text-center">
                  {[
                    { key: 'new', label: 'الاستلام' },
                    { key: 'inspected', label: 'المعاينة' },
                    { key: 'confirmed', label: 'التأكيد' },
                    { key: 'fabrication', label: 'التصنيع' },
                    { key: 'installed', label: 'التركيب' },
                  ].map((step, idx) => {
                    const currentStepNum = statusStepMap[activeOrder.status]?.step || 1;
                    const stepWeights: Record<string, number> = {
                      new: 1,
                      inspected: 3,
                      confirmed: 4,
                      fabrication: 5,
                      installed: 7,
                    };
                    const isDone = currentStepNum >= stepWeights[step.key];
                    const isCurrent = currentStepNum === stepWeights[step.key];

                    return (
                      <div key={step.key} className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-all ${
                            isDone
                              ? 'bg-[#1E9E5A] text-white shadow-xs'
                              : 'bg-gray-100 text-gray-400 border border-gray-200'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span
                          className={`text-[11px] leading-tight ${
                            isCurrent ? 'font-black text-[#0B4F9E]' : isDone ? 'font-semibold text-gray-700' : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer Notes / Inspection info */}
              <div className="p-3.5 rounded-2xl bg-[#F3F6FA] border border-[#DDE3EA] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#5B6675] block">موقع التسليم:</span>
                  <span className="font-bold text-[#10161F]">
                    {activeOrder.customerWilaya} - {activeOrder.customerAddress || 'حسب الاتفاق'}
                  </span>
                </div>
                <div>
                  <span className="text-[#5B6675] block">طلب زيارة المعاينة:</span>
                  <span className="font-bold text-[#10161F]">
                    {activeOrder.wantsInspectionVisit ? 'نعم (مطلوبة لأخذ القياسات بالموقع)' : 'لا (المقاسات مدققة مسبقاً)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Items inside this order */}
            <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-[#10161F]">البنود والمواصفات المطلوبة:</h3>
              <div className="space-y-3">
                {activeOrder.items.map((it, idx) => (
                  <div
                    key={`cust-ord-item-${it.id || ''}-${idx}`}
                    className="p-3 rounded-2xl border border-gray-100 bg-[#F8FAFC] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#10161F] text-sm block">{it.modelName}</span>
                      <span className="text-[#5B6675]">
                        {it.width} × {it.height} {it.unit} | {it.seriesName.split('(')[0]} | {it.colorName.split('(')[0]} | {it.glassTypeName.split('(')[0]}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="font-extrabold text-[#0B4F9E] text-sm block">
                        {formatDZD(it.itemSubtotalDZD)}
                      </span>
                      <span className="text-gray-400 text-[11px]">{it.quantity} قطع</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial balances */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[#5B6675] block">إجمالي الطلب:</span>
                  <span className="text-base font-black text-[#10161F]">{formatDZD(activeOrder.grandTotalDZD)}</span>
                </div>
                <div>
                  <span className="text-[#5B6675] block">المبلغ المدفوع (عربون/أقساط):</span>
                  <span className="text-base font-black text-[#1E9E5A]">{formatDZD(activeOrder.paidAmountDZD)}</span>
                </div>
                <div>
                  <span className="text-[#5B6675] block">المتبقي عند التسليم:</span>
                  <span className="text-base font-black text-[#D62F3A]">{formatDZD(activeOrder.remainingAmountDZD)}</span>
                </div>
              </div>
            </div>

            {/* Internal Order Messaging between Customer and Owner (FR-A7 & FR-C5) */}
            <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-[#10161F] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#0B4F9E]" />
                <span>محادثة مباشرة مع الورشة حول هذا الطلب</span>
              </h3>

              {/* Messages Container */}
              <div className="h-48 overflow-y-auto space-y-2.5 p-3 rounded-2xl bg-[#F8FAFC] border border-gray-100 text-xs">
                {activeOrder.messages.length === 0 ? (
                  <p className="text-center text-gray-400 py-12">
                    لا توجد رسائل بعد. يمكنك كتابة استفسار لصاحب الورشة هنا.
                  </p>
                ) : (
                  activeOrder.messages.map(msg => {
                    const isMe = msg.sender === 'customer';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl ${
                            isMe
                              ? 'bg-[#0B4F9E] text-white rounded-tr-xs'
                              : 'bg-white text-[#10161F] border border-[#DDE3EA] rounded-tl-xs shadow-xs'
                          }`}
                        >
                          <div className="text-[10px] opacity-75 font-semibold mb-0.5">
                            {msg.senderName}
                          </div>
                          <p className="leading-relaxed">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="اكتب استفسارك أو رسالتك للورشة..."
                  className="flex-1 py-2.5 px-3 rounded-xl border border-[#DDE3EA] text-xs font-medium focus:border-[#0B4F9E] focus:ring-1 focus:ring-[#0B4F9E]"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="py-2.5 px-4 rounded-xl bg-[#0B4F9E] hover:bg-[#083A75] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
