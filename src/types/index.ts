export type Unit = 'cm' | 'mm';

export type Role = 'customer' | 'owner';

export type ModelCategory = 'window' | 'door' | 'facade' | 'shutter' | 'accessory';

export type ModelOpeningType = 
  | 'sliding'        // نافذة جرارة / منزلقة
  | 'casement'       // نافذة مفصلية فتح عادي
  | 'tilt_turn'      // نافذة قلاب Tilt & Turn
  | 'fixed'          // واجهة ثابتة
  | 'door_casement'  // باب مفصلي
  | 'door_sliding'   // باب منزلق
  | 'shutter'        // شتر رولو
  | 'accessory';     // ملحقات

export interface Model {
  id: string;
  name: string;
  nameFr?: string;
  categoryId: ModelCategory;
  categoryName: string;
  openingType: ModelOpeningType;
  minWidth: number; // in cm
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  allowedSashes: number[]; // e.g. [1, 2, 3, 4]
  defaultSashes: number;
  basePriceSqm: number; // DZD per m2
  fixedPrice?: number;  // For fixed price items like specific doors
  priceType: 'sqm' | 'fixed';
  description: string;
  isActive: boolean;
}

export interface ProfileSeries {
  id: string;
  name: string;
  nameFr?: string;
  tier: 'eco' | 'standard' | 'premium';
  pricePerSqmExtra: number; // DZD addition
  costFactor: number;       // multiplier for cost
  frameDepthMm: number;     // e.g. 60mm, 70mm, 80mm
  glassDeductionMm: number; // deduction from sash frame to glass edge
  scrapRate: number;        // default 0.08 (8%)
  description: string;
}

export interface ProfileColor {
  id: string;
  name: string;
  nameFr?: string;
  hex: string;
  secondaryHex?: string;
  priceMarkupPercent: number; // % markup e.g. 0% for white, 15% for woodgrain
  texture?: 'smooth' | 'woodgrain' | 'matte';
}

export interface GlassType {
  id: string;
  name: string;
  nameFr?: string;
  pricePerSqm: number; // selling price
  costPerSqm: number;  // purchase cost for owner
  thickness: string;
  description: string;
}

export interface AccessoryOption {
  id: string;
  name: string;
  nameFr?: string;
  calcType: 'fixed' | 'sqm' | 'linear_meter';
  price: number;
  cost: number;
  description: string;
}

// Technical Bill of Materials (BOM) breakdown for an item
export interface TechnicalBOM {
  frameLengthM: number;       // بروفيل الحلق 2*(W+H)
  sashLengthM: number;        // بروفيل الضلفة 2*(sashW + sashH)*N
  mullionLengthM: number;     // بروفيل القائم الأوسط (N-1)*H
  totalProfileNetM: number;   // إجمالي طول البروفيل الصافي
  totalProfileGrossM: number; // بعد إضافة نسبة الهدر (مثل 8%)
  barsRequired6m: number;     // عدد القضبان الكاملة (6 م)
  scrapWasteM: number;        // بقايا القطع الصافية
  steelReinforcementM: number;// حديد التقوية المعدنية
  glassAreaSqm: number;       // مساحة الزجاج الصافية لجميع الضلف
  glassCutDimensions: { widthCm: number; heightCm: number; quantity: number };
  gasketsLengthM: number;     // أمتار جوانات المطاط
  hingesCount: number;        // عدد المفصلات
  locksHandlesCount: number;  // الأقفال والمقابض
  rollersCount: number;       // عجلات الجرار
  screwsAndAccessoriesCost: number; // تكلفة البراغي والسيليكون
  totalMaterialCostDZD: number;     // تكلفة المواد الإجمالية للمالك
  estimatedProfitDZD: number;       // الربح التقديري للمالك
}

export type SashFunction = 'OB' | 'OF' | 'FIX' | 'SLIDE';

export interface SashConfig {
  id: number;
  type: SashFunction;
  openingSide?: 'left' | 'right';
  hasMoustiquaire?: boolean;
}

export interface QuoteItem {
  id: string;
  modelId: string;
  modelName: string;
  openingType: ModelOpeningType;
  sashes: number;
  sashConfigs?: SashConfig[];
  width: number;  // in unit
  height: number; // in unit
  unit: Unit;
  quantity: number;
  seriesId: string;
  seriesName: string;
  colorId: string;
  colorName: string;
  colorHex: string;
  glassTypeId: string;
  glassTypeName: string;
  selectedOptionIds: string[];
  selectedOptionNames: string[];
  // Calculated values (Snapshot)
  areaSqm: number;
  accountingAreaSqm: number;
  unitPriceDZD: number;
  itemSubtotalDZD: number;
  technicalBOM: TechnicalBOM; // Private to owner
  note?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  createdAt: string;
  validUntil: string;
  status: 'draft' | 'saved' | 'sent' | 'converted';
  customerName?: string;
  customerPhone?: string;
  customerWilaya?: string;
  items: QuoteItem[];
  subtotalDZD: number;
  discountDZD: number;
  discountPercent?: number;
  discountReason?: string;
  tvaEnabled: boolean;
  tvaRate: number;
  tvaAmountDZD: number;
  installationDeliveryFeeDZD: number;
  grandTotalDZD: number;
  notes?: string;
}

export type OrderStatus =
  | 'new'            // جديد
  | 'reviewing'      // قيد المراجعة
  | 'inspected'      // تمت المعاينة
  | 'confirmed'      // مؤكد
  | 'fabrication'    // قيد التصنيع
  | 'ready'          // جاهز
  | 'installed'      // تم التركيب
  | 'cancelled';     // ملغى

export interface OrderPayment {
  id: string;
  amountDZD: number;
  date: string;
  method: 'cash' | 'ccp_baridimob' | 'bank_check';
  reference?: string;
  note?: string;
}

export interface OrderMessage {
  id: string;
  sender: 'customer' | 'owner';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  quoteId?: string;
  customerName: string;
  customerPhone: string;
  customerWilaya: string;
  customerAddress: string;
  wantsInspectionVisit: boolean;
  customerNotes?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: QuoteItem[];
  subtotalDZD: number;
  discountDZD: number;
  discountReason?: string;
  tvaAmountDZD: number;
  deliveryInstallationFeeDZD: number;
  grandTotalDZD: number;
  paidAmountDZD: number;
  remainingAmountDZD: number;
  payments: OrderPayment[];
  messages: OrderMessage[];
  // Technical & financial summary for owner
  totalMaterialCostDZD: number;
  projectedNetProfitDZD: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  materialType: string;
  address: string;
  balancePayableDZD: number;   // ما على الورشة للمورد
  balanceReceivableDZD: number;// ما للمورد على الورشة
}

export interface MaterialPurchase {
  id: string;
  supplierId: string;
  supplierName: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPriceDZD: number;
  totalPriceDZD: number;
  date: string;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  linkedOrderId?: string;
  notes?: string;
}

export interface WorkshopExpense {
  id: string;
  category: 'wages' | 'electricity' | 'rent' | 'transport' | 'maintenance' | 'other';
  categoryLabel: string;
  amountDZD: number;
  date: string;
  notes: string;
}

export interface NotificationItem {
  id: string;
  recipient: 'customer' | 'owner' | 'all';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'order_status' | 'new_order' | 'message' | 'promo' | 'system';
  orderId?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface WorkshopSettings {
  workshopName: string;
  logoUrl: string;
  phone: string;
  email: string;
  address: string;
  wilaya: string;
  taxRegistrationNumber: string; // NIF / NIS / RC
  currency: string;
  defaultUnit: Unit;
  tvaEnabled: boolean;
  tvaRate: number;
  minBillableAreaSqm: number;
  standardBarLengthM: number;
  scrapWastePercentage: number;
  quoteValidityDays: number;
  legalDisclaimer: string;
  warrantyAndTerms: string;
}
