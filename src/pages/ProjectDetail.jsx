import { useParams, Link } from 'react-router-dom'
import { ShoppingCart, Users, ClipboardList, BarChart3, ExternalLink, MapPin, CreditCard, ListChecks, Eye, FilePlus } from 'lucide-react'
import { formatCurrency, formatDate, getStatusLabel, getStatusBadgeClass, calcQuoteTotals } from '../data/mockData'
import { getProject, getQuote, getMilestones, getBOQQuote } from '../data/store'

export default function ProjectDetail() {
  const { id } = useParams()
  const pid = Number(id)
  const project = getProject(pid)

  if (!project) return <div className="animate-in"><div className="card" style={{ textAlign: 'center', padding: '40px' }}>פרויקט לא נמצא</div></div>

  const isBOQ = project.billingType === 'boq'
  const quote = project.quoteId ? getQuote(project.quoteId) : null
  const boq = project.boqQuoteId ? getBOQQuote(project.boqQuoteId) : null
  const totals = quote ? calcQuoteTotals(quote.items || []) : isBOQ && boq ? {
    totalCost: (boq.items || []).reduce((s, i) => s + (i.costPrice * i.quantity), 0),
    totalSell: (boq.items || []).reduce((s, i) => s + (i.clientPrice * i.quantity), 0),
    profit: (boq.items || []).reduce((s, i) => s + ((i.clientPrice - i.costPrice) * i.quantity), 0),
    profitMargin: (() => { const sell = (boq.items || []).reduce((s, i) => s + (i.clientPrice * i.quantity), 0); const cost = (boq.items || []).reduce((s, i) => s + (i.costPrice * i.quantity), 0); return sell > 0 ? Math.round(((sell - cost) / sell) * 100) : 0 })(),
  } : { totalCost: 0, totalSell: 0, profit: 0, profitMargin: 0 }
  const projMilestones = isBOQ ? [] : getMilestones().filter(m => m.projectId === pid)

  const modules = [
    { to: `/project/${id}/tasks`, icon: ListChecks, color: 'var(--gold)', bg: 'var(--gold-bg)', title: 'משימות', desc: 'מעקב משימות ועבודות' },
    { to: `/project/${id}/procurement`, icon: ShoppingCart, color: 'var(--info)', bg: 'var(--info-bg)', title: 'רכש וכמויות', desc: 'הזמנות, ספקים ומעקב אספקה' },
    { to: `/project/${id}/subcontractors`, icon: Users, color: 'var(--success)', bg: 'var(--success-bg)', title: 'קבלני משנה', desc: 'הסכמים, תשלומים ומעקב' },
    { to: `/project/${id}/logs`, icon: ClipboardList, color: 'var(--warning)', bg: 'var(--warning-bg)', title: 'יומני עבודה', desc: 'דיווחים יומיים + לינק למנהל עבודה' },
    isBOQ
      ? { to: `/project/${id}/boq-billing`, icon: CreditCard, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', title: 'חשבון חלקי', desc: 'גבייה לפי ביצוע בפועל (כתב כמויות)' }
      : { to: `/project/${id}/billing`, icon: CreditCard, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', title: 'גבייה ותשלומים', desc: 'אבני דרך, חשבוניות וגבייה' },
    { to: `/project/${id}/changes`, icon: FilePlus, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', title: 'תוספות ושינויים', desc: 'שינויים, תוספות ואישורי לקוח' },
    { to: `/project/${id}/overview`, icon: BarChart3, color: 'var(--danger)', bg: 'var(--danger-bg)', title: 'סקירה כספית', desc: 'רווח/הפסד ומעקב תקציב' },
  ]

  return (
    <div className="animate-in">
      {/* כותרת פרויקט */}
      <div className="card" style={{ marginBottom: '24px', padding: '28px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: '16px', flexWrap: 'wrap', gap: '12px'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>{project.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px' }}>
              <MapPin size={14} />{project.address} | {project.clientName}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className={`badge ${getStatusBadgeClass(project.status)}`}>{getStatusLabel(project.status)}</span>
            <button className="btn btn-primary btn-sm" onClick={() => {
              const url = `${window.location.origin}${window.location.pathname}#/log/${id}`
              navigator.clipboard.writeText(url)
              alert('הלינק הועתק!')
            }}>
              <ExternalLink size={14} />לינק יומן עבודה
            </button>
          </div>
        </div>

        {/* סיכום כספי */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px',
          marginBottom: '20px'
        }}>
          {[
            { label: 'עלות צפויה', value: formatCurrency(totals.totalCost), color: 'var(--danger)' },
            { label: 'מחיר מכירה', value: formatCurrency(totals.totalSell), color: 'var(--gold)' },
            { label: 'רווח צפוי', value: formatCurrency(totals.profit), color: totals.profit > 0 ? 'var(--success)' : 'var(--danger)' },
            { label: 'אחוז רווח', value: `${totals.profitMargin}%`, color: totals.profitMargin > 20 ? 'var(--success)' : 'var(--warning)' },
            { label: 'התחלה', value: formatDate(project.startDate), color: 'var(--text-secondary)' },
            { label: 'סיום צפוי', value: formatDate(project.expectedEnd), color: 'var(--text-secondary)' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '12px', background: 'var(--dark)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* אבני דרך מיני */}
        {projMilestones.length > 0 && (
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginBottom: '10px' }}>אבני דרך</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {projMilestones.map(ms => (
                <div key={ms.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'var(--dark)', borderRadius: '8px', fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 500 }}>{ms.name}</span>
                    <span className={`badge ${getStatusBadgeClass(ms.status)}`} style={{ fontSize: '11px' }}>
                      {getStatusLabel(ms.status)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: ms.billingStatus === 'שולם' ? 'var(--success)' : 'var(--text-muted)', fontSize: '12px' }}>
                      {ms.billingStatus}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--gold)' }}>{formatCurrency(ms.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* מודולים */}
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px' }}>ניהול הפרויקט</h2>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px'
      }}>
        {modules.map((mod, i) => (
          <Link key={i} to={mod.to} className="card" style={{
            textDecoration: 'none', color: 'inherit', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '16px',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '12px', background: mod.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <mod.icon size={22} color={mod.color} />
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: '2px' }}>{mod.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{mod.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
