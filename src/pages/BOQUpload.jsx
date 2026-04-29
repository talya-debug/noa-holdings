import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileSpreadsheet, Download, X, Plus } from 'lucide-react'
import * as XLSX from 'xlsx'
import { addBOQQuote } from '../data/store'

// עמודות חובה בכתב כמויות
const REQUIRED_COLUMNS = ['סעיף', 'קטגוריה', 'מהות', 'יחידה', 'כמות', 'סוג']
const VALID_TYPES = { 'רכש': 'procurement', 'כוח אדם': 'labor', 'קבלן משנה': 'subcontractor' }

export default function BOQUpload() {
  const navigate = useNavigate()
  const fileInputRef = useRef()
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ clientName: '', clientPhone: '', address: '', projectName: '' })
  const [step, setStep] = useState(1) // 1=פרטי לקוח, 2=העלאת קובץ

  // העלאת קובץ אקסל
  const handleFile = (file) => {
    if (!file) return
    setError('')
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws)

        if (rows.length === 0) { setError('הקובץ ריק'); return }

        // בדיקת עמודות חובה
        const cols = Object.keys(rows[0])
        const missing = REQUIRED_COLUMNS.filter(c => !cols.includes(c))
        if (missing.length > 0) {
          setError(`חסרות עמודות: ${missing.join(', ')}\n\nהעמודות הנדרשות: סעיף, קטגוריה, מהות, יחידה, כמות`)
          return
        }

        // פרסור שורות
        // בדיקת ערכי סוג תקינים
        const invalidTypes = rows
          .filter(row => row['מהות'] && row['סוג'])
          .filter(row => !Object.keys(VALID_TYPES).includes(String(row['סוג']).trim()))
        if (invalidTypes.length > 0) {
          setError(`ערכים לא תקינים בעמודת "סוג".\n\nהערכים המותרים: רכש, כוח אדם, קבלן משנה\n\nשורות עם בעיה: ${invalidTypes.slice(0, 3).map(r => r['מהות']).join(', ')}`)
          return
        }

        // בדיקה שכל שורה עם מהות יש לה סוג
        const missingType = rows.filter(row => row['מהות'] && Number(row['כמות']) > 0 && !row['סוג'])
        if (missingType.length > 0) {
          setError(`חסר סוג ב-${missingType.length} שורות.\n\nכל שורה חייבת עמודת "סוג" עם אחד מ: רכש, כוח אדם, קבלן משנה\n\nשורות ללא סוג: ${missingType.slice(0, 3).map(r => r['מהות']).join(', ')}`)
          return
        }

        const parsed = rows
          .filter(row => row['מהות'] && Number(row['כמות']) > 0)
          .map((row, idx) => ({
            id: idx + 1,
            clause: String(row['סעיף'] || ''),
            category: String(row['קטגוריה'] || 'כללי'),
            name: String(row['מהות'] || ''),
            unit: String(row['יחידה'] || 'יח׳'),
            quantity: Number(row['כמות']) || 0,
            itemType: VALID_TYPES[String(row['סוג']).trim()] || '',
            itemTypeLabel: String(row['סוג']).trim(),
            selected: true,
          }))

        if (parsed.length === 0) {
          setError('לא נמצאו שורות תקינות (חסרה מהות או כמות)')
          return
        }

        setPreview(parsed)
      } catch (err) {
        setError('שגיאה בקריאת הקובץ. ודא שזה קובץ אקסל תקין.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleExcelUpload = (e) => {
    handleFile(e.target.files[0])
    e.target.value = ''
  }

  // הורדת תבנית
  const handleDownloadTemplate = () => {
    const data = [
      { 'סעיף': '01.01', 'קטגוריה': 'עבודות שלד', 'מהות': 'בטון B30', 'יחידה': 'מ"ק', 'כמות': 120, 'סוג': 'רכש' },
      { 'סעיף': '01.02', 'קטגוריה': 'עבודות שלד', 'מהות': 'ברזל זיון', 'יחידה': 'טון', 'כמות': 8, 'סוג': 'רכש' },
      { 'סעיף': '01.03', 'קטגוריה': 'עבודות שלד', 'מהות': 'עבודת שלד', 'יחידה': 'יום', 'כמות': 45, 'סוג': 'כוח אדם' },
      { 'סעיף': '01.04', 'קטגוריה': 'עבודות שלד', 'מהות': 'קבלן שלד (פאושלי)', 'יחידה': 'פאושלי', 'כמות': 1, 'סוג': 'קבלן משנה' },
      { 'סעיף': '02.01', 'קטגוריה': 'חשמל', 'מהות': 'נקודות חשמל', 'יחידה': 'נק׳', 'כמות': 80, 'סוג': 'רכש' },
      { 'סעיף': '02.02', 'קטגוריה': 'חשמל', 'מהות': 'קבלן חשמל', 'יחידה': 'פאושלי', 'כמות': 1, 'סוג': 'קבלן משנה' },
      { 'סעיף': '03.01', 'קטגוריה': 'אינסטלציה', 'מהות': 'צנרת מים', 'יחידה': 'מ"א', 'כמות': 150, 'סוג': 'רכש' },
      { 'סעיף': '04.01', 'קטגוריה': 'ריצוף', 'מהות': 'ריצוף פנים', 'יחידה': 'מ"ר', 'כמות': 180, 'סוג': 'רכש' },
      { 'סעיף': '04.02', 'קטגוריה': 'ריצוף', 'מהות': 'עבודת ריצוף', 'יחידה': 'מ"ר', 'כמות': 180, 'סוג': 'כוח אדם' },
      { 'סעיף': '05.01', 'קטגוריה': 'איטום', 'מהות': 'איטום גג', 'יחידה': 'מ"ר', 'כמות': 180, 'סוג': 'קבלן משנה' },
    ]
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [{ wch: 8 }, { wch: 15 }, { wch: 25 }, { wch: 8 }, { wch: 8 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'כתב כמויות')
    XLSX.writeFile(wb, 'תבנית-כתב-כמויות.xlsx')
  }

  // אישור ויצירת כתב כמויות
  const handleConfirm = () => {
    if (!form.clientName || !form.address) { setError('מלא שם לקוח וכתובת'); return }
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
      })),
    })

    navigate(`/boq/${boqQuote.id}`)
  }

  // קטגוריות ייחודיות לסיכום
  const categories = preview ? [...new Set(preview.filter(r => r.selected).map(r => r.category))] : []

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>כתב כמויות חדש</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>העלה כתב כמויות מאקסל ליצירת פרויקט</p>
      </div>

      {/* שלב 1: פרטי לקוח */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px' }}>
          פרטי הפרויקט
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>שם לקוח / מזמין *</label>
            <input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} placeholder="שם הלקוח או החברה" />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>שם הפרויקט</label>
            <input value={form.projectName} onChange={e => setForm(p => ({ ...p, projectName: e.target.value }))} placeholder="לדוגמה: בניין מגורים רח׳ הרצל" />
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

      {/* שלב 2: העלאת קובץ */}
      {!preview && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px' }}>
            העלאת כתב כמויות
          </h3>

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
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              תומך ב-Excel (.xlsx, .xls) וב-CSV
            </div>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} style={{ display: 'none' }} />
          </div>

          {/* עמודות נדרשות */}
          <div style={{ marginTop: '20px', padding: '16px', background: 'var(--dark)', borderRadius: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
              עמודות נדרשות בקובץ:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px' }}>
              {REQUIRED_COLUMNS.map(col => (
                <div key={col} style={{
                  padding: '6px 14px', background: 'var(--gold-bg)', borderRadius: '6px',
                  border: '1px solid var(--gold-border)', color: 'var(--gold)', fontWeight: 600,
                }}>
                  {col}
                </div>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: '14px' }} onClick={handleDownloadTemplate}>
              <Download size={14} />הורד תבנית לדוגמה
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: '16px', padding: '14px', background: 'var(--danger-bg)',
              border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px',
              color: 'var(--danger)', fontSize: '13px', whiteSpace: 'pre-line',
            }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* שלב 3: תצוגה מקדימה */}
      {preview && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', margin: 0 }}>
                נמצאו {preview.length} סעיפים
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {categories.length} קטגוריות: {categories.join(', ')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setPreview(null); setError('') }}>
                העלה קובץ אחר
              </button>
              <button className="btn btn-primary" onClick={handleConfirm}>
                <Plus size={16} />צור כתב כמויות ({preview.filter(r => r.selected).length} סעיפים)
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              marginBottom: '12px', padding: '10px', background: 'var(--danger-bg)',
              borderRadius: '8px', color: 'var(--danger)', fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input type="checkbox"
                      checked={preview.every(r => r.selected)}
                      onChange={() => {
                        const allSelected = preview.every(r => r.selected)
                        setPreview(preview.map(r => ({ ...r, selected: !allSelected })))
                      }}
                    />
                  </th>
                  <th style={{ width: '70px' }}>סעיף</th>
                  <th>קטגוריה</th>
                  <th>מהות</th>
                  <th style={{ width: '70px' }}>יחידה</th>
                  <th style={{ width: '80px' }}>כמות</th>
                  <th>סוג</th>
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
                        }}
                      />
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{row.clause}</td>
                    <td>{row.category}</td>
                    <td style={{ fontWeight: 500 }}>{row.name}</td>
                    <td>{row.unit}</td>
                    <td style={{ fontWeight: 600 }}>{row.quantity}</td>
                    <td>
                      <span className={`badge ${row.itemType === 'procurement' ? 'badge-info' : row.itemType === 'labor' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '11px' }}>
                        {row.itemTypeLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
