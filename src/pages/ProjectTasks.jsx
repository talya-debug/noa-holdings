import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Package, Wrench, Users, CheckCircle, Clock, AlertCircle, ShoppingCart, ClipboardList } from 'lucide-react'
import { formatCurrency, categoryIcons, getStatusLabel, getStatusBadgeClass, getTypeLabel, getTypeBadgeClass } from '../data/mockData'
import { getProjectTasks, updateProjectTask, getProject } from '../data/store'

export default function ProjectTasks() {
  const { id } = useParams()
  const projectId = Number(id)
  const project = getProject(projectId)
  const [tasks, setTasks] = useState(() => getProjectTasks().filter(t => t.projectId === projectId))

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

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>משימות פרויקט</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{project.name}</p>
      </div>

      {/* סיכום */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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

      {/* התקדמות */}
      {totalTasks > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>התקדמות כללית</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)' }}>{Math.round(doneCount / totalTasks * 100)}%</span>
          </div>
          <div style={{ height: '8px', background: 'var(--dark)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${Math.round(doneCount / totalTasks * 100)}%`, borderRadius: '4px',
              background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))', transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* משימות לפי קטגוריה */}
      {categories.map(cat => (
        <div key={cat} className="card" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--gold)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{categoryIcons[cat] || '📦'}</span>
            {cat}
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
              ({grouped[cat].filter(t => t.status === 'done').length}/{grouped[cat].length} בוצע)
            </span>
          </h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>שם</th>
                  <th>סוג</th>
                  <th>יחידה</th>
                  <th>כמות תקציב</th>
                  <th>עלות תקציב</th>
                  <th>מחיר ללקוח</th>
                  <th>סטטוס</th>
                  <th>קישורים</th>
                </tr>
              </thead>
              <tbody>
                {grouped[cat].map(task => (
                  <tr key={task.id} style={{
                    opacity: task.status === 'done' ? 0.7 : 1,
                  }}>
                    <td style={{ fontWeight: 500 }}>{task.name}</td>
                    <td>
                      <span className={`badge ${getTypeBadgeClass(task.type)}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                        {task.type === 'material' ? <Package size={11} /> : task.type === 'labor' ? <Wrench size={11} /> : <Users size={11} />}
                        {getTypeLabel(task.type)}
                      </span>
                    </td>
                    <td>{task.unit}</td>
                    <td>{task.budgetQty}</td>
                    <td>{formatCurrency(task.budgetCost * task.budgetQty)}</td>
                    <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{formatCurrency(task.clientPrice * task.budgetQty)}</td>
                    <td>
                      <select
                        value={task.status}
                        onChange={e => handleStatusChange(task.id, e.target.value)}
                        style={{
                          padding: '4px 8px', fontSize: '12px', borderRadius: '6px',
                          background: task.status === 'done' ? 'var(--success-bg)' : task.status === 'in_progress' ? 'var(--warning-bg)' : 'var(--info-bg)',
                          color: task.status === 'done' ? 'var(--success)' : task.status === 'in_progress' ? 'var(--warning)' : 'var(--info)',
                          border: 'none', cursor: 'pointer', fontWeight: 600,
                        }}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {(task.type === 'material' || task.type === 'subcontractor') && (
                        <Link to={`/project/${projectId}/procurement`} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          fontSize: '12px', color: 'var(--info)', textDecoration: 'none',
                        }}>
                          <ShoppingCart size={12} />{task.type === 'subcontractor' ? 'תשלומים' : 'רכש'}
                        </Link>
                      )}
                      {task.type === 'labor' && (
                        <Link to={`/project/${projectId}/logs`} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          fontSize: '12px', color: 'var(--warning)', textDecoration: 'none',
                        }}>
                          <ClipboardList size={12} />יומן
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {tasks.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          אין משימות. משימות נוצרות אוטומטית מאישור הצעת מחיר.
        </div>
      )}
    </div>
  )
}
