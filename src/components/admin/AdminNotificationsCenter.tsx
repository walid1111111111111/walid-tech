import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Send, CheckCircle2, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';

export const AdminNotificationsCenter: React.FC = () => {
  const { notifications, sendNotification, markAllNotificationsRead } = useApp();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState<'all' | 'customer' | 'owner'>('customer');
  const [notifType, setNotifType] = useState<'order_status' | 'promo' | 'system'>('promo');
  const [sentSuccessToast, setSentSuccessToast] = useState(false);

  // Ready templates (Section 6.7)
  const templates = [
    {
      label: 'تأكيد موعد المعاينة الميدانية',
      title: 'تأكيد موعد المعاينة وأخذ المقاسات',
      message: 'مرحباً، تم تحديد موعد المعاينة الميدانية لورشتكم غداً بعد صلاة العصر لضبط المقاسات بدقة.',
      type: 'order_status' as const,
    },
    {
      label: 'الطلبية جاهزة للتسليم والتركيب',
      title: 'طلبك جاهز للتسليم والتركيب!',
      message: 'يسرنا إعلامكم أن تصنيع النوافذ والأبواب قد اكتمل في الورشة، وفريق التركيب جاهز للانطلاق.',
      type: 'order_status' as const,
    },
    {
      label: 'عرض ترويجي على الزجاج المزدوج',
      title: 'عرض خاص: ترقية مجانية للزجاج العاكس',
      message: 'استفد من ترقية مجانية للزجاج العاكس للشمس لجميع الطلبات المؤكدة خلال هذا الأسبوع!',
      type: 'promo' as const,
    },
  ];

  const handleApplyTemplate = (tmpl: typeof templates[0]) => {
    setTitle(tmpl.title);
    setMessage(tmpl.message);
    setNotifType(tmpl.type);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    sendNotification({
      recipient,
      title,
      message,
      type: notifType,
    });

    setSentSuccessToast(true);
    setTimeout(() => setSentSuccessToast(false), 2500);

    setTitle('');
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#10161F]">مركز الإشعارات والتنبيهات</h1>
          <p className="text-xs text-[#5B6675]">
            إرسال إشعارات مباشرة لزبائن الورشة، تفعيل العروض الترويجية، ومتابعة سجل التنبيهات.
          </p>
        </div>

        <button
          onClick={markAllNotificationsRead}
          className="text-xs font-bold text-[#0B4F9E] hover:underline self-start"
        >
          تحديد الكل كمقروء
        </button>
      </div>

      {sentSuccessToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>تم إرسال الإشعار بنجاح! سيظهر في شريط إشعارات الزبون فوراً.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Send Notification Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-[#10161F] flex items-center gap-2">
            <Send className="w-4 h-4 text-[#0B4F9E]" />
            <span>إرسال إشعار جديد</span>
          </h3>

          {/* Quick Templates */}
          <div>
            <span className="text-[11px] font-bold text-[#5B6675] block mb-1.5">
              قوالب رسائل جاهزة وسريعة:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(t)}
                  className="text-[11px] font-semibold bg-gray-50 hover:bg-blue-50 hover:text-[#0B4F9E] text-gray-700 px-3 py-1.5 rounded-xl border border-gray-200 transition-all text-right"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-3 pt-2 text-xs">
            <div>
              <label className="block font-bold text-[#10161F] mb-1">المستلم:</label>
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value as any)}
                className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA] font-semibold"
              >
                <option value="customer">الزبائن الحاليين</option>
                <option value="all">جميع المستخدمين والزوار</option>
                <option value="owner">المالك وفريق الورشة</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#10161F] mb-1">عنوان الإشعار: *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان موجز وواضح..."
                className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA] font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-[#10161F] mb-1">نص الرسالة: *</label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب رسالة الإشعار هنا..."
                className="w-full py-2 px-3 rounded-xl border border-[#DDE3EA] leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#0B4F9E] hover:bg-[#083A75] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Send className="w-4 h-4" />
              <span>إرسال التنبيه الآن</span>
            </button>
          </form>
        </div>

        {/* Recent Notifications Log */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-[#10161F] flex items-center justify-between">
            <span>سجل الإشعارات ({notifications.length})</span>
            <span className="text-xs text-[#5B6675]">الأحدث أولاً</span>
          </h3>

          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border text-xs space-y-1 transition-all ${
                  n.isRead ? 'border-gray-100 bg-[#F8FAFC]' : 'border-blue-200 bg-blue-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <strong className="text-[#10161F] font-bold">{n.title}</strong>
                  <span className="text-[10px] text-gray-400 shrink-0">{n.timestamp}</span>
                </div>
                <p className="text-[#5B6675] text-[11px] leading-relaxed">{n.message}</p>
                <div className="text-[10px] text-[#0B4F9E] font-semibold pt-1">
                  الموجه إلى: {n.recipient === 'owner' ? 'المالك' : n.recipient === 'customer' ? 'الزبون' : 'الكل'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
