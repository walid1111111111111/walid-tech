import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  ClipboardList,
  DollarSign,
  Ruler,
  Truck,
  TrendingUp,
  Bell,
  Settings,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const {
    activeAdminTab,
    setActiveAdminTab,
    setRole,
    orders,
    notifications,
    settings,
  } = useApp();

  const newOrdersCount = orders.filter(o => o.status === 'new').length;
  const unreadNotifs = notifications.filter(n => !n.isRead && n.recipient !== 'customer').length;

  const navItems = [
    { id: 'dashboard' as const, label: 'لوحة التحكم (Dashboard)', icon: LayoutDashboard },
    { id: 'orders' as const, label: 'إدارة الطلبات والمقايسة', icon: ClipboardList, badge: newOrdersCount },
    { id: 'pricing' as const, label: 'الأسعار والمنتجات', icon: DollarSign },
    { id: 'tech_rules' as const, label: 'القواعد الفنية والـ BOM', icon: Ruler },
    { id: 'purchases' as const, label: 'المشتريات والمصاريف', icon: Truck },
    { id: 'reports' as const, label: 'الأرباح والإحصائيات', icon: TrendingUp },
    { id: 'notifications' as const, label: 'مركز الإشعارات', icon: Bell, badge: unreadNotifs },
    { id: 'settings' as const, label: 'إعدادات الورشة', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F3F6FA] flex flex-col">
      {/* Top Admin Sub-bar */}
      <div className="bg-[#083A75] text-white px-4 py-2 text-xs flex items-center justify-between border-b border-blue-900">
        <div className="flex items-center gap-2 font-bold">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>منطقة المالك الإدارية السرية</span>
          <span className="text-gray-300 font-normal hidden sm:inline">|</span>
          <span className="text-blue-200 text-[11px] hidden sm:inline">
            الكميات الفنية والتكاليف وأرباح الورشة محمية ولا تظهر للزبائن
          </span>
        </div>
        <button
          onClick={() => setRole('customer')}
          className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-white font-bold text-xs flex items-center gap-1.5 transition-all"
        >
          <span>العودة لواجهة الزبون</span>
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Admin Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          <div className="bg-white p-4 rounded-3xl border border-[#DDE3EA] shadow-xs space-y-1">
            <div className="text-[11px] font-bold text-[#5B6675] px-3 py-1 uppercase tracking-wider">
              لوحة الإدارة
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveAdminTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#0B4F9E] text-white shadow-md'
                      : 'text-[#5B6675] hover:bg-[#F3F6FA] hover:text-[#10161F]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        isActive ? 'bg-white text-[#0B4F9E]' : 'bg-[#D62F3A] text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick info card */}
          <div className="p-4 rounded-3xl bg-blue-50/70 border border-blue-100 text-xs text-[#0B4F9E] space-y-1">
            <span className="font-extrabold block">{settings.workshopName}</span>
            <span className="text-[11px] text-[#5B6675] block">الهاتف: {settings.phone}</span>
            <span className="text-[11px] text-[#5B6675] block">الولاية: {settings.wilaya}</span>
          </div>
        </aside>

        {/* Admin Tab Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
