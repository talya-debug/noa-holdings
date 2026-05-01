# ארכיטקטורה — תוספות ושינויים + סוג "כולל"

## פיצ'ר 1: סוג "כולל" (combined)

### מה זה
פריט בכתב כמויות שכולל גם חומר וגם עבודה ביחד (למשל "ריצוף פורצלן — 150₪/מ"ר").

### מה משתנה

**BOQUpload.jsx**
- VALID_TYPES: הוספת `'כולל': 'combined'`

**BOQBuilder.jsx**
- ITEM_TYPES: הוספת `{ value: 'combined', label: 'כולל', icon: Layers, color: 'var(--gold)' }`

**store.js — approveBOQQuote()**
- פריט `combined` → נכנס גם לרכישות (purchases) וגם מזין את יומן העבודה
- יוצר task מסוג `combined`

**WorkLogForm.jsx**
- `laborCostByCategory`: משנה את הלוגיקה — אם אין labor לקטגוריה, מחפש combined
- fallback: `t.type === 'labor' || t.type === 'combined'`

**ProjectOverview.jsx**
- תכנון: פריט combined נספר כקטגוריה שלמה (לא מפוצל)
- ביצוע: purchases + workLogs ביחד פר קטגוריה

**mockData.js**
- `getTypeLabel`: הוספת `combined: 'כולל'`
- `getTypeBadgeClass`: הוספת `combined: 'badge-gold'`

**BOQUpload — תבנית לדוגמה**
- הוספת שורת דוגמה עם סוג "כולל"

---

## פיצ'ר 2: תוספות ושינויים (Change Orders)

### מה זה
במהלך פרויקט, הלקוח מבקש שינוי או תוספת. הקבלן יוצר אמנדמנט (שינוי), שולח לינק ללקוח לאישור, ואחרי אישור — זה נכנס לפרויקט.

### Flow

```
פרויקט פעיל
    ↓
קבלן יוצר "תוספת/שינוי" — פריטים + מחירים
    ↓
שולח לינק ללקוח (כמו יומן עבודה — דף חיצוני בלי סיידבר)
    ↓
לקוח רואה את הפריטים, הסכומים, ומאשר (לחיצה + שם)
    ↓  [אישור]
הפריטים נכנסים ל:
  ✓ משימות הפרויקט (tasks)
  ✓ רכישות (purchases) — אם חומר/combined
  ✓ קבלני משנה — אם קב"מ
  ✓ גבייה:
      - פרויקט רגיל → אבן דרך חדשה "תוספות ושינויים"
      - פרויקט BOQ → סעיפים חדשים בחשבון חלקי
  ✓ סקירה כספית — מעדכנת את ערך החוזה
```

### מודל נתונים

```
ChangeOrder = {
  id: number,
  projectId: number,
  number: "CO-001",
  date: "2026-05-01",
  status: "draft" | "sent" | "approved" | "rejected",

  // פרטי האישור
  approvedBy: "",         // שם המאשר
  approvedDate: null,
  approvalNote: "",       // הערת לקוח

  // פריטים
  items: [
    {
      name: "שינוי מיקום דלת",
      category: "נגרות",
      unit: "יח'",
      quantity: 1,
      type: "labor" | "material" | "subcontractor" | "combined",
      costPrice: 500,
      clientPrice: 800,
      description: "העברת דלת פנים מקיר צפוני לקיר דרומי",
    }
  ],

  // סכומים מחושבים
  totalCost: 500,
  totalSell: 800,
}
```

### localStorage
- מפתח: `pb_changeOrders`
- CRUD: getChangeOrders, addChangeOrder, updateChangeOrder, deleteChangeOrder

### Routes חדשים

| Route | קומפוננטה | תיאור |
|-------|----------|-------|
| `/project/:id/changes` | ChangeOrders.jsx | רשימת תוספות ושינויים בפרויקט |
| `/change/:changeId` | ChangeOrderForm.jsx | יצירה/עריכה של שינוי (קבלן) |
| `/approve/:projectId/:changeId` | ChangeOrderApproval.jsx | דף חיצוני ללקוח (בלי סיידבר) |

### דפים חדשים

**ChangeOrders.jsx** — רשימה בתוך הפרויקט
- כרטיסי שינויים עם סטטוס
- סה"כ תוספות שאושרו
- כפתור "תוספת חדשה"

**ChangeOrderForm.jsx** — יצירה/עריכה
- פרטי השינוי: תיאור, פריטים, מחירים
- תצוגה מקדימה של מה הלקוח יראה
- כפתור "שלח ללקוח לאישור" → מעתיק לינק
- כפתור "אשר ידנית" (אם הלקוח אישר בע"פ)

**ChangeOrderApproval.jsx** — דף חיצוני ללקוח
- בלי סיידבר (כמו WorkLogForm)
- מראה: שם פרויקט, פריטים, סכומים, מע"מ
- שדה שם + כפתור "מאשר"
- מסך אישור עם סיכום
- ממותג (לוגו + צבעי המערכת)

### חיבור לגבייה

**פרויקט רגיל (אבני דרך):**
- אישור שינוי → יוצר אבן דרך חדשה "תוספות ושינויים #X"
- percentage: 0 (סכום קבוע, לא אחוז)
- amount: סה"כ מכירה של השינוי
- billingStatus: "ממתין לאישור"

**פרויקט BOQ (חשבון חלקי):**
- אישור שינוי → מוסיף סעיפים חדשים ל-boqQuote.items
- הסעיפים החדשים מופיעים בחשבון החלקי הבא
- מסומנים כ"תוספת" בטבלה

### חיבור ל-Layout
- הוספת לינק "תוספות ושינויים" בסיידבר הפרויקט
- badge עם מספר שינויים ממתינים

### חיבור לדשבורד
- התראה: "X תוספות ממתינות לאישור לקוח"

### חיבור לסקירה כספית
- ערך חוזה = ערך מקורי + תוספות מאושרות
- שורה נפרדת: "תוספות ושינויים: +X₪"

---

## סדר עבודה

### שלב 1: סוג "כולל"
1. mockData.js — תוויות
2. BOQUpload.jsx — סוג חוקי + תבנית
3. BOQBuilder.jsx — כפתור רביעי
4. store.js — approveBOQQuote טיפול ב-combined
5. WorkLogForm.jsx — fallback ל-combined
6. ProjectOverview.jsx — תכנון מול ביצוע

### שלב 2: תוספות ושינויים
1. store.js — CRUD + approveChangeOrder
2. ChangeOrders.jsx — רשימה
3. ChangeOrderForm.jsx — יצירה/עריכה
4. ChangeOrderApproval.jsx — דף לקוח
5. App.jsx — routes
6. Layout.jsx — סיידבר
7. חיבור גבייה (milestone / BOQ)
8. חיבור דשבורד + סקירה כספית
