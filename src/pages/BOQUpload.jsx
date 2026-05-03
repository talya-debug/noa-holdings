import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileSpreadsheet, Download, Plus, AlertCircle, ChevronDown, ChevronUp, ArrowRight, Check } from 'lucide-react'
import * as XLSX from 'xlsx'
import { addBOQQuote } from '../data/store'

// סוגי סיווג
const TYPE_OPTIONS = [
  { value: 'procurement', label: 'רכש (חומר)' },
  { value: 'labor', label: 'כוח אדם (עבודה)' },
  { value: 'subcontractor', label: 'קבלן משנה' },
]

// ניחוש סוג לפי מילות מפתח בתיאור
function guessType(name) {
  const n = (name || '').toLowerCase()
  // קבלני משנה
  if (/קבלן|קב"מ|פאושלי|ביצוע מלא/.test(n)) return 'subcontractor'
  // עבודה
  if (/עבוד|צוות|יום עבודה|כוח אדם|התקנה|פירוק|הרכבה/.test(n)) return 'labor'
  // כולל = בד"כ קבלן משנה שעושה הכל
  if (/כולל עבודה|כולל התקנה|אספקה והתקנה|כולל חומר/.test(n)) return 'subcontractor'
  // רכש (ברירת מחדל)
  return 'procurement'
}

// ניחוש שם עמודה מתוך הכותרות בקובץ
function guessColumnMapping(cols) {
  const mapping = { description: '', quantity: '', unit: '', category: '', clause: '' }

  for (const col of cols) {
    const c = col.toLowerCase().trim()
    // תיאור/מהות
    if (!mapping.description && /מהות|תיאור|תאור|פריט|שם|description|item/.test(c)) mapping.description = col
    // כמות
    if (!mapping.quantity && /כמות|כמ|qty|quantity/.test(c)) mapping.quantity = col
    // יחידה
    if (!mapping.unit && /יחידה|יח|unit/.test(c)) mapping.unit = col
    // קטגוריה/פרק
    if (!mapping.category && /קטגוריה|פרק|תחום|category|section/.test(c)) mapping.category = col
    // סעיף
    if (!mapping.clause && /סעיף|מס|clause|item.?no|#/.test(c)) mapping.clause = col
  }

  return mapping
}

// זיהוי אם שורה היא כותרת (לא פריט אמיתי)
function isHeaderRow(row, descCol, qtyCol) {
  const desc = row[descCol]
  const qty = row[qtyCol]
  // אין כמות מספרית = כותרת
  if (!qty || isNaN(Number(qty)) || Number(qty) === 0) {
    // אבל יש תיאור = זו כותרת פרק
    if (desc && String(desc).trim().length > 0) return 'header'
    // אין כלום = שורה ריקה
    return 'empty'
  }
  return 'item'
}

export default function BOQUpload() {
  const navigate = useNavigate()
  const fileInputRef = useRef()
  const [step, setStep] = useState(1) // 1=פרטים, 2=מיפוי עמודות, 3=תצוגה מקדימה
  const [form, setForm] = useState({ clientName: '', clientPhone: '', address: '', projectName: '' })
  const [rawData, setRawData] = useState(null) // נתונים גולמיים מהאקסל
  const [columns, setColumns] = useState([]) // עמודות בקובץ
  const [mapping, setMapping] = useState({}) // מיפוי עמודות
  const [preview, setPreview] = useState(null) // תצוגה מקדימה
  const [headers, setHeaders] = useState([]) // שורות כותרת
  const [problems, setProblems] = useState([]) // שורות בעייתיות
  const [showProblems, setShowProblems] = useState(false)
  const [typesConfirmed, setTypesConfirmed] = useState(false)
  const [error, setError] = useState('')

  // שלב 1: העלאת קובץ
  const handleFile = (file) => {
    if (!file) return
    setError('')
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (rows.length === 0) { setError('הקובץ ריק'); return }

        const cols = Object.keys(rows[0])
        setRawData(rows)
        setColumns(cols)
        setMapping(guessColumnMapping(cols))
        setStep(2)
      } catch { setError('שגיאה בקריאת הקובץ. ודא שזה אקסל תקין.') }
    }
    reader.readAsArrayBuffer(file)
  }

  // שלב 2: אישור מיפוי → פרסור
  const handleConfirmMapping = () => {
    if (!mapping.description) { setError('חובה למפות עמודת תיאור'); return }
    if (!mapping.quantity) { setError('חובה למפות עמודת כמות'); return }
    setError('')

    const items = []
    const headerRows = []
    const problemRows = []
    let currentCategory = ''

    rawData.forEach((row, idx) => {
      const rowType = isHeaderRow(row, mapping.description, mapping.quantity)

      if (rowType === 'empty') return

      if (rowType === 'header') {
        const headerText = String(row[mapping.description] || '').trim()
        currentCategory = headerText
        headerRows.push({ idx, text: headerText })
        return
      }

      // שורת פריט
      const name = String(row[mapping.description] || '').trim()
      const qty = Number(row[mapping.quantity]) || 0

      if (!name) {
        problemRows.push({ idx, row, reason: 'חסר תיאור' })
        return
      }
      if (qty <= 0) {
        problemRows.push({ idx, row, reason: 'כמות לא תקינה' })
        return
      }

      // שמירת כל העמודות הנוספות
      const extraData = {}
      columns.forEach(col => {
        if (col !== mapping.description && col !== mapping.quantity && col !== mapping.unit && col !== mapping.category && col !== mapping.clause) {
          if (row[col] !== '' && row[col] !== undefined) extraData[col] = row[col]
        }
      })

      items.push({
        id: idx + 1,
        clause: mapping.clause ? String(row[mapping.clause] || '') : '',
        category: mapping.category ? String(row[mapping.category] || currentCategory || 'כללי') : (currentCategory || 'כללי'),
        name,
        unit: mapping.unit ? String(row[mapping.unit] || 'יח׳') : 'יח׳',
        quantity: qty,
        itemType: guessType(name),
        selected: true,
        extraData,
      })
    })

    setPreview(items)
    setHeaders(headerRows)
    setProblems(problemRows)
    setStep(3)
  }

  // שלב 3: אישור → יצירת BOQ
  const handleConfirm = () => {
    if (!form.clientName || !form.address) { setError('מלא שם לקוח וכתובת'); return }
    if (!typesConfirmed) { setError('חובה לאשר שבדקת את סיווג הפריטים לפני המשך'); return }
    const selectedItems = preview.filter(r => r.selected)
    if (selectedItems.length === 0) { setError('בחר לפחות פריט אחד'); return }

    const boqQuote = addBOQQuote({
      clientName: form.clientName,
      clientPhone: form.clientPhone,
      address: form.address,
      projectName: form.projectName,
      items: selectedItems.map(r => ({
        clause: r.clause,
        category: r.category,
        name: r.name,
        unit: r.unit,
        quantity: r.quantity,
        itemType: r.itemType,
        costPrice: 0,
        clientPrice: 0,
        extraData: r.extraData,
      })),
    })
    navigate(`/boq/${boqQuote.id}`)
  }

  // הורדת תבנית
  const handleDownloadTemplate = () => {
    const data = [
      { 'סעיף': '01.01', 'תיאור': 'בטון B30', 'יחידה': 'מ"ק', 'כמות': 120 },
      { 'סעיף': '', 'תיאור': 'פרק ב — חשמל', 'יחידה': '', 'כמות': '' },
      { 'סעיף': '02.01', 'תיאור': 'נקודות חשמל', 'יחידה': 'נק׳', 'כמות': 80 },
      { 'סעיף': '02.02', 'תיאור': 'קבלן חשמל — ביצוע מלא', 'יחידה': 'פאושלי', 'כמות': 1 },
      { 'סעיף': '03.01', 'תיאור': 'עבודות גבס כולל חומר', 'יחידה': 'מ"ר', 'כמות': 500 },
    ]
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 8 }, { wch: 8 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'כתב כמויות')
    XLSX.writeFile(wb, 'תבנית-כתב-כמויות.xlsx')
  }

  const categories = preview ? [...new Set(preview.filter(r => r.selected).map(r => r.category))] : []

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>כתב כמויות חדש</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>העלה כתב כמויות מאקסל — המערכת מזהה את העמודות אוטומטית</p>
      </div>

      {/* שלבים */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { num: 1, label: 'פרטים + קובץ' },
          { num: 2, label: 'מיפוי עמודות' },
          { num: 3, label: 'אישור' },
        ].map(s => (
          <div key={s.num} style={{
            flex: 1, padding: '10px', borderRadius: '8px', textAlign: 'center',
            background: step >= s.num ? 'var(--gold-bg)' : 'var(--dark)',
            border: step === s.num ? '1px solid var(--gold-border)' : '1px solid transparent',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: step >= s.num ? 'var(--gold)' : 'var(--text-muted)' }}>
              {step > s.num ? <Check size={14} style={{ verticalAlign: 'middle' }} /> : s.num}. {s.label}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          marginBottom: '16px', padding: '12px 16px', background: 'var(--danger-bg)',
          border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px',
          color: 'var(--danger)', fontSize: '13px', whiteSpace: 'pre-line',
          display: 'flex', alignItems: 'flex-start', gap: '8px',
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          {error}
        </div>
      )}

      {/* שלב 1: פרטים + העלאה */}
      {step === 1 && (
        <>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px' }}>פרטי הפרויקט</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>שם לקוח / מזמין *</label>
                <input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} placeholder="שם הלקוח או החברה" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>שם הפרויקט</label>
                <input value={form.projectName} onChange={e => setForm(p => ({ ...p, projectName: e.target.value }))} placeholder="לדוגמה: בניין מגורים" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>טלפון</label>
                <input value={form.clientPhone} onChange={e => setForm(p => ({ ...p, clientPhone: e.target.value }))} placeholder="054-1234567" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>כתובת *</label>
                <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="עיר, רחוב ומספר" />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px' }}>העלאת כתב כמויות</h3>
            <div style={{
              border: '2px dashed var(--gold-border)', borderRadius: '12px',
              padding: '50px 20px', textAlign: 'center', cursor: 'pointer',
              background: 'rgba(212,168,67,0.03)',
            }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
            >
              <FileSpreadsheet size={48} color="var(--gold)" style={{ marginBottom: '16px' }} />
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)', marginBottom: '8px' }}>
                גרור קובץ אקסל לכאן או לחץ לבחירה
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                כל פורמט אקסל — המערכת מזהה את העמודות אוטומטית
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                .xlsx, .xls, .csv
              </div>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={e => { handleFile(e.target.files[0]); e.target.value = '' }} style={{ display: 'none' }} />
            </div>

            <button className="btn btn-secondary btn-sm" style={{ marginTop: '14px' }} onClick={handleDownloadTemplate}>
              <Download size={14} />הורד תבנית לדוגמה
            </button>
          </div>
        </>
      )}

      {/* שלב 2: מיפוי עמודות */}
      {step === 2 && (
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginBottom: '6px' }}>
            מיפוי עמודות — נמצאו {columns.length} עמודות ו-{rawData.length} שורות
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            המערכת זיהתה אוטומטית. אם הזיהוי לא נכון — שני ידנית.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {[
              { key: 'description', label: 'תיאור / מהות *', required: true },
              { key: 'quantity', label: 'כמות *', required: true },
              { key: 'unit', label: 'יחידה' },
              { key: 'category', label: 'קטגוריה / פרק' },
              { key: 'clause', label: 'מספר סעיף' },
            ].map(field => (
              <div key={field.key} className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '13px' }}>
                  {field.label}
                  {mapping[field.key] && <Check size={12} style={{ color: 'var(--success)', marginRight: '4px' }} />}
                </label>
                <select value={mapping[field.key] || ''} onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}>
                  <option value="">— לא ממופה —</option>
                  {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* תצוגה מקדימה של 3 שורות ראשונות */}
          <div style={{ marginBottom: '20px', padding: '14px', background: 'var(--dark)', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              תצוגה מקדימה (3 שורות ראשונות):
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {columns.map(col => (
                      <th key={col} style={{
                        fontSize: '11px',
                        background: Object.values(mapping).includes(col) ? 'var(--gold-bg)' : 'var(--dark)',
                        color: Object.values(mapping).includes(col) ? 'var(--gold)' : 'var(--text-muted)',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawData.slice(0, 3).map((row, i) => (
                    <tr key={i}>
                      {columns.map(col => (
                        <td key={col} style={{ fontSize: '12px' }}>{row[col] !== undefined ? String(row[col]) : ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>חזור</button>
            <button className="btn btn-primary" onClick={handleConfirmMapping}>
              <ArrowRight size={16} />המשך לתצוגה מקדימה
            </button>
          </div>
        </div>
      )}

      {/* שלב 3: תצוגה מקדימה */}
      {step === 3 && preview && (
        <>
          {/* סיכום */}
          <div className="card" style={{ marginBottom: '16px', border: '1px solid var(--gold-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)', margin: 0 }}>
                  {preview.length} סעיפים זוהו
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {categories.length} קטגוריות • {headers.length} כותרות פרק • {problems.length} שורות בעייתיות
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setStep(2)}>חזור למיפוי</button>
                <button className="btn btn-primary" onClick={handleConfirm}>
                  <Plus size={16} />צור כתב כמויות ({preview.filter(r => r.selected).length} סעיפים)
                </button>
              </div>
            </div>
          </div>

          {/* שורות בעייתיות */}
          {problems.length > 0 && (
            <div className="card" style={{ marginBottom: '16px', border: '1px solid rgba(248,113,113,0.3)' }}>
              <div onClick={() => setShowProblems(!showProblems)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} color="var(--warning)" />
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{problems.length} שורות לא זוהו</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>לחץ לפרטים</span>
                </div>
                {showProblems ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {showProblems && (
                <div style={{ marginTop: '12px' }}>
                  {problems.map((p, i) => (
                    <div key={i} style={{
                      padding: '8px 12px', background: 'var(--dark)', borderRadius: '6px',
                      marginBottom: '4px', fontSize: '12px', display: 'flex', gap: '12px',
                    }}>
                      <span style={{ color: 'var(--warning)', fontWeight: 600 }}>שורה {p.idx + 2}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{p.reason}</span>
                      <span>{Object.values(p.row).filter(v => v).join(' | ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* כותרות פרק שזוהו */}
          {headers.length > 0 && (
            <div style={{
              display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center' }}>פרקים שזוהו:</span>
              {headers.map((h, i) => (
                <span key={i} className="badge badge-gold" style={{ fontSize: '11px' }}>{h.text}</span>
              ))}
            </div>
          )}

          {/* אישור סיווג */}
          <div className="card" style={{
            marginBottom: '16px',
            background: typesConfirmed ? 'var(--success-bg)' : 'var(--warning-bg)',
            border: typesConfirmed ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(251,191,36,0.3)',
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={typesConfirmed} onChange={e => setTypesConfirmed(e.target.checked)}
                style={{ marginTop: '3px', width: '18px', height: '18px' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                  {typesConfirmed ? 'אישרתי — הסיווגים נבדקו' : 'חובה: בדוק את סיווג הפריטים (רכש / עבודה / קב"מ / כולל)'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  סיווג שגוי ישפיע על מעקב רכש, יומני עבודה, ניהול קב"מ והסקירה הכספית של הפרויקט.
                  עבור על העמודה האחרונה בטבלה ושנה אם צריך.
                </div>
              </div>
            </label>
          </div>

          {/* טבלת פריטים */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input type="checkbox" checked={preview.every(r => r.selected)}
                        onChange={() => {
                          const all = preview.every(r => r.selected)
                          setPreview(preview.map(r => ({ ...r, selected: !all })))
                        }} />
                    </th>
                    <th style={{ width: '60px' }}>סעיף</th>
                    <th>קטגוריה</th>
                    <th>תיאור</th>
                    <th style={{ width: '70px' }}>יחידה</th>
                    <th style={{ width: '70px' }}>כמות</th>
                    <th style={{ width: '110px' }}>סוג</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} style={{ opacity: row.selected ? 1 : 0.4 }}>
                      <td>
                        <input type="checkbox" checked={row.selected}
                          onChange={() => {
                            const updated = [...preview]
                            updated[i] = { ...updated[i], selected: !updated[i].selected }
                            setPreview(updated)
                          }} />
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--gold)', fontSize: '12px' }}>{row.clause}</td>
                      <td style={{ fontSize: '12px' }}>{row.category}</td>
                      <td style={{ fontWeight: 500 }}>
                        {row.name}
                        {row.extraData && Object.keys(row.extraData).length > 0 && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {Object.entries(row.extraData).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '12px' }}>{row.unit}</td>
                      <td style={{ fontWeight: 600 }}>{row.quantity}</td>
                      <td>
                        <select value={row.itemType} onChange={e => {
                          const updated = [...preview]
                          updated[i] = { ...updated[i], itemType: e.target.value }
                          setPreview(updated)
                        }} style={{ padding: '4px 6px', fontSize: '11px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                          background: row.itemType === 'procurement' ? 'var(--info-bg)' : row.itemType === 'labor' ? 'var(--warning-bg)' : row.itemType === 'subcontractor' ? 'var(--success-bg)' : 'var(--gold-bg)',
                          color: row.itemType === 'procurement' ? 'var(--info)' : row.itemType === 'labor' ? 'var(--warning)' : row.itemType === 'subcontractor' ? 'var(--success)' : 'var(--gold)',
                          fontWeight: 600,
                        }}>
                          {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
