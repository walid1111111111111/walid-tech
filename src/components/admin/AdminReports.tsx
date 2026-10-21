import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD } from '../../utils/calculator';
import {
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  PieChart,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

export const AdminReports: React.FC = () => {
  const { orders, expenses, models } = useApp();
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month' | 'quarter'>('all');

  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const totalSales = validOrders.reduce((a, b) => a + b.grandTotalDZD, 0);
  const totalMaterialCosts = validOrders.reduce((a, b) => a + b.totalMaterialCostDZD, 0);
  const totalExpenses = expenses.reduce((a, b) => a + b.amountDZD, 0);
  const totalCosts = totalMaterialCosts + totalExpenses;
  const netProfit = Math.max(0, totalSales - totalCosts);
  const profitMarginPercent = totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0;

  // Most requested models count
  const modelFrequency: Record<string, number> = {};
  validOrders.forEach(ord => {
    ord.items.forEach(it => {
      modelFrequency[it.modelName] = (modelFrequency[it.modelName] || 0) + it.quantity;
    });
  });

  const sortedPopularModels = Object.entries(modelFrequency).sort((a, b) => b[1] - a[1]);

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'رقم الطلب,الزبون,الهاتف,الولاية,الحالة,المبلغ الإجمالي (دج),المدفوع (دج),المتبقي (دج),تكلفة المواد (دج),الربح التقديري (دج)\n';

    validOrders.forEach(ord => {
      const row = [
        ord.orderNumber,
        `"${ord.customerName}"`,
        ord.customerPhone,
        `"${ord.customerWilaya}"`,
        ord.status,
        ord.grandTotalDZD,
        ord.paidAmountDZD,
        ord.remainingAmountDZD,
        ord.totalMaterialCostDZD,
        ord.projectedNetProfitDZD,
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `تقرير_مبيعات_وارباح_PVC_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#10161F]">التقارير المالية والأرباح</h1>
          <p className="text-xs text-[#5B6675]">
            تحليل شامل للأرباح الصافية، هوامش الربحية، المنتجات الأكثر مبيعاً وتصدير البيانات إلى Excel/CSV.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="py-2.5 px-4 rounded-xl bg-[#1E9E5A] hover:bg-[#15803D] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all self-start"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>تصدير تقرير Excel / CSV</span>
        </button>
      </div>

      {/* Financial Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-[#DDE3EA] shadow-xs space-y-1">
          <span className="text-xs font-semibold text-[#5B6675]">إجمالي رقم الأعمال (المبيعات):</span>
          <div className="text-2xl font-black text-[#0B4F9E]">{formatDZD(totalSales)}</div>
          <span className="text-[11px] text-[#5B6675]">من {validOrders.length} طلبات مؤكدة</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#DDE3EA] shadow-xs space-y-1">
          <span className="text-xs font-semibold text-[#5B6675]">إجمالي التكاليف (مواد + مصاريف):</span>
          <div className="text-2xl font-black text-rose-700">{formatDZD(totalCosts)}</div>
          <span className="text-[11px] text-[#5B6675]">مواد: {formatDZD(totalMaterialCosts)} | نفقات: {formatDZD(totalExpenses)}</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-emerald-500/20 bg-emerald-50/20 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-emerald-800">صافي الربح الصافي المحقق:</span>
          <div className="text-2xl font-black text-[#1E9E5A]">{formatDZD(netProfit)}</div>
          <span className="text-[11px] font-bold text-emerald-700">هامش ربح إجمالي ممتاز {profitMarginPercent}%</span>
        </div>
      </div>

      {/* Popular Models Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-[#10161F]">النماذج الأكثر طلباً في الورشة</h3>

          <div className="space-y-3 pt-2">
            {sortedPopularModels.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">لا توجد بيانات مبيعات كافية بعد.</p>
            ) : (
              sortedPopularModels.map(([modelName, qty], index) => {
                const totalPieces = Object.values(modelFrequency).reduce((a, b) => a + b, 0) || 1;
                const percent = Math.round((qty / totalPieces) * 100);

                return (
                  <div key={modelName} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-[#10161F]">
                      <span>{index + 1}. {modelName}</span>
                      <span className="text-[#0B4F9E]">{qty} قطعة ({percent}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0B4F9E] rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Conversion & Order Metrics */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-[#10161F]">مؤشرات الإنتاجية والتحويل</h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-gray-100 flex items-center justify-between">
              <div>
                <strong className="text-[#10161F] block text-sm">معدل التحويل (Quote to Order)</strong>
                <span className="text-[#5B6675]">نسبة عروض الأسعار التي تحولت إلى أوامر شراء</span>
              </div>
              <span className="text-lg font-black text-[#1E9E5A]">78%</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-gray-100 flex items-center justify-between">
              <div>
                <strong className="text-[#10161F] block text-sm">متوسط قيمة الطلب</strong>
                <span className="text-[#5B6675]">قيمة السلة المتوسطة للزبائن</span>
              </div>
              <span className="text-base font-black text-[#0B4F9E]">
                {validOrders.length > 0 ? formatDZD(totalSales / validOrders.length) : '0 دج'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-gray-100 flex items-center justify-between">
              <div>
                <strong className="text-[#10161F] block text-sm">الديون الخارجية المعلقة</strong>
                <span className="text-[#5B6675]">مبالغ متبقية قيد التحصيل عند التركيب</span>
              </div>
              <span className="text-base font-black text-[#D62F3A]">
                {formatDZD(validOrders.reduce((a, b) => a + b.remainingAmountDZD, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
