import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { ChevronDown, ChevronLeft, Check, X, Package, Hammer } from 'lucide-react'
import { masterTemplate, findMasterItem, formatCurrency, calcProjectMaterialCost, calcProjectLaborCost, calcProjectSellPrice, calcProfitMargin } from '../data/mockData'
import { getProject, updateProject } from '../data/store'

export default function WorkBreakdown() {
  const { id } = useParams()
  const pid = Number(id)
  const [project, setProject] = useState(getProject(pid))
  const [expanded, setExpanded] = useState({})

  if (!project) return <div>פרויקט לא נמצא</div>

  const selectedItems = project.selectedItems || []

  const getQty = (itemId) => {
    const sel = selectedItems.find(s => s.itemId === itemId)
    return sel ? sel.quantity : 0
  }

  const setQty = (itemId, qty) => {
    let updated = [...selectedItems]
    const idx = updated.findIndex(s => s.itemId === itemId)
    if (qty > 0) {
      if (idx !== -1) updated[idx] = { ...updated[idx], quantity: qty }
      else updated.push({ itemId, quantity: qty })
    } else {
      updated = updated.filter(s => s.itemId !== itemId)
    }
    const newProject = { ...project, selectedItems: updated }
    setProject(newProject)
    updateProject(pid, { selectedItems: updated })
  }

  const toggleCategory = (cat) => {
    const catItemIds = cat.items.map(i => i.id)
    const hasAny = catItemIds.some(id => getQty(id) > 0)
    let updated = [...selectedItems]
    if (hasAny) {
      updated = updated.filter(s => !catItemIds.includes(s.itemId))
    } else {
      catItemIds.forEach(itemId => {
        if (!updated.find(s => s.itemId === itemId)) updated.push({ itemId, quantity: 1 })
      })
    }
    const newProject = { ...project, selectedItems: updated }
    setProject(newProject)
    updateProject(pid, { selectedItems: updated })
  }

  const totalMaterial = calcProjectMaterialCost(selectedItems)
  const totalLabor = calcProjectLaborCost(selectedItems)
  const totalCost = totalMaterial + totalLabor
  const totalSell = calcProjectSellPrice(selectedItems)
  const totalProfit = totalSell - totalCost
  const profitMargin = calcProfitMargin(selectedItems)

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>תכולות פרויקט</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{project.name}</p>
      </div>

      {/* סיכום עליון */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px', marginBottom: '24px', padding: '20px',
        background: 'var(--dark-card)', borderRadius: 'var(--radius)', border: '1px solid var(--gold-border)',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Package size={12} /> אומדן רכש
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--info)' }}>{formatCurrency(totalMaterial)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Hammer size={12} /> אומדן כוח אדם
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--warning)' }}>{formatCurrency(totalLabor)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>עלות כוללת</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(totalCost)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>מחיר מכירה</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gold)' }}>{formatCurrency(totalSell)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>רווח</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(totalProfit)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>% רווח</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: profitMargin > 20 ? 'var(--success)' : 'var(--warning)' }}>
            {profitMargin}%
          </div>
        </div>
      </div>

      {/* מקרא */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '12px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--info)' }}></span>
          רכש - מתועד במעקב רכש
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }}></span>
          כוח אדם - מתועד ביומני עבודה
        </span>
      </div>

      {/* קטגוריות */}
      {masterTemplate.map(category => {
        const catItemIds = category.items.map(i => i.id)
        const activeCatItems = selectedItems.filter(s => catItemIds.includes(s.itemId))
        const isActive = activeCatItems.length > 0
        const isExpanded = expanded[category.id]

        let catCost = 0, catSell = 0
        activeCatItems.forEach(sel => {
          const item = findMasterItem(sel.itemId)
          if (item) {
            catCost += item.costPrice * sel.quantity
            catSell += item.sellPrice * sel.quantity
          }
        })

        return (
          <div key={category.id} className="card" style={{
            marginBottom: '10px', padding: 0,
            opacity: isActive ? 1 : 0.6,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '16px 20px', cursor: 'pointer',
            }} onClick={() => setExpanded(prev => ({ ...prev, [category.id]: !prev[category.id] }))}>

              <button onClick={(e) => { e.stopPropagation(); toggleCategory(category) }} style={{
                width: 28, height: 28, borderRadius: '6px', border: 'none',
                background: isActive ? 'var(--gold)' : 'var(--dark)',
                color: isActive ? 'var(--dark)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}>
                {isActive ? <Check size={16} /> : <X size={14} />}
              </button>

              <span style={{ fontSize: '20px' }}>{category.icon}</span>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{category.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {category.items.length} פריטים{isActive && ` | ${activeCatItems.length} נבחרו`}
                </div>
              </div>

              {isActive && (
                <div style={{ display: 'flex', gap: '16px', textAlign: 'left' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>עלות</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--danger)' }}>{formatCurrency(catCost)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>מכירה</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)' }}>{formatCurrency(catSell)}</div>
                  </div>
                </div>
              )}

              {isExpanded ? <ChevronDown size={18} /> : <ChevronLeft size={18} />}
            </div>

            {isExpanded && (
              <div style={{ borderTop: '1px solid var(--dark-border)', overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '30px' }}></th>
                      <th>פריט</th>
                      <th>סוג</th>
                      <th>יחידה</th>
                      <th>עלות</th>
                      <th>מכירה</th>
                      <th style={{ width: '90px' }}>כמות</th>
                      <th>סה"כ עלות</th>
                      <th>סה"כ מכירה</th>
                      <th>רווח</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.items.map(item => {
                      const qty = getQty(item.id)
                      const isSelected = qty > 0
                      const totalC = item.costPrice * qty
                      const totalS = item.sellPrice * qty
                      const itemProfit = totalS - totalC
                      const isMaterial = item.type === 'material'

                      return (
                        <tr key={item.id} style={{ opacity: isSelected ? 1 : 0.5 }}>
                          <td>
                            <input type="checkbox" checked={isSelected}
                              onChange={() => isSelected ? setQty(item.id, 0) : setQty(item.id, 1)}
                              style={{ width: 'auto', cursor: 'pointer', accentColor: 'var(--gold)' }}
                            />
                          </td>
                          <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</td>
                          <td>
                            <span className={`badge ${isMaterial ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                              {isMaterial ? 'רכש' : 'עבודה'}
                            </span>
                          </td>
                          <td>{item.unit}</td>
                          <td style={{ color: isMaterial ? 'var(--info)' : 'var(--warning)', fontSize: '13px' }}>
                            {formatCurrency(item.costPrice)}
                          </td>
                          <td style={{ color: 'var(--gold)', fontSize: '13px' }}>{formatCurrency(item.sellPrice)}</td>
                          <td>
                            <input type="number" min="0" value={qty || ''} placeholder="0"
                              onChange={e => setQty(item.id, Number(e.target.value) || 0)}
                              style={{
                                width: '75px', padding: '5px 8px', textAlign: 'center', fontSize: '13px',
                                background: isSelected ? 'var(--gold-bg)' : 'var(--dark)',
                                borderColor: isSelected ? 'var(--gold-border)' : 'var(--dark-border)',
                              }}
                            />
                          </td>
                          <td style={{ color: isMaterial ? 'var(--info)' : 'var(--warning)' }}>
                            {isSelected ? formatCurrency(totalC) : '-'}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--gold)' }}>
                            {isSelected ? formatCurrency(totalS) : '-'}
                          </td>
                          <td style={{ fontWeight: 600, color: isSelected ? 'var(--success)' : 'var(--text-muted)' }}>
                            {isSelected ? formatCurrency(itemProfit) : '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {isActive && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', padding: '12px 20px',
                    background: 'var(--gold-bg)', borderTop: '1px solid var(--gold-border)',
                    fontSize: '13px', flexWrap: 'wrap', gap: '12px',
                  }}>
                    <span style={{ color: 'var(--gold)', fontWeight: 600 }}>סה"כ {category.name}</span>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <span>עלות: <strong style={{ color: 'var(--danger)' }}>{formatCurrency(catCost)}</strong></span>
                      <span>מכירה: <strong style={{ color: 'var(--gold)' }}>{formatCurrency(catSell)}</strong></span>
                      <span>רווח: <strong style={{ color: 'var(--success)' }}>{formatCurrency(catSell - catCost)}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
