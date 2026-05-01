import { useState } from 'react'
import { Plus, Package, Wrench, Users, X, Edit3, Trash2, Save, Download } from 'lucide-react'
import { categoryIcons, formatCurrency, getTypeLabel, getTypeBadgeClass } from '../data/mockData'
import { getPriceList, addPriceItem, updatePriceItem, deletePriceItem } from '../data/store'
import * as XLSX from 'xlsx'

export default function PriceList() {
  const [priceList, setPriceList] = useState(getPriceList())
  const [showModal, setShowModal] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [form, setForm] = useState({ category: '', name: '', unit: '', type: 'material', costPrice: '' })

  const refresh = () => setPriceList(getPriceList())
  const categories = [...new Set(priceList.map(i => i.category))]
  const grouped = categories.reduce((acc, cat) => { acc[cat] = priceList.filter(i => i.category === cat); return acc }, {})

  const typeIcon = (type) => type === 'material' ? <Package size={12} /> : type === 'labor' ? <Wrench size={12} /> : <Users size={12} />

  const handleSubmit = (e) => {
    e.preventDefault()
    const category = newCategory || form.category
    if (!category) return
    addPriceItem({ category, name: form.name, unit: form.unit, type: form.type, costPrice: Number(form.costPrice) })
    refresh()
    setShowModal(false)
    setForm({ category: '', name: '', unit: '', type: 'material', costPrice: '' })
    setNewCategory('')
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

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>מחירון מאסטר</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{priceList.length} פריטים ב-{categories.length} קטגוריות</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
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
                        <td><input value={editForm.unit} onChange={e => setEditForm(p => ({ ...p, unit: e.target.value }))} style={{ width: '60px', padding: '4px 8px', fontSize: '13px' }} /></td>
                        <td>
                          <select value={editForm.type} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))} style={{ padding: '4px', fontSize: '12px' }}>
                            <option value="material">חומר</option>
                            <option value="labor">עבודה</option>
                            <option value="subcontractor">קבלן משנה</option>
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
                  <input required value={form.unit} onChange={e => setForm(prev => ({ ...prev, unit: e.target.value }))} placeholder='מ"ר, יח׳, יום, פאושלי...' />
                </div>
                <div className="form-group">
                  <label>מחיר עלות (₪)</label>
                  <input required type="number" min="0" value={form.costPrice} onChange={e => setForm(prev => ({ ...prev, costPrice: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div className="form-group">
                <label>סוג</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  {[
                    { value: 'material', icon: <Package size={14} />, label: 'חומר' },
                    { value: 'labor', icon: <Wrench size={14} />, label: 'עבודה' },
                    { value: 'subcontractor', icon: <Users size={14} />, label: 'קבלן משנה' },
                  ].map(opt => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="radio" name="type" value={opt.value} checked={form.type === opt.value} onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))} />
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
