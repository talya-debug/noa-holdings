import { useParams } from 'react-router-dom'
import { getProject, getPurchases, getSubcontractors, getMilestones, getProjectTasks, getWorkLogs } from '../data/store'
import { formatCurrency, findPriceItem, calcQuoteTotals, formatDate } from '../data/mockData'
import { AlertTriangle, TrendingDown, Clock, DollarSign, Users, Package, CheckCircle, XCircle } from 'lucide-react'

// חישוב התראות אוטומטי מהנתונים
function generateAlerts(projectId, project) {
  const alerts = []
  const purchases = getPurchases().filter(p => p.projectId === projectId)
  const subs = getSubcontractors().filter(s => s.projectId === projectId)
  const milestones = getMilestones().filter(m => m.projectId === projectId)
  const tasks = getProjectTasks().filter(t => t.projectId === projectId)
  const logs = getWorkLogs().filter(l => l.projectId === projectId)

  // --- התראות תקציב ---

  // חריגות רכש - כשמחיר בפועל גבוה מהתקציב
  purchases.forEach(p => {
    if (p.actualTotal > 0 && p.budgetTotal > 0) {
      const overrun = ((p.actualTotal - p.budgetTotal) / p.budgetTotal) * 100
      if (overrun > 10) {
        alerts.push({
          type: 'danger',
          icon: TrendingDown,
          category: 'תקציב',
          title: `חריגת תקציב ברכש: ${p.name}`,
          detail: `תקציב: ${formatCurrency(p.budgetTotal)} | בפועל: ${formatCurrency(p.actualTotal)} | חריגה: ${overrun.toFixed(0)}%`,
          priority: overrun > 25 ? 1 : 2,
        })
      }
    }
  })

  // סה"כ חריגה תקציבית כוללת
  const totalBudget = purchases.reduce((s, p) => s + p.budgetTotal, 0)
  const totalActual = purchases.reduce((s, p) => s + p.actualTotal, 0)
  if (totalBudget > 0 && totalActual > totalBudget) {
    const overrunPct = ((totalActual - totalBudget) / totalBudget * 100).toFixed(0)
    alerts.push({
      type: 'danger',
      icon: DollarSign,
      category: 'תקציב',
      title: `חריגה תקציבית כוללת: ${overrunPct}%`,
      detail: `תקציב כולל: ${formatCurrency(totalBudget)} | הוצאות בפועל: ${formatCurrency(totalActual)}`,
      priority: 1,
    })
  }

  // --- התראות קבלני משנה ---

  subs.forEach(sub => {
    // חוב פתוח גבוה
    const unpaid = sub.contractAmount - sub.paid
    if (unpaid > 0 && sub.paid > 0) {
      const paidPct = (sub.paid / sub.contractAmount * 100).toFixed(0)
      if (unpaid > sub.contractAmount * 0.5) {
        alerts.push({
          type: 'warning',
          icon: Users,
          category: 'קבלני משנה',
          title: `חוב גדול ל: ${sub.name}`,
          detail: `סכום חוזה: ${formatCurrency(sub.contractAmount)} | שולם: ${formatCurrency(sub.paid)} (${paidPct}%) | נותר: ${formatCurrency(unpaid)}`,
          priority: 2,
        })
      }
    }
    // אין חוזה
    if (!sub.hasContract) {
      alerts.push({
        type: 'warning',
        icon: AlertTriangle,
        category: 'קבלני משנה',
        title: `אין חוזה חתום עם: ${sub.name}`,
        detail: `סכום: ${formatCurrency(sub.contractAmount)} — עובד בלי חוזה`,
        priority: 2,
      })
    }
  })

  // --- התראות לו"ז ---

  // פרויקט קרוב לדדליין
  if (project.expectedEnd) {
    const daysLeft = Math.ceil((new Date(project.expectedEnd) - new Date()) / (1000 * 60 * 60 * 24))
    const totalTasks = tasks.length
    const doneTasks = tasks.filter(t => t.status === 'done').length
    const progress = totalTasks > 0 ? (doneTasks / totalTasks * 100) : 0

    if (daysLeft <= 30 && daysLeft > 0 && progress < 80) {
      alerts.push({
        type: 'danger',
        icon: Clock,
        category: 'לוח זמנים',
        title: `נותרו ${daysLeft} ימים לסיום — התקדמות ${progress.toFixed(0)}% בלבד`,
        detail: `תאריך סיום: ${formatDate(project.expectedEnd)} | ${doneTasks}/${totalTasks} משימות הושלמו`,
        priority: 1,
      })
    } else if (daysLeft <= 60 && daysLeft > 30 && progress < 60) {
      alerts.push({
        type: 'warning',
        icon: Clock,
        category: 'לוח זמנים',
        title: `נותרו ${daysLeft} ימים — התקדמות ${progress.toFixed(0)}%`,
        detail: `יש פער בין ההתקדמות ללו"ז. כדאי לבדוק`,
        priority: 2,
      })
    }

    if (daysLeft < 0) {
      alerts.push({
        type: 'danger',
        icon: XCircle,
        category: 'לוח זמנים',
        title: `הפרויקט באיחור של ${Math.abs(daysLeft)} ימים!`,
        detail: `תאריך סיום מתוכנן: ${formatDate(project.expectedEnd)}`,
        priority: 1,
      })
    }
  }

  // --- התראות רכש ---

  // פריטים שלא הוזמנו
  const notOrdered = purchases.filter(p => p.orderStatus === 'not_ordered' && p.budgetTotal > 5000)
  if (notOrdered.length > 0) {
    alerts.push({
      type: 'info',
      icon: Package,
      category: 'רכש',
      title: `${notOrdered.length} פריטי רכש גדולים טרם הוזמנו`,
      detail: notOrdered.slice(0, 3).map(p => p.name).join(', ') + (notOrdered.length > 3 ? ` ועוד ${notOrdered.length - 3}...` : ''),
      priority: 3,
    })
  }

  // --- התראות גבייה ---

  const pendingMilestones = milestones.filter(m => m.status === 'pending' || m.status === 'in_progress')
  const overdueMilestones = milestones.filter(m => m.status === 'in_progress')
  if (overdueMilestones.length > 0) {
    const totalPending = overdueMilestones.reduce((s, m) => s + (m.amount || 0), 0)
    alerts.push({
      type: 'warning',
      icon: DollarSign,
      category: 'גבייה',
      title: `${overdueMilestones.length} אבני דרך מחכות לגבייה`,
      detail: `סה"כ לגבות: ${formatCurrency(totalPending)}`,
      priority: 2,
    })
  }

  // --- התרא��ת חיוביות ---

  const donePct = tasks.length > 0 ? (tasks.filter(t => t.status === 'done').length / tasks.length * 100) : 0
  if (donePct >= 50 && donePct < 100) {
    alerts.push({
      type: 'success',
      icon: CheckCircle,
      category: 'התקדמות',
      title: `הפרויקט ב-${donePct.toFixed(0)}% ביצוע`,
      detail: `${tasks.filter(t => t.status === 'done').length} מתוך ${tasks.length} משימות הושלמו`,
      priority: 4,
    })
  }

  // אין יומן עבודה 3+ ימים
  if (logs.length > 0) {
    const lastLog = logs.sort((a, b) => b.date.localeCompare(a.date))[0]
    const daysSince = Math.ceil((new Date() - new Date(lastLog.date)) / (1000 * 60 * 60 * 24))
    if (daysSince > 3) {
      alerts.push({
        type: 'warning',
        icon: AlertTriangle,
        category: 'יומן עבודה',
        title: `לא דווח יומן עבודה ${daysSince} ימים`,
        detail: `דיווח אחרון: ${formatDate(lastLog.date)} — חשוב לתעד כל יום`,
        priority: 2,
      })
    }
  }

  // מיון לפי עדיפות
  return alerts.sort((a, b) => a.priority - b.priority)
}

// סגנונות לפי סוג
const typeStyles = {
  danger: { bg: 'var(--danger-bg)', border: 'rgba(248,113,113,0.3)', color: 'var(--danger)' },
  warning: { bg: 'var(--warning-bg)', border: 'rgba(251,191,36,0.3)', color: 'var(--warning)' },
  info: { bg: 'var(--info-bg)', border: 'rgba(96,165,250,0.3)', color: 'var(--info)' },
  success: { bg: 'var(--success-bg)', border: 'rgba(74,222,128,0.3)', color: 'var(--success)' },
}

export default function ProjectAlerts() {
  const { id } = useParams()
  const projectId = Number(id)
  const project = getProject(projectId)

  if (!project) return <div className="card"><h2>פרויקט לא נמצא</h2></div>

  const alerts = generateAlerts(projectId, project)
  const dangerCount = alerts.filter(a => a.type === 'danger').length
  const warningCount = alerts.filter(a => a.type === 'warning').length

  return (
    <div className="animate-in">
      {/* כותרת */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>התראות וחריגות</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>{project.name}</p>
      </div>

      {/* סיכום */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center', borderColor: dangerCount > 0 ? 'rgba(248,113,113,0.3)' : undefined }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: dangerCount > 0 ? 'var(--danger)' : 'var(--success)' }}>{dangerCount}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>קריטיות</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center', borderColor: warningCount > 0 ? 'rgba(251,191,36,0.3)' : undefined }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: warningCount > 0 ? 'var(--warning)' : 'var(--success)' }}>{warningCount}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>אזהרות</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--info)' }}>{alerts.filter(a => a.type === 'info').length}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>מידע</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success)' }}>{alerts.filter(a => a.type === 'success').length}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>חיובי</div>
        </div>
      </div>

      {/* רשימת התראות */}
      {alerts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <CheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
          <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--success)' }}>הכל תקין!</p>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>אין התראות או חריגות בפרויקט</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map((alert, i) => {
            const style = typeStyles[alert.type]
            const Icon = alert.icon
            return (
              <div key={i} className="card" style={{
                padding: '16px 20px',
                borderColor: style.border,
                background: style.bg,
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '10px',
                  background: `${style.color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={20} style={{ color: style.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>{alert.title}</span>
                    <span className="badge" style={{ background: `${style.color}22`, color: style.color }}>{alert.category}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>{alert.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
