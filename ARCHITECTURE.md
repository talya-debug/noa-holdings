# ProBuild (contractor-demo) — ארכיטקטורה מלאה

## סקירה כללית
מערכת ניהול פרויקטי בנייה לקבלנים. React+Vite, localStorage בלבד (בלי Supabase מחובר), עברית RTL, עיצוב כהה+זהב.

## מבנה קבצים

```
src/
├── main.jsx              # נקודת כניסה (HashRouter)
├── App.jsx               # 22 routes
├── index.css             # כל ה-CSS הגלובלי
├── components/
│   └── Layout.jsx        # סיידבר + תוכן ראשי
├── data/
│   ├── mockData.js       # מחירון (67 פריטים), דמו, פונקציות עזר
│   └── store.js          # שכבת CRUD על localStorage (קידומת pb_)
└── pages/
    ├── Dashboard.jsx          # דשבורד ראשי
    ├── Tutorial.jsx           # הדרכה 5 שלבים
    ├── PriceList.jsx          # מחירון מאסטר
    ├── Quotes.jsx             # רשימת הצעות מחיר
    ├── QuoteBuilder.jsx       # עורך הצעת מחיר + PDF + אקסל
    ├── BOQUpload.jsx          # ייבוא כתב כמויות מאקסל
    ├── BOQBuilder.jsx         # עורך כתב כמויות
    ├── PlanAnalyzer.jsx       # ניתוח תוכניות (דמו בלבד)
    ├── Projects.jsx           # רשימת פרויקטים
    ├── ProjectDetail.jsx      # דף פרויקט ראשי
    ├── ProjectTasks.jsx       # משימות
    ├── Procurement.jsx        # רכש
    ├── Subcontractors.jsx     # קבלני משנה
    ├── WorkLogs.jsx           # יומני עבודה (צפייה)
    ├── WorkLogForm.jsx        # טופס יומן (חיצוני, בלי סיידבר)
    ├── ProjectBilling.jsx     # גבייה לפי אבני דרך
    ├── BOQBilling.jsx         # חשבונות חלקיים (כתב כמויות)
    ├── ProjectOverview.jsx    # סקירה כספית
    ├── ProjectDocuments.jsx   # מסמכים (מטא-דאטה בלבד)
    ├── ProjectAlerts.jsx      # התראות אוטומטיות
    ├── ProjectTimeline.jsx    # ציר זמן
    └── WorkBreakdown.jsx      # שבור! מייבא פונקציות שלא קיימות
```

## מודל נתונים (localStorage)

| ישות | מפתח | שדות עיקריים |
|------|------|-------------|
| מחירון | `pb_priceList` | id, category, name, unit, type, costPrice |
| הצעות מחיר | `pb_quotes` | id, number, clientName, address, status, items[], milestones[] |
| הצעות BOQ | `pb_boqQuotes` | id, number, clientName, type:'boq', items[] |
| פרויקטים | `pb_projects` | id, quoteId/boqQuoteId, billingType, name, status |
| אבני דרך | `pb_milestones` | id, projectId, name, percentage, amount, billingStatus, paidAmount |
| משימות | `pb_projectTasks` | id, projectId, name, category, type, budgetQty, budgetCost, clientPrice, status |
| רכישות | `pb_purchases` | id, projectId, taskId, name, category, orders[], budgetTotal |
| יומני עבודה | `pb_workLogs` | id, projectId, date, managerName, entries[], laborCost |
| קבלני משנה | `pb_subcontractors` | id, projectId, name, contractAmount, paid, pending |
| מסמכים | `pb_documents` | id, projectId, name, category (מטא-דאטה בלבד) |
| חשבונות חלקיים | `pb_partialInvoices` | id, projectId, items[], totalAmount, paidAmount |

## זרימת נתונים

```
מחירון מאסטר
    ↓
הצעת מחיר (בחירת פריטים + כמויות + מחירי לקוח)
    ↓  [אישור]
פרויקט נוצר אוטומטית + אבני דרך + משימות + רכישות
    ↓
ניהול שוטף: רכש, יומנים, קבלני משנה, גבייה
    ↓
סקירה כספית: תכנון מול ביצוע
```

זרימה מקבילה ל-BOQ:
```
ייבוא אקסל → כתב כמויות → סיווג פריטים → אישור → פרויקט
```

## באגים קריטיים

1. **WorkBreakdown.jsx** — מייבא `masterTemplate`, `findMasterItem` ועוד — לא קיימים ב-mockData. הדף יקרוס.
2. **QuoteBuilder.jsx** — קורא ל-`autoUpdateMilestones` שלא מוגדר בקובץ. קריסה בייבוא אקסל.
3. **React key warnings** — fragments בלי key בתוך `.map()` ב-QuoteBuilder וב-BOQBuilder.

## חבילות לא בשימוש
- `@supabase/supabase-js` — מותקן אבל אין קוד Supabase
- `html2pdf.js` — לא מיובא בשום מקום
- `react-hot-toast` — לא מיובא בשום מקום
- `playwright` — ב-dependencies (צריך להיות dev, ולא בכלל)

## הבדלים מ-golden-x

golden-x הוא גרסה ישנה יותר וחסרים בה:
- BOQ (ייבוא כתב כמויות + BOQBuilder + BOQBilling)
- PlanAnalyzer
- ProjectDocuments
- ProjectAlerts
- ProjectTimeline
- חשבונות חלקיים
- ייבוא/ייצוא אקסל

**contractor-demo הוא הטמפלט המתקדם. golden-x הוא עותק ישן.**
