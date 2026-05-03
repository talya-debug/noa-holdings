import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, Zap, CheckCircle, Loader, ChevronDown, ChevronUp, Trash2, Plus, Download, Eye } from 'lucide-react'
import { addBOQQuote } from '../data/store'
import { formatCurrency } from '../data/mockData'
import * as XLSX from 'xlsx'

// סוגי תוכניות יועצים
const PLAN_TYPES = [
  { value: 'architecture', label: 'אדריכלות', icon: '🏠', description: 'תוכנית אדריכלית — קירות, פתחים, חללים' },
  { value: 'structural', label: 'קונסטרוקציה', icon: '🏗️', description: 'תוכנית שלד — בטון, ברזל, יסודות' },
  { value: 'electrical', label: 'חשמל', icon: '⚡', description: 'תוכנית חשמל — נקודות, לוחות, תאורה' },
  { value: 'plumbing', label: 'אינסטלציה', icon: '🔧', description: 'תוכנית אינסטלציה — צנרת, ביוב, כלים סניטריים' },
  { value: 'hvac', label: 'מיזוג אוויר', icon: '❄️', description: 'תוכנית מיזוג — יחידות, צנרת, תשתיות' },
  { value: 'waterproofing', label: 'איטום', icon: '💧', description: 'תוכנית איטום — גגות, מרתפים, מקלחות' },
  { value: 'landscape', label: 'פיתוח חוץ', icon: '🌿', description: 'תוכנית פיתוח — חניה, גינון, גדרות' },
]

// תוצאות דמו לפי סוג תוכנית (בעתיד — AI אמיתי)
const DEMO_RESULTS = {
  structural: [
    { clause: '01.01', category: 'עבודות שלד', name: 'בטון B30 ליסודות', unit: 'מ"ק', quantity: 85, itemType: 'procurement' },
    { clause: '01.02', category: 'עבודות שלד', name: 'בטון B30 לעמודים וקורות', unit: 'מ"ק', quantity: 45, itemType: 'procurement' },
    { clause: '01.03', category: 'עבודות שלד', name: 'בטון B30 לתקרות', unit: 'מ"ק', quantity: 120, itemType: 'procurement' },
    { clause: '01.04', category: 'עבודות שלד', name: 'ברזל זיון B500', unit: 'טון', quantity: 12, itemType: 'procurement' },
    { clause: '01.05', category: 'עבודות שלד', name: 'תבניות ליסודות', unit: 'מ"ר', quantity: 180, itemType: 'procurement' },
    { clause: '01.06', category: 'עבודות שלד', name: 'תבניות לעמודים', unit: 'מ"ר', quantity: 90, itemType: 'procurement' },
    { clause: '01.07', category: 'עבודות שלד', name: 'תבניות לתקרות', unit: 'מ"ר', quantity: 300, itemType: 'procurement' },
    { clause: '01.08', category: 'עבודות שלד', name: 'בלוקים 20 ס"מ', unit: 'יח׳', quantity: 3500, itemType: 'procurement' },
    { clause: '01.09', category: 'עבודות שלד', name: 'עבודת שלד — צוות', unit: 'יום', quantity: 60, itemType: 'labor' },
    { clause: '01.10', category: 'עבודות שלד', name: 'משאבת בטון', unit: 'יום', quantity: 8, itemType: 'procurement' },
  ],
  electrical: [
    { clause: '02.01', category: 'חשמל', name: 'נקודות חשמל רגילות', unit: 'נק׳', quantity: 95, itemType: 'procurement' },
    { clause: '02.02', category: 'חשמל', name: 'נקודות חשמל מוגברות', unit: 'נק׳', quantity: 12, itemType: 'procurement' },
    { clause: '02.03', category: 'חשמל', name: 'לוח חשמל ראשי', unit: 'יח׳', quantity: 1, itemType: 'procurement' },
    { clause: '02.04', category: 'חשמל', name: 'לוח חשמל משני', unit: 'יח׳', quantity: 2, itemType: 'procurement' },
    { clause: '02.05', category: 'חשמל', name: 'גופי תאורה שקועים', unit: 'יח׳', quantity: 45, itemType: 'procurement' },
    { clause: '02.06', category: 'חשמל', name: 'גופי תאורה צמודים', unit: 'יח׳', quantity: 15, itemType: 'procurement' },
    { clause: '02.07', category: 'חשמל', name: 'תשתית מערכת חכמה', unit: 'פאושלי', quantity: 1, itemType: 'procurement' },
    { clause: '02.08', category: 'חשמל', name: 'עבודת חשמלאי', unit: 'יום', quantity: 25, itemType: 'labor' },
    { clause: '02.09', category: 'חשמל', name: 'קבלן חשמל — ביצוע מלא', unit: 'פאושלי', quantity: 1, itemType: 'subcontractor' },
  ],
  plumbing: [
    { clause: '03.01', category: 'אינסטלציה', name: 'צנרת מים חמים/קרים PPR', unit: 'מ"א', quantity: 180, itemType: 'procurement' },
    { clause: '03.02', category: 'אינסטלציה', name: 'צנרת ביוב PVC', unit: 'מ"א', quantity: 95, itemType: 'procurement' },
    { clause: '03.03', category: 'אינסטלציה', name: 'אסלות', unit: 'יח׳', quantity: 4, itemType: 'procurement' },
    { clause: '03.04', category: 'אינסטלציה', name: 'כיורים', unit: 'יח׳', quantity: 5, itemType: 'procurement' },
    { clause: '03.05', category: 'אינסטלציה', name: 'מקלחונים', unit: 'יח׳', quantity: 3, itemType: 'procurement' },
    { clause: '03.06', category: 'אינסטלציה', name: 'דוד שמש 200 ליטר', unit: 'יח׳', quantity: 1, itemType: 'procurement' },
    { clause: '03.07', category: 'אינסטלציה', name: 'ברזים ואביזרים', unit: 'קומפלט', quantity: 1, itemType: 'procurement' },
    { clause: '03.08', category: 'אינסטלציה', name: 'עבודת אינסטלטור', unit: 'יום', quantity: 18, itemType: 'labor' },
  ],
  architecture: [
    { clause: '04.01', category: 'ריצוף וחיפוי', name: 'ריצוף פנים — סלון ומטבח', unit: 'מ"ר', quantity: 85, itemType: 'procurement' },
    { clause: '04.02', category: 'ריצוף וחיפוי', name: 'ריצוף חדרים', unit: 'מ"ר', quantity: 55, itemType: 'procurement' },
    { clause: '04.03', category: 'ריצוף וחיפוי', name: 'חיפוי קירות מקלחות', unit: 'מ"ר', quantity: 40, itemType: 'procurement' },
    { clause: '04.04', category: 'ריצוף וחיפוי', name: 'ריצוף מרפסות', unit: 'מ"ר', quantity: 25, itemType: 'procurement' },
    { clause: '04.05', category: 'ריצוף וחיפוי', name: 'עבודת ריצוף', unit: 'מ"ר', quantity: 205, itemType: 'labor' },
    { clause: '04.06', category: 'נגרות', name: 'דלתות פנים', unit: 'יח׳', quantity: 8, itemType: 'procurement' },
    { clause: '04.07', category: 'נגרות', name: 'דלת כניסה', unit: 'יח׳', quantity: 1, itemType: 'procurement' },
    { clause: '04.08', category: 'אלומיניום', name: 'חלונות אלומיניום', unit: 'מ"ר', quantity: 35, itemType: 'procurement' },
    { clause: '04.09', category: 'אלומיניום', name: 'דלת מרפסת הזזה', unit: 'יח׳', quantity: 2, itemType: 'procurement' },
    { clause: '04.10', category: 'צבע וגבס', name: 'תקרות גבס', unit: 'מ"ר', quantity: 140, itemType: 'procurement' },
    { clause: '04.11', category: 'צבע וגבס', name: 'צביעה פנים', unit: 'מ"ר', quantity: 420, itemType: 'labor' },
    { clause: '04.12', category: 'נגרות', name: 'ארונות מטבח', unit: 'מ"א', quantity: 6, itemType: 'subcontractor' },
  ],
  hvac: [
    { clause: '05.01', category: 'מיזוג אוויר', name: 'יחידות פנימיות עילי', unit: 'יח׳', quantity: 5, itemType: 'procurement' },
    { clause: '05.02', category: 'מיזוג אוויר', name: 'יחידות פנימיות נסתר', unit: 'יח׳', quantity: 2, itemType: 'procurement' },
    { clause: '05.03', category: 'מיזוג אוויר', name: 'יחידה חיצונית מולטי', unit: 'יח׳', quantity: 2, itemType: 'procurement' },
    { clause: '05.04', category: 'מיזוג אוויר', name: 'צנרת נחושת + בידוד', unit: 'מ"א', quantity: 45, itemType: 'procurement' },
    { clause: '05.05', category: 'מיזוג אוויר', name: 'התקנת מיזוג — קבלן', unit: 'פאושלי', quantity: 1, itemType: 'subcontractor' },
  ],
  waterproofing: [
    { clause: '06.01', category: 'איטום', name: 'איטום גג ביטומני', unit: 'מ"ר', quantity: 160, itemType: 'procurement' },
    { clause: '06.02', category: 'איטום', name: 'איטום מרפסות', unit: 'מ"ר', quantity: 25, itemType: 'procurement' },
    { clause: '06.03', category: 'איטום', name: 'איטום מקלחות ושירותים', unit: 'יח׳', quantity: 4, itemType: 'procurement' },
    { clause: '06.04', category: 'איטום', name: 'איטום קירות מרתף', unit: 'מ"ר', quantity: 80, itemType: 'procurement' },
    { clause: '06.05', category: 'איטום', name: 'עבודת איטום — קבלן', unit: 'פאושלי', quantity: 1, itemType: 'subcontractor' },
  ],
  landscape: [
    { clause: '07.01', category: 'פיתוח חוץ', name: 'ריצוף חניה — בטון מוחלק', unit: 'מ"ר', quantity: 40, itemType: 'procurement' },
    { clause: '07.02', category: 'פיתוח חוץ', name: 'גדר בלוקים + טיח', unit: 'מ"א', quantity: 30, itemType: 'procurement' },
    { clause: '07.03', category: 'פיתוח חוץ', name: 'שער חשמלי + מנוע', unit: 'יח׳', quantity: 1, itemType: 'procurement' },
    { clause: '07.04', category: 'פיתוח חוץ', name: 'שער כניסה להולכי רגל', unit: 'יח׳', quantity: 1, itemType: 'procurement' },
    { clause: '07.05', category: 'פיתוח חוץ', name: 'גינון ומדשאה', unit: 'מ"ר', quantity: 100, itemType: 'procurement' },
    { clause: '07.06', category: 'פיתוח חוץ', name: 'תאורת חוץ', unit: 'נק׳', quantity: 8, itemType: 'procurement' },
    { clause: '07.07', category: 'פיתוח חוץ', name: 'עבודת פיתוח', unit: 'יום', quantity: 12, itemType: 'labor' },
  ],
}

const TYPE_LABELS = { procurement: 'רכש', labor: 'כוח אדם', subcontractor: 'קבלן משנה' }
const TYPE_COLORS = { procurement: 'badge-info', labor: 'badge-warning', subcontractor: 'badge-success' }

export default function PlanAnalyzer() {
  const navigate = useNavigate()
  const fileInputRef = useRef()
  const [step, setStep] = useState(1) // 1=בחירת סוג, 2=העלאה, 3=ניתוח, 4=תוצאות
  const [selectedTypes, setSelectedTypes] = useState([])
  const [files, setFiles] = useState([]) // קבצים שהועלו
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState([]) // תוצאות ניתוח
  const [form, setForm] = useState({ clientName: '', address: '', projectName: '' })
  const [expandedCats, setExpandedCats] = useState({})

  // בחירת סוג תוכנית
  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  // העלאת קבצים
  const handleFiles = (newFiles) => {
    const fileList = Array.from(newFiles).map(f => ({
      file: f,
      name: f.name,
      size: (f.size / 1024 / 1024).toFixed(1) + ' MB',
      type: f.type,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }))
    setFiles(prev => [...prev, ...fileList])
  }

  // ניתוח (כרגע דמו — בעתיד AI אמיתי)
  const handleAnalyze = () => {
    setAnalyzing(true)
    setStep(3)

    // סימולציה של ניתוח AI
    setTimeout(() => {
      let allItems = []
      selectedTypes.forEach(type => {
        const items = DEMO_RESULTS[type] || []
        allItems = [...allItems, ...items]
      })

      // מספור מחדש
      allItems = allItems.map((item, idx) => ({
        ...item,
        id: idx + 1,
        selected: true,
        costPrice: 0,
        clientPrice: 0,
      }))

      setResults(allItems)
      setAnalyzing(false)
      setStep(4)
    }, 2500) // 2.5 שניות סימולציה
  }

  // יצירת כתב כמויות מהתוצאות
  const handleCreateBOQ = () => {
    if (!form.clientName || !form.address) { alert('מלא שם לקוח וכתובת'); return }
    const selectedItems = results.filter(r => r.selected)
    if (selectedItems.length === 0) { alert('בחר לפחות פריט אחד'); return }

    const boq = addBOQQuote({
      clientName: form.clientName,
      clientPhone: '',
      address: form.address,
      projectName: form.projectName || `${form.clientName} - ${form.address}`,
      items: selectedItems.map(r => ({
        clause: r.clause,
        category: r.category,
        name: r.name,
        unit: r.unit,
        quantity: r.quantity,
        itemType: r.itemType,
        costPrice: r.costPrice,
        clientPrice: r.clientPrice,
      })),
    })

    navigate(`/boq/${boq.id}`)
  }

  // ייצוא תוצאות לאקסל
  const handleExportResults = () => {
    const data = results.filter(r => r.selected).map(r => ({
      'סעיף': r.clause,
      'קטגוריה': r.category,
      'מהות': r.name,
      'יחידה': r.unit,
      'כמות': r.quantity,
      'סוג': TYPE_LABELS[r.itemType] || '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [{ wch: 8 }, { wch: 15 }, { wch: 30 }, { wch: 8 }, { wch: 8 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'כתב כמויות')
    XLSX.writeFile(wb, 'כתב-כמויות-מתוכנית.xlsx')
  }

  // קטגוריות ייחודיות בתוצאות
  const resultCategories = [...new Set(results.filter(r => r.selected).map(r => r.category))]

  return (
    <div className="animate-in">
      {/* כותרת */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>ניתוח תו��ניות יועצים</h1>
          <span className="badge badge-warning" style={{ fontSize: '11px' }}>דמו</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          גרסת הדגמה — בחר תחומים וצפה בכתב כמויות לדוגמה. ניתוח AI אמיתי בקרוב
        </p>
      </div>

      {/* שלבים */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
        {[
          { num: 1, label: 'בחר תחומים' },
          { num: 2, label: 'העלה תוכניות' },
          { num: 3, label: 'ניתוח AI' },
          { num: 4, label: 'כתב כמויות' },
        ].map(s => (
          <div key={s.num} style={{
            flex: 1, padding: '12px', borderRadius: '8px', textAlign: 'center',
            background: step >= s.num ? 'var(--gold-bg)' : 'var(--dark)',
            border: step === s.num ? '1px solid var(--gold-border)' : '1px solid transparent',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', margin: '0 auto 6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step >= s.num ? 'var(--gold)' : 'var(--dark-border)',
              color: step >= s.num ? 'var(--dark)' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '13px',
            }}>
              {step > s.num ? <CheckCircle size={16} /> : s.num}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: step >= s.num ? 'var(--gold)' : 'var(--text-muted)' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* שלב 1: בחירת סוגי תוכניות */}
      {step === 1 && (
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px' }}>
            איזה תוכניות יש לך?
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            {PLAN_TYPES.map(type => {
              const isSelected = selectedTypes.includes(type.value)
              return (
                <div key={type.value}
                  onClick={() => toggleType(type.value)}
                  style={{
                    padding: '16px', borderRadius: '10px', cursor: 'pointer',
                    background: isSelected ? 'var(--gold-bg)' : 'var(--dark)',
                    border: isSelected ? '2px solid var(--gold)' : '2px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{type.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{type.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{type.description}</div>
                </div>
              )
            })}
          </div>
          <button className="btn btn-primary" disabled={selectedTypes.length === 0}
            onClick={() => setStep(2)}>
            המשך — העלאת תוכניות ({selectedTypes.length} תחומים)
          </button>
        </div>
      )}

      {/* שלב 2: העלאת קבצים */}
      {step === 2 && (
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginBottom: '6px' }}>
            העלאת תוכניות
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            תחומים נבחרו: {selectedTypes.map(t => PLAN_TYPES.find(p => p.value === t)?.label).join(', ')}
          </p>

          {/* פרטי פרויקט */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>שם לקוח *</label>
              <input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} placeholder="שם הלקוח" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>שם הפרויקט</label>
              <input value={form.projectName} onChange={e => setForm(p => ({ ...p, projectName: e.target.value }))} placeholder="לדוגמה: בניין מגורים" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>כתובת *</label>
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="עיר, רחוב" />
            </div>
          </div>

          {/* אזור העלאה */}
          <div style={{
            border: '2px dashed var(--gold-border)', borderRadius: '12px',
            padding: '40px 20px', textAlign: 'center', cursor: 'pointer',
            background: 'rgba(212,168,67,0.03)', marginBottom: '16px',
          }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          >
            <Upload size={40} color="var(--gold)" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--gold)', marginBottom: '6px' }}>
              גרור קבצים לכאן או לחץ לבחירה
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              PDF, JPG, PNG — תוכניות יועצים
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff,.dwg"
              multiple onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />
          </div>

          {/* קבצים שהועלו */}
          {files.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              {files.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'var(--dark)', borderRadius: '8px', marginBottom: '6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={18} color="var(--gold)" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{f.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.size}</div>
                    </div>
                  </div>
                  <button onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>חזור</button>
            <button className="btn btn-primary" onClick={handleAnalyze}
              disabled={!form.clientName || !form.address}>
              <Zap size={16} />{files.length > 0 ? `נתח תוכניות (${files.length} קבצים)` : 'נתח תוכניות (דמו)'}
            </button>
          </div>
        </div>
      )}

      {/* שלב 3: ניתוח */}
      {step === 3 && analyzing && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Loader size={48} color="var(--gold)" style={{ marginBottom: '20px', animation: 'spin 1.5s linear infinite' }} />
          <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--gold)', marginBottom: '8px' }}>
            מנתח תוכניות...
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            מזהה פריטים, כמויות ותחומי עבודה מתוך התוכניות
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* שלב 4: תוצאות */}
      {step === 4 && (
        <>
          {/* סיכום */}
          <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--gold-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)', margin: 0 }}>
                  <Zap size={18} style={{ verticalAlign: 'middle', marginLeft: '6px' }} />
                  נמצאו {results.length} סעיפים
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {resultCategories.length} קטגוריות • {results.filter(r => r.itemType === 'procurement').length} רכש • {results.filter(r => r.itemType === 'labor').length} כ"א • {results.filter(r => r.itemType === 'subcontractor').length} קב"מ
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleExportResults}>
                  <Download size={14} />ייצא אקסל
                </button>
                <button className="btn btn-primary" onClick={handleCreateBOQ}>
                  <Plus size={16} />צור כתב כמויות ({results.filter(r => r.selected).length} סעיפים)
                </button>
              </div>
            </div>
          </div>

          {/* טבלת תוצאות מקובצת לפי קטגוריה */}
          {resultCategories.map(cat => {
            const catItems = results.filter(r => r.category === cat)
            const isExpanded = expandedCats[cat] !== false // ברירת מחדל פתוח
            return (
              <div key={cat} className="card" style={{ marginBottom: '12px', padding: 0 }}>
                <div onClick={() => setExpandedCats(prev => ({ ...prev, [cat]: !isExpanded }))}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 20px', cursor: 'pointer',
                    background: 'rgba(212,168,67,0.05)',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--gold)' }}>{cat}</span>
                    <span className="badge badge-gold" style={{ fontSize: '11px' }}>{catItems.length} סעיפים</span>
                  </div>
                  {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                </div>

                {isExpanded && (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>בחר</th>
                          <th style={{ width: '60px' }}>סעיף</th>
                          <th>מהות</th>
                          <th>יחידה</th>
                          <th>כמות</th>
                          <th>סוג</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catItems.map(item => (
                          <tr key={item.id} style={{ opacity: item.selected ? 1 : 0.4 }}>
                            <td>
                              <input type="checkbox" checked={item.selected}
                                onChange={() => {
                                  setResults(prev => prev.map(r => r.id === item.id ? { ...r, selected: !r.selected } : r))
                                }}
                              />
                            </td>
                            <td style={{ fontWeight: 600, color: 'var(--gold)', fontSize: '12px' }}>{item.clause}</td>
                            <td style={{ fontWeight: 500 }}>{item.name}</td>
                            <td style={{ fontSize: '12px' }}>{item.unit}</td>
                            <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                            <td>
                              <span className={`badge ${TYPE_COLORS[item.itemType]}`} style={{ fontSize: '11px' }}>
                                {TYPE_LABELS[item.itemType]}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
