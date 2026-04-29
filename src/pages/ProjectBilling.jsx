import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { CreditCard, ChevronLeft, Check, Clock, ArrowLeftRight } from 'lucide-react'
import { getMilestones, updateMilestone, getQuotes, getProject } from '../data/store'
import { calcQuoteTotals, formatCurrency } from '../data/mockData'

// זרימת סטטוס גבייה
const billingFlow = ['גבייה עתידית', 'ממתין לאישור', 'מאושר לגבייה', 'שולם']

function getBillingColor(status) {
  switch (status) {
    case 'שולם': return 'var(--success)'
    case 'מאושר לגבייה': return '#a78bfa'
    case 'ממתין לאישור': return 'var(--warning)'
    default: return 'var(--text-muted)'
  }
}

function getBillingBadgeClass(status) {
  switch (status) {
    case 'שולם': return 'badge-success'
    case 'מאושר לגבייה': return 'badge-info'
    case 'ממתין לאישור': return 'badge-warning'
    default: return 'badge-gold'
  }
}

export default function ProjectBilling() {
  const { id } = useParams()
  const pid = Number(id)
  const project = getProject(pid)
  const [milestones, setMilestones] = useState(() => getMilestones().filter(m => m.projectId === pid))
  const [showPayment, setShowPayment] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')

  // חישוב סה"כ מההצעה
  const quote = project?.quoteId ? getQuotes().find(q => q.id === project.quoteId) : null
  const quoteTotals = quote ? calcQuoteTotals(quote.items || []) : { totalSell: 0 }

  // חישוב סכומי אבני דרך (אם amount=0, חשב מאחוז)
  const milestonesWithAmounts = milestones.map(ms => ({
    ...ms,
    calculatedAmount: ms.amount > 0 ? ms.amount : Math.round(quoteTotals.totalSell * ms.percentage / 100)
  }))

  const totalContract = quoteTotals.totalSell
  const totalCollected = milestonesWithAmounts.filter(m => m.billingStatus === 'שולם').reduce((s, m) => s + m.paidAmount, 0)
  const totalPending = milestonesWithAmounts.filter(m => m.billingStatus === 'ממתין לאישור' || m.billingStatus === 'מאושר לגבייה').reduce((s, m) => s + m.calculatedAmount, 0)
  const totalOutstanding = totalContract - totalCollected

  // קידום סטטוס גבייה
  const advanceBilling = (msId) => {
    const ms = milestones.find(m => m.id === msId)
    if (!ms) return
    const currentIdx = billingFlow.indexOf(ms.billingStatus)
    if (currentIdx < billingFlow.length - 2) {
      // לא שולם - רק מקדם
      const nextStatus = billingFlow[currentIdx + 1]
      updateMilestone(msId, { billingStatus: nextStatus })
      setMilestones(getMilestones().filter(m => m.projectId === pid))
    }
  }

  // רישום תשלום
  const handlePayment = (msId) => {
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) return
    const ms = milestonesWithAmounts.find(m => m.id === msId)
    updateMilestone(msId, {
      billingStatus: 'שולם',
      paidAmount: (ms?.paidAmount || 0) + amount,
      paidDate: new Date().toISOString().split('T')[0],
      status: 'paid',
    })
    setMilestones(getMilestones().filter(m => m.projectId === pid))
    setShowPayment(null)
    setPaymentAmount('')
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>גבייה ותשלומים</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{project?.name}</p>
      </div>

      {/* סיכום */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px', marginBottom: '24px'
      }}>
        {[
          { label: 'סה"כ חוזה', value: formatCurrency(totalContract), color: 'var(--gold)' },
          { label: 'נגבה', value: formatCurrency(totalCollected), color: 'var(--success)' },
          { label: 'ממתין לגבייה', value: formatCurrency(totalPending), color: 'var(--warning)' },
          { label: 'יתרה לגבייה', value: formatCurrency(totalOutstanding), color: totalOutstanding > 0 ? 'var(--danger)' : 'var(--success)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* פרוגרס גבייה */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>התקדמות גבייה</span>
          <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
            {totalContract > 0 ? Math.round((totalCollected / totalContract) * 100) : 0}%
          </span>
        </div>
        <div style={{ height: '10px', background: 'var(--dark)', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${totalContract > 0 ? Math.round((totalCollected / totalContract) * 100) : 0}%`,
            borderRadius: '5px',
            background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))',
          }} />
        </div>
      </div>

      {/* רשימת אבני דרך */}
      {milestonesWithAmounts.map(ms => (
        <div key={ms.id} className="card" style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            marginBottom: '12px', flexWrap: 'wrap', gap: '8px'
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{ms.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {ms.percentage}% מהחוזה
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`badge ${getBillingBadgeClass(ms.billingStatus)}`}>
                {ms.billingStatus}
              </span>
            </div>
          </div>

          {/* סכומים */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px',
            padding: '10px 14px', background: 'var(--dark)', borderRadius: '8px',
            marginBottom: '12px', fontSize: '13px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>סכום</div>
              <div style={{ fontWeight: 600, color: 'var(--gold)' }}>{formatCurrency(ms.calculatedAmount)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>שולם</div>
              <div style={{ fontWeight: 600, color: ms.paidAmount > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                {formatCurrency(ms.paidAmount)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>יתרה</div>
              <div style={{ fontWeight: 600, color: ms.calculatedAmount - ms.paidAmount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {formatCurrency(ms.calculatedAmount - ms.paidAmount)}
              </div>
            </div>
          </div>

          {/* כפתורי פעולה */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {ms.billingStatus !== 'שולם' && ms.billingStatus !== 'מאושר לגבייה' && (
              <button className="btn btn-secondary btn-sm" onClick={() => advanceBilling(ms.id)}>
                <ArrowLeftRight size={14} />
                קדם ל{billingFlow[billingFlow.indexOf(ms.billingStatus) + 1]}
              </button>
            )}

            {ms.billingStatus !== 'שולם' && (
              <>
                {showPayment === ms.id ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                    <input
                      type="number"
                      placeholder="סכום תשלום"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px' }}
                      autoFocus
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => handlePayment(ms.id)}>אשר</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setShowPayment(null); setPaymentAmount('') }}>ביטול</button>
                  </div>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => {
                    setShowPayment(ms.id)
                    setPaymentAmount(String(ms.calculatedAmount - ms.paidAmount))
                  }}>
                    <CreditCard size={14} />
                    רשום תשלום
                  </button>
                )}
              </>
            )}

            {ms.billingStatus === 'שולם' && ms.paidDate && (
              <span style={{ fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} />
                שולם ב-{new Date(ms.paidDate).toLocaleDateString('he-IL')}
              </span>
            )}
          </div>
        </div>
      ))}

      {milestonesWithAmounts.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          אין אבני דרך. הן נוצרות אוטומטית כשמאשרים הצעת מחיר.
        </div>
      )}
    </div>
  )
}
