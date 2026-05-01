import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Plus, Trash2, Send, Save, ExternalLink, CheckCircle } from 'lucide-react'
import { formatCurrency, categoryIcons } from '../data/mockData'
import { getProject, getChangeOrder, addChangeOrder, updateChangeOrder, getProjectTasks, approveChangeOrder } from '../data/store'

export default function ChangeOrderForm() {
  const { projectId, changeId } = useParams()
  const navigate = useNavigate()
  const pid = Number(projectId)
  const project = getProject(pid)

  // קטגוריות מהפרויקט
  const projectTasks = getProjectTasks().filter(t => t.projectId === pid)
  const categories = [...new Set(projectTasks.map(t => t.category))]

  // טעינת שינוי קיים או חדש
  const existing = changeId && changeId !== 'new' ? getChangeOrder(Number(changeId)) : null
  const [form, setForm] = useState({
    description: existing?.description || '',
    items: existing?.items || [{ name: '', category: '', unit: 'יח׳', quantity: 1, type: 'material', costPrice: 0, clientPrice: 0, description: '' }],
  })

  if (!project) return <div className="animate-in"><div className="card" style={{ textAlign: 'center', padding: '40px' }}>פרויקט לא נמצא</div></div>

  const totalCost = form.items.reduce((s, i) => s + (i.costPrice * i.quantity), 0)
  const totalSell = form.items.reduce((s, i) => s + (i.clientPrice * i.quantity), 0)
  const profit = totalSell - totalCost

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { name: '', category: categories[0] || '', unit: 'יח׳', quantity: 1, type: 'material', costPrice: 0, clientPrice: 0, description: '' }]
    }))
  }

  const removeItem = (idx) => {
    if (form.items.length <= 1) return
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))
  }

  const updateItem = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === idx ? { ...item, [field]: ['costPrice', 'clientPrice', 'quantity'].includes(field) ? (Number(value) || 0) : value } : item)
    }))
  }

  const handleSave = (status) => {
    if (!form.items.some(i => i.name && i.clientPrice > 0)) {
      alert('הוסף לפחות פריט אחד עם שם ומחיר')
      return
    }

    const data = {
      projectId: pid,
      description: form.description,
      items: form.items.filter(i => i.name),
      totalCost,
      totalSell,
    }

    if (existing) {
      updateChangeOrder(existing.id, { ...data, status })
    } else {
      const co = addChangeOrder({ ...data, status })
      if (status === 'sent') {
        const url = `${window.location.origin}${window.location.pathname}#/approve/${pid}/${co.id}`
        navigator.clipboard.writeText(url)
        alert('התוספת נשמרה והלינק הועתק! שלח ללקוח לאישור')
      }
    }
    navigate(`/project/${pid}/changes`)
  }

  const handleManualApprove = () => {
    if (!confirm('לאשר ידנית? (הלקוח אישר בע"פ/וואטסאפ)')) return
    const data = {
      projectId: pid,
      description: form.description,
      items: form.items.filter(i => i.name),
      totalCost, totalSell,
    }
    let coId
    if (existing) {
      updateChangeOrder(existing.id, { ...data, status: 'sent' })
      coId = existing.id
    } else {
      const co = addChangeOrder({ ...data, status: 'sent' })
      coId = co.id
    }
    approveChangeOrder(coId, 'אישור ידני')
    navigate(`/project/${pid}/changes`)
  }

  const typeOptions = [
    { value: 'material', label: 'חומר' },
    { value: 'labor', label: 'עבודה' },
    { value: 'subcontractor', label: 'קב"מ' },
    { value: 'combined', label: 'כולל' },
  ]

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
          {existing ? `עריכת תוספת ${existing.number}` : 'תוספת חדשה'}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{project.name}</p>
      </div>

      {/* סיכום */}
      <div className="card" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 45%), 1fr))', gap: '12px',
        marginBottom: '24px', border: '1px solid var(--gold-border)',
      }}>
        {[
          { label: 'עלות', value: formatCurrency(totalCost), color: 'var(--danger)' },
          { label: 'מכירה', value: formatCurrency(totalSell), color: 'var(--gold)' },
          { label: 'רווח', value: formatCurrency(profit), color: profit >= 0 ? 'var(--success)' : 'var(--danger)' },
          { label: 'פריטים', value: form.items.filter(i => i.name).length, color: 'var(--text-primary)' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* תיאור */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>תיאור השינוי</label>
          <input value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="למשל: שינוי מיקום דלת + תוספת ארון" />
        </div>
      </div>

      {/* פריטים */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', margin: 0 }}>פריטים</h3>
          <button className="btn btn-secondary btn-sm" onClick={addItem}>
            <Plus size={14} />הוסף פריט
          </button>
        </div>

        {form.items.map((item, idx) => (
          <div key={idx} style={{
            padding: '14px', background: 'var(--dark)', borderRadius: '10px',
            marginBottom: '10px', border: '1px solid var(--dark-border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>פריט {idx + 1}</span>
              {form.items.length > 1 && (
                <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: '10px', marginBottom: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px' }}>שם הפריט</label>
                <input value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="תיאור העבודה/חומר" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px' }}>קטגוריה</label>
                <select value={item.category} onChange={e => updateItem(idx, 'category', e.target.value)}>
                  <option value="">— בחר —</option>
                  {categories.map(c => <option key={c} value={c}>{categoryIcons[c] || '📦'} {c}</option>)}
                  <option value="תוספות">תוספות</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px' }}>סוג</label>
                <select value={item.type} onChange={e => updateItem(idx, 'type', e.target.value)}>
                  {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ margin: 0, flex: '0 0 80px' }}>
                <label style={{ fontSize: '12px' }}>יחידה</label>
                <input value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} style={{ textAlign: 'center' }} />
              </div>
              <div className="form-group" style={{ margin: 0, flex: '0 0 80px' }}>
                <label style={{ fontSize: '12px' }}>כמות</label>
                <input type="number" min="0" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} style={{ textAlign: 'center' }} />
              </div>
              <div className="form-group" style={{ margin: 0, flex: '0 0 100px' }}>
                <label style={{ fontSize: '12px' }}>עלות ליח׳</label>
                <input type="number" min="0" value={item.costPrice || ''} onChange={e => updateItem(idx, 'costPrice', e.target.value)} placeholder="0" style={{ textAlign: 'center' }} />
              </div>
              <div className="form-group" style={{ margin: 0, flex: '0 0 100px' }}>
                <label style={{ fontSize: '12px' }}>מחיר ללקוח</label>
                <input type="number" min="0" value={item.clientPrice || ''} onChange={e => updateItem(idx, 'clientPrice', e.target.value)} placeholder="0" style={{ textAlign: 'center' }} />
              </div>
              <div className="form-group" style={{ margin: 0, flex: 1 }}>
                <label style={{ fontSize: '12px' }}>סה"כ</label>
                <div style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--gold)' }}>
                  {formatCurrency(item.clientPrice * item.quantity)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* כפתורי פעולה */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={() => handleSave('draft')}>
          <Save size={16} />שמור טיוטה
        </button>
        <button className="btn btn-primary" onClick={() => handleSave('sent')}>
          <Send size={16} />שלח ללקוח לאישור
        </button>
        <button className="btn btn-secondary" onClick={handleManualApprove}>
          <CheckCircle size={16} />אשר ידנית
        </button>
      </div>
    </div>
  )
}
