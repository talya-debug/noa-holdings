import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Package, Wrench, Users, Layers, CheckCircle, Clock, AlertCircle, ShoppingCart, ClipboardList, BarChart3 } from 'lucide-react'
import { formatCurrency, categoryIcons, getStatusLabel, getStatusBadgeClass, getTypeLabel, getTypeBadgeClass } from '../data/mockData'
import { getProjectTasks, updateProjectTask, getProject, getWorkLogs, getPurchases, getSubcontractors } from '../data/store'

// חישוב כמות מצטברת שבוצעה per משימה מיומני עבודה
function getExecutedByTask(logs) {
  const result = {}
  logs.forEach(log => {
    (log.entries || []).forEach(entry => {
      if (entry.taskId && entry.executedQty) {
        result[entry.taskId] = (result[entry.taskId] || 0) + entry.executedQty
      }
    })
  })
  return result
}

export default function ProjectTasks() {
  const { id } = useParams()
  const projectId = Number(id)
  const project = getProject(projectId)
  const [tasks, setTasks] = useState(() => getProjectTasks().filter(t => t.projectId === projectId))

  // נתונים נוספים לכרטיס קטגוריה
  const logs = getWorkLogs().filter(l => l.projectId === projectId)
  const purchases = getPurchases().filter(p => p.projectId === projectId)
  const subs = getSubcontractors().filter(s => s.projectId === projectId)
  const executedByTask = getExecutedByTask(logs)

  if (!project) {
    return (
      <div className="animate-in">
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          פרויקט לא נמצא
        </div>
      </div>
    )
  }

  const totalTasks = tasks.length
  const doneCount = tasks.filter(t => t.status === 'done').length
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length
  const pendingCount = tasks.filter(t => t.status === 'pending').length

  // קיבוץ לפי קטגוריה
  const categories = [...new Set(tasks.map(t => t.category))]
  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = tasks.filter(t => t.category === cat)
    return acc
  }, {})

  const handleStatusChange = (taskId, newStatus) => {
    updateProjectTask(taskId, { status: newStatus })
    setTasks(getProjectTasks().filter(t => t.projectId === projectId))
  }

  const statusOptions = [
    { value: 'pending', label: 'ממתין' },
    { value: 'in_progress', label: 'בתהליך' },
    { value: 'done', label: 'בוצע' },
  ]

  // חישוב סיכום per קטגוריה
  const getCategorySummary = (cat) => {
    const catTasks = grouped[cat]

    // רכש — % הוזמן, % סופק
    const catPurchases = purchases.filter(p => p.category === cat)
    const purchaseBudget = catPurchases.reduce((s, p) => s + p.budgetTotal, 0)
    const purchaseOrdered = catPurchases.reduce((s, p) => (p.orders || []).reduce((os, o) => os + o.total, 0) + s, 0)
    const purchaseDelivered = catPurchases.reduce((s, p) => (p.orders || []).filter(o => o.status === 'delivered').reduce((os, o) => os + o.total, 0) + s, 0)

    // קב"מ
    const catSubs = subs.filter(s => s.specialty === cat)
    const subTotal = catSubs.reduce((s, sub) => s + sub.contractAmount, 0)
    const subPaid = catSubs.reduce((s, sub) => s + sub.paid, 0)

    // ביצוע עבודה — ממוצע משוקלל של כל משימות הקטגוריה
    let totalPlannedValue = 0
    let totalExecutedValue = 0
    catTasks.forEach(t => {
      const taskValue = t.clientPrice * t.budgetQty
      totalPlannedValue += taskValue
      const executed = executedByTask[t.id] || 0
      const pct = t.budgetQty > 0 ? Math.min(executed / t.budgetQty, 1) : (t.status === 'done' ? 1 : 0)
      totalExecutedValue += taskValue * pct
    })
    const overallPct = totalPlannedValue > 0 ? Math.round((totalExecutedValue / totalPlannedValue) * 100) : 0

    return { purchaseBudget, purchaseOrdered, purchaseDelivered, subTotal, subPaid, overallPct }
  }

  // סיכום כללי פרויקט
  const projectProgress = (() => {
    let totalValue = 0, executedValue = 0
    tasks.forEach(t => {
      const v = t.clientPrice * t.budgetQty
      totalValue += v
      const ex = executedByTask[t.id] || 0
      const pct = t.budgetQty > 0 ? Math.min(ex / t.budgetQty, 1) : (t.status === 'done' ? 1 : 0)
      executedValue += v * pct
    })
    return totalValue > 0 ? Math.round((executedValue / totalValue) * 100) : 0
  })()

  const typeIcon = (type) => {
    switch(type) {
      case 'material': return <Package size={11} />
      case 'labor': return <Wrench size={11} />
      case 'subcontractor': return <Users size={11} />
      case 'combined': return <Layers size={11} />
      default: return <Package size={11} />
    }
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>משימות פרויקט</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{project.name}</p>
      </div>

      {/* סיכום */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))',
        gap: '12px', marginBottom: '24px',
      }}>
        {[
          { label: 'סה"כ משימות', value: totalTasks, icon: ClipboardList, color: 'var(--text-primary)', bg: 'rgba(255,255,255,0.05)' },
          { label: 'בוצע', value: doneCount, icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-bg)' },
          { label: 'בתהליך', value: inProgressCount, icon: Clock, color: 'var(--warning)', bg: 'var(--warning-bg)' },
          { label: 'ממתין', value: pendingCount, icon: AlertCircle, color: 'var(--info)', bg: 'var(--info-bg)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* התקדמות כללית */}
      {totalTasks > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>התקדמות כללית (מיומנים)</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)' }}>{projectProgress}%</span>
          </div>
          <div style={{ height: '8px', background: 'var(--dark)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${projectProgress}%`, borderRadius: '4px',
              background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))', transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* קטגוריות */}
      {categories.map(cat => {
        const summary = getCategorySummary(cat)
        const catTasks = grouped[cat]
        const catDone = catTasks.filter(t => t.status === 'done').length

        return (
          <div key={cat} className="card" style={{ marginBottom: '16px', borderRight: `3px solid ${summary.overallPct >= 100 ? 'var(--success)' : summary.overallPct > 0 ? 'var(--gold)' : 'var(--dark-border)'}` }}>
            {/* כותרת + אחוז התקדמות */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{categoryIcons[cat] || '📦'}</span>
                {cat}
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({catDone}/{catTasks.length})
                </span>
              </h3>
              <span style={{
                fontSize: '14px', fontWeight: 700,
                color: summary.overallPct >= 100 ? 'var(--success)' : summary.overallPct > 0 ? 'var(--gold)' : 'var(--text-muted)',
              }}>
                {summary.overallPct}%
              </span>
            </div>

            {/* פרוגרס */}
            <div style={{ height: '4px', background: 'var(--dark)', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{
                height: '100%', width: `${Math.min(summary.overallPct, 100)}%`, borderRadius: '2px',
                background: summary.overallPct >= 100 ? 'var(--success)' : 'var(--gold)',
              }} />
            </div>

            {/* סיכום רכש + קב"מ */}
            {(summary.purchaseBudget > 0 || summary.subTotal > 0) && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {summary.purchaseBudget > 0 && (
                  <div style={{ padding: '8px 12px', background: 'var(--dark)', borderRadius: '6px', fontSize: '12px', flex: 1 }}>
                    <span style={{ color: 'var(--info)' }}>רכש: </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      הוזמן {summary.purchaseBudget > 0 ? Math.round(summary.purchaseOrdered / summary.purchaseBudget * 100) : 0}%
                      {' | '}סופק {summary.purchaseBudget > 0 ? Math.round(summary.purchaseDelivered / summary.purchaseBudget * 100) : 0}%
                    </span>
                  </div>
                )}
                {summary.subTotal > 0 && (
                  <div style={{ padding: '8px 12px', background: 'var(--dark)', borderRadius: '6px', fontSize: '12px', flex: 1 }}>
                    <span style={{ color: 'var(--success)' }}>קב"מ: </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      שולם {formatCurrency(summary.subPaid)} מ-{formatCurrency(summary.subTotal)}
                      ({summary.subTotal > 0 ? Math.round(summary.subPaid / summary.subTotal * 100) : 0}%)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* טבלת משימות */}
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>סוג</th>
                    <th>יחידה</th>
                    <th>תכנון</th>
                    <th>בוצע</th>
                    <th>% ביצוע</th>
                    <th>סטטוס</th>
                    <th>קישור</th>
                  </tr>
                </thead>
                <tbody>
                  {catTasks.map(task => {
                    const executed = executedByTask[task.id] || 0
                    const pct = task.budgetQty > 0 ? Math.round((executed / task.budgetQty) * 100) : 0
                    return (
                      <tr key={task.id} style={{ opacity: task.status === 'done' ? 0.7 : 1 }}>
                        <td style={{ fontWeight: 500 }}>{task.name}</td>
                        <td>
                          <span className={`badge ${getTypeBadgeClass(task.type)}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                            {typeIcon(task.type)}
                            {getTypeLabel(task.type)}
                          </span>
                        </td>
                        <td>{task.unit}</td>
                        <td>{task.budgetQty}</td>
                        <td style={{ fontWeight: 600, color: executed > 0 ? 'var(--gold)' : 'var(--text-muted)' }}>
                          {executed > 0 ? executed : '-'}
                        </td>
                        <td>
                          {executed > 0 ? (
                            <span style={{
                              fontSize: '12px', fontWeight: 600,
                              color: pct >= 100 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--text-muted)',
                            }}>
                              {pct}%
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          <select value={task.status} onChange={e => handleStatusChange(task.id, e.target.value)}
                            style={{
                              padding: '4px 8px', fontSize: '12px', borderRadius: '6px',
                              background: task.status === 'done' ? 'var(--success-bg)' : task.status === 'in_progress' ? 'var(--warning-bg)' : 'var(--info-bg)',
                              color: task.status === 'done' ? 'var(--success)' : task.status === 'in_progress' ? 'var(--warning)' : 'var(--info)',
                              border: 'none', cursor: 'pointer', fontWeight: 600,
                            }}>
                            {statusOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {(task.type === 'material' || task.type === 'combined') && (
                            <Link to={`/project/${projectId}/procurement`} style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              fontSize: '12px', color: 'var(--info)', textDecoration: 'none',
                            }}>
                              <ShoppingCart size={12} />רכש
                            </Link>
                          )}
                          {task.type === 'subcontractor' && (
                            <Link to={`/project/${projectId}/subcontractors`} style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              fontSize: '12px', color: 'var(--success)', textDecoration: 'none',
                            }}>
                              <Users size={12} />קב"מ
                            </Link>
                          )}
                          {(task.type === 'labor' || task.type === 'combined') && (
                            <Link to={`/project/${projectId}/logs`} style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              fontSize: '12px', color: 'var(--warning)', textDecoration: 'none',
                              marginRight: task.type === 'combined' ? '8px' : 0,
                            }}>
                              <ClipboardList size={12} />יומן
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {tasks.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          אין משימות. משימות נוצרות אוטומטית מאישור הצעת מחיר.
        </div>
      )}
    </div>
  )
}
