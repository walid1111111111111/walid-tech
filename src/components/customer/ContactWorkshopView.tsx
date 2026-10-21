import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

export const ContactWorkshopView: React.FC = () => {
  const { settings, setActiveCustomerTab } = useApp();

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* Workshop Banner */}
      <div className="bg-gradient-to-br from-[#0B4F9E] to-[#083A75] text-white rounded-3xl p-6 sm:p-10 shadow-lg text-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center mx-auto mb-4 border border-white/20">
          <img src="/icon.svg" alt="PVC" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">{settings.workshopName}</h1>
        <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto mt-2 leading-relaxed">
          متخصصون في تصنيع وتركيب أرقى نوافذ وأبواب الـ PVC العازلة للصوت والحرارة ومقاومة عوامل الطقس مع ضمان رسمي ودقة متناهية.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <a
            href={`tel:${settings.phone}`}
            className="py-2.5 px-5 rounded-xl bg-white text-[#0B4F9E] font-bold text-xs sm:text-sm hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <Phone className="w-4 h-4" />
            <span>اتصل بنا مباشرة: {settings.phone}</span>
          </a>
          <a
            href={`https://wa.me/?text=مرحباً، أود الاستفسار حول نوافذ وأبواب الـ PVC`}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 px-5 rounded-xl bg-[#1E9E5A] text-white font-bold text-xs sm:text-sm hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>محادثة واتساب</span>
          </a>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B4F9E] flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-[#10161F]">الموقع والمقر</h3>
          <p className="text-xs text-[#5B6675] leading-relaxed">
            {settings.address} - ولاية {settings.wilaya}
          </p>
          <span className="text-[11px] text-[#0B4F9E] font-semibold block">
            نغطي كافة بلديات الولاية والولايات المجاورة
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1E9E5A] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-[#10161F]">مواعيد العمل واستقبال الزبائن</h3>
          <p className="text-xs text-[#5B6675] leading-relaxed">
            السبت إلى الخميس: 08:00 صباحاً - 17:30 مساءً
            <br />
            الجمعة: عطلة أسبوعية (المعاينة بالمواعيد المسبقة)
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#DDE3EA] shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-[#10161F]">الضمان والجودة الرسمية</h3>
          <p className="text-xs text-[#5B6675] leading-relaxed">
            {settings.warrantyAndTerms}
          </p>
          <span className="text-[10px] text-gray-400 block">{settings.taxRegistrationNumber}</span>
        </div>
      </div>

      {/* Workshop Advantages */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DDE3EA] shadow-xs space-y-4">
        <h3 className="font-extrabold text-lg text-[#10161F]">لماذا تختار نوافذ وأبواب الورشة؟</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#5B6675]">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#1E9E5A] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#10161F] block text-sm mb-0.5">عزل تام للصوت والحرارة</strong>
              بروفيل PVC متعدد الغرف يقلل فاتورة التدفئة والتكييف بنسبة تصل إلى 45%.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#1E9E5A] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#10161F] block text-sm mb-0.5">تقوية حديدية مجلفنة داخلية</strong>
              مقاومة عالية للرياح ولا ينثني أو يتغير شكله مع مرور السنوات.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#1E9E5A] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#10161F] block text-sm mb-0.5">إكسسوارات أوروبية وإغلاق محكم</strong>
              مقابض وأقفال متعددة النقاط ومطاط EPDM مضاد لتسرب المياه والغبار.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#1E9E5A] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#10161F] block text-sm mb-0.5">فريق تركيب محترف وضمان 10 سنوات</strong>
              معاينة ميدانية وتثبيت بأحدث أدوات القياس بالليزر لضمان عزل مثالي.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
