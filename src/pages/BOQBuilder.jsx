import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, CheckCircle, Package, Users, Wrench, Layers } from 'lucide-react'
import { formatCurrency } from '../data/mockData'
import { getBOQQuote, updateBOQQuote, approveBOQQuote } from '../data/store'

// סוגי פריט
const ITEM_TYPES = [
  { value: 'procurement', label: 'רכש', icon: Package, color: 'var(--info)' },
  { value: 'labor', label: 'כוח אדם', icon: Wrench, color: 'var(--warning)' },
  { value: 'subcontractor', label: 'קב"מ', icon: Users, color: 'var(--success)' },
  { value: 'combined', label: 'כולל', icon: Layers, color: 'var(--gold)' },
]

export default function BOQBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [boq, setBOQ] = useState(() => getBOQQuote(Number(id)))

  if (!boq) return <div className="animate-in"><div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>כתב כמויות לא נמצא</div></div>

  const items = boq.items || []

  // חישובים
  const totalCost = items.reduce((s, i) => s + (i.costPrice * i.quantity), 0)
  const totalSell = items.reduce((s, i) => s + (i.clientPrice * i.quantity), 0)
  const profit = totalSell - totalCost
  const profitMargin = totalSell > 0 ? Math.round((profit / totalSell) * 100) : 0
  const classifiedCount = items.filter(i => i.itemType).length
  const allClassified = classifiedCount === items.length
  const allPriced = items.every(i => i.clientPrice > 0)

  // קיבוץ לפי קטגוריה
  const grouped = {}
  items.forEach((item, idx) => {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push({ ...item, _idx: idx })
  })

  const saveItems = (newItems) => {
    updateBOQQuote(boq.id, { items: newItems })
    setBOQ(prev => ({ ...prev, items: newItems }))
  }

  const handleItemChange = (idx, field, value) => {
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], [field]: field === 'costPrice' || field === 'clientPrice' ? (Number(value) || 0) : value }
    saveItems(newItems)
  }

  const handleApprove = () => {
    if (!allClassified) { alert('יש לסווג את כל הפריטים (רכש / כוח אדם / קבלן משנה)'); return }
    if (!allPriced) { alert('יש למלא מחיר ללקוח לכל הפריטים'); return }
    if (!confirm('לאשר כתב כמויות וליצור פרויקט?')) return
    const project = approveBOQQuote(boq.id)
    if (project) navigate(`/project/${project.id}`)
  }

  return (
    <div className="animate-in">
      {/* כותרת */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{boq.number}</h1>
            <span className="badge badge-info">כתב כמויות</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            {boq.clientName} • {boq.address}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {boq.status !== 'approved' && (
            <button className="btn btn-primary" onClick={handleApprove}>
              <CheckCircle size={16} />אשר → צור פרויקט
            </button>
          )}
        </div>
      </div>

      {/* סרגל סיכום */}
      <div className="card" style={{
        position: 'sticky', top: '0', zIndex: 10,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px',
        marginBottom: '24px', background: 'var(--dark-card)', border: '1px solid var(--gold-border)',
      }}>
        {[
          { label: 'סעיפים', value: items.length, color: 'var(--text-primary)' },
          { label: 'סווגו', value: `${classifiedCount}/${items.length}`, color: allClassified ? 'var(--success)' : 'var(--warning)' },
          { label: 'עלות כוללת', value: formatCurrency(totalCost), color: 'var(--danger)' },
          { label: 'מכירה כוללת', value: formatCurrency(totalSell), color: 'var(--gold)' },
          { label: 'רווח', value: formatCurrency(profit), color: profit >= 0 ? 'var(--success)' : 'var(--danger)' },
          { label: 'אחוז רווח', value: `${profitMargin}%`, color: profitMargin >= 20 ? 'var(--success)' : profitMargin >= 10 ? 'var(--warning)' : 'var(--danger)' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* טבלת סעיפים */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '20px 20px 0' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginBottom: '8px' }}>
            סעיפים — סווג כל שורה ומלא מחירים
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            כל שורה חייבת סיווג: <strong>רכש</strong> (חומרים → מעקב רכש), <strong>כוח אדם</strong> (עבודה → יומן עבודה), <strong>קבלן משנה</strong> (→ קבלני משנה)
          </p>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '70px' }}>סעיף</th>
                <th>מהות</th>
                <th style={{ width: '65px' }}>יחידה</th>
                <th style={{ width: '70px' }}>כמות</th>
                <th style={{ width: '180px' }}>סוג</th>
                <th style={{ width: '100px' }}>עלות ליח׳</th>
                <th style={{ width: '100px' }}>מחיר ללקוח</th>
                <th>סה"כ עלות</th>
                <th>סה"כ מכירה</th>
                <th>רווח</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([cat, catItems]) => (
                <>
                  <tr key={`cat-${cat}`}>
                    <td colSpan="10" style={{
                      background: 'rgba(212,168,67,0.06)', fontWeight: 600,
                      fontSize: '13px', color: 'var(--gold)', padding: '10px 16px',
                    }}>
                      {cat}
                    </td>
                  </tr>
                  {catItems.map(item => {
                    const lineCost = item.costPrice * item.quantity
                    const lineSell = item.clientPrice * item.quantity
                    const lineProfit = lineSell - lineCost
                    return (
                      <tr key={item._idx}>
                        <td style={{ fontWeight: 600, color: 'var(--gold)', fontSize: '12px' }}>{item.clause}</td>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td style={{ fontSize: '12px' }}>{item.unit}</td>
                        <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {ITEM_TYPES.map(t => (
                              <button key={t.value}
                                onClick={() => handleItemChange(item._idx, 'itemType', t.value)}
                                style={{
                                  padding: '4px 8px', fontSize: '11px', fontWeight: 600,
                                  borderRadius: '4px', border: 'none', cursor: 'pointer',
                                  background: item.itemType === t.value ? t.color : 'var(--dark)',
                                  color: item.itemType === t.value ? '#fff' : 'var(--text-muted)',
                                  opacity: item.itemType === t.value ? 1 : 0.6,
                                }}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td>
                          <input type="number" min="0" value={item.costPrice || ''}
                            onChange={e => handleItemChange(item._idx, 'costPrice', e.target.value)}
                            placeholder="0"
                            style={{ width: '85px', textAlign: 'center', padding: '5px', fontSize: '13px' }}
                          />
                        </td>
                        <td>
                          <input type="number" min="0" value={item.clientPrice || ''}
                            onChange={e => handleItemChange(item._idx, 'clientPrice', e.target.value)}
                            placeholder="0"
                            style={{ width: '85px', textAlign: 'center', padding: '5px', fontSize: '13px' }}
                          />
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                          {lineCost > 0 ? formatCurrency(lineCost) : '-'}
                        </td>
                        <td style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '13px' }}>
                          {lineSell > 0 ? formatCurrency(lineSell) : '-'}
                        </td>
                        <td style={{ color: lineProfit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: '13px' }}>
                          {lineSell > 0 ? formatCurrency(lineProfit) : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
