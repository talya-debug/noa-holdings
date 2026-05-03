import { Link } from 'react-router-dom'
import { useState } from 'react'
import { FolderKanban, DollarSign, AlertTriangle, Plus, FileText, ChevronLeft, Users, Clock, Package } from 'lucide-react'
import { getProjects, getQuotes, getMilestones, getBOQQuotes, getPartialInvoices, getSubcontractors, getPurchases, getWorkLogs, getChangeOrders } from '../data/store'
import { calcQuoteTotals, formatCurrency, formatDate, getStatusLabel, getStatusBadgeClass } from '../data/mockData'

// חישוב סכום מכירה לפרויקט
function getProjectSellTotal(project, quotes, boqQuotes) {
  if (project.quoteId) {
    const quote = quotes.find(q => q.id === project.quoteId)
    return quote ? calcQuoteTotals(quote.items || []).totalSell : 0
  }
  if (project.boqQuoteId) {
    const boq = boqQuotes.find(b => b.id === project.boqQuoteId)
    return boq ? (boq.items || []).reduce((s, i) => s + (i.clientPrice || 0) * (i.quantity || 0), 0) : 0
  }
  return 0
}

// חישוב התראות על כל הפרויקטים
function getAllAlerts(projects, subcontractors, purchases, workLogs, milestones) {
  const alerts = []

  // קבלני משנה בלי חוזה
  const noContract = subcontractors.filter(s => !s.hasContract)
  if (noContract.length > 0) {
    const proj = noContract[0].projectId ? projects.find(pr => pr.id === noContract[0].projectId) : null
    alerts.push({
      type: 'warning', icon: AlertTriangle,
      text: `${noContract.length} קבלני משנה בלי חוזה חתום`,
      detail: noContract.map(s => s.name).join(', '),
      link: proj ? `/project/${proj.id}/subcontractors` : null,
    })
  }

  // חובות גדולים לקבלני משנה
  const bigDebts = subcontractors.filter(s => (s.contractAmount - s.paid) > s.contractAmount * 0.5 && s.paid > 0)
  if (bigDebts.length > 0) {
    const totalDebt = bigDebts.reduce((s, sub) => s + (sub.contractAmount - sub.paid), 0)
    const proj = bigDebts[0].projectId ? projects.find(pr => pr.id === bigDebts[0].projectId) : null
    alerts.push({
      type: 'warning', icon: Users,
      text: `חובות פתוחים לקבלני משנה: ${formatCurrency(totalDebt)}`,
      detail: bigDebts.map(s => `${s.name}: ${formatCurrency(s.contractAmount - s.paid)}`).join(' | '),
      link: proj ? `/project/${proj.id}/subcontractors` : null,
    })
  }

  // פריטי רכש גדולים לא הוזמנו
  const notOrdered = purchases.filter(p => p.orderStatus === 'not_ordered' && p.budgetTotal > 5000)
  if (notOrdered.length > 0) {
    const proj = notOrdered[0].projectId ? projects.find(pr => pr.id === notOrdered[0].projectId) : null
    alerts.push({
      type: 'info', icon: Package,
      text: `${notOrdered.length} פריטי רכש טרם הוזמנו`,
      detail: notOrdered.slice(0, 3).map(p => p.name).join(', ') + (notOrdered.length > 3 ? '...' : ''),
      link: proj ? `/project/${proj.id}/procurement` : null,
    })
  }

  // חריגות תקציב
  const overBudget = purchases.filter(p => p.actualTotal > 0 && p.budgetTotal > 0 && ((p.actualTotal - p.budgetTotal) / p.budgetTotal) > 0.1)
  if (overBudget.length > 0) {
    const proj = overBudget[0].projectId ? projects.find(pr => pr.id === overBudget[0].projectId) : null
    alerts.push({
      type: 'danger', icon: DollarSign,
      text: `${overBudget.length} חריגות תקציב ברכש`,
      detail: overBudget.map(p => `${p.name}: +${Math.round(((p.actualTotal - p.budgetTotal) / p.budgetTotal) * 100)}%`).join(' | '),
      link: proj ? `/project/${proj.id}/procurement` : null,
    })
  }

  // פרויקטים באיחור — נשארים על הדשבורד (לא מנווטים)
  projects.filter(p => p.status === 'active' && p.expectedEnd).forEach(p => {
    const daysLeft = Math.ceil((new Date(p.expectedEnd) - new Date()) / (1000 * 60 * 60 * 24))
    if (daysLeft < 0) {
      alerts.push({ type: 'danger', icon: Clock, text: `${p.name} — באיחור של ${Math.abs(daysLeft)} ימים!`, detail: '', link: null })
    } else if (daysLeft <= 30) {
      alerts.push({ type: 'warning', icon: Clock, text: `${p.name} — ${daysLeft} ימים לסיום`, detail: '', link: null })
    }
  })

  // אבני דרך ממתינות לגבייה
  const pendingMs = milestones.filter(m => m.status === 'in_progress')
  if (pendingMs.length > 0) {
    const total = pendingMs.reduce((s, m) => s + (m.amount || 0), 0)
    alerts.push({
      type: 'warning', icon: DollarSign,
      text: `${pendingMs.length} אבני דרך מחכות לגבייה — ${formatCurrency(total)}`,
      detail: '',
      link: null,
    })
  }

  // אבני דרך לא מגיעות ל-100%
  projects.forEach(p => {
    const projMs = milestones.filter(m => m.projectId === p.id)
    if (projMs.length > 0) {
      const totalPct = projMs.reduce((s, m) => s + (m.percentage || 0), 0)
      if (totalPct > 0 && totalPct < 100) {
        alerts.push({
          type: 'warning', icon: AlertTriangle,
          text: `${p.name} — אבני דרך ${totalPct}% (חסרים ${100 - totalPct}%)`,
          detail: '',
          link: `/project/${p.id}/billing`,
        })
      }
    }
  })

  // התראות אספקה — חומר מגיע בעוד יומיים
  purchases.forEach(p => {
    (p.orders || []).forEach(o => {
      if (o.status === 'delivered' || !o.expectedDelivery) return
      const days = Math.ceil((new Date(o.expectedDelivery) - new Date()) / (1000*60*60*24))
      const proj = projects.find(pr => pr.id === p.projectId)
      const projName = proj?.name || ''
      if (days <= 0) {
        alerts.push({
          type: 'danger', icon: Package,
          text: `${p.name} — באיחור אספקה ${Math.abs(days)} ימים! (${projName})`,
          detail: `ספק: ${o.supplier}`,
          link: proj ? `/project/${proj.id}/procurement` : null,
        })
      } else if (days <= 2) {
        alerts.push({
          type: 'warning', icon: Package,
          text: `${p.name} — אספקה בעוד ${days} ימים, יש לאשר מול הספק (${projName})`,
          detail: `ספק: ${o.supplier} | תאריך: ${o.expectedDelivery}`,
          link: proj ? `/project/${proj.id}/procurement` : null,
        })
      }
    })
  })

  return alerts
}

const alertStyles = {
  danger: { bg: 'var(--danger-bg)', border: 'rgba(248,113,113,0.3)', color: 'var(--danger)' },
  warning: { bg: 'var(--warning-bg)', border: 'rgba(251,191,36,0.3)', color: 'var(--warning)' },
  info: { bg: 'var(--info-bg)', border: 'rgba(96,165,250,0.3)', color: 'var(--info)' },
}

export default function Dashboard() {
  const [, setRefresh] = useState(0)

  const projects = getProjects()
  const quotes = getQuotes()
  const boqQuotes = getBOQQuotes()
  const milestones = getMilestones()
  const subcontractors = getSubcontractors()
  const purchases = getPurchases()
  const workLogs = getWorkLogs()

  const activeProjects = projects.filter(p => p.status === 'active')
  const planningProjects = projects.filter(p => p.status === 'planning')
  const allProjects = projects.filter(p => p.status !== 'completed')

  // חישוב סה"כ ערך חוזי כל הפרויקטים הפעילים
  const totalContractValue = activeProjects.reduce((sum, p) => sum + getProjectSellTotal(p, quotes, boqQuotes), 0)

  // גבייה ממתינה — אבני דרך + חשבונות חלקיים לא שולמו
  const pendingMilestones = milestones
    .filter(m => m.billingStatus !== 'שולם' && m.amount > 0)
    .reduce((sum, m) => sum + (m.amount - (m.paidAmount || 0)), 0)

  // חשבונות חלקיים ממתינים
  const allInvoices = activeProjects
    .filter(p => p.billingType === 'boq')
    .flatMap(p => getPartialInvoices(p.id))
  const pendingInvoices = allInvoices
    .filter(i => i.status !== 'paid')
    .reduce((sum, i) => sum + ((i.totalAmount || 0) - (i.paidAmount || 0)), 0)

  const totalPending = pendingMilestones + pendingInvoices

  // סה"כ הוצאות בפועל
  const totalExpenses = purchases.reduce((s, p) => s + (p.actualTotal || 0), 0)
    + subcontractors.reduce((s, sub) => s + (sub.paid || 0), 0)
    + workLogs.reduce((s, l) => s + (l.laborCost || 0), 0)

  // תוספות ממתינות
  const allChangeOrders = projects.flatMap(p => getChangeOrders(p.id))
  const pendingChanges = allChangeOrders.filter(co => co.status === 'sent')

  // התראות
  const alerts = getAllAlerts(projects, subcontractors, purchases, workLogs, milestones)

  // התראה על תוספות ממתינות
  if (pendingChanges.length > 0) {
    alerts.unshift({
      type: 'info', icon: FileText,
      text: `${pendingChanges.length} תוספות ממתינות לאישור לקוח`,
      detail: pendingChanges.map(co => co.number).join(', '),
    })
  }

  // הצעות אחרונות (רגילות + BOQ)
  const allQuotes = [
    ...quotes.map(q => ({ ...q, type: 'quote', sell: calcQuoteTotals(q.items || []).totalSell })),
    ...boqQuotes.map(b => ({ ...b, type: 'boq', sell: (b.items || []).reduce((s, i) => s + (i.clientPrice || 0) * (i.quantity || 0), 0) })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)

  return (
    <div className="animate-in">
      {/* כותרת + כפתורים */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>נעה אחזקות</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/quotes" className="btn btn-primary">
          <Plus size={18} />הצעה חדשה
        </Link>
      </div>

      {/* סטטיסטיקות */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
        gap: '14px', marginBottom: '28px'
      }}>
        {[
          { label: 'פרויקטים פעילים', value: activeProjects.length, icon: FolderKanban, color: 'var(--info)', bg: 'var(--info-bg)' },
          { label: 'ערך חוזי כולל', value: formatCurrency(totalContractValue), icon: DollarSign, color: 'var(--gold)', bg: 'var(--gold-bg)' },
          { label: 'גבייה ממתינה', value: formatCurrency(totalPending), icon: AlertTriangle, color: totalPending > 100000 ? 'var(--danger)' : 'var(--warning)', bg: totalPending > 100000 ? 'var(--danger-bg)' : 'var(--warning-bg)' },
          { label: 'הוצאות בפועל', value: formatCurrency(totalExpenses), icon: DollarSign, color: 'var(--text-secondary)', bg: 'var(--dark)' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: 44, height: 44, borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.icon size={20} color={stat.color} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>{stat.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* התראות */}
      {alerts.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--warning)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> התראות ({alerts.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts.map((alert, i) => {
              const style = alertStyles[alert.type] || alertStyles.info
              const Icon = alert.icon
              const Wrapper = alert.link ? Link : 'div'
              const wrapperProps = alert.link ? { to: alert.link, style: { textDecoration: 'none', color: 'inherit' } } : {}
              return (
                <Wrapper key={i} {...wrapperProps}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px', borderRadius: '8px',
                    background: style.bg, border: `1px solid ${style.border}`,
                    cursor: alert.link ? 'pointer' : 'default',
                    transition: 'opacity 0.15s',
                  }}
                    onMouseEnter={e => { if (alert.link) e.currentTarget.style.opacity = '0.8' }}
                    onMouseLeave={e => { if (alert.link) e.currentTarget.style.opacity = '1' }}
                  >
                    <Icon size={16} style={{ color: style.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{alert.text}</div>
                      {alert.detail && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{alert.detail}</div>}
                    </div>
                    {alert.link && <ChevronLeft size={16} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </Wrapper>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: '24px' }}>
        {/* הצעות אחרונות */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)' }}>הצעות וכתבי כמויות</h2>
            <Link to="/quotes" className="btn btn-secondary btn-sm">הכל</Link>
          </div>
          {allQuotes.map(q => (
            <Link key={`${q.type}-${q.id}`} to={q.type === 'boq' ? `/boq/${q.id}` : `/quote/${q.id}`} style={{
              display: 'block', padding: '14px', background: 'var(--dark)',
              borderRadius: '10px', marginBottom: '10px', textDecoration: 'none', color: 'inherit',
              border: '1px solid transparent', transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold-border)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={14} color="var(--text-muted)" />
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{q.number}</span>
                  {q.type === 'boq' && <span className="badge badge-gold" style={{ fontSize: '10px' }}>כת"כ</span>}
                </div>
                <span className={`badge ${getStatusBadgeClass(q.status)}`}>{getStatusLabel(q.status)}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {q.clientName} | {q.address}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{formatDate(q.date)}</span>
                <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{formatCurrency(q.sell)}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* פרויקטים */}
        <div>
          {/* בביצוע */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)' }}>פרויקטים בביצוע ({activeProjects.length})</h2>
              <Link to="/projects" className="btn btn-secondary btn-sm">הכל</Link>
            </div>
            {activeProjects.map(p => {
              const totalSell = getProjectSellTotal(p, quotes, boqQuotes)
              const projMilestones = milestones.filter(m => m.projectId === p.id)
              const paidCount = projMilestones.filter(m => m.billingStatus === 'שולם').length
              return (
                <Link key={p.id} to={`/project/${p.id}`} style={{
                  display: 'block', padding: '14px', background: 'var(--dark)',
                  borderRadius: '10px', marginBottom: '10px', textDecoration: 'none', color: 'inherit',
                  border: '1px solid transparent', transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold-border)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      {p.billingType === 'boq' && <span className="badge badge-gold" style={{ fontSize: '10px' }}>חשבון חלקי</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>{p.clientName}</span>
                    {projMilestones.length > 0 && <span>אבני דרך: {paidCount}/{projMilestones.length}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{p.startDate ? formatDate(p.startDate) : ''}</span>
                    <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{totalSell > 0 ? formatCurrency(totalSell) : '-'}</span>
                  </div>
                </Link>
              )
            })}
            {activeProjects.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                אין פרויקטים בביצוע
              </div>
            )}
          </div>

          {/* בתכנון */}
          {planningProjects.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '16px' }}>בתכנון ({planningProjects.length})</h2>
              {planningProjects.map(p => {
                const totalSell = getProjectSellTotal(p, quotes, boqQuotes)
                return (
                  <Link key={p.id} to={`/project/${p.id}`} style={{
                    display: 'block', padding: '12px', background: 'var(--dark)',
                    borderRadius: '10px', marginBottom: '8px', textDecoration: 'none', color: 'inherit',
                    border: '1px solid transparent', opacity: 0.7,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold-border)'; e.currentTarget.style.opacity = '1' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.opacity = '0.7' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      <span className="badge badge-info">בתכנון</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {p.clientName} {totalSell > 0 ? `• ${formatCurrency(totalSell)}` : ''}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
