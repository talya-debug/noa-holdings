import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Camera, Send, Check, Plus, Trash2 } from 'lucide-react'
import { categoryIcons, findPriceItem, formatCurrency } from '../data/mockData'
import { getProject, addWorkLog, getProjectSettings, getQuote, getProjectTasks } from '../data/store'

// טופס חיצוני למנהל עבודה - נפתח דרך לינק בוואטסאפ
// תומך בכמה דיווחים באותו יומן (לא צריך לשלוח ולפתוח מחדש)
export default function WorkLogForm() {
  const { projectId } = useParams()
  const pid = Number(projectId)
  const project = getProject(pid)
  const settings = getProjectSettings(pid)

  // קטגוריות מהפרויקט + עלות עבודה לכל קטגוריה
  const projectTasks = getProjectTasks().filter(t => t.projectId === pid)
  const categories = [...new Set(projectTasks.map(t => t.category))]

  // עלות עבודה יומית לכל קטגוריה - נלקח מפריטי העבודה בהצעה
  const laborCostByCategory = {}
  projectTasks.forEach(t => {
    if (t.type === 'labor' && !laborCostByCategory[t.category]) {
      // עלות סגירה מול לקוח (clientPrice) - זה מה שצריך להציג למנכ"ל
      laborCostByCategory[t.category] = { costPrice: t.budgetCost, clientPrice: t.clientPrice }
    }
  })

  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    managerName: '',
    // כל "דיווח" ביומן = קטגוריה + מספר עובדים + תיאור
    entries: [{ category: '', workersCount: '', description: '' }],
    issues: '',
    photos: [],
  })

  // הוספת שורת דיווח
  const addEntry = () => {
    setForm(prev => ({
      ...prev,
      entries: [...prev.entries, { category: '', workersCount: '', description: '' }]
    }))
  }

  // מחיקת שורת דיווח
  const removeEntry = (idx) => {
    if (form.entries.length <= 1) return
    setForm(prev => ({
      ...prev,
      entries: prev.entries.filter((_, i) => i !== idx)
    }))
  }

  // עדכון שורת דיווח
  const updateEntry = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      entries: prev.entries.map((e, i) => i === idx ? { ...e, [field]: value } : e)
    }))
  }

  // חישוב עלות כוללת - לכל קטגוריה לפי העלות שלה
  const totalLaborCost = form.entries.reduce((sum, entry) => {
    const workers = Number(entry.workersCount) || 0
    const catCost = laborCostByCategory[entry.category]
    // עלות סגירה = מחיר ללקוח * מספר עובדים
    const costPerWorker = catCost ? catCost.clientPrice : settings.laborCostPerWorker
    return sum + (workers * costPerWorker)
  }, 0)

  const totalActualCost = form.entries.reduce((sum, entry) => {
    const workers = Number(entry.workersCount) || 0
    const catCost = laborCostByCategory[entry.category]
    const costPerWorker = catCost ? catCost.costPrice : settings.laborCostPerWorker
    return sum + (workers * costPerWorker)
  }, 0)

  const totalWorkers = form.entries.reduce((s, e) => s + (Number(e.workersCount) || 0), 0)

  const handleSubmit = (e) => {
    e.preventDefault()

    // שמירת כל הדיווחים כיומן אחד עם entries
    const entriesData = form.entries
      .filter(en => en.category && Number(en.workersCount) > 0)
      .map(en => {
        const catCost = laborCostByCategory[en.category]
        const workers = Number(en.workersCount) || 0
        return {
          category: en.category,
          workersCount: workers,
          description: en.description,
          clientCost: workers * (catCost ? catCost.clientPrice : settings.laborCostPerWorker),
          actualCost: workers * (catCost ? catCost.costPrice : settings.laborCostPerWorker),
        }
      })

    addWorkLog({
      projectId: pid,
      date: form.date,
      managerName: form.managerName,
      workersCount: totalWorkers,
      categories: entriesData.map(e => e.category),
      entries: entriesData,
      description: entriesData.map(e => `${e.category}: ${e.description}`).filter(d => d.includes(': ') && d.split(': ')[1]).join(' | '),
      issues: form.issues,
      photos: form.photos.length,
      signature: true,
      laborCost: totalLaborCost, // עלות סגירה מול לקוח
      actualLaborCost: totalActualCost, // עלות בפועל
    })

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--dark)', padding: '20px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'var(--success-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
          }}>
            <Check size={40} color="var(--success)" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: 'var(--gold)' }}>
            הדיווח נשלח בהצלחה!
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
            תודה, הדיווח היומי נשמר במערכת.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>
            {totalWorkers} עובדים | עלות יומית: <strong style={{ color: 'var(--gold)' }}>{totalLaborCost.toLocaleString()} ₪</strong>
          </p>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            {form.entries.filter(e => e.category).map((e, i) => (
              <div key={i}>{e.category}: {e.workersCount} עובדים</div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => {
            setSubmitted(false)
            setForm(prev => ({
              ...prev,
              entries: [{ category: '', workersCount: '', description: '' }],
              issues: '',
              photos: [],
            }))
          }}>
            דיווח נוסף
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* כותרת ממותגת */}
        <div style={{
          textAlign: 'center', padding: '28px 20px', marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))',
          borderRadius: 'var(--radius-lg)', border: '1px solid var(--gold-border)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: '22px', fontWeight: 800,
            color: 'var(--dark)', fontFamily: 'Arial'
          }}>PB</div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gold)', marginBottom: '4px' }}>
            דיווח יומי
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {project?.name || 'פרויקט'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* פרטים בסיסיים */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px' }}>
              פרטי דיווח
            </h3>
            <div className="form-row" style={{ marginBottom: '0' }}>
              <div className="form-group">
                <label>תאריך</label>
                <input type="date" value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>שם מנהל העבודה</label>
                <input type="text" placeholder="שם מלא" value={form.managerName} onChange={e => setForm(prev => ({ ...prev, managerName: e.target.value }))} required />
              </div>
            </div>
          </div>

          {/* דיווחי עבודה - כמה שורות */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)', margin: 0 }}>
                עבודות שבוצעו
              </h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addEntry} style={{ fontSize: '12px' }}>
                <Plus size={14} /> הוסף עבודה
              </button>
            </div>

            {form.entries.map((entry, idx) => {
              const catCost = laborCostByCategory[entry.category]
              const workers = Number(entry.workersCount) || 0
              const entryCost = workers * (catCost ? catCost.clientPrice : settings.laborCostPerWorker)

              return (
                <div key={idx} style={{
                  padding: '14px', background: 'var(--dark)', borderRadius: '10px',
                  marginBottom: '10px', border: '1px solid var(--dark-border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      דיווח {idx + 1}
                    </span>
                    {form.entries.length > 1 && (
                      <button type="button" onClick={() => removeEntry(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* בחירת קטגוריה */}
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '12px' }}>סוג עבודה</label>
                    <select value={entry.category} onChange={e => updateEntry(idx, 'category', e.target.value)} required
                      style={{ fontSize: '14px' }}>
                      <option value="">— בחר קטגוריה —</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{categoryIcons[cat] || ''} {cat}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <div className="form-group" style={{ margin: 0, flex: '0 0 100px' }}>
                      <label style={{ fontSize: '12px' }}>מס׳ עובדים</label>
                      <input type="number" min="0" placeholder="0" value={entry.workersCount}
                        onChange={e => updateEntry(idx, 'workersCount', e.target.value)} required
                        style={{ textAlign: 'center' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0, flex: '0 0 110px' }}>
                      <label style={{ fontSize: '12px' }}>סכום שסוכם (₪)</label>
                      <input type="number" min="0" placeholder="0" value={entry.agreedAmount || ''}
                        onChange={e => updateEntry(idx, 'agreedAmount', e.target.value)}
                        style={{ textAlign: 'center' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label style={{ fontSize: '12px' }}>תיאור העבודה</label>
                      <input type="text" placeholder="מה בוצע..." value={entry.description}
                        onChange={e => updateEntry(idx, 'description', e.target.value)} />
                    </div>
                  </div>

                  {/* עלות יומית לקטגוריה */}
                  {entry.category && workers > 0 && (
                    <div style={{
                      padding: '8px 12px', background: 'rgba(212,168,67,0.08)', borderRadius: '6px',
                      fontSize: '12px', color: 'var(--gold)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: entry.agreedAmount ? '4px' : 0 }}>
                        <span>
                          {workers} עובדים × {formatCurrency(catCost ? catCost.clientPrice : settings.laborCostPerWorker)} ליום (תקציב)
                        </span>
                        <strong>{formatCurrency(entryCost)}</strong>
                      </div>
                      {entry.agreedAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: Number(entry.agreedAmount) > entryCost ? 'var(--danger)' : 'var(--success)' }}>
                          <span>סכום שסוכם</span>
                          <strong>{formatCurrency(Number(entry.agreedAmount))}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* סיכום עלות כולל */}
            {totalWorkers > 0 && (
              <div style={{
                padding: '14px', background: 'var(--gold-bg)', borderRadius: '10px',
                border: '1px solid var(--gold-border)', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginTop: '4px'
              }}>
                <span style={{ fontWeight: 600, color: 'var(--gold)' }}>
                  סה"כ: {totalWorkers} עובדים
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold)' }}>
                  {formatCurrency(totalLaborCost)}
                </span>
              </div>
            )}
          </div>

          {/* בעיות */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>בעיות / הערות</label>
              <textarea rows="2" placeholder="בעיות שנתקלתם בהן, הערות מהמפקח..." value={form.issues} onChange={e => setForm(prev => ({ ...prev, issues: e.target.value }))} />
            </div>
          </div>

          {/* תמונות */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)', marginBottom: '14px' }}>
              תמונות מהאתר
            </h3>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              padding: '24px', background: 'var(--dark)', borderRadius: '10px',
              border: '2px dashed var(--dark-border)', cursor: 'pointer', marginBottom: 0,
            }}>
              <Camera size={28} color="var(--text-muted)" />
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>לחץ כאן לצילום או העלאת תמונות</span>
              <input type="file" accept="image/*" multiple capture="environment" style={{ display: 'none' }} onChange={e => {
                const files = Array.from(e.target.files || [])
                setForm(prev => ({ ...prev, photos: [...prev.photos, ...files] }))
              }} />
            </label>
            {form.photos.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--success)' }}>
                {form.photos.length} תמונות נבחרו
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{
            width: '100%', justifyContent: 'center', padding: '14px', fontSize: '16px', fontWeight: 600
          }}>
            <Send size={18} />
            שלח דיווח
          </button>
        </form>

        <div style={{ textAlign: 'center', padding: '20px', fontSize: '11px', color: 'var(--text-muted)' }}>
          ProBuild © 2026
        </div>
      </div>
    </div>
  )
}
