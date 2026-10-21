import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, X, CheckCheck, Clock, Tag, MessageSquare, ClipboardList } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    role,
    markNotificationRead,
    markAllNotificationsRead,
    setActiveCustomerTab,
    setActiveAdminTab,
  } = useApp();

  if (!isOpen) return null;

  const relevantNotifications = notifications.filter(n => {
    if (role === 'owner') return n.recipient !== 'customer';
    return n.recipient !== 'owner';
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_status':
        return <ClipboardList className="w-4 h-4 text-blue-600" />;
      case 'promo':
        return <Tag className="w-4 h-4 text-emerald-600" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#DDE3EA] space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0B4F9E] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#10161F]">مركز الإشعارات</h3>
              <p className="text-[11px] text-[#5B6675]">
                {relevantNotifications.filter(n => !n.isRead).length} غير مقروء
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={markAllNotificationsRead}
              className="p-1.5 rounded-lg text-gray-500 hover:text-[#0B4F9E] text-xs font-semibold flex items-center gap-1"
              title="تحديد الكل كمقروء"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="text-[10px]">قراءة الكل</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
          {relevantNotifications.length === 0 ? (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs">لا توجد إشعارات حالياً.</p>
            </div>
          ) : (
            relevantNotifications.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id);
                  if (n.orderId) {
                    if (role === 'customer') setActiveCustomerTab('orders');
                    else setActiveAdminTab('orders');
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-2xl border text-xs space-y-1 cursor-pointer transition-all ${
                  n.isRead
                    ? 'border-gray-100 bg-[#F8FAFC] opacity-80'
                    : 'border-blue-200 bg-blue-50/60 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white shadow-xs shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <strong className="text-[#10161F] font-bold text-xs">{n.title}</strong>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{n.timestamp}</span>
                </div>
                <p className="text-[#5B6675] text-[11px] leading-relaxed pr-8">{n.message}</p>
                {n.orderId && (
                  <span className="text-[10px] text-[#0B4F9E] font-bold block pr-8 mt-1">
                    انقر للانتقال لتفاصيل الطلب ←
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
