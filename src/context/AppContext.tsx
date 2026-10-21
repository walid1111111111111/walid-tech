import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Role,
  Model,
  ProfileSeries,
  ProfileColor,
  GlassType,
  AccessoryOption,
  WorkshopSettings,
  Supplier,
  WorkshopExpense,
  NotificationItem,
  Order,
  OrderStatus,
  OrderPayment,
  OrderMessage,
  AuditLogItem,
  Quote,
  QuoteItem,
} from '../types';
import {
  initialModels,
  initialSeries,
  initialColors,
  initialGlassTypes,
  initialOptions,
  initialSettings,
  initialSuppliers,
  initialExpenses,
  initialNotifications,
  initialOrders,
  initialAuditLogs,
} from '../data/initialData';

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  activeCustomerTab: 'calculator' | 'basket' | 'orders' | 'saved_quotes' | 'contact';
  setActiveCustomerTab: (tab: 'calculator' | 'basket' | 'orders' | 'saved_quotes' | 'contact') => void;
  activeAdminTab: 'dashboard' | 'orders' | 'pricing' | 'tech_rules' | 'purchases' | 'reports' | 'notifications' | 'settings';
  setActiveAdminTab: (tab: 'dashboard' | 'orders' | 'pricing' | 'tech_rules' | 'purchases' | 'reports' | 'notifications' | 'settings') => void;

  models: Model[];
  series: ProfileSeries[];
  colors: ProfileColor[];
  glassTypes: GlassType[];
  options: AccessoryOption[];
  settings: WorkshopSettings;
  suppliers: Supplier[];
  expenses: WorkshopExpense[];
  orders: Order[];
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];

  // Active Quote / Basket
  currentQuote: Quote;
  addItemToQuote: (item: QuoteItem) => void;
  updateQuoteItem: (item: QuoteItem) => void;
  removeQuoteItem: (itemId: string) => void;
  clearQuote: () => void;
  applyQuoteDiscount: (discountDZD: number, reason?: string) => void;
  setDeliveryInstallationFee: (fee: number) => void;
  savedQuotes: Quote[];
  saveCurrentQuote: () => void;
  loadSavedQuote: (quote: Quote) => void;
  deleteSavedQuote: (quoteId: string) => void;

  // Order Operations
  createOrderFromQuote: (customerInfo: {
    name: string;
    phone: string;
    wilaya: string;
    address: string;
    inspectionVisit: boolean;
    notes?: string;
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addPaymentToOrder: (orderId: string, payment: Omit<OrderPayment, 'id'>) => void;
  addMessageToOrder: (orderId: string, text: string, sender: 'customer' | 'owner') => void;
  adjustOrderPrice: (orderId: string, discountDZD: number, reason: string) => void;

  // Catalog & Pricing Management (Admin)
  updateModel: (model: Model) => void;
  toggleModelActive: (modelId: string) => void;
  updateSeriesItem: (seriesItem: ProfileSeries) => void;
  updateColorItem: (colorItem: ProfileColor) => void;
  updateGlassItem: (glassItem: GlassType) => void;
  updateOptionItem: (optionItem: AccessoryOption) => void;
  batchAdjustPrices: (percentage: number, target: 'all' | 'windows' | 'doors' | 'glass') => void;

  // Suppliers & Expenses
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  addExpense: (expense: Omit<WorkshopExpense, 'id'>) => void;
  deleteExpense: (expenseId: string) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  sendNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => void;

  // Settings & Utilities
  updateSettings: (newSettings: Partial<WorkshopSettings>) => void;
  resetAllData: () => void;
  selectedOrderForModal: Order | null;
  setSelectedOrderForModal: (order: Order | null) => void;
  printableQuoteModalData: Quote | null;
  setPrintableQuoteModalData: (quote: Quote | null) => void;
  printableOrderModalData: Order | null;
  setPrintableOrderModalData: (order: Order | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PREFIX = 'pvc_workshop_app_v1_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Error loading ${key} from localStorage:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role>(() => loadFromStorage<Role>('role', 'customer'));
  const [activeCustomerTab, setActiveCustomerTab] = useState<'calculator' | 'basket' | 'orders' | 'saved_quotes' | 'contact'>('calculator');
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'orders' | 'pricing' | 'tech_rules' | 'purchases' | 'reports' | 'notifications' | 'settings'>('dashboard');

  const [models, setModels] = useState<Model[]>(() => loadFromStorage('models', initialModels));
  const [series, setSeries] = useState<ProfileSeries[]>(() => loadFromStorage('series', initialSeries));
  const [colors, setColors] = useState<ProfileColor[]>(() => loadFromStorage('colors', initialColors));
  const [glassTypes, setGlassTypes] = useState<GlassType[]>(() => loadFromStorage('glassTypes', initialGlassTypes));
  const [options, setOptions] = useState<AccessoryOption[]>(() => loadFromStorage('options', initialOptions));
  const [settings, setSettings] = useState<WorkshopSettings>(() => loadFromStorage('settings', initialSettings));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadFromStorage('suppliers', initialSuppliers));
  const [expenses, setExpenses] = useState<WorkshopExpense[]>(() => loadFromStorage('expenses', initialExpenses));
  const [orders, setOrders] = useState<Order[]>(() => {
    const loaded = loadFromStorage<Order[]>('orders', initialOrders);
    if (!Array.isArray(loaded)) return initialOrders;
    return loaded.map((ord: Order) => {
      const seen = new Set<string>();
      const sanitizedItems = (ord.items || []).map((it: QuoteItem, idx: number) => {
        if (!it.id || seen.has(it.id)) {
          const freshId = `item-ord-${ord.id}-${idx}-${Math.random().toString(36).substring(2, 8)}`;
          seen.add(freshId);
          return { ...it, id: freshId };
        }
        seen.add(it.id);
        return it;
      });
      return { ...ord, items: sanitizedItems };
    });
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadFromStorage('notifications', initialNotifications));
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => loadFromStorage('auditLogs', initialAuditLogs));
  const [savedQuotes, setSavedQuotes] = useState<Quote[]>(() => {
    const loaded = loadFromStorage<Quote[]>('savedQuotes', []);
    if (!Array.isArray(loaded)) return [];
    return loaded.map((q: Quote) => {
      const seen = new Set<string>();
      const sanitizedItems = (q.items || []).map((it: QuoteItem, idx: number) => {
        if (!it.id || seen.has(it.id)) {
          const freshId = `item-sq-${q.id}-${idx}-${Math.random().toString(36).substring(2, 8)}`;
          seen.add(freshId);
          return { ...it, id: freshId };
        }
        seen.add(it.id);
        return it;
      });
      return { ...q, items: sanitizedItems };
    });
  });

  // Current Working Quote
  const [currentQuote, setCurrentQuote] = useState<Quote>(() => {
    const defaultQuote: Quote = {
      id: `quote-${Date.now()}`,
      quoteNumber: `DEV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString(),
      status: 'draft',
      items: [],
      subtotalDZD: 0,
      discountDZD: 0,
      tvaEnabled: false,
      tvaRate: 19,
      tvaAmountDZD: 0,
      installationDeliveryFeeDZD: 0,
      grandTotalDZD: 0,
    };
    const loaded = loadFromStorage('currentQuote', defaultQuote);
    if (loaded && Array.isArray(loaded.items)) {
      const seen = new Set<string>();
      loaded.items = loaded.items.map((it, idx) => {
        if (!it.id || seen.has(it.id)) {
          const freshId = `item-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 8)}`;
          seen.add(freshId);
          return { ...it, id: freshId };
        }
        seen.add(it.id);
        return it;
      });
    }
    return loaded;
  });

  // Modal inspection states
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [printableQuoteModalData, setPrintableQuoteModalData] = useState<Quote | null>(null);
  const [printableOrderModalData, setPrintableOrderModalData] = useState<Order | null>(null);

  // Sync to storage
  useEffect(() => saveToStorage('role', role), [role]);
  useEffect(() => saveToStorage('models', models), [models]);
  useEffect(() => saveToStorage('series', series), [series]);
  useEffect(() => saveToStorage('colors', colors), [colors]);
  useEffect(() => saveToStorage('glassTypes', glassTypes), [glassTypes]);
  useEffect(() => saveToStorage('options', options), [options]);
  useEffect(() => saveToStorage('settings', settings), [settings]);
  useEffect(() => saveToStorage('suppliers', suppliers), [suppliers]);
  useEffect(() => saveToStorage('expenses', expenses), [expenses]);
  useEffect(() => saveToStorage('orders', orders), [orders]);
  useEffect(() => saveToStorage('notifications', notifications), [notifications]);
  useEffect(() => saveToStorage('auditLogs', auditLogs), [auditLogs]);
  useEffect(() => saveToStorage('savedQuotes', savedQuotes), [savedQuotes]);
  useEffect(() => saveToStorage('currentQuote', currentQuote), [currentQuote]);

  const addAudit = (action: string, details: string) => {
    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-DZ'),
      user: role === 'owner' ? 'المالك (Admin)' : 'الزبون (Customer)',
      action,
      details,
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 100)]);
  };

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    addAudit('تبديل الواجهة', `تم التبديل إلى واجهة: ${newRole === 'owner' ? 'المالك' : 'الزبون'}`);
  };

  // Recalculate Quote Totals helper
  const recalculateQuote = (quote: Quote, items: QuoteItem[]): Quote => {
    const subtotal = items.reduce((acc, it) => acc + it.itemSubtotalDZD, 0);
    const afterDiscount = Math.max(0, subtotal - quote.discountDZD);
    const tvaAmount = quote.tvaEnabled ? Math.round((afterDiscount * quote.tvaRate) / 100) : 0;
    const grandTotal = afterDiscount + tvaAmount + quote.installationDeliveryFeeDZD;

    return {
      ...quote,
      items,
      subtotalDZD: subtotal,
      tvaAmountDZD: tvaAmount,
      grandTotalDZD: grandTotal,
    };
  };

  const addItemToQuote = (item: QuoteItem) => {
    setCurrentQuote(prev => {
      const freshId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const freshItem = { ...item, id: freshId };
      const updatedItems = [...prev.items, freshItem];
      return recalculateQuote(prev, updatedItems);
    });
  };

  const updateQuoteItem = (item: QuoteItem) => {
    setCurrentQuote(prev => {
      const updatedItems = prev.items.map(it => it.id === item.id ? item : it);
      return recalculateQuote(prev, updatedItems);
    });
  };

  const removeQuoteItem = (itemId: string) => {
    setCurrentQuote(prev => {
      const updatedItems = prev.items.filter(it => it.id !== itemId);
      return recalculateQuote(prev, updatedItems);
    });
  };

  const clearQuote = () => {
    setCurrentQuote({
      id: `quote-${Date.now()}`,
      quoteNumber: `DEV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString(),
      status: 'draft',
      items: [],
      subtotalDZD: 0,
      discountDZD: 0,
      tvaEnabled: settings.tvaEnabled,
      tvaRate: settings.tvaRate,
      tvaAmountDZD: 0,
      installationDeliveryFeeDZD: 0,
      grandTotalDZD: 0,
    });
  };

  const applyQuoteDiscount = (discountDZD: number, reason?: string) => {
    setCurrentQuote(prev => {
      const subtotal = prev.items.reduce((acc, it) => acc + it.itemSubtotalDZD, 0);
      const safeDiscount = Math.min(discountDZD, subtotal);
      const afterDiscount = subtotal - safeDiscount;
      const tvaAmount = prev.tvaEnabled ? Math.round((afterDiscount * prev.tvaRate) / 100) : 0;
      const grandTotal = afterDiscount + tvaAmount + prev.installationDeliveryFeeDZD;

      return {
        ...prev,
        discountDZD: safeDiscount,
        discountReason: reason || prev.discountReason,
        subtotalDZD: subtotal,
        tvaAmountDZD: tvaAmount,
        grandTotalDZD: grandTotal,
      };
    });
  };

  const setDeliveryInstallationFee = (fee: number) => {
    setCurrentQuote(prev => {
      const grandTotal = Math.max(0, prev.subtotalDZD - prev.discountDZD) + prev.tvaAmountDZD + fee;
      return {
        ...prev,
        installationDeliveryFeeDZD: fee,
        grandTotalDZD: grandTotal,
      };
    });
  };

  const saveCurrentQuote = () => {
    if (currentQuote.items.length === 0) return;
    const existingIndex = savedQuotes.findIndex(q => q.id === currentQuote.id);
    if (existingIndex >= 0) {
      setSavedQuotes(prev => {
        const copy = [...prev];
        copy[existingIndex] = { ...currentQuote, status: 'saved' };
        return copy;
      });
    } else {
      setSavedQuotes(prev => [{ ...currentQuote, status: 'saved' }, ...prev]);
    }
  };

  const loadSavedQuote = (quote: Quote) => {
    setCurrentQuote(quote);
    setActiveCustomerTab('basket');
  };

  const deleteSavedQuote = (quoteId: string) => {
    setSavedQuotes(prev => prev.filter(q => q.id !== quoteId));
  };

  const createOrderFromQuote = (customerInfo: {
    name: string;
    phone: string;
    wilaya: string;
    address: string;
    inspectionVisit: boolean;
    notes?: string;
  }): Order => {
    const totalMatCost = currentQuote.items.reduce((acc, it) => {
      return acc + (it.technicalBOM.totalMaterialCostDZD * it.quantity);
    }, 0);

    const projectedProfit = Math.max(0, currentQuote.grandTotalDZD - totalMatCost);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `CMD-2026-${Math.floor(100 + Math.random() * 900)}`,
      quoteId: currentQuote.id,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      customerWilaya: customerInfo.wilaya,
      customerAddress: customerInfo.address,
      wantsInspectionVisit: customerInfo.inspectionVisit,
      customerNotes: customerInfo.notes,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: currentQuote.items.map((it, idx) => ({
        ...it,
        id: `ord-item-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 8)}`,
      })),
      subtotalDZD: currentQuote.subtotalDZD,
      discountDZD: currentQuote.discountDZD,
      discountReason: currentQuote.discountReason,
      tvaAmountDZD: currentQuote.tvaAmountDZD,
      deliveryInstallationFeeDZD: currentQuote.installationDeliveryFeeDZD,
      grandTotalDZD: currentQuote.grandTotalDZD,
      paidAmountDZD: 0,
      remainingAmountDZD: currentQuote.grandTotalDZD,
      payments: [],
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'customer',
          senderName: customerInfo.name,
          text: `مرحباً، أرسلت لكم هذا الطلب. ${customerInfo.inspectionVisit ? 'أرجو التنسيق لزيارة المعاينة.' : ''}`,
          timestamp: new Date().toISOString(),
        },
      ],
      totalMaterialCostDZD: totalMatCost,
      projectedNetProfitDZD: projectedProfit,
    };

    setOrders(prev => [newOrder, ...prev]);

    // Add in-app notification for owner
    sendNotification({
      recipient: 'owner',
      title: 'طلب جديد وارد!',
      message: `طلب رقم ${newOrder.orderNumber} من ${newOrder.customerName} بقيمة ${newOrder.grandTotalDZD.toLocaleString('ar-DZ')} دج`,
      type: 'new_order',
      orderId: newOrder.id,
    });

    addAudit('إنشاء طلب جديد', `تم إنشاء طلب جديد ${newOrder.orderNumber} من طرف ${newOrder.customerName}`);

    // Clear current active quote
    clearQuote();

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    let orderNum = '';
    let custName = '';
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id === orderId) {
          orderNum = ord.orderNumber;
          custName = ord.customerName;
          return {
            ...ord,
            status,
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      })
    );

    const statusArabicMap: Record<OrderStatus, string> = {
      new: 'جديد',
      reviewing: 'قيد المراجعة',
      inspected: 'تمت المعاينة',
      confirmed: 'مؤكد',
      fabrication: 'قيد التصنيع في الورشة',
      ready: 'جاهز للتسليم والتركيب',
      installed: 'تم التركيب بنجاح',
      cancelled: 'ملغى',
    };

    sendNotification({
      recipient: 'customer',
      title: `تحديث الطلب ${orderNum}`,
      message: `مرحباً ${custName}، تم تحديث حالة طلبك إلى: "${statusArabicMap[status]}"`,
      type: 'order_status',
      orderId,
    });

    addAudit('تحديث حالة طلب', `تغيير حالة الطلب ${orderNum} إلى ${statusArabicMap[status]}`);
  };

  const addPaymentToOrder = (orderId: string, payment: Omit<OrderPayment, 'id'>) => {
    const paymentObj: OrderPayment = {
      ...payment,
      id: `pay-${Date.now()}`,
    };

    setOrders(prev =>
      prev.map(ord => {
        if (ord.id === orderId) {
          const newPaid = ord.paidAmountDZD + paymentObj.amountDZD;
          const newRemaining = Math.max(0, ord.grandTotalDZD - newPaid);
          return {
            ...ord,
            paidAmountDZD: newPaid,
            remainingAmountDZD: newRemaining,
            payments: [...ord.payments, paymentObj],
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      })
    );

    addAudit('تسجيل دفعة', `تسجيل دفعة مالية بقيمة ${paymentObj.amountDZD.toLocaleString('ar-DZ')} دج`);
  };

  const addMessageToOrder = (orderId: string, text: string, sender: 'customer' | 'owner') => {
    const msg: OrderMessage = {
      id: `msg-${Date.now()}`,
      sender,
      senderName: sender === 'owner' ? settings.workshopName : 'الزبون',
      text,
      timestamp: new Date().toISOString(),
    };

    setOrders(prev =>
      prev.map(ord => {
        if (ord.id === orderId) {
          return {
            ...ord,
            messages: [...ord.messages, msg],
          };
        }
        return ord;
      })
    );

    // Notify the other party
    sendNotification({
      recipient: sender === 'owner' ? 'customer' : 'owner',
      title: 'رسالة جديدة في محادثة الطلب',
      message: text.slice(0, 70),
      type: 'message',
      orderId,
    });
  };

  const adjustOrderPrice = (orderId: string, discountDZD: number, reason: string) => {
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id === orderId) {
          const afterDiscount = Math.max(0, ord.subtotalDZD - discountDZD);
          const newGrandTotal = afterDiscount + ord.tvaAmountDZD + ord.deliveryInstallationFeeDZD;
          const newRemaining = Math.max(0, newGrandTotal - ord.paidAmountDZD);
          return {
            ...ord,
            discountDZD,
            discountReason: reason,
            grandTotalDZD: newGrandTotal,
            remainingAmountDZD: newRemaining,
            projectedNetProfitDZD: Math.max(0, newGrandTotal - ord.totalMaterialCostDZD),
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      })
    );

    addAudit('تعديل سعر طلب', `تطبيق خصم بقيمة ${discountDZD.toLocaleString('ar-DZ')} دج بسبب: ${reason}`);
  };

  // Catalog update methods
  const updateModel = (model: Model) => {
    setModels(prev => prev.map(m => m.id === model.id ? model : m));
    addAudit('تعديل نموذج', `تحديث بيانات وسعر نموذج ${model.name}`);
  };

  const toggleModelActive = (modelId: string) => {
    setModels(prev => prev.map(m => m.id === modelId ? { ...m, isActive: !m.isActive } : m));
  };

  const updateSeriesItem = (seriesItem: ProfileSeries) => {
    setSeries(prev => prev.map(s => s.id === seriesItem.id ? seriesItem : s));
    addAudit('تعديل سلسلة بروفيل', `تحديث مواصفات ${seriesItem.name}`);
  };

  const updateColorItem = (colorItem: ProfileColor) => {
    setColors(prev => prev.map(c => c.id === colorItem.id ? colorItem : c));
  };

  const updateGlassItem = (glassItem: GlassType) => {
    setGlassTypes(prev => prev.map(g => g.id === glassItem.id ? glassItem : g));
  };

  const updateOptionItem = (optionItem: AccessoryOption) => {
    setOptions(prev => prev.map(o => o.id === optionItem.id ? optionItem : o));
  };

  const batchAdjustPrices = (percentage: number, target: 'all' | 'windows' | 'doors' | 'glass') => {
    const factor = 1 + (percentage / 100);

    if (target === 'all' || target === 'windows' || target === 'doors') {
      setModels(prev =>
        prev.map(m => {
          const match = target === 'all' ||
            (target === 'windows' && m.categoryId === 'window') ||
            (target === 'doors' && m.categoryId === 'door');
          if (match) {
            return {
              ...m,
              basePriceSqm: Math.round(m.basePriceSqm * factor),
              fixedPrice: m.fixedPrice ? Math.round(m.fixedPrice * factor) : undefined,
            };
          }
          return m;
        })
      );
    }

    if (target === 'all' || target === 'glass') {
      setGlassTypes(prev =>
        prev.map(g => ({
          ...g,
          pricePerSqm: Math.round(g.pricePerSqm * factor),
        }))
      );
    }

    addAudit('تعديل جماعي للأسعار', `تطبيق تعديل نسبي بنسبة ${percentage}% على فئة ${target}`);
  };

  // Suppliers & Expenses
  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSup: Supplier = { ...supplier, id: `sup-${Date.now()}` };
    setSuppliers(prev => [...prev, newSup]);
    addAudit('إضافة مورد', `إضافة المورد ${newSup.name}`);
  };

  const updateSupplier = (supplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));
  };

  const addExpense = (expense: Omit<WorkshopExpense, 'id'>) => {
    const newExp: WorkshopExpense = { ...expense, id: `exp-${Date.now()}` };
    setExpenses(prev => [newExp, ...prev]);
    addAudit('تسجيل مصروف', `تسجيل مصروف ${newExp.categoryLabel}: ${newExp.amountDZD.toLocaleString('ar-DZ')} دج`);
  };

  const deleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const sendNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => {
    const notif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      timestamp: 'الآن',
      isRead: false,
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const updateSettings = (newSettings: Partial<WorkshopSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addAudit('تحديث الإعدادات', 'تم تعديل الإعدادات العامة للورشة');
  };

  const resetAllData = () => {
    localStorage.clear();
    setModels(initialModels);
    setSeries(initialSeries);
    setColors(initialColors);
    setGlassTypes(initialGlassTypes);
    setOptions(initialOptions);
    setSettings(initialSettings);
    setSuppliers(initialSuppliers);
    setExpenses(initialExpenses);
    setOrders(initialOrders);
    setNotifications(initialNotifications);
    setAuditLogs(initialAuditLogs);
    setSavedQuotes([]);
    clearQuote();
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        activeCustomerTab,
        setActiveCustomerTab,
        activeAdminTab,
        setActiveAdminTab,
        models,
        series,
        colors,
        glassTypes,
        options,
        settings,
        suppliers,
        expenses,
        orders,
        notifications,
        auditLogs,
        currentQuote,
        addItemToQuote,
        updateQuoteItem,
        removeQuoteItem,
        clearQuote,
        applyQuoteDiscount,
        setDeliveryInstallationFee,
        savedQuotes,
        saveCurrentQuote,
        loadSavedQuote,
        deleteSavedQuote,
        createOrderFromQuote,
        updateOrderStatus,
        addPaymentToOrder,
        addMessageToOrder,
        adjustOrderPrice,
        updateModel,
        toggleModelActive,
        updateSeriesItem,
        updateColorItem,
        updateGlassItem,
        updateOptionItem,
        batchAdjustPrices,
        addSupplier,
        updateSupplier,
        addExpense,
        deleteExpense,
        markNotificationRead,
        markAllNotificationsRead,
        sendNotification,
        updateSettings,
        resetAllData,
        selectedOrderForModal,
        setSelectedOrderForModal,
        printableQuoteModalData,
        setPrintableQuoteModalData,
        printableOrderModalData,
        setPrintableOrderModalData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
