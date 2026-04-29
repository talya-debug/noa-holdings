import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProject, getMilestones, getProjectTasks } from '../data/store'
import { formatDate, categoryIcons } from '../data/mockData'
import { Calendar, ChevronDown, ChevronUp, CheckCircle, Circle, Clock } from 'lucide-react'

// שלבי בנייה בסדר כרונולוגי
const BUILD_PHASES = [
  { key: 'עבודות שלד', label: 'שלד', defaultWeeks: 12 },
  { key: 'אינסטלציה', label: 'אינסטלציה', defaultWeeks: 4 },
  { key: 'חשמל', label: 'חשמל', defaultWeeks: 4 },
  { key: 'איטום', label: 'איטום', defaultWeeks: 2 },
  { key: 'אלומיניום', label: 'אלומיניום', defaultWeeks: 3 },
  { key: 'ריצוף וחיפוי', label: 'ריצוף', defaultWeeks: 4 },
  { key: 'צבע וגבס', label: 'צבע וגבס', defaultWeeks: 4 },
  { key: 'נגרות', label: 'נגרות', defaultWeeks: 2 },
  { key: 'מיזוג אוויר', label: 'מיזוג', defaultWeeks: 2 },
  { key: 'מעלית', label: 'מעלית', defaultWeeks: 4 },
  { key: 'פיתוח חוץ', label: 'פיתוח חוץ', defaultWeeks: 3 },
  { key: 'עבודות פח', label: 'פח', defaultWeeks: 1 },
]

// סטטוס צבע
function getStatusStyle(status) {
  if (status === 'done') return { bg: 'var(--success)', text: 'הושלם' }
  if (status === 'in_progress') return { bg: 'var(--warning)', text: 'בביצוע' }
  return { bg: 'var(--text-muted)', text: 'טרם התחיל' }
}

export default function ProjectTimeline() {
  const { id } = useParams()
  const projectId = Number(id)
  const project = getProject(projectId)
  const [expanded, setExpanded] = useState(null)

  if (!project) return <div className="card"><h2>פרויקט לא נמצא</h2></div>

  const tasks = getProjectTasks().filter(t => t.projectId === projectId)
  const milestones = getMilestones().filter(m => m.projectId === projectId)

  // חישוב שלבים מהמשימות
  const phases = BUILD_PHASES.map(phase => {
    const phaseTasks = tasks.filter(t => t.category === phase.key)
    if (phaseTasks.length === 0) return null

    const done = phaseTasks.filter(t => t.status === 'done').length
    const inProgress = phaseTasks.filter(t => t.status === 'in_progress').length
    const total = phaseTasks.length
    const progress = total > 0 ? Math.round((done / total) * 100) : 0
    const status = done === total ? 'done' : inProgress > 0 || done > 0 ? 'in_progress' : 'pending'

    // תקציב
    const budgetTotal = phaseTasks.reduce((s, t) => s + (t.budgetCost * t.budgetQty), 0)
    const sellTotal = phaseTasks.reduce((s, t) => s + (t.clientPrice * t.budgetQty), 0)

    return {
      ...phase,
      tasks: phaseTasks,
      done, inProgress, total, progress, status,
      budgetTotal, sellTotal,
    }
  }).filter(Boolean)

  // סיכום כולל
  const totalTasks = tasks.length
  const totalDone = tasks.filter(t => t.status === 'done').length
  const totalProgress = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

  // חישוב ציר זמן
  const startDate = project.startDate ? new Date(project.startDate) : new Date()
  const endDate = project.expectedEnd ? new Date(project.expectedEnd) : null
  const today = new Date()
  const totalDays = endDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) : 180
  const elapsedDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24))
  const timeProgress = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)))

  return (
    <div className="animate-in">
      {/* כותרת */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>לוח זמנים</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>{project.name}</p>
      </div>

      {/* סרגל התקדמות כולל */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>התקדמות ביצוע</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--gold)' }}>{totalProgress}%</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{totalDone} מתוך {totalTasks} משימות</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>התקדמות זמן</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: timeProgress > totalProgress + 20 ? 'var(--danger)' : 'var(--info)' }}>{timeProgress}%</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {formatDate(project.startDate)} → {endDate ? formatDate(project.expectedEnd) : 'לא הוגדר'}
            </div>
          </div>
        </div>

        {/* סרגל כפול */}
        <div style={{ position: 'relative', height: '24px', background: 'var(--dark)', borderRadius: '12px', overflow: 'hidden' }}>
          {/* זמן */}
          <div style={{
            position: 'absolute', top: 0, right: 0, height: '100%',
            width: `${timeProgress}%`,
            background: 'rgba(96,165,250,0.15)',
            borderRadius: '12px',
            transition: 'width 0.5s',
          }} />
          {/* ביצוע */}
          <div style={{
            position: 'absolute', top: '4px', right: '4px', height: 'calc(100% - 8px)',
            width: `calc(${totalProgress}% - 8px)`,
            background: 'linear-gradient(90deg, var(--gold), var(--gold-dark))',
            borderRadius: '8px',
            transition: 'width 0.5s',
            minWidth: totalProgress > 0 ? '8px' : '0',
          }} />
          {/* היום */}
          <div style={{
            position: 'absolute', top: 0, right: `${timeProgress}%`,
            width: '2px', height: '100%', background: 'var(--info)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} /> ביצוע
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--info)', display: 'inline-block' }} /> זמן
          </span>
        </div>
      </div>

      {/* ציר זמן — שלבי בנייה */}
      <div style={{ position: 'relative', paddingRight: '30px' }}>
        {/* קו אנכי */}
        <div style={{
          position: 'absolute', right: '14px', top: 0, bottom: 0, width: '2px',
          background: 'linear-gradient(to bottom, var(--gold), var(--dark-border))',
        }} />

        {phases.map((phase, i) => {
          const statusStyle = getStatusStyle(phase.status)
          const isExpanded = expanded === i

          return (
            <div key={phase.key} style={{ marginBottom: '8px', position: 'relative' }}>
              {/* נקודה על הציר */}
              <div style={{
                position: 'absolute', right: '-22px', top: '18px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: statusStyle.bg,
                border: '3px solid var(--dark)',
                zIndex: 2,
              }} />

              {/* כרטיס שלב */}
              <div className="card" style={{
                padding: '16px 20px',
                cursor: 'pointer',
                borderColor: phase.status === 'in_progress' ? 'rgba(251,191,36,0.3)' : phase.status === 'done' ? 'rgba(74,222,128,0.2)' : undefined,
              }} onClick={() => setExpanded(isExpanded ? null : i)}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{categoryIcons[phase.key] || '📋'}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{phase.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {phase.done}/{phase.total} משימות
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* סרגל התקדמות קטן */}
                    <div style={{ width: '100px' }}>
                      <div style={{ height: '6px', background: 'var(--dark)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${phase.progress}%`,
                          background: statusStyle.bg,
                          borderRadius: '3px',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2px' }}>
                        {phase.progress}%
                      </div>
                    </div>

                    <span className="badge" style={{
                      background: `${statusStyle.bg}22`,
                      color: statusStyle.bg,
                    }}>
                      {statusStyle.text}
                    </span>

                    {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </div>

                {/* פירוט משימות */}
                {isExpanded && (
                  <div style={{ marginTop: '16px', borderTop: '1px solid var(--dark-border)', paddingTop: '12px' }}>
                    {phase.tasks.map(task => (
                      <div key={task.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 0', borderBottom: '1px solid var(--dark-border)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {task.status === 'done' ? <CheckCircle size={14} style={{ color: 'var(--success)' }} /> :
                           task.status === 'in_progress' ? <Clock size={14} style={{ color: 'var(--warning)' }} /> :
                           <Circle size={14} style={{ color: 'var(--text-muted)' }} />}
                          <span style={{ fontSize: '13px' }}>{task.name}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {task.budgetQty} {task.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* אבני דרך */}
      {milestones.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--gold)' }}>
            <Calendar size={18} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
            אבני דרך (גבייה)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {milestones.map(ms => (
              <div key={ms.id} className="card" style={{
                padding: '16px', textAlign: 'center',
                borderColor: ms.status === 'paid' ? 'rgba(74,222,128,0.2)' : ms.status === 'in_progress' ? 'rgba(251,191,36,0.3)' : undefined,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', margin: '0 auto 8px',
                  background: ms.status === 'paid' ? 'var(--success-bg)' : ms.status === 'in_progress' ? 'var(--warning-bg)' : 'var(--dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {ms.status === 'paid' ? <CheckCircle size={18} style={{ color: 'var(--success)' }} /> :
                   ms.status === 'in_progress' ? <Clock size={18} style={{ color: 'var(--warning)' }} /> :
                   <Circle size={18} style={{ color: 'var(--text-muted)' }} />}
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{ms.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--gold)' }}>{ms.percentage}%</div>
                {ms.paidDate && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>שולם: {formatDate(ms.paidDate)}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
