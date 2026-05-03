import { useState } from 'react'
import { Plus, Package, Wrench, Users, Layers, X, Edit3, Trash2, Save, Download, Upload } from 'lucide-react'
import { categoryIcons, formatCurrency, getTypeLabel, getTypeBadgeClass } from '../data/mockData'
import { getPriceList, savePriceList, addPriceItem, updatePriceItem, deletePriceItem } from '../data/store'
import * as XLSX from 'xlsx'

// יחידות מידה סטנדרטיות
const STANDARD_UNITS = [
  'מ"ר', 'מ"ק', 'מ"א', 'טון', 'ק"ג', 'יח׳', 'נק׳', 'יום', 'שעה', 'פאושלי', 'קומפלט', 'חודש',
]

// סוגי פריטים
const TYPE_OPTIONS = [
  { value: 'material', icon: <Package size={14} />, label: 'חומר' },
  { value: 'labor', icon: <Wrench size={14} />, label: 'עבודה' },
  { value: 'subcontractor', icon: <Users size={14} />, label: 'קבלן משנה' },
  { value: 'combined', icon: <Layers size={14} />, label: 'כולל (חומר+עבודה)' },
]

export default function PriceList() {
  const [priceList, setPriceList] = useState(getPriceList())
  const [showModal, setShowModal] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [customUnit, setCustomUnit] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [form, setForm] = useState({ category: '', name: '', unit: '', type: 'material', costPrice: '' })

  const refresh = () => setPriceList(getPriceList())
  const categories = [...new Set(priceList.map(i => i.category))]
  const grouped = categories.reduce((acc, cat) => { acc[cat] = priceList.filter(i => i.category === cat); return acc }, {})

  const typeIcon = (type) => {
    switch (type) {
      case 'material': return <Package size={12} />
      case 'labor': return <Wrench size={12} />
      case 'subcontractor': return <Users size={12} />
      case 'combined': return <Layers size={12} />
      default: return <Package size={12} />
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const category = newCategory || form.category
    if (!category) { alert('בחר או הקלד קטגוריה'); return }
    if (!form.name) { alert('הקלד שם פריט'); return }
    const unit = customUnit || form.unit
    if (!unit) { alert('בחר או הקלד יחידת מידה'); return }
    addPriceItem({ category, name: form.name, unit, type: form.type, costPrice: Number(form.costPrice) || 0 })
    refresh()
    setShowModal(false)
    setForm({ category: '', name: '', unit: '', type: 'material', costPrice: '' })
    setNewCategory('')
    setCustomUnit('')
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditForm({ name: item.name, unit: item.unit, type: item.type, costPrice: item.costPrice })
  }

  const saveEdit = (id) => {
    updatePriceItem(id, { ...editForm, costPrice: Number(editForm.costPrice) })
    setEditingId(null)
    refresh()
  }

  const handleDelete = (id, name) => {
    if (!confirm(`למחוק את "${name}" מהמחירון?`)) return
    deletePriceItem(id)
    refresh()
  }

  const handleExportExcel = () => {
    const typeLabels = { material: 'חומר', labor: 'עבודה', subcontractor: 'קבלן משנה', combined: 'כולל' }
    const data = priceList.map(item => ({
      'קטגוריה': item.category,
      'שם': item.name,
      'יחידה': item.unit,
      'סוג': typeLabels[item.type] || item.type,
      'מחיר עלות': item.costPrice,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 8 }, { wch: 12 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'מחירון')
    XLSX.writeFile(wb, 'מחירון.xlsx')
  }

  // ייבוא מחירון מאקסל
  const handleImportExcel = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws)
        if (rows.length === 0) { alert('הקובץ ריק'); return }

        const typeMap = { 'חומר': 'material', 'עבודה': 'labor', 'קבלן משנה': 'subcontractor', 'כולל': 'combined' }
        let added = 0
        rows.forEach(row => {
          const name = row['שם'] || row['מהות'] || row['תיאור']
          if (!name) return
          addPriceItem({
            category: row['קטגוריה'] || 'כללי',
            name: String(name),
            unit: String(row['יחידה'] || row['יח\''] || 'יח׳'),
            type: typeMap[row['סוג']] || 'material',
            costPrice: Number(row['מחיר עלות'] || row['מחיר'] || 0),
          })
          added++
        })
        refresh()
        alert(`יובאו ${added} פריטים למחירון`)
      } catch { alert('שגיאה בקריאת הקובץ') }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>מחירון מאסטר</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{priceList.length} פריטים ב-{categories.length} קטגוריות</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={16} />ייבוא מאקסל
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportExcel} style={{ display: 'none' }} />
          </label>
          <button className="btn btn-secondary" onClick={handleExportExcel}>
            <Download size={16} />ייצוא לאקסל
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />פריט חדש
          </button>
        </div>
      </div>

      {categories.map(cat => (
        <div key={cat} className="card" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{categoryIcons[cat] || '📦'}</span>
            {cat}
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>({grouped[cat].length} פריטים)</span>
          </h2>
          <div className="table-container">
            <table>
              <colgroup>
                <col style={{ width: '40%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <thead>
                <tr><th>שם</th><th>יחידה</th><th>סוג</th><th>מחיר עלות</th><th></th></tr>
              </thead>
              <tbody>
                {grouped[cat].map(item => (
                  <tr key={item.id}>
                    {editingId === item.id ? (
                      <>
                        <td><input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '4px 8px', fontSize: '13px' }} /></td>
                        <td>
                          <select value={STANDARD_UNITS.includes(editForm.unit) ? editForm.unit : '__custom'} onChange={e => setEditForm(p => ({ ...p, unit: e.target.value === '__custom' ? p.unit : e.target.value }))} style={{ padding: '4px', fontSize: '12px', width: '80px' }}>
                            {STANDARD_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            {!STANDARD_UNITS.includes(editForm.unit) && <option value={editForm.unit}>{editForm.unit}</option>}
                          </select>
                        </td>
                        <td>
                          <select value={editForm.type} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))} style={{ padding: '4px', fontSize: '12px' }}>
                            {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </td>
                        <td><input type="number" value={editForm.costPrice} onChange={e => setEditForm(p => ({ ...p, costPrice: e.target.value }))} style={{ width: '80px', padding: '4px 8px', fontSize: '13px', textAlign: 'center' }} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => saveEdit(item.id)} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '4px' }}><Save size={14} /></button>
                            <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><X size={14} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td>{item.unit}</td>
                        <td>
                          <span className={`badge ${getTypeBadgeClass(item.type)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {typeIcon(item.type)} {getTypeLabel(item.type)}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(item.costPrice)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => startEdit(item)} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', padding: '4px' }}><Edit3 size={14} /></button>
                            <button onClick={() => handleDelete(item.id, item.name)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {priceList.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          המחירון ריק. הוסף פריטים ידנית או ייבא מאקסל.
        </div>
      )}

      {/* מודל הוספת פריט */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>פריט חדש למחירון</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)} style={{ padding: '6px' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>קטגוריה</label>
                <select value={form.category} onChange={e => { setForm(prev => ({ ...prev, category: e.target.value })); setNewCategory('') }}>
                  <option value="">— בחר קטגוריה קיימת —</option>
                  {categories.map(c => <option key={c} value={c}>{categoryIcons[c] || '📦'} {c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>או הקלד קטגוריה חדשה</label>
                <input value={newCategory} onChange={e => { setNewCategory(e.target.value); setForm(prev => ({ ...prev, category: '' })) }} placeholder="שם קטגוריה חדשה" />
              </div>
              <div className="form-group">
                <label>שם הפריט</label>
                <input required value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="לדוגמה: בטון B30" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>יחידת מידה</label>
                  <select value={STANDARD_UNITS.includes(form.unit) ? form.unit : (form.unit ? '__custom' : '')} onChange={e => {
                    if (e.target.value === '__custom') { setForm(prev => ({ ...prev, unit: '' })); setCustomUnit('') }
                    else { setForm(prev => ({ ...prev, unit: e.target.value })); setCustomUnit('') }
                  }}>
                    <option value="">— בחר —</option>
                    {STANDARD_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    <option value="__custom">אחר...</option>
                  </select>
                  {(form.unit === '' && customUnit !== undefined) && (
                    <input value={customUnit} onChange={e => { setCustomUnit(e.target.value); setForm(prev => ({ ...prev, unit: '' })) }}
                      placeholder="הקלד יחידה" style={{ marginTop: '6px' }} />
                  )}
                </div>
                <div className="form-group">
                  <label>מחיר עלות (₪)</label>
                  <input type="number" min="0" value={form.costPrice} onChange={e => setForm(prev => ({ ...prev, costPrice: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div className="form-group">
                <label>סוג</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {TYPE_OPTIONS.map(opt => (
                    <label key={opt.value} style={{
                      display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                      padding: '8px 12px', borderRadius: '8px',
                      background: form.type === opt.value ? 'var(--gold-bg)' : 'var(--dark)',
                      border: form.type === opt.value ? '1px solid var(--gold-border)' : '1px solid transparent',
                    }}>
                      <input type="radio" name="type" value={opt.value} checked={form.type === opt.value}
                        onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))} style={{ display: 'none' }} />
                      {opt.icon} {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">הוסף למחירון</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>ביטול</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
