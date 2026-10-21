import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD } from '../../utils/calculator';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Users,
  Bell,
  ArrowUpRight,
  ClipboardList,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    orders,
    savedQuotes,
    expenses,
    auditLogs,
    setActiveAdminTab,
    setSelectedOrderForModal,
  } = useApp();

  // Metrics calculations
  const totalSales = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, o) => acc + o.grandTotalDZD, 0);

  const totalMaterialCosts = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, o) => acc + o.totalMaterialCostDZD, 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amountDZD, 0);

  const netProfit = Math.max(0, totalSales - totalMaterialCosts - totalExpenses);
  const profitMargin = totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0;

  const newOrdersToday = orders.filter(o => o.status === 'new').length;
  const inFabrication = orders.filter(o => o.status === 'fabrication').length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;

  const totalOutstandingBalance = orders.reduce((acc, o) => acc + o.remainingAmountDZD, 0);

  // Recent 5 orders
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>نظام التسعير وإدارة ورشة PVC نشط ومُحدث</span>
          </div>
          <h1 className="text-2xl font-black text-[#10161F]">لوحة مؤشرات أداء الورشة</h1>
          <p className="text-xs text-[#5B6675] mt-1">
            متابعة فورية للمبيعات، صافي الأرباح، قائمة المواد والقص (BOM)، والديون المستحقة.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveAdminTab('orders')}
            className="py-2.5 px-4 rounded-xl bg-[#0B4F9E] hover:bg-[#083A75] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
          >
            <ClipboardList className="w-4 h-4" />
            <span>عرض كل الطلبات ({orders.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sales */}
        <div className="bg-white rounded-3xl p-5 border border-[#DDE3EA] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#5B6675]">
            <span className="font-semibold">إجمالي المبيعات المؤكدة</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0B4F9E] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#10161F]">
            {formatDZD(totalSales)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>حسب آخر تحديث للطلبات المعتمدة</span>
          </div>
        </div>

        {/* Card 2: Net Profit */}
        <div className="bg-white rounded-3xl p-5 border border-[#DDE3EA] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#5B6675]">
            <span className="font-semibold">صافي الربح المتوقع</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#1E9E5A] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1E9E5A]">
            {formatDZD(netProfit)}
          </div>
          <div className="text-[11px] text-[#5B6675] font-semibold">
            هامش الربح الإجمالي: <strong className="text-emerald-700">{profitMargin}%</strong>
          </div>
        </div>

        {/* Card 3: Pending & Fabrication Orders */}
        <div className="bg-white rounded-3xl p-5 border border-[#DDE3EA] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#5B6675]">
            <span className="font-semibold">طلبات قيد الإنجاز</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#10161F]">
            {newOrdersToday + inFabrication + readyOrders} طلبات
          </div>
          <div className="text-[11px] text-[#5B6675] flex items-center gap-1.5">
            <span className="text-blue-600 font-bold">{newOrdersToday} جديدة</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{inFabrication} بالورشة</span>
          </div>
        </div>

        {/* Card 4: Outstanding Receivables */}
        <div className="bg-white rounded-3xl p-5 border border-[#DDE3EA] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#5B6675]">
            <span className="font-semibold">ديون مستحقة على الزبائن</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#D62F3A] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#D62F3A]">
            {formatDZD(totalOutstandingBalance)}
          </div>
          <div className="text-[11px] text-[#5B6675]">
            تُستخلص عند التسليم والتركيب
          </div>
        </div>
      </div>

      {/* Charts & Analytical Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales vs Cost breakdown visual bar */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-[#10161F]">
              توزيع الإيرادات مقابل تكلفة المواد والمصاريف
            </h3>
            <span className="text-xs text-[#5B6675]">حساب تحليلي</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700">صافي أرباح الورشة ({profitMargin}%)</span>
                <span>{formatDZD(netProfit)}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1E9E5A] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, profitMargin))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-700">تكلفة المواد والبروفيل والزجاج والإكسسوارات</span>
                <span>{formatDZD(totalMaterialCosts)}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0B4F9E] rounded-full transition-all duration-500"
                  style={{ width: `${totalSales > 0 ? (totalMaterialCosts / totalSales) * 100 : 40}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700">المصاريف التشغيلية (أجور، كهرباء، إيجار، نقل)</span>
                <span>{formatDZD(totalExpenses)}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalSales > 0 ? (totalExpenses / totalSales) * 100 : 20}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick summary notes */}
          <div className="mt-4 p-4 rounded-2xl bg-[#F8FAFC] border border-gray-100 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#5B6675] block">معدل تحويل العروض لطلبات:</span>
              <strong className="text-[#10161F] text-sm font-black">
                {orders.length > 0 ? '78%' : '0%'}
              </strong>
            </div>
            <div>
              <span className="text-[#5B6675] block">متوسط قيمة الطلب الواحد:</span>
              <strong className="text-[#0B4F9E] text-sm font-black">
                {orders.length > 0 ? formatDZD(totalSales / orders.length) : '0 دج'}
              </strong>
            </div>
          </div>
        </div>

        {/* Quick Audit Log */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-extrabold text-base text-[#10161F]">آخر العمليات (Audit Log)</h3>
            <span className="text-[11px] text-[#5B6675]">سجل آمن</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {auditLogs.slice(0, 6).map(log => (
              <div key={log.id} className="p-3 rounded-2xl bg-[#F8FAFC] border border-gray-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#10161F]">{log.action}</span>
                  <span className="text-[10px] text-gray-400">{log.timestamp}</span>
                </div>
                <p className="text-[#5B6675] text-[11px] leading-relaxed">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-extrabold text-base text-[#10161F]">أحدث طلبات الزبائن</h3>
            <p className="text-xs text-[#5B6675]">انقر على أي طلب لمشاهدة المقايسة الفنية وجدول القص</p>
          </div>
          <button
            onClick={() => setActiveAdminTab('orders')}
            className="text-xs font-bold text-[#0B4F9E] hover:underline flex items-center gap-1"
          >
            <span>عرض كل الطلبات</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="text-[#5B6675] border-b border-gray-100 pb-2">
                <th className="py-2.5 font-bold">رقم الطلب</th>
                <th className="py-2.5 font-bold">الزبون والهاتف</th>
                <th className="py-2.5 font-bold">الموقع</th>
                <th className="py-2.5 font-bold">الحالة</th>
                <th className="py-2.5 font-bold">الإجمالي</th>
                <th className="py-2.5 font-bold">المدفوع</th>
                <th className="py-2.5 font-bold">المتبقي</th>
                <th className="py-2.5 font-bold text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map(ord => (
                <tr key={ord.id} className="hover:bg-blue-50/30 transition-all">
                  <td className="py-3 font-extrabold text-[#0B4F9E]">{ord.orderNumber}</td>
                  <td className="py-3">
                    <strong className="text-[#10161F] block">{ord.customerName}</strong>
                    <span className="text-[#5B6675]">{ord.customerPhone}</span>
                  </td>
                  <td className="py-3 text-[#5B6675]">{ord.customerWilaya}</td>
                  <td className="py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#0B4F9E]">
                      {ord.status === 'new' && 'جديد'}
                      {ord.status === 'reviewing' && 'قيد المراجعة'}
                      {ord.status === 'inspected' && 'تمت المعاينة'}
                      {ord.status === 'confirmed' && 'مؤكد'}
                      {ord.status === 'fabrication' && 'قيد التصنيع'}
                      {ord.status === 'ready' && 'جاهز للتسليم'}
                      {ord.status === 'installed' && 'تم التركيب'}
                      {ord.status === 'cancelled' && 'ملغى'}
                    </span>
                  </td>
                  <td className="py-3 font-black text-[#10161F]">{formatDZD(ord.grandTotalDZD)}</td>
                  <td className="py-3 font-semibold text-[#1E9E5A]">{formatDZD(ord.paidAmountDZD)}</td>
                  <td className="py-3 font-semibold text-[#D62F3A]">{formatDZD(ord.remainingAmountDZD)}</td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedOrderForModal(ord);
                        setActiveAdminTab('orders');
                      }}
                      className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0B4F9E] font-bold text-[11px]"
                    >
                      فتح وتفصيل الـ BOM
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
