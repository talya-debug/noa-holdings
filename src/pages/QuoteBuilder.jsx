import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Save, CheckCircle, X, FileDown, Upload, FileSpreadsheet, Download } from 'lucide-react'
import { findPriceItem, calcQuoteTotals, formatCurrency, formatDate, getStatusLabel, getStatusBadgeClass, categoryIcons, getCategories, getTypeLabel, getTypeBadgeClass, masterPriceList } from '../data/mockData'
import { getQuote, updateQuote, approveQuote, getPriceList, addPriceItem } from '../data/store'
import * as XLSX from 'xlsx'

export default function QuoteBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quote, setQuote] = useState(() => getQuote(Number(id)))
  const [priceList] = useState(getPriceList())
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [addMode, setAddMode] = useState('manual') // 'manual' | 'excel'
  const [importPreview, setImportPreview] = useState(null) // תצוגה מקדימה של ייבוא
  const fileInputRef = useRef()
  const printRef = useRef()

  if (!quote) return <div className="animate-in"><div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>הצעת מחיר לא נמצאה</div></div>

  const categories = [...new Set(priceList.map(i => i.category))]
  const categoryItems = selectedCategory ? priceList.filter(i => i.category === selectedCategory) : []
  const totals = calcQuoteTotals(quote.items || [])

  // פריטים מורחבים
  const enrichedItems = (quote.items || []).map(qi => {
    const pi = priceList.find(p => p.id === qi.priceItemId) || findPriceItem(qi.priceItemId)
    if (!pi) return null
    const totalCost = pi.costPrice * qi.quantity
    const totalSell = qi.clientPrice * qi.quantity
    return { ...qi, ...pi, totalCost, totalSell, profit: totalSell - totalCost }
  }).filter(Boolean)

  // קיבוץ לפי קטגוריה
  const groupedItems = {}
  enrichedItems.forEach(item => {
    if (!groupedItems[item.category]) groupedItems[item.category] = []
    groupedItems[item.category].push(item)
  })

  // קטגוריות שנבחרו בהצעה
  const selectedCategories = [...new Set(enrichedItems.map(i => i.category))]

  const saveQuote = (updates) => {
    const updated = { ...quote, ...updates }
    updateQuote(quote.id, updates)
    setQuote(updated)
  }

  // שמירת items + milestones ביחד כדי שלא ידרסו אחד את השני
  const saveItemsWithMilestones = (newItems) => {
    const findItem = (id) => priceList.find(p => p.id === id) || findPriceItem(id)
    const cats = [...new Set(newItems.map(qi => findItem(qi.priceItemId)?.category).filter(Boolean))]

    const newMilestones = [{ name: 'מקדמה', percentage: 30, completionCriteria: 'חתימת חוזה' }]
    const perCat = cats.length > 0 ? Math.floor(60 / cats.length) : 0
    let remainder = 60 - (perCat * cats.length)
    cats.forEach((cat, i) => {
      newMilestones.push({
        name: `סיום ${cat}`,
        percentage: perCat + (i === 0 ? remainder : 0),
        completionCriteria: `כל משימות ${cat} הושלמו`,
      })
    })
    newMilestones.push({ name: 'גמר + פרוטוקול מסירה', percentage: 10, completionCriteria: 'פרוטוקול מסירה חתום' })

    // שמירה אטומית — items + milestones ביחד
    saveQuote({ items: newItems, milestones: newMilestones })
  }

  const handleAddItem = () => {
    if (!selectedItemId) return
    const itemId = Number(selectedItemId)
    const pi = priceList.find(p => p.id === itemId) || findPriceItem(itemId)
    if (!pi) return
    if ((quote.items || []).find(qi => qi.priceItemId === pi.id)) return
    const newItems = [...(quote.items || []), { priceItemId: pi.id, quantity: 1, clientPrice: Math.round(pi.costPrice * 1.3) }]
    saveItemsWithMilestones(newItems)
    setSelectedItemId('')
  }

  const handleRemoveItem = (priceItemId) => {
    const newItems = (quote.items || []).filter(qi => qi.priceItemId !== priceItemId)
    saveItemsWithMilestones(newItems)
  }

  const handleItemChange = (priceItemId, field, value) => {
    const newItems = (quote.items || []).map(qi =>
      qi.priceItemId === priceItemId ? { ...qi, [field]: Number(value) || 0 } : qi
    )
    saveQuote({ items: newItems })
  }

  // אבני דרך
  const milestones = quote.milestones || []
  const totalPercentage = milestones.reduce((s, m) => s + (m.percentage || 0), 0)

  const handleMilestoneChange = (index, field, value) => {
    const newMs = milestones.map((m, i) =>
      i === index ? { ...m, [field]: field === 'percentage' ? (Number(value) || 0) : value } : m
    )
    saveQuote({ milestones: newMs })
  }

  // === ייבוא כתב כמויות מאקסל ===
  const REQUIRED_COLUMNS = ['סעיף', 'קטגוריה', 'מהות', 'יחידה', 'כמות']

  const handleExcelUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws)

      if (rows.length === 0) { alert('הקובץ ריק'); return }

      // בדיקת עמודות חובה
      const firstRow = rows[0]
      const cols = Object.keys(firstRow)
      const missing = REQUIRED_COLUMNS.filter(c => !cols.includes(c))
      if (missing.length > 0) {
        alert(`חסרות עמודות בקובץ:\n${missing.join(', ')}\n\nהעמודות הנדרשות: סעיף, קטגוריה, מהות, יחידה, כמות\n\nהורד תבנית לדוגמה ומלא לפי הפורמט.`)
        return
      }

      const parsed = rows
        .filter(row => row['מהות'] && row['כמות']) // רק שורות עם תוכן
        .map((row, idx) => ({
          idx,
          clause: String(row['סעיף'] || ''),
          category: String(row['קטגוריה'] || 'כללי'),
          name: String(row['מהות'] || ''),
          unit: String(row['יחידה'] || 'יח׳'),
          quantity: Number(row['כמות']) || 0,
          selected: true,
        }))

      setImportPreview(parsed)
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const handleImportConfirm = () => {
    if (!importPreview) return
    const selectedItems = importPreview.filter(r => r.selected)
    const newItems = [...(quote.items || [])]

    selectedItems.forEach(row => {
      // יוצרים פריט חדש במחירון עם מחיר 0 — הקבלן ימלא אח"כ
      const newPriceItem = addPriceItem({
        category: row.category,
        name: row.name,
        unit: row.unit,
        type: 'material',
        costPrice: 0,
      })
      newItems.push({
        priceItemId: newPriceItem.id,
        quantity: row.quantity,
        clientPrice: 0, // הקבלן ימלא מחיר ללקוח בטבלה
      })
    })

    saveItemsWithMilestones(newItems)
    setImportPreview(null)
    setAddMode('manual')
  }

  // הורדת תבנית כתב כמויות
  const handleDownloadTemplate = () => {
    const templateData = [
      { 'סעיף': '01.01', 'קטגוריה': 'עבודות שלד', 'מהות': 'בטון B30', 'יחידה': 'מ"ק', 'כמות': 120 },
      { 'סעיף': '01.02', 'קטגוריה': 'עבודות שלד', 'מהות': 'ברזל זיון', 'יחידה': 'טון', 'כמות': 8 },
      { 'סעיף': '01.03', 'קטגוריה': 'עבודות שלד', 'מהות': 'תבניות/קופסנות', 'יחידה': 'מ"ר', 'כמות': 300 },
      { 'סעיף': '02.01', 'קטגוריה': 'חשמל', 'מהות': 'נקודות חשמל', 'יחידה': 'נק׳', 'כמות': 80 },
      { 'סעיף': '02.02', 'קטגוריה': 'חשמל', 'מהות': 'לוח חשמל ראשי', 'יחידה': 'יח׳', 'כמות': 1 },
      { 'סעיף': '03.01', 'קטגוריה': 'אינסטלציה', 'מהות': 'צנרת מים', 'יחידה': 'מ"א', 'כמות': 150 },
      { 'סעיף': '04.01', 'קטגוריה': 'ריצוף וחיפוי', 'מהות': 'אריחי ריצוף פנים', 'יחידה': 'מ"ר', 'כמות': 180 },
    ]
    const ws = XLSX.utils.json_to_sheet(templateData)
    ws['!cols'] = [{ wch: 8 }, { wch: 15 }, { wch: 25 }, { wch: 8 }, { wch: 8 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'כתב כמויות')
    XLSX.writeFile(wb, 'תבנית-כתב-כמויות.xlsx')
  }

  const addMilestone = () => saveQuote({ milestones: [...milestones, { name: '', percentage: 0, completionCriteria: '' }] })
  const removeMilestone = (index) => saveQuote({ milestones: milestones.filter((_, i) => i !== index) })

  const handleApprove = () => {
    if (totalPercentage !== 100) { alert('סה"כ אחוזי אבני דרך חייב להיות 100%'); return }
    if (!confirm('לאשר הצעה וליצור פרויקט?')) return
    const project = approveQuote(quote.id)
    if (project) navigate(`/project/${project.id}`)
  }

  // === הפקת PDF ללקוח ===
  const handleExportPDF = () => {
    const categoryTotals = Object.entries(groupedItems).map(([cat, items]) => {
      const catTotal = items.reduce((s, item) => s + (item.clientPrice * item.quantity), 0)
      return { category: cat, total: catTotal }
    })

    const totalWithVat = Math.round(totals.totalSell * 1.18)
    const vatAmount = totalWithVat - totals.totalSell

    // פתיחת חלון חדש עם ה-PDF — margin:0 מסיר כיתובי דפדפן
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="he"><head><meta charset="UTF-8">
<title>הצעת מחיר ${quote.number}</title>
<style>
@page{size:A4;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,'Heebo',sans-serif;color:#222;font-size:10px;line-height:1.35;direction:rtl;padding:18mm 14mm 10mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.hdr{border-bottom:2px solid #D4A843;padding-bottom:10px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-end}
.logo{font-size:26px;font-weight:900;color:#D4A843;font-family:Arial}
.logo span{display:block;font-size:8px;font-weight:400;color:#999;letter-spacing:2px}
.hdr-l{text-align:left;font-size:10px;color:#777}
.dn{font-size:12px;font-weight:700;color:#D4A843}
.greet{background:#faf7f0;padding:10px 14px;margin-bottom:14px;border-right:3px solid #D4A843;font-size:11px;color:#444}
.greet b{color:#D4A843}
h2{font-size:12px;color:#D4A843;margin:12px 0 6px;padding-bottom:3px;border-bottom:1px solid #ddd;font-weight:700}
table.t{width:100%;border-collapse:collapse;margin-bottom:12px}
table.t th{background:#f5f0e3;color:#8a7530;padding:5px 8px;font-size:9px;border-bottom:2px solid #D4A843;text-align:right}
table.t th.l{text-align:left}
table.t td{padding:5px 8px;border-bottom:1px solid #eee;font-size:10px}
table.t td.l{text-align:left;font-weight:600}
table.t .tot td{background:#fdf8ec;font-weight:700;color:#D4A843;border-top:2px solid #D4A843}
.sum{width:100%;border-collapse:collapse;margin:14px 0;background:#1a1a2e;color:#fff}
.sum td{padding:10px;text-align:center;font-size:9px;color:#bbb;width:33.3%}
.sum .v{display:block;font-size:15px;font-weight:700;color:#D4A843;margin-top:2px}
.sum .vb{font-size:17px}
.sum td+td{border-right:1px solid rgba(255,255,255,.15)}
.terms{background:#f7f7f7;padding:8px 12px;margin-bottom:8px;font-size:9px;color:#555}
.terms b{color:#333;font-size:10px;display:block;margin-bottom:3px}
.terms ul{padding-right:14px;margin:0}
.terms li{margin-bottom:1px}
.sigs{margin-top:14px;padding-top:8px;border-top:1px solid #ddd;display:flex;justify-content:space-between}
.sig{width:42%;text-align:center}
.sig .line{border-bottom:1px solid #bbb;height:26px;margin-bottom:3px}
.sig .name{font-size:9px;color:#888}
.ft{text-align:center;color:#ccc;font-size:8px;margin-top:8px;padding-top:5px;border-top:1px solid #eee}
</style></head><body>

<div class="hdr">
  <div><div class="logo">NH<span>NOA HOLDINGS</span></div></div>
  <div class="hdr-l"><div class="dn">הצעת מחיר ${quote.number}</div>${formatDate(quote.date)}<br>תוקף: 30 יום</div>
</div>

<div class="greet">שלום רב <b>${quote.clientName}</b>,<br>בהמשך לשיחתנו, מצורפת הצעתנו עבור <b>${quote.address}</b>. להלן פירוט העבודות והתנאים:</div>

<h2>פירוט עבודות</h2>
<table class="t">
<tr><th>תחום</th><th class="l" style="width:100px">סכום</th></tr>
${categoryTotals.map(c => `<tr><td>${c.category}</td><td class="l">${c.total.toLocaleString()} ₪</td></tr>`).join('')}
<tr class="tot"><td>סה"כ</td><td class="l">${totals.totalSell.toLocaleString()} ₪</td></tr>
</table>

<h2>תנאי תשלום</h2>
<table class="t">
<tr><th style="width:24px">#</th><th>שלב</th><th style="width:40px">אחוז</th><th class="l" style="width:90px">סכום</th></tr>
${milestones.map((ms, i) => `<tr><td>${i + 1}</td><td>${ms.name}</td><td>${ms.percentage}%</td><td class="l">${Math.round(totals.totalSell * ms.percentage / 100).toLocaleString()} ₪</td></tr>`).join('')}
<tr class="tot"><td colspan="2">סה"כ</td><td>100%</td><td class="l">${totals.totalSell.toLocaleString()} ₪</td></tr>
</table>

<table class="sum"><tr>
<td>לפני מע"מ<span class="v">${totals.totalSell.toLocaleString()} ₪</span></td>
<td>מע"מ 18%<span class="v">${vatAmount.toLocaleString()} ₪</span></td>
<td>סה"כ לתשלום<span class="v vb">${totalWithVat.toLocaleString()} ₪</span></td>
</tr></table>

<div class="terms">
<b>תנאים והערות</b>
<ul>
<li>הצעה זו בתוקף ל-30 יום מתאריך ההנפקה</li>
<li>המחירים אינם כוללים מע"מ אלא אם צוין אחרת</li>
<li>לוח זמנים משוער ייקבע עם חתימת ההסכם ויותאם לתנאי השטח</li>
<li>שינויים ותוספות יתומחרו בנפרד ויאושרו מראש</li>
<li>ההצעה אינה כוללת: אגרות והיטלים, עבודות לא מפורטות לעיל, ריהוט ומוצרי חשמל</li>
<li>תשלומים בהתאם לאבני הדרך לעיל, בתוך 7 ימי עבודה מהשלמת כל שלב</li>
<li>אחריות: 12 חודשים על כלל העבודות מיום המסירה, בכפוף לשימוש סביר</li>
</ul>
</div>

<div class="sigs">
<div class="sig"><div class="line"></div><div class="name">נעה אחזקות בע"מ</div></div>
<div class="sig"><div class="line"></div><div class="name">${quote.clientName}</div></div>
</div>

<div class="ft">נעה אחזקות בע"מ | ${quote.number} | ${formatDate(quote.date)}</div>

<script>window.onload=()=>window.print()</script>
</body></html>`)
    win.document.close()
  }

  return (
    <div className="animate-in">
      {/* כותרת */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{quote.number}</h1>
            <span className={`badge ${getStatusBadgeClass(quote.status)}`}>{getStatusLabel(quote.status)}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            {quote.clientName} • {quote.address} • {formatDate(quote.date)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}>
            <FileDown size={16} />PDF ללקוח
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => alert('נשמר!')}>
            <Save size={16} />שמור
          </button>
          {quote.status !== 'approved' && (
            <button className="btn btn-primary btn-sm" onClick={handleApprove}>
              <CheckCircle size={16} />אשר → צור פרויקט
            </button>
          )}
        </div>
      </div>

      {/* סרגל סיכום - סדר: מכירה, עלות, רווח */}
      <div className="card" style={{
        position: 'sticky', top: '0', zIndex: 10,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 45%), 1fr))', gap: '12px',
        marginBottom: '24px', background: 'var(--dark-card)', border: '1px solid var(--gold-border)',
      }}>
        {[
          { label: 'מכירה כוללת', value: formatCurrency(totals.totalSell), color: 'var(--gold)' },
          { label: 'עלות כוללת', value: formatCurrency(totals.totalCost), color: 'var(--danger)' },
          { label: 'רווח', value: formatCurrency(totals.profit), color: 'var(--success)' },
          { label: 'אחוז רווח', value: `${totals.profitMargin}%`, color: totals.profitMargin >= 25 ? 'var(--success)' : totals.profitMargin >= 15 ? 'var(--warning)' : 'var(--danger)' },
          { label: 'פריטים', value: (quote.items || []).length, color: 'var(--text-primary)' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* הוספת פריט — טאבים */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '2px solid var(--dark-border)' }}>
          {[
            { key: 'manual', label: 'בחירה מהמחירון', icon: Plus },
            { key: 'excel', label: 'ייבוא מאקסל', icon: Upload },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setAddMode(tab.key); setImportPreview(null) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', fontSize: '13px', fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer',
                color: addMode === tab.key ? 'var(--gold)' : 'var(--text-muted)',
                borderBottom: addMode === tab.key ? '2px solid var(--gold)' : '2px solid transparent',
                marginBottom: '-2px',
              }}>
              <tab.icon size={16} />{tab.label}
            </button>
          ))}
        </div>

        {addMode === 'manual' && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
              <label style={{ fontSize: '12px' }}>קטגוריה</label>
              <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setSelectedItemId('') }}>
                <option value="">— בחר קטגוריה —</option>
                {categories.map(c => <option key={c} value={c}>{categoryIcons[c] || '📦'} {c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, flex: '1 1 250px' }}>
              <label style={{ fontSize: '12px' }}>פריט</label>
              <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} disabled={!selectedCategory}>
                <option value="">— בחר פריט —</option>
                {categoryItems.map(ci => (
                  <option key={ci.id} value={ci.id}>{ci.name} ({ci.unit}) - {formatCurrency(ci.costPrice)}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleAddItem} disabled={!selectedItemId} style={{ height: '40px' }}>
              <Plus size={16} />הוסף
            </button>
          </div>
        )}

        {addMode === 'excel' && !importPreview && (
          <div>
            <div style={{
              border: '2px dashed var(--gold-border)', borderRadius: '12px',
              padding: '40px', textAlign: 'center', cursor: 'pointer',
              background: 'rgba(212,168,67,0.03)',
            }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { const input = fileInputRef.current; const dt = new DataTransfer(); dt.items.add(f); input.files = dt.files; handleExcelUpload({ target: input }) } }}
            >
              <FileSpreadsheet size={40} color="var(--gold)" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--gold)', marginBottom: '8px' }}>
                גרור קובץ אקסל לכאן או לחץ לבחירה
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                תומך ב-Excel (.xlsx, .xls) וב-CSV
              </div>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} style={{ display: 'none' }} />
            </div>

            <div style={{ marginTop: '16px', padding: '16px', background: 'var(--dark)', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                עמודות נדרשות בקובץ:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <div><span style={{ color: 'var(--gold)' }}>תיאור</span> — שם הפריט (חובה)</div>
                <div><span style={{ color: 'var(--gold)' }}>כמות</span> — כמות (חובה)</div>
                <div><span style={{ color: 'var(--gold)' }}>יחידה</span> — מ"ר, מ"א, יח׳...</div>
                <div><span style={{ color: 'var(--gold)' }}>קטגוריה</span> — תחום עבודה</div>
                <div><span style={{ color: 'var(--gold)' }}>מחיר עלות</span> — מחיר ליחידה</div>
                <div><span style={{ color: 'var(--gold)' }}>מחיר ללקוח</span> — מחיר מכירה</div>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }} onClick={handleDownloadTemplate}>
                <Download size={14} />הורד תבנית לדוגמה
              </button>
            </div>
          </div>
        )}

        {addMode === 'excel' && importPreview && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)' }}>
                נמצאו {importPreview.length} פריטים — בחר מה לייבא
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setImportPreview(null)}>
                  ביטול
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleImportConfirm}>
                  <Plus size={14} />ייבא {importPreview.filter(r => r.selected).length} פריטים
                </button>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>בחר</th>
                    <th>תיאור</th>
                    <th>קטגוריה</th>
                    <th>יחידה</th>
                    <th>כמות</th>
                    <th>עלות</th>
                    <th>מחיר ללקוח</th>
                    <th>התאמה</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((row, i) => (
                    <tr key={i} style={{ opacity: row.selected ? 1 : 0.4 }}>
                      <td>
                        <input type="checkbox" checked={row.selected}
                          onChange={() => {
                            const updated = [...importPreview]
                            updated[i] = { ...updated[i], selected: !updated[i].selected }
                            setImportPreview(updated)
                          }}
                        />
                      </td>
                      <td style={{ fontWeight: 500 }}>{row.name}</td>
                      <td>{row.category}</td>
                      <td>{row.unit}</td>
                      <td>{row.quantity}</td>
                      <td>{row.costPrice > 0 ? formatCurrency(row.costPrice) : '-'}</td>
                      <td>{row.clientPrice > 0 ? formatCurrency(row.clientPrice) : '-'}</td>
                      <td>
                        {row.matchedItem ? (
                          <span className="badge badge-success" style={{ fontSize: '11px' }}>נמצא במחירון</span>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: '11px' }}>פריט חדש</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* טבלת פריטים - מיושרת */}
      <div className="card" style={{ marginBottom: '24px', padding: 0 }}>
        <div style={{ padding: '20px 20px 0' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px' }}>
            פריטים בהצעה ({(quote.items || []).length})
          </h3>
        </div>

        {Object.keys(groupedItems).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            אין פריטים. הוסף פריטים מהמחירון למעלה.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>שם</th>
                  <th>סוג</th>
                  <th>יחידה</th>
                  <th>עלות ליח׳</th>
                  <th style={{ width: '80px' }}>כמות</th>
                  <th style={{ width: '100px' }}>מחיר ללקוח</th>
                  <th>סה"כ עלות</th>
                  <th>סה"כ מכירה</th>
                  <th>רווח</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedItems).map(([cat, items]) => (
                  <>
                    <tr key={`cat-${cat}`}>
                      <td colSpan="10" style={{
                        background: 'rgba(212,168,67,0.06)', fontWeight: 600,
                        fontSize: '13px', color: 'var(--gold)', padding: '10px 16px',
                      }}>
                        {categoryIcons[cat] || '📦'} {cat}
                      </td>
                    </tr>
                    {items.map(item => (
                      <tr key={item.priceItemId}>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td>
                          <span className={`badge ${getTypeBadgeClass(item.type)}`} style={{ fontSize: '11px' }}>
                            {getTypeLabel(item.type)}
                          </span>
                        </td>
                        <td>{item.unit}</td>
                        <td>{formatCurrency(item.costPrice)}</td>
                        <td>
                          <input type="number" min="0" value={item.quantity}
                            onChange={e => handleItemChange(item.priceItemId, 'quantity', e.target.value)}
                            style={{ width: '70px', textAlign: 'center', padding: '5px 8px', fontSize: '13px' }}
                          />
                        </td>
                        <td>
                          <input type="number" min="0" value={item.clientPrice}
                            onChange={e => handleItemChange(item.priceItemId, 'clientPrice', e.target.value)}
                            style={{ width: '90px', textAlign: 'center', padding: '5px 8px', fontSize: '13px' }}
                          />
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatCurrency(item.totalCost)}</td>
                        <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{formatCurrency(item.totalSell)}</td>
                        <td style={{ color: item.profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                          {formatCurrency(item.profit)}
                        </td>
                        <td>
                          <button onClick={() => handleRemoveItem(item.priceItemId)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* אבני דרך - דינמיות */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', margin: 0 }}>
            אבני דרך לגבייה
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontSize: '12px', fontWeight: 600,
              color: totalPercentage === 100 ? 'var(--success)' : 'var(--danger)',
            }}>
              סה"כ: {totalPercentage}% {totalPercentage !== 100 && '(חייב 100%)'}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => saveItemsWithMilestones(quote.items || [])}>
              חישוב אוטומטי
            </button>
            <button className="btn btn-secondary btn-sm" onClick={addMilestone}>
              <Plus size={14} />הוסף
            </button>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr><th>#</th><th>שם</th><th>תנאי סיום</th><th style={{ width: '80px' }}>אחוז</th><th>סכום</th><th style={{ width: '40px' }}></th></tr>
            </thead>
            <tbody>
              {milestones.map((ms, i) => {
                const amount = Math.round(totals.totalSell * (ms.percentage || 0) / 100)
                return (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td>
                      <input value={ms.name} onChange={e => handleMilestoneChange(i, 'name', e.target.value)}
                        style={{ width: '100%', minWidth: '150px', padding: '5px 8px', fontSize: '13px' }}
                      />
                    </td>
                    <td>
                      <input value={ms.completionCriteria || ''} onChange={e => handleMilestoneChange(i, 'completionCriteria', e.target.value)}
                        placeholder="מה מגדיר סיום..."
                        style={{ width: '100%', minWidth: '150px', padding: '5px 8px', fontSize: '12px', color: 'var(--text-muted)' }}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="number" min="0" max="100" value={ms.percentage}
                          onChange={e => handleMilestoneChange(i, 'percentage', e.target.value)}
                          style={{ width: '55px', textAlign: 'center', padding: '5px', fontSize: '13px' }}
                        />
                        <span style={{ fontSize: '12px' }}>%</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--gold)', whiteSpace: 'nowrap' }}>{formatCurrency(amount)}</td>
                    <td>
                      <button onClick={() => removeMilestone(i)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}>
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
