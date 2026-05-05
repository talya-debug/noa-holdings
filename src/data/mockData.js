// ProBuild - מודל נתונים
// הפלו: מחירון → הצעת מחיר → פרויקט (אוטומטי)

// ===== מחירון מאסטר =====
// כל פריט: קטגוריה, תיאור, יחידה, סוג (חומר/עבודה), מחיר עלות
export const masterPriceList = [
  // עבודות שלד
  { id: 101, category: 'עבודות שלד', name: 'בטון', unit: 'מ"ק', type: 'material', costPrice: 450 },
  { id: 102, category: 'עבודות שלד', name: 'ברזל זיון', unit: 'טון', type: 'material', costPrice: 3200 },
  { id: 103, category: 'עבודות שלד', name: 'תבניות/קופסנות', unit: 'מ"ר', type: 'material', costPrice: 70 },
  { id: 104, category: 'עבודות שלד', name: 'בלוקים', unit: 'יח׳', type: 'material', costPrice: 5 },
  { id: 105, category: 'עבודות שלד', name: 'עבודת שלד', unit: 'יום', type: 'labor', costPrice: 3500 },
  { id: 106, category: 'עבודות שלד', name: 'קבלן שלד (פאושלי)', unit: 'פאושלי', type: 'subcontractor', costPrice: 350000 },

  // חשמל
  { id: 201, category: 'חשמל', name: 'נקודות חשמל', unit: 'נק׳', type: 'material', costPrice: 80 },
  { id: 202, category: 'חשמל', name: 'לוח חשמל ראשי', unit: 'יח׳', type: 'material', costPrice: 3500 },
  { id: 203, category: 'חשמל', name: 'גופי תאורה', unit: 'נק׳', type: 'material', costPrice: 120 },
  { id: 204, category: 'חשמל', name: 'מערכת חכמה', unit: 'פאושלי', type: 'material', costPrice: 5000 },
  { id: 205, category: 'חשמל', name: 'עבודת חשמלאי', unit: 'יום', type: 'labor', costPrice: 1800 },
  { id: 206, category: 'חשמל', name: 'קבלן חשמל (פאושלי)', unit: 'פאושלי', type: 'subcontractor', costPrice: 65000 },

  // אינסטלציה
  { id: 301, category: 'אינסטלציה', name: 'צנרת מים', unit: 'מ"א', type: 'material', costPrice: 35 },
  { id: 302, category: 'אינסטלציה', name: 'צנרת ביוב', unit: 'מ"א', type: 'material', costPrice: 45 },
  { id: 303, category: 'אינסטלציה', name: 'כלים סניטריים', unit: 'יח׳', type: 'material', costPrice: 900 },
  { id: 304, category: 'אינסטלציה', name: 'דוד שמש/חימום', unit: 'יח׳', type: 'material', costPrice: 5000 },
  { id: 305, category: 'אינסטלציה', name: 'עבודת אינסטלטור', unit: 'יום', type: 'labor', costPrice: 1600 },
  { id: 306, category: 'אינסטלציה', name: 'קבלן אינסטלציה (פאושלי)', unit: 'פאושלי', type: 'subcontractor', costPrice: 55000 },

  // אלומיניום
  { id: 401, category: 'אלומיניום', name: 'חלונות', unit: 'מ"ר', type: 'material', costPrice: 850 },
  { id: 402, category: 'אלומיניום', name: 'דלתות אלומיניום', unit: 'יח׳', type: 'material', costPrice: 3000 },
  { id: 403, category: 'אלומיניום', name: 'מעקות', unit: 'מ"א', type: 'material', costPrice: 500 },
  { id: 404, category: 'אלומיניום', name: 'התקנת אלומיניום', unit: 'יום', type: 'labor', costPrice: 1500 },
  { id: 405, category: 'אלומיניום', name: 'קבלן אלומיניום (פאושלי)', unit: 'פאושלי', type: 'subcontractor', costPrice: 80000 },

  // ריצוף וחיפוי
  { id: 501, category: 'ריצוף וחיפוי', name: 'אריחי ריצוף פנים', unit: 'מ"ר', type: 'material', costPrice: 80 },
  { id: 502, category: 'ריצוף וחיפוי', name: 'אריחי חיפוי', unit: 'מ"ר', type: 'material', costPrice: 90 },
  { id: 503, category: 'ריצוף וחיפוי', name: 'אריחי ריצוף חוץ', unit: 'מ"ר', type: 'material', costPrice: 70 },
  { id: 504, category: 'ריצוף וחיפוי', name: 'עבודת ריצוף', unit: 'מ"ר', type: 'labor', costPrice: 80 },

  // צבע וגבס
  { id: 601, category: 'צבע וגבס', name: 'לוחות גבס', unit: 'מ"ר', type: 'material', costPrice: 40 },
  { id: 602, category: 'צבע וגבס', name: 'חומרי צביעה', unit: 'מ"ר', type: 'material', costPrice: 10 },
  { id: 603, category: 'צבע וגבס', name: 'עבודת גבסן', unit: 'מ"ר', type: 'labor', costPrice: 50 },
  { id: 604, category: 'צבע וגבס', name: 'עבודת צבע', unit: 'מ"ר', type: 'labor', costPrice: 18 },

  // איטום
  { id: 701, category: 'איטום', name: 'חומרי איטום גג', unit: 'מ"ר', type: 'material', costPrice: 40 },
  { id: 702, category: 'איטום', name: 'חומרי איטום מרתף', unit: 'מ"ר', type: 'material', costPrice: 55 },
  { id: 703, category: 'איטום', name: 'חומרי איטום מקלחות', unit: 'יח׳', type: 'material', costPrice: 1200 },
  { id: 704, category: 'איטום', name: 'עבודת איטום', unit: 'מ"ר', type: 'labor', costPrice: 35 },

  // נגרות
  { id: 801, category: 'נגרות', name: 'דלתות פנים', unit: 'יח׳', type: 'material', costPrice: 1200 },
  { id: 802, category: 'נגרות', name: 'ארונות מטבח', unit: 'מ"א', type: 'material', costPrice: 2000 },
  { id: 803, category: 'נגרות', name: 'ארונות אמבטיה', unit: 'יח׳', type: 'material', costPrice: 2500 },
  { id: 804, category: 'נגרות', name: 'התקנת נגרות', unit: 'יום', type: 'labor', costPrice: 1200 },

  // מיזוג אוויר
  { id: 901, category: 'מיזוג אוויר', name: 'יחידות פנימיות', unit: 'יח׳', type: 'material', costPrice: 1400 },
  { id: 902, category: 'מיזוג אוויר', name: 'יחידה חיצונית', unit: 'יח׳', type: 'material', costPrice: 4000 },
  { id: 903, category: 'מיזוג אוויר', name: 'צנרת נחושת', unit: 'מ"א', type: 'material', costPrice: 35 },
  { id: 904, category: 'מיזוג אוויר', name: 'התקנת מיזוג', unit: 'יום', type: 'labor', costPrice: 1400 },

  // פיתוח חוץ
  { id: 1001, category: 'פיתוח חוץ', name: 'חומרי גינון', unit: 'מ"ר', type: 'material', costPrice: 30 },
  { id: 1002, category: 'פיתוח חוץ', name: 'חומרי חניה', unit: 'מ"ר', type: 'material', costPrice: 150 },
  { id: 1003, category: 'פיתוח חוץ', name: 'גדרות', unit: 'מ"א', type: 'material', costPrice: 200 },
  { id: 1004, category: 'פיתוח חוץ', name: 'שער חשמלי', unit: 'יח׳', type: 'material', costPrice: 5000 },
  { id: 1005, category: 'פיתוח חוץ', name: 'עבודת פיתוח', unit: 'יום', type: 'labor', costPrice: 2500 },

  // פח
  { id: 1101, category: 'עבודות פח', name: 'מרזבים', unit: 'מ"א', type: 'material', costPrice: 70 },
  { id: 1102, category: 'עבודות פח', name: 'שוליים', unit: 'מ"א', type: 'material', costPrice: 45 },
  { id: 1103, category: 'עבודות פח', name: 'עבודת פחח', unit: 'יום', type: 'labor', costPrice: 1200 },

  // מעלית
  { id: 1201, category: 'מעלית', name: 'מעלית פרטית (אספקה)', unit: 'יח׳', type: 'material', costPrice: 45000 },
  { id: 1202, category: 'מעלית', name: 'התקנת מעלית', unit: 'פאושלי', type: 'labor', costPrice: 17000 },
]

// אייקון לכל קטגוריה
export const categoryIcons = {
  'עבודות שלד': '🏗️', 'חשמל': '⚡', 'אינסטלציה': '🔧', 'אלומיניום': '🪟',
  'ריצוף וחיפוי': '🧱', 'צבע וגבס': '🎨', 'איטום': '💧', 'נגרות': '🚪',
  'מיזוג אוויר': '❄️', 'פיתוח חוץ': '🌿', 'עבודות פח': '🔩', 'מעלית': '🛗',
}

// רשימת קטגוריות ייחודיות
export function getCategories() {
  return [...new Set(masterPriceList.map(i => i.category))]
}

// אבני דרך ברירת מחדל (אחוזים מתוך סה"כ מכירה)
export const defaultMilestones = [
  { name: 'מקדמה', percentage: 30 },
  { name: 'סיום שלד', percentage: 15 },
  { name: 'סיום אינסטלציה + חשמל', percentage: 15 },
  { name: 'סיום ריצוף', percentage: 10 },
  { name: 'סיום גבס + צבע', percentage: 10 },
  { name: 'סיום אלומיניום + נגרות', percentage: 10 },
  { name: 'גמר + פרוטוקול מסירה', percentage: 10 },
]

// ===== נתוני דמו =====

// הצעת מחיר דמו - הרצליה
export const demoQuotes = [
  {
    id: 1,
    number: 'Q-2026-001',
    clientName: 'משפחת כהן',
    clientPhone: '054-1234567',
    address: 'הרצליה פיתוח, רח׳ האלון 24',
    date: '2026-01-10',
    status: 'approved', // draft, sent, approved, rejected
    items: [
      // שלד
      { priceItemId: 101, quantity: 120, clientPrice: 850 },
      { priceItemId: 102, quantity: 8, clientPrice: 5200 },
      { priceItemId: 103, quantity: 300, clientPrice: 180 },
      { priceItemId: 104, quantity: 2000, clientPrice: 12 },
      { priceItemId: 105, quantity: 45, clientPrice: 4800 },
      // קבלן שלד
      { priceItemId: 106, quantity: 1, clientPrice: 450000 },
      // חשמל
      { priceItemId: 201, quantity: 80, clientPrice: 280 },
      { priceItemId: 202, quantity: 1, clientPrice: 8500 },
      { priceItemId: 203, quantity: 40, clientPrice: 350 },
      { priceItemId: 205, quantity: 20, clientPrice: 2800 },
      // קבלן חשמל
      { priceItemId: 206, quantity: 1, clientPrice: 85000 },
      // אינסטלציה
      { priceItemId: 301, quantity: 150, clientPrice: 95 },
      { priceItemId: 302, quantity: 80, clientPrice: 120 },
      { priceItemId: 303, quantity: 12, clientPrice: 2200 },
      { priceItemId: 304, quantity: 1, clientPrice: 12000 },
      { priceItemId: 305, quantity: 15, clientPrice: 2500 },
      // קבלן אינסטלציה
      { priceItemId: 306, quantity: 1, clientPrice: 72000 },
      // אלומיניום
      { priceItemId: 401, quantity: 45, clientPrice: 1800 },
      { priceItemId: 402, quantity: 4, clientPrice: 6500 },
      { priceItemId: 403, quantity: 20, clientPrice: 1200 },
      // ריצוף
      { priceItemId: 501, quantity: 180, clientPrice: 160 },
      { priceItemId: 502, quantity: 60, clientPrice: 170 },
      { priceItemId: 504, quantity: 240, clientPrice: 120 },
      // צבע וגבס
      { priceItemId: 601, quantity: 160, clientPrice: 75 },
      { priceItemId: 602, quantity: 450, clientPrice: 18 },
      { priceItemId: 603, quantity: 160, clientPrice: 65 },
      { priceItemId: 604, quantity: 450, clientPrice: 27 },
      // איטום
      { priceItemId: 701, quantity: 180, clientPrice: 70 },
      { priceItemId: 703, quantity: 4, clientPrice: 2000 },
      { priceItemId: 704, quantity: 180, clientPrice: 55 },
      // נגרות
      { priceItemId: 801, quantity: 10, clientPrice: 2800 },
      { priceItemId: 802, quantity: 6, clientPrice: 4500 },
      { priceItemId: 804, quantity: 8, clientPrice: 1800 },
      // מיזוג
      { priceItemId: 901, quantity: 6, clientPrice: 3200 },
      { priceItemId: 902, quantity: 2, clientPrice: 8500 },
      { priceItemId: 904, quantity: 5, clientPrice: 2200 },
      // פיתוח
      { priceItemId: 1001, quantity: 200, clientPrice: 55 },
      { priceItemId: 1002, quantity: 40, clientPrice: 250 },
      { priceItemId: 1005, quantity: 10, clientPrice: 3500 },
    ],
    milestones: [
      { name: 'מקדמה', percentage: 30 },
      { name: 'סיום שלד', percentage: 20 },
      { name: 'סיום אינסטלציה + חשמל', percentage: 15 },
      { name: 'סיום ריצוף + איטום', percentage: 10 },
      { name: 'סיום גבס + צבע + נגרות', percentage: 15 },
      { name: 'גמר + מסירה', percentage: 10 },
    ],
  },
  {
    id: 2,
    number: 'Q-2026-002',
    clientName: 'משפחת לוי',
    clientPhone: '052-7654321',
    address: 'רעננה, רח׳ הדקל 8',
    date: '2026-03-05',
    status: 'sent',
    items: [
      { priceItemId: 106, quantity: 1, clientPrice: 380000 },
      { priceItemId: 206, quantity: 1, clientPrice: 70000 },
      { priceItemId: 306, quantity: 1, clientPrice: 60000 },
      { priceItemId: 401, quantity: 30, clientPrice: 1600 },
      { priceItemId: 501, quantity: 140, clientPrice: 150 },
      { priceItemId: 504, quantity: 140, clientPrice: 110 },
      { priceItemId: 801, quantity: 8, clientPrice: 2500 },
      { priceItemId: 802, quantity: 5, clientPrice: 4000 },
    ],
    milestones: [
      { name: 'מקדמה', percentage: 30 },
      { name: 'סיום שלד', percentage: 20 },
      { name: 'סיום גמר', percentage: 40 },
      { name: 'מסירה', percentage: 10 },
    ],
  },
]

// פרויקטים דמו — 3 פרויקטים: הצעת מחיר, כתב כמויות, ובתכנון
export const demoProjects = [
  {
    id: 1,
    quoteId: 1,
    name: 'וילה פרטית - הרצליה פיתוח',
    clientName: 'משפחת כהן',
    address: 'הרצליה פיתוח, רח׳ האלון 24',
    status: 'active',
    startDate: '2026-01-15',
    expectedEnd: '2026-06-30',
    laborCostPerWorker: 600,
  },
  {
    id: 2,
    boqQuoteId: 1001,
    billingType: 'boq',
    name: 'בניין מגורים - בת ים',
    clientName: 'אלמוג נדל"ן בע"מ',
    address: 'בת ים, רח׳ הבנים 12',
    status: 'active',
    startDate: '2026-02-01',
    expectedEnd: '2026-12-31',
    laborCostPerWorker: 600,
  },
  {
    id: 3,
    quoteId: 2,
    name: 'שיפוץ דירה - רעננה',
    clientName: 'משפחת לוי',
    address: 'רעננה, רח׳ הדקל 8',
    status: 'planning',
    startDate: '',
    expectedEnd: '',
    laborCostPerWorker: 600,
  },
]

// כתב כמויות דמו — פרויקט בת ים (חיוב לפי חשבון חלקי)
export const demoBOQQuotes = [
  {
    id: 1001,
    number: 'BOQ-001',
    date: '2026-01-25',
    status: 'approved',
    type: 'boq',
    clientName: 'אלמוג נדל"ן בע"מ',
    clientPhone: '03-5551234',
    address: 'בת ים, רח׳ הבנים 12',
    projectName: 'בניין מגורים - בת ים',
    items: [
      { clause: '01.01', category: 'עבודות שלד', name: 'בטון B30 ליסודות', unit: 'מ"ק', quantity: 200, itemType: 'procurement', costPrice: 450, clientPrice: 750 },
      { clause: '01.02', category: 'עבודות שלד', name: 'בטון B30 לעמודים וקורות', unit: 'מ"ק', quantity: 150, itemType: 'procurement', costPrice: 450, clientPrice: 750 },
      { clause: '01.03', category: 'עבודות שלד', name: 'בטון B30 לתקרות', unit: 'מ"ק', quantity: 350, itemType: 'procurement', costPrice: 450, clientPrice: 750 },
      { clause: '01.04', category: 'עבודות שלד', name: 'ברזל זיון B500', unit: 'טון', quantity: 45, itemType: 'procurement', costPrice: 3200, clientPrice: 5000 },
      { clause: '01.05', category: 'עבודות שלד', name: 'תבניות עמודים וקירות', unit: 'מ"ר', quantity: 800, itemType: 'procurement', costPrice: 70, clientPrice: 150 },
      { clause: '01.06', category: 'עבודות שלד', name: 'תבניות תקרות', unit: 'מ"ר', quantity: 1200, itemType: 'procurement', costPrice: 70, clientPrice: 140 },
      { clause: '01.07', category: 'עבודות שלד', name: 'בלוקים 20 ס"מ', unit: 'יח׳', quantity: 15000, itemType: 'procurement', costPrice: 5, clientPrice: 10 },
      { clause: '01.08', category: 'עבודות שלד', name: 'עבודת שלד — צוות', unit: 'יום', quantity: 120, itemType: 'labor', costPrice: 3500, clientPrice: 5500 },
      { clause: '01.09', category: 'עבודות שלד', name: 'קבלן שלד (פאושלי)', unit: 'פאושלי', quantity: 1, itemType: 'subcontractor', costPrice: 850000, clientPrice: 1200000 },
      { clause: '02.01', category: 'חשמל', name: 'נקודות חשמל', unit: 'נק׳', quantity: 400, itemType: 'procurement', costPrice: 80, clientPrice: 200 },
      { clause: '02.02', category: 'חשמל', name: 'לוחות חשמל', unit: 'יח׳', quantity: 8, itemType: 'procurement', costPrice: 3500, clientPrice: 7000 },
      { clause: '02.03', category: 'חשמל', name: 'קבלן חשמל', unit: 'פאושלי', quantity: 1, itemType: 'subcontractor', costPrice: 180000, clientPrice: 250000 },
      { clause: '03.01', category: 'אינסטלציה', name: 'צנרת מים', unit: 'מ"א', quantity: 600, itemType: 'procurement', costPrice: 35, clientPrice: 80 },
      { clause: '03.02', category: 'אינסטלציה', name: 'צנרת ביוב', unit: 'מ"א', quantity: 300, itemType: 'procurement', costPrice: 45, clientPrice: 100 },
      { clause: '03.03', category: 'אינסטלציה', name: 'כלים סניטריים', unit: 'יח׳', quantity: 48, itemType: 'procurement', costPrice: 900, clientPrice: 1800 },
      { clause: '03.04', category: 'אינסטלציה', name: 'קבלן אינסטלציה', unit: 'פאושלי', quantity: 1, itemType: 'subcontractor', costPrice: 150000, clientPrice: 210000 },
      { clause: '04.01', category: 'איטום', name: 'איטום גג', unit: 'מ"ר', quantity: 400, itemType: 'procurement', costPrice: 40, clientPrice: 80 },
      { clause: '04.02', category: 'איטום', name: 'איטום מרתף', unit: 'מ"ר', quantity: 300, itemType: 'procurement', costPrice: 55, clientPrice: 110 },
      { clause: '04.03', category: 'איטום', name: 'איטום מקלחות', unit: 'יח׳', quantity: 16, itemType: 'procurement', costPrice: 1200, clientPrice: 2200 },
      { clause: '04.04', category: 'איטום', name: 'קבלן איטום', unit: 'פאושלי', quantity: 1, itemType: 'subcontractor', costPrice: 120000, clientPrice: 170000 },
      { clause: '05.01', category: 'ריצוף וחיפוי', name: 'ריצוף פנים', unit: 'מ"ר', quantity: 800, itemType: 'procurement', costPrice: 80, clientPrice: 160 },
      { clause: '05.02', category: 'ריצוף וחיפוי', name: 'חיפוי קירות', unit: 'מ"ר', quantity: 300, itemType: 'procurement', costPrice: 90, clientPrice: 170 },
      { clause: '05.03', category: 'ריצוף וחיפוי', name: 'עבודת ריצוף', unit: 'מ"ר', quantity: 1100, itemType: 'labor', costPrice: 80, clientPrice: 130 },
    ],
  },
]

// חשבון חלקי דמו — פרויקט בת ים (23 סעיפים בכתב הכמויות)
export const demoPartialInvoices = [
  {
    id: 5001,
    projectId: 2,
    invoiceNumber: 1,
    date: '2026-03-15',
    status: 'paid',
    items: [
      // שלד — יסודות
      { itemIdx: 0, currentQty: 80 },   // בטון יסודות — 80 מתוך 200
      { itemIdx: 1, currentQty: 30 },   // בטון עמודים — 30 מתוך 150
      { itemIdx: 3, currentQty: 10 },   // ברזל — 10 מתוך 45
      { itemIdx: 4, currentQty: 200 },  // תבניות עמודים — 200 מתוך 800
      { itemIdx: 6, currentQty: 3000 }, // בלוקים — 3000 מתוך 15000
      { itemIdx: 7, currentQty: 30 },   // עבודת שלד — 30 מתוך 120 יום
    ],
    totalAmount: 478000,
    paidAmount: 478000,
    paidDate: '2026-03-25',
  },
  {
    id: 5002,
    projectId: 2,
    invoiceNumber: 2,
    date: '2026-04-15',
    status: 'sent',
    items: [
      // שלד — המשך
      { itemIdx: 0, currentQty: 60 },   // בטון יסודות — עוד 60
      { itemIdx: 1, currentQty: 50 },   // בטון עמודים — עוד 50
      { itemIdx: 2, currentQty: 100 },  // בטון תקרות — 100 מתוך 350
      { itemIdx: 3, currentQty: 12 },   // ברזל — עוד 12
      { itemIdx: 4, currentQty: 300 },  // תבניות עמודים — עוד 300
      { itemIdx: 5, currentQty: 400 },  // תבניות תקרות — 400 מתוך 1200
      { itemIdx: 6, currentQty: 5000 }, // בלוקים — עוד 5000
      { itemIdx: 7, currentQty: 40 },   // עבודת שלד — עוד 40 יום
      // חשמל — תחילת עבודה
      { itemIdx: 9, currentQty: 80 },   // נקודות חשמל — 80 מתוך 400
      { itemIdx: 10, currentQty: 2 },   // לוחות חשמל — 2 מתוך 8
      // אינסטלציה — תחילת עבודה
      { itemIdx: 12, currentQty: 150 }, // צנרת מים — 150 מתוך 600
      { itemIdx: 13, currentQty: 100 }, // צנרת ביוב — 100 מתוך 300
    ],
    totalAmount: 562500,
    paidAmount: 0,
    paidDate: null,
  },
]

// אבני דרך דמו — סה"כ מכירה כ-1,850,000 ש"ח
export const demoMilestones = [
  { id: 1, projectId: 1, name: 'מקדמה', percentage: 30, amount: 555000, status: 'paid', billingStatus: 'שולם', paidAmount: 555000, paidDate: '2026-01-20' },
  { id: 2, projectId: 1, name: 'סיום שלד', percentage: 20, amount: 370000, status: 'in_progress', billingStatus: 'ממתין לגבייה', paidAmount: 0, paidDate: null },
  { id: 3, projectId: 1, name: 'סיום אינסטלציה + חשמל', percentage: 15, amount: 277500, status: 'pending', billingStatus: 'גבייה עתידית', paidAmount: 0, paidDate: null },
  { id: 4, projectId: 1, name: 'סיום ריצוף + איטום', percentage: 10, amount: 185000, status: 'pending', billingStatus: 'גבייה עתידית', paidAmount: 0, paidDate: null },
  { id: 5, projectId: 1, name: 'סיום גבס + צבע + נגרות', percentage: 15, amount: 277500, status: 'pending', billingStatus: 'גבייה עתידית', paidAmount: 0, paidDate: null },
  { id: 6, projectId: 1, name: 'גמר + מסירה', percentage: 10, amount: 185000, status: 'pending', billingStatus: 'גבייה עתידית', paidAmount: 0, paidDate: null },
]

// משימות פרויקט דמו (נוצרו אוטומטית - כל פריט מהצעה = משימה)
// status: 'pending' | 'in_progress' | 'done'
export const demoProjectTasks = (() => {
  // יצירה אוטומטית מכל פריטי ההצעה
  let id = 1
  return demoQuotes[0].items.map(qi => {
    const pi = masterPriceList.find(p => p.id === qi.priceItemId)
    if (!pi) return null
    return {
      id: id++, projectId: 1, priceItemId: qi.priceItemId,
      name: pi.name, category: pi.category, type: pi.type, unit: pi.unit,
      budgetQty: qi.quantity, budgetCost: pi.costPrice, clientPrice: qi.clientPrice,
      status: pi.category === 'עבודות שלד' ? (pi.type === 'subcontractor' ? 'in_progress' : (['בטון', 'ברזל זיון', 'תבניות/קופסנות', 'בלוקים'].includes(pi.name) ? 'done' : 'in_progress'))
        : pi.category === 'חשמל' ? (pi.name === 'נקודות חשמל' ? 'in_progress' : 'pending')
        : pi.category === 'אינסטלציה' ? (pi.name === 'צנרת ביוב' ? 'in_progress' : 'pending')
        : 'pending',
    }
  }).filter(Boolean)
})()

// רכישות דמו (נוצרו אוטומטית מפריטי חומר בהצעה)
export const demoPurchases = (() => {
  let id = 1
  const materialItems = demoQuotes[0].items.filter(qi => {
    const pi = masterPriceList.find(p => p.id === qi.priceItemId)
    return pi && pi.type === 'material'
  })

  // כמה הזמנות דמו לפריטים ראשונים
  const demoOrders = {
    101: [{ id: 901, date: '2026-02-20', supplier: 'רדימיקס', quantity: 45, unitCost: 460, total: 20700, status: 'delivered' }],
    102: [
      { id: 902, date: '2026-02-18', supplier: 'פלדות ישראל', quantity: 3, unitCost: 3800, total: 11400, status: 'delivered' },
      { id: 905, date: '2026-03-25', supplier: 'פלדות ישראל', quantity: 3, unitCost: 3900, total: 11700, status: 'delivered' },
    ],
    202: [{ id: 903, date: '2026-03-10', supplier: 'חשמל הצפון', quantity: 1, unitCost: 3500, total: 3500, status: 'delivered' }],
    // תשלומים לקבלני משנה
    106: [
      { id: 910, date: '2026-02-01', supplier: 'אבי מלכה - קבלן שלד', quantity: 1, unitCost: 140000, total: 140000, status: 'delivered' },
      { id: 911, date: '2026-03-15', supplier: 'אבי מלכה - קבלן שלד', quantity: 1, unitCost: 90000, total: 90000, status: 'delivered' },
    ],
    206: [
      { id: 912, date: '2026-03-01', supplier: 'חשמל פלוס בע"מ', quantity: 1, unitCost: 34000, total: 34000, status: 'delivered' },
    ],
    306: [
      { id: 913, date: '2026-03-10', supplier: 'יוסי אינסטלציה', quantity: 1, unitCost: 25000, total: 25000, status: 'delivered' },
    ],
  }

  return materialItems.map(qi => {
    const pi = masterPriceList.find(p => p.id === qi.priceItemId)
    const task = demoProjectTasks.find(t => t.priceItemId === qi.priceItemId)
    const orders = demoOrders[qi.priceItemId] || []
    const orderedQty = orders.reduce((s, o) => s + o.quantity, 0)
    const actualTotal = orders.reduce((s, o) => s + o.total, 0)

    return {
      id: id++, projectId: 1, taskId: task?.id || id,
      name: pi.name, category: pi.category,
      supplier: orders[0]?.supplier || '',
      budgetQty: qi.quantity, budgetUnitCost: pi.costPrice, budgetTotal: pi.costPrice * qi.quantity,
      orderedQty, actualUnitCost: orderedQty > 0 ? Math.round(actualTotal / orderedQty) : 0,
      actualTotal,
      orderStatus: orders.length > 0 ? (orders.every(o => o.status === 'delivered') ? 'delivered' : 'ordered') : 'not_ordered',
      orders,
      date: orders[0]?.date || null,
    }
  })
})()

// === משימות ורכש לפרויקט 2 — בת ים (מכתב כמויות) ===
// נוצרים מה-BOQ ומתווספים לרשימות הקיימות
const batYamTasks = demoBOQQuotes[0].items.map((item, i) => ({
  id: 2000 + i,
  projectId: 2,
  name: item.name,
  category: item.category,
  type: item.itemType === 'procurement' ? 'material' : item.itemType === 'subcontractor' ? 'subcontractor' : 'labor',
  unit: item.unit,
  budgetQty: item.quantity,
  budgetCost: item.costPrice,
  clientPrice: item.clientPrice,
  clause: item.clause,
  // שלד — חלק בוצע, חשמל ואינסטלציה התחילו, השאר ממתין
  status: item.category === 'עבודות שלד'
    ? (['בטון B30 ליסודות'].includes(item.name) ? 'done' : 'in_progress')
    : (item.category === 'חשמל' || item.category === 'אינסטלציה') ? 'in_progress'
    : 'pending',
}))
demoProjectTasks.push(...batYamTasks)

const batYamPurchases = demoBOQQuotes[0].items
  .filter(item => item.itemType === 'procurement' || item.itemType === 'subcontractor')
  .map((item, i) => {
    const task = batYamTasks.find(t => t.name === item.name)
    // הזמנות דמו לפריטים שבביצוע
    let orders = []
    if (item.name === 'בטון B30 ליסודות') {
      orders = [{ id: 3001, date: '2026-02-20', supplier: 'רדימיקס דרום', quantity: 140, unitCost: 470, total: 65800, status: 'delivered' }]
    } else if (item.name === 'בטון B30 לעמודים וקורות') {
      orders = [{ id: 3002, date: '2026-03-10', supplier: 'רדימיקס דרום', quantity: 80, unitCost: 470, total: 37600, status: 'delivered' }]
    } else if (item.name === 'ברזל זיון B500') {
      orders = [
        { id: 3003, date: '2026-02-15', supplier: 'פלדות דרום', quantity: 10, unitCost: 3400, total: 34000, status: 'delivered' },
        { id: 3004, date: '2026-03-20', supplier: 'פלדות דרום', quantity: 12, unitCost: 3500, total: 42000, status: 'delivered' },
      ]
    } else if (item.name === 'תבניות עמודים וקירות') {
      orders = [{ id: 3005, date: '2026-02-25', supplier: 'טפסנות אור', quantity: 500, unitCost: 75, total: 37500, status: 'delivered' }]
    } else if (item.name === 'בלוקים 20 ס"מ') {
      orders = [{ id: 3006, date: '2026-03-01', supplier: 'איטונג', quantity: 8000, unitCost: 5.5, total: 44000, status: 'delivered' }]
    } else if (item.name === 'נקודות חשמל') {
      orders = [{ id: 3007, date: '2026-04-01', supplier: 'אלקטרה חשמל', quantity: 80, unitCost: 85, total: 6800, status: 'delivered' }]
    } else if (item.name === 'צנרת מים') {
      orders = [{ id: 3008, date: '2026-04-05', supplier: 'פלסאון', quantity: 150, unitCost: 38, total: 5700, status: 'delivered' }]
    }

    const orderedQty = orders.reduce((s, o) => s + o.quantity, 0)
    const actualTotal = orders.reduce((s, o) => s + o.total, 0)

    return {
      id: 3000 + i,
      projectId: 2,
      taskId: task?.id,
      name: item.name,
      category: item.category,
      supplier: orders[0]?.supplier || '',
      budgetQty: item.quantity,
      budgetUnitCost: item.costPrice,
      budgetTotal: item.costPrice * item.quantity,
      orderedQty,
      actualUnitCost: orderedQty > 0 ? Math.round(actualTotal / orderedQty) : 0,
      actualTotal,
      orderStatus: orders.length > 0 ? 'delivered' : 'not_ordered',
      orders,
      date: orders[0]?.date || null,
    }
  })
demoPurchases.push(...batYamPurchases)

// יומני עבודה דמו — הרבה יומנים כדי שייראה חי
export const demoWorkLogs = [
  { id: 1, projectId: 1, date: '2026-04-22', managerName: 'מוחמד חסן', workersCount: 8, categories: ['עבודות שלד', 'אינסטלציה'], description: 'יציקת תקרה קומה א\' + התחלת צנרת ביוב', issues: 'עיכוב באספקת ברזל — ספק עדיין לא סיפק 2 טון', photos: 3, signature: true, laborCost: 4800 },
  { id: 2, projectId: 1, date: '2026-04-21', managerName: 'מוחמד חסן', workersCount: 6, categories: ['עבודות שלד'], description: 'הכנות ליציקה - הרכבת תבניות וברזל', issues: '', photos: 5, signature: true, laborCost: 3600 },
  { id: 3, projectId: 1, date: '2026-04-20', managerName: 'מוחמד חסן', workersCount: 10, categories: ['עבודות שלד', 'חשמל'], description: 'סיום קירות קומת קרקע + הנחת תשתיות חשמל', issues: 'המפקח ביקש שינוי במיקום לוח החשמל', photos: 8, signature: true, laborCost: 6000 },
  { id: 4, projectId: 1, date: '2026-04-17', managerName: 'מוחמד חסן', workersCount: 7, categories: ['עבודות שלד'], description: 'יציקת עמודים קומה א\' + קירות חיצוניים', issues: '', photos: 4, signature: true, laborCost: 4200 },
  { id: 5, projectId: 1, date: '2026-04-16', managerName: 'מוחמד חסן', workersCount: 9, categories: ['עבודות שלד', 'אינסטלציה'], description: 'בלוקים קומת קרקע + שרוולים לצנרת', issues: 'חוסר בבלוקים 20 — הזמנה נוספת', photos: 6, signature: true, laborCost: 5400 },
  { id: 6, projectId: 1, date: '2026-04-15', managerName: 'מוחמד חסן', workersCount: 12, categories: ['עבודות שלד'], description: 'יציקת רצפה קומת קרקע', issues: '', photos: 10, signature: true, laborCost: 7200 },
  { id: 7, projectId: 1, date: '2026-04-14', managerName: 'מוחמד חסן', workersCount: 5, categories: ['חשמל'], description: 'הנחת תשתיות חשמל ברצפה לפני יציקה', issues: '', photos: 3, signature: true, laborCost: 3000 },
  { id: 8, projectId: 1, date: '2026-04-13', managerName: 'מוחמד חסן', workersCount: 8, categories: ['עבודות שלד'], description: 'טפסנות ליסודות + הכנת ברזל', issues: '', photos: 4, signature: true, laborCost: 4800 },
  { id: 9, projectId: 1, date: '2026-04-10', managerName: 'מוחמד חסן', workersCount: 6, categories: ['עבודות שלד'], description: 'חפירה ויסודות', issues: 'נתקלנו בסלע — צריך פטישון', photos: 7, signature: true, laborCost: 3600 },
  { id: 10, projectId: 1, date: '2026-04-09', managerName: 'מוחמד חסן', workersCount: 4, categories: ['עבודות שלד'], description: 'סימון + חפירה ליסודות', issues: '', photos: 2, signature: true, laborCost: 2400 },
  // פרויקט 2 — בת ים
  { id: 11, projectId: 2, date: '2026-04-25', managerName: 'עלי נאסר', workersCount: 18, categories: ['עבודות שלד', 'חשמל'], description: 'יציקת תקרה קומה 2 + הנחת שרוולים חשמל', issues: '', photos: 8, signature: true, laborCost: 10800 },
  { id: 12, projectId: 2, date: '2026-04-24', managerName: 'עלי נאסר', workersCount: 15, categories: ['עבודות שלד'], description: 'טפסנות תקרה קומה 2 + ברזל', issues: 'עיכוב במשאבת בטון — דחינו יציקה ליום המחר', photos: 6, signature: true, laborCost: 9000 },
  { id: 13, projectId: 2, date: '2026-04-23', managerName: 'עלי נאסר', workersCount: 14, categories: ['עבודות שלד', 'אינסטלציה'], description: 'בלוקים קומה 2 + שרוולי אינסטלציה', issues: '', photos: 5, signature: true, laborCost: 8400 },
  { id: 14, projectId: 2, date: '2026-04-22', managerName: 'עלי נאסר', workersCount: 20, categories: ['עבודות שלד'], description: 'יציקת תקרה קומה 1', issues: '', photos: 12, signature: true, laborCost: 12000 },
  { id: 15, projectId: 2, date: '2026-04-21', managerName: 'עלי נאסר', workersCount: 16, categories: ['עבודות שלד'], description: 'טפסנות + ברזל תקרה קומה 1', issues: 'חוסר בתבניות — שכרנו נוספות', photos: 4, signature: true, laborCost: 9600 },
  { id: 16, projectId: 2, date: '2026-04-20', managerName: 'עלי נאסר', workersCount: 12, categories: ['עבודות שלד'], description: 'עמודים + קירות קומה 1', issues: '', photos: 5, signature: true, laborCost: 7200 },
]

// קבלני משנה דמו — 2 פרויקטים
export const demoSubcontractors = [
  // פרויקט 1 — הרצליה
  { id: 1, name: 'אבי מלכה', phone: '050-1234567', specialty: 'עבודות שלד', projectId: 1, contractAmount: 450000, paid: 180000, pending: 90000, hasContract: true },
  { id: 2, name: 'חשמל פלוס בע"מ', phone: '052-9876543', specialty: 'חשמל', projectId: 1, contractAmount: 85000, paid: 34000, pending: 17000, hasContract: true },
  { id: 3, name: 'יוסי אינסטלציה', phone: '054-5551234', specialty: 'אינסטלציה', projectId: 1, contractAmount: 72000, paid: 36000, pending: 18000, hasContract: true },
  { id: 4, name: 'מוסא איטום', phone: '050-8881234', specialty: 'איטום', projectId: 1, contractAmount: 45000, paid: 0, pending: 0, hasContract: false },
  { id: 5, name: 'ברוך אלומיניום', phone: '054-3332211', specialty: 'אלומיניום', projectId: 1, contractAmount: 95000, paid: 0, pending: 0, hasContract: true },
  // פרויקט 2 — בת ים
  { id: 6, name: 'רמי שלד בע"מ', phone: '050-7771234', specialty: 'עבודות שלד', projectId: 2, contractAmount: 1200000, paid: 480000, pending: 240000, hasContract: true },
  { id: 7, name: 'אלקטרה חשמל', phone: '03-6661234', specialty: 'חשמל', projectId: 2, contractAmount: 250000, paid: 75000, pending: 50000, hasContract: true },
  { id: 8, name: 'שרון אינסטלציה', phone: '054-8889999', specialty: 'אינסטלציה', projectId: 2, contractAmount: 210000, paid: 63000, pending: 42000, hasContract: true },
  { id: 9, name: 'סולל איטום', phone: '052-3334444', specialty: 'איטום', projectId: 2, contractAmount: 170000, paid: 0, pending: 0, hasContract: false },
]

// מסמכים דמו
export const demoDocuments = [
  { id: 1, projectId: 1, name: 'תוכנית אדריכלות - קומת קרקע.pdf', category: 'plans', size: 2450000, type: 'application/pdf', note: 'גרסה 3 - אחרי שינויים של הלקוח', uploadedBy: 'טליה', date: '2026-01-20' },
  { id: 2, projectId: 1, name: 'תוכנית קונסטרוקציה - יסודות.pdf', category: 'plans', size: 3100000, type: 'application/pdf', note: 'כולל פרטי כלונסאות', uploadedBy: 'טליה', date: '2026-01-20' },
  { id: 3, projectId: 1, name: 'תוכנית חשמל E-01.pdf', category: 'plans', size: 1800000, type: 'application/pdf', note: '', uploadedBy: 'טליה', date: '2026-02-05' },
  { id: 4, projectId: 1, name: 'תוכנית אינסטלציה IN-01.pdf', category: 'plans', size: 2200000, type: 'application/pdf', note: '', uploadedBy: 'טליה', date: '2026-02-05' },
  { id: 5, projectId: 1, name: 'היתר בנייה - הרצליה 2026.pdf', category: 'permits', size: 980000, type: 'application/pdf', note: 'היתר מאושר', uploadedBy: 'טליה', date: '2026-01-10' },
  { id: 6, projectId: 1, name: 'אישור מהנדס קונסטרוקציה.pdf', category: 'permits', size: 450000, type: 'application/pdf', note: 'אישור יסודות', uploadedBy: 'לירן', date: '2026-02-15' },
  { id: 7, projectId: 1, name: 'חוזה קבלן שלד - אבי מלכה.pdf', category: 'contracts', size: 320000, type: 'application/pdf', note: 'חתום', uploadedBy: 'טליה', date: '2026-01-25' },
  { id: 8, projectId: 1, name: 'חוזה חשמל - חשמל פלוס.pdf', category: 'contracts', size: 280000, type: 'application/pdf', note: 'חתום', uploadedBy: 'טליה', date: '2026-02-01' },
  { id: 9, projectId: 1, name: 'חוזה אינסטלציה - יוסי.pdf', category: 'contracts', size: 290000, type: 'application/pdf', note: 'חתום', uploadedBy: 'טליה', date: '2026-02-01' },
  { id: 10, projectId: 1, name: 'פוליסת ביטוח קבלנים.pdf', category: 'insurance', size: 1200000, type: 'application/pdf', note: 'בתוקף עד 01/2027', uploadedBy: 'טליה', date: '2026-01-15' },
  { id: 11, projectId: 1, name: 'פוליסת חבות צד ג.pdf', category: 'insurance', size: 850000, type: 'application/pdf', note: '', uploadedBy: 'טליה', date: '2026-01-15' },
  { id: 12, projectId: 1, name: 'חשבונית רדימיקס - בטון יסודות.pdf', category: 'invoices', size: 150000, type: 'application/pdf', note: '45 קוב', uploadedBy: 'מוחמד', date: '2026-02-22' },
  { id: 13, projectId: 1, name: 'חשבונית פלדות ישראל - ברזל.pdf', category: 'invoices', size: 180000, type: 'application/pdf', note: '3 טון', uploadedBy: 'מוחמד', date: '2026-02-20' },
  { id: 14, projectId: 1, name: 'פרוטוקול ישיבה 1 - פתיחת פרויקט.pdf', category: 'protocols', size: 200000, type: 'application/pdf', note: 'נוכחים: קבלן, מפקח, אדריכל', uploadedBy: 'לירן', date: '2026-01-18' },
  { id: 15, projectId: 1, name: 'פרוטוקול ישיבה 2 - סיום יסודות.pdf', category: 'protocols', size: 220000, type: 'application/pdf', note: '', uploadedBy: 'לירן', date: '2026-03-01' },
  { id: 16, projectId: 1, name: 'צילום אתר - יסודות.jpg', category: 'photos', size: 3500000, type: 'image/jpeg', note: 'לפני יציקה', uploadedBy: 'מוחמד', date: '2026-02-18' },
  { id: 17, projectId: 1, name: 'צילום אתר - שלד קומת קרקע.jpg', category: 'photos', size: 4200000, type: 'image/jpeg', note: '', uploadedBy: 'מוחמד', date: '2026-04-10' },
  { id: 18, projectId: 1, name: 'צילום אתר - יציקת תקרה.jpg', category: 'photos', size: 3800000, type: 'image/jpeg', note: 'קומה א', uploadedBy: 'מוחמד', date: '2026-04-22' },
  // פרויקט 2 — בת ים
  { id: 19, projectId: 2, name: 'כתב כמויות - בניין מגורים בת ים.xlsx', category: 'plans', size: 1500000, type: 'application/xlsx', note: 'כתב כמויות מלא', uploadedBy: 'טליה', date: '2026-01-28' },
  { id: 20, projectId: 2, name: 'תוכנית קונסטרוקציה - יסודות.pdf', category: 'plans', size: 4200000, type: 'application/pdf', note: '', uploadedBy: 'טליה', date: '2026-01-28' },
  { id: 21, projectId: 2, name: 'תוכנית קונסטרוקציה - קומה טיפוסית.pdf', category: 'plans', size: 3800000, type: 'application/pdf', note: '', uploadedBy: 'טליה', date: '2026-01-28' },
  { id: 22, projectId: 2, name: 'היתר בנייה - בת ים.pdf', category: 'permits', size: 1200000, type: 'application/pdf', note: 'מאושר', uploadedBy: 'טליה', date: '2026-01-20' },
  { id: 23, projectId: 2, name: 'חוזה קבלן שלד - רמי שלד.pdf', category: 'contracts', size: 450000, type: 'application/pdf', note: 'חתום', uploadedBy: 'טליה', date: '2026-02-05' },
  { id: 24, projectId: 2, name: 'חוזה חשמל - אלקטרה.pdf', category: 'contracts', size: 380000, type: 'application/pdf', note: 'חתום', uploadedBy: 'טליה', date: '2026-02-10' },
  { id: 25, projectId: 2, name: 'חשבון חלקי מס 1.pdf', category: 'invoices', size: 250000, type: 'application/pdf', note: 'שולם 25.3.2026', uploadedBy: 'טליה', date: '2026-03-15' },
  { id: 26, projectId: 2, name: 'חשבון חלקי מס 2.pdf', category: 'invoices', size: 280000, type: 'application/pdf', note: 'ממתין לתשלום', uploadedBy: 'טליה', date: '2026-04-15' },
  { id: 27, projectId: 2, name: 'פוליסת ביטוח קבלנים.pdf', category: 'insurance', size: 1100000, type: 'application/pdf', note: 'בתוקף עד 02/2027', uploadedBy: 'טליה', date: '2026-02-01' },
  { id: 28, projectId: 2, name: 'צילום אתר - יסודות.jpg', category: 'photos', size: 4500000, type: 'image/jpeg', note: 'לפני יציקה', uploadedBy: 'עלי', date: '2026-03-01' },
  { id: 29, projectId: 2, name: 'צילום אתר - קומה 1.jpg', category: 'photos', size: 5200000, type: 'image/jpeg', note: 'אחרי יציקת תקרה', uploadedBy: 'עלי', date: '2026-04-22' },
]

// ===== פונקציות עזר =====

// חיפוש פריט מחירון — גם ב-masterPriceList וגם ב-localStorage
export function findPriceItem(id) {
  // קודם במחירון הקשיח
  const found = masterPriceList.find(i => i.id === id)
  if (found) return found
  // אם לא נמצא — חפש ב-localStorage
  try {
    const stored = localStorage.getItem('pb_priceList')
    if (stored) {
      const list = JSON.parse(stored)
      return list.find(i => i.id === id)
    }
  } catch {}
  return null
}

// חישובי הצעת מחיר
export function calcQuoteTotals(quoteItems) {
  let totalCost = 0, totalSell = 0, materialCost = 0, laborCost = 0
  quoteItems.forEach(qi => {
    // פריט חופשי — נתונים ישירות על הפריט
    if (qi._free) {
      const cost = (qi._costPrice || 0) * qi.quantity
      const sell = qi.clientPrice * qi.quantity
      totalCost += cost
      totalSell += sell
      if (qi._type === 'material') materialCost += cost
      else laborCost += cost
      return
    }
    const pi = findPriceItem(qi.priceItemId)
    if (!pi) return
    const cost = pi.costPrice * qi.quantity
    const sell = qi.clientPrice * qi.quantity
    totalCost += cost
    totalSell += sell
    if (pi.type === 'material') materialCost += cost
    else laborCost += cost
  })
  return {
    totalCost, totalSell, materialCost, laborCost,
    profit: totalSell - totalCost,
    profitMargin: totalCost > 0 ? Math.round(((totalSell - totalCost) / totalCost) * 100) : 0,
  }
}

// פורמטים
export function formatCurrency(amount) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}
export function formatNumber(num) { return new Intl.NumberFormat('he-IL').format(num) }
export function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('he-IL')
}
// תוויות סוג פריט
export function getTypeLabel(type) {
  return { material: 'חומר', labor: 'עבודה', subcontractor: 'קבלן משנה', combined: 'כולל' }[type] || type
}
export function getTypeBadgeClass(type) {
  return { material: 'badge-info', labor: 'badge-warning', subcontractor: 'badge-success', combined: 'badge-gold' }[type] || 'badge-info'
}

export function getStatusLabel(status) {
  return { active: 'פעיל', planning: 'בתכנון', completed: 'הושלם', draft: 'טיוטה', sent: 'נשלח', approved: 'מאושר', rejected: 'נדחה', pending: 'ממתין', in_progress: 'בתהליך', done: 'בוצע', delivered: 'סופק', ordered: 'הוזמן', paid: 'שולם' }[status] || status
}
export function getStatusBadgeClass(status) {
  return { active: 'badge-success', completed: 'badge-gold', draft: 'badge-info', sent: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', pending: 'badge-info', in_progress: 'badge-warning', done: 'badge-success', delivered: 'badge-success', ordered: 'badge-warning', paid: 'badge-success' }[status] || 'badge-info'
}
