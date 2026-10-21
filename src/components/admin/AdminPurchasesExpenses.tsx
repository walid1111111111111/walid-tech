import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDZD } from '../../utils/calculator';
import { Supplier, WorkshopExpense } from '../../types';
import {
  Truck,
  Plus,
  DollarSign,
  Users,
  Building,
  Zap,
  Wrench,
  Fuel,
  Trash2,
  Phone,
  CheckCircle2,
} from 'lucide-react';

export const AdminPurchasesExpenses: React.FC = () => {
  const {
    suppliers,
    addSupplier,
    updateSupplier,
    expenses,
    addExpense,
    deleteExpense,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'expenses' | 'suppliers'>('expenses');

  // New Expense state
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<WorkshopExpense['category']>('wages');
  const [expenseLabel, setExpenseLabel] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');

  // New Supplier state
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supMaterial, setSupMaterial] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supPayable, setSupPayable] = useState<number>(0);

  const totalExpenses = expenses.reduce((a, b) => a + b.amountDZD, 0);
  const totalPayableToSuppliers = suppliers.reduce((a, b) => a + b.balancePayableDZD, 0);

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0) return;

    const categoryNames: Record<WorkshopExpense['category'], string> = {
      wages: 'عمالة وأجور الفنيين',
      electricity: 'كهرباء وطاقة Sonelgaz',
      rent: 'إيجار مستودع الورشة',
      transport: 'وقود ونقل وتركيب',
      maintenance: 'صيانة آلات التلحيم والقص',
      other: 'مصاريف أخرى',
    };

    addExpense({
      category: expenseCategory,
      categoryLabel: expenseLabel || categoryNames[expenseCategory],
      amountDZD: expenseAmount,
      date: expenseDate,
      notes: expenseNotes,
    });

    setShowAddExpense(false);
    setExpenseAmount(0);
    setExpenseLabel('');
    setExpenseNotes('');
  };

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName) return;

    addSupplier({
      name: supName,
      phone: supPhone,
      materialType: supMaterial || 'مواد أولية PVC وزجاج',
      address: supAddress,
      balancePayableDZD: supPayable,
      balanceReceivableDZD: 0,
    });

    setShowAddSupplier(false);
    setSupName('');
    setSupPhone('');
    setSupMaterial('');
    setSupPayable(0);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#10161F]">المشتريات والمصروفات وحسابات الموردين</h1>
          <p className="text-xs text-[#5B6675]">
            تتبع نفقات الورشة الشهرية، أجور العمال، فواتير الكهرباء، وأرصدة موردي البروفيل والزجاج.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'expenses' ? (
            <button
              onClick={() => setShowAddExpense(true)}
              className="py-2.5 px-4 rounded-xl bg-[#0B4F9E] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل مصروف جديد</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddSupplier(true)}
              className="py-2.5 px-4 rounded-xl bg-[#0B4F9E] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مورد جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-[#DDE3EA] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#5B6675]">إجمالي المصاريف المسجلة:</span>
            <div className="text-2xl font-black text-amber-700 mt-1">{formatDZD(totalExpenses)}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#DDE3EA] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#5B6675]">مستحقات الموردين (ما على الورشة):</span>
            <div className="text-2xl font-black text-[#D62F3A] mt-1">{formatDZD(totalPayableToSuppliers)}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#D62F3A] flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#DDE3EA] pb-2">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'expenses'
              ? 'bg-[#0B4F9E] text-white shadow-xs'
              : 'bg-white border border-[#DDE3EA] text-[#5B6675]'
          }`}
        >
          المصاريف التشغيلية للورشة ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'suppliers'
              ? 'bg-[#0B4F9E] text-white shadow-xs'
              : 'bg-white border border-[#DDE3EA] text-[#5B6675]'
          }`}
        >
          حسابات الموردين ({suppliers.length})
        </button>
      </div>

      {/* Expenses Table */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-3xl border border-[#DDE3EA] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-[#F8FAFC] text-[#5B6675] border-b border-[#DDE3EA]">
                <tr>
                  <th className="py-3 px-4 font-bold">بند المصروف</th>
                  <th className="py-3 px-4 font-bold">الفئة</th>
                  <th className="py-3 px-4 font-bold">التاريخ</th>
                  <th className="py-3 px-4 font-bold">المبلغ</th>
                  <th className="py-3 px-4 font-bold">ملاحظات</th>
                  <th className="py-3 px-4 font-bold text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-bold text-[#10161F]">{exp.categoryLabel}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700 font-semibold">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#5B6675]">{exp.date}</td>
                    <td className="py-3 px-4 font-black text-amber-700 text-sm">{formatDZD(exp.amountDZD)}</td>
                    <td className="py-3 px-4 text-[#5B6675] text-[11px]">{exp.notes || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppliers Table */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map(sup => (
            <div key={sup.id} className="bg-white rounded-3xl p-5 border border-[#DDE3EA] shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-black text-base text-[#10161F]">{sup.name}</h4>
                  <span className="text-xs text-[#5B6675] flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-[#0B4F9E]" />
                    <span>{sup.phone}</span>
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0B4F9E] flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-gray-100 text-xs space-y-1">
                <span className="text-[#5B6675] block">نوع المواد: {sup.materialType}</span>
                <span className="text-[#5B6675] block">{sup.address}</span>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#5B6675] block text-[11px]">مستحق للمورد:</span>
                  <strong className="text-sm font-black text-[#D62F3A]">
                    {formatDZD(sup.balancePayableDZD)}
                  </strong>
                </div>

                <button
                  onClick={() => {
                    const newBal = prompt('تحديث رصيد المورد المستحق (دج):', String(sup.balancePayableDZD));
                    if (newBal !== null) {
                      updateSupplier({ ...sup, balancePayableDZD: Number(newBal) || 0 });
                    }
                  }}
                  className="py-1 px-2.5 rounded-lg border border-gray-300 hover:bg-gray-100 font-bold text-[11px]"
                >
                  تعديل الرصيد
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-[#10161F]">تسجيل مصروف جديد</h3>
            <form onSubmit={handleAddExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#10161F] mb-1">نوع المصروف:</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA] font-semibold"
                >
                  <option value="wages">أجور وعمالة الفنيين</option>
                  <option value="electricity">كهرباء وطاقة Sonelgaz</option>
                  <option value="rent">إيجار الورشة / المستودع</option>
                  <option value="transport">وقود وشاحنة النقل للتركيب</option>
                  <option value="maintenance">صيانة آلات ومعدات الـ PVC</option>
                  <option value="other">مصاريف أخرى</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#10161F] mb-1">بيان المصروف:</label>
                <input
                  type="text"
                  value={expenseLabel}
                  onChange={(e) => setExpenseLabel(e.target.value)}
                  placeholder="مثال: أجر أسبوعي لفني التلحيم"
                  className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#10161F] mb-1">المبلغ (دج):</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={expenseAmount || ''}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  placeholder="أدخل المبلغ"
                  className="w-full text-base font-black py-2 px-3 rounded-xl border border-[#DDE3EA]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#10161F] mb-1">التاريخ:</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0B4F9E] text-white font-bold"
                >
                  حفظ المصروف
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-[#10161F]">إضافة مورد جديد</h3>
            <form onSubmit={handleAddSupplierSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#10161F] mb-1">اسم الشركة أو المورد: *</label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="شركة الأندلس للبروفيل..."
                  className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#10161F] mb-1">رقم الهاتف:</label>
                <input
                  type="tel"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  placeholder="05 / 06 / 07 ..."
                  className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#10161F] mb-1">نوع المواد الموردة:</label>
                <input
                  type="text"
                  value={supMaterial}
                  onChange={(e) => setSupMaterial(e.target.value)}
                  placeholder="بروفيل، زجاج مزدوج، إكسسوارات..."
                  className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#10161F] mb-1">الرصيد المستحق الأولي (دج):</label>
                <input
                  type="number"
                  value={supPayable || ''}
                  onChange={(e) => setSupPayable(Number(e.target.value))}
                  placeholder="0"
                  className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0B4F9E] text-white font-bold"
                >
                  حفظ المورد
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSupplier(false)}
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
