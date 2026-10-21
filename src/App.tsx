import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { PwaInstallBanner } from './components/common/PwaInstallBanner';
import { CalculatorView } from './components/customer/CalculatorView';
import { QuoteBasketView } from './components/customer/QuoteBasketView';
import { CustomerOrdersView } from './components/customer/CustomerOrdersView';
import { SavedQuotesView } from './components/customer/SavedQuotesView';
import { ContactWorkshopView } from './components/customer/ContactWorkshopView';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminOrders } from './components/admin/AdminOrders';
import { AdminPricingProducts } from './components/admin/AdminPricingProducts';
import { AdminTechnicalRules } from './components/admin/AdminTechnicalRules';
import { AdminPurchasesExpenses } from './components/admin/AdminPurchasesExpenses';
import { AdminReports } from './components/admin/AdminReports';
import { AdminNotificationsCenter } from './components/admin/AdminNotificationsCenter';
import { AdminSettings } from './components/admin/AdminSettings';
import { NotificationsModal } from './components/customer/NotificationsModal';
import { PrintableQuoteModal } from './components/printable/PrintableQuoteModal';
import { PrintableOrderModal } from './components/printable/PrintableOrderModal';

const AppContent: React.FC = () => {
  const {
    role,
    activeCustomerTab,
    activeAdminTab,
    printableQuoteModalData,
    setPrintableQuoteModalData,
    printableOrderModalData,
    setPrintableOrderModalData,
  } = useApp();

  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#F3F6FA] flex flex-col antialiased text-[#10161F] pb-16 md:pb-0">
      {/* App Header */}
      <Header onOpenNotifications={() => setShowNotificationsModal(true)} />

      {/* PWA Install Banner */}
      <PwaInstallBanner />

      {/* Role-based Content */}
      {role === 'customer' ? (
        <main className="flex-1">
          {activeCustomerTab === 'calculator' && <CalculatorView />}
          {activeCustomerTab === 'basket' && <QuoteBasketView />}
          {activeCustomerTab === 'orders' && <CustomerOrdersView />}
          {activeCustomerTab === 'saved_quotes' && <SavedQuotesView />}
          {activeCustomerTab === 'contact' && <ContactWorkshopView />}
          <BottomNav />
        </main>
      ) : (
        <AdminLayout>
          {activeAdminTab === 'dashboard' && <AdminDashboard />}
          {activeAdminTab === 'orders' && <AdminOrders />}
          {activeAdminTab === 'pricing' && <AdminPricingProducts />}
          {activeAdminTab === 'tech_rules' && <AdminTechnicalRules />}
          {activeAdminTab === 'purchases' && <AdminPurchasesExpenses />}
          {activeAdminTab === 'reports' && <AdminReports />}
          {activeAdminTab === 'notifications' && <AdminNotificationsCenter />}
          {activeAdminTab === 'settings' && <AdminSettings />}
        </AdminLayout>
      )}

      {/* Common Footer in Customer Mode */}
      {role === 'customer' && (
        <footer className="no-print bg-white border-t border-[#DDE3EA] py-6 px-4 text-center text-xs text-[#5B6675]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              © {new Date().getFullYear()} تطبيق تسعير ومقايسة نوافذ وأبواب PVC • جميع الحسابات مطابقة لدفتر الشروط والمواصفات الفنية
            </p>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-[#0B4F9E]">
              <span>العملة: الدينار الجزائري (دج)</span>
              <span>•</span>
              <span>تطبيق ويب تقدمي (PWA)</span>
            </div>
          </div>
        </footer>
      )}

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />

      {/* Printable Quote Devis Modal */}
      <PrintableQuoteModal
        quote={printableQuoteModalData}
        onClose={() => setPrintableQuoteModalData(null)}
      />

      {/* Printable Workshop BOM Order Modal */}
      <PrintableOrderModal
        order={printableOrderModalData}
        onClose={() => setPrintableOrderModalData(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
