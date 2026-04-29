import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Users, FileText, AlertTriangle, Plus, CreditCard } from 'lucide-react'
import { formatCurrency } from '../data/mockData'
import { getProject, getSubcontractors, addSubcontractor, addPaymentToSub } from '../data/store'

export default function Subcontractors() {
  const { id } = useParams()
  const pid = Number(id)
  const project = getProject(pid)
  const [subs, setSubs] = useState(getSubcontractors().filter(s => s.projectId === pid))
  const [showAdd, setShowAdd] = useState(false)
  const [showPayment, setShowPayment] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')

  const [form, setForm] = useState({
    name: '', phone: '', specialty: '', workPercentage: '', contractAmount: ''
  })

  const totalContracts = subs.reduce((s, c) => s + c.contractAmount, 0)
  const totalPaid = subs.reduce((s, c) => s + c.paid, 0)
  const totalPending = subs.reduce((s, c) => s + c.pending, 0)

  const handleAdd = (e) => {
    e.preventDefault()
    addSubcontractor({
      ...form,
      projectId: pid,
      workPercentage: Number(form.workPercentage),
      contractAmount: Number(form.contractAmount),
      paid: 0,
      pending: 0,
      hasContract: false,
    })
    setSubs(getSubcontractors().filter(s => s.projectId === pid))
    setShowAdd(false)
    setForm({ name: '', phone: '', specialty: '', workPercentage: '', contractAmount: '' })
  }

  const handlePayment = (subId) => {
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) return
    addPaymentToSub(subId, amount)
    setSubs(getSubcontractors().filter(s => s.projectId === pid))
    setShowPayment(null)
    setPaymentAmount('')
  }

  return (
    <div className="animate-in">
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>קבלני משנה</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{project?.name}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={18} />
          הוסף קבלן
        </button>
      </div>

      {/* סטטיסטיקות */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px', marginBottom: '24px'
      }}>
        {[
          { label: 'סה"כ הסכמים', value: formatCurrency(totalContracts), color: 'var(--gold)' },
          { label: 'שולם', value: formatCurrency(totalPaid), color: 'var(--success)' },
          { label: 'ממתין לתשלום', value: formatCurrency(totalPending), color: 'var(--warning)' },
          { label: 'יתרה', value: formatCurrency(totalContracts - totalPaid - totalPending), color: 'var(--info)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* כרטיסי קבלנים */}
      {subs.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          אין קבלני משנה עדיין. לחץ "הוסף קבלן" להתחיל.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {subs.map(sub => {
          const paidPercent = sub.contractAmount > 0 ? Math.round((sub.paid / sub.contractAmount) * 100) : 0
          return (
            <div key={sub.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{sub.name}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {sub.specialty} {sub.phone && `| ${sub.phone}`}
                  </div>
                </div>
                <span className={`badge ${sub.hasContract ? 'badge-success' : 'badge-warning'}`}>
                  {sub.hasContract ? <><FileText size={12} /> הסכם חתום</> : <><AlertTriangle size={12} /> חסר הסכם</>}
                </span>
              </div>

              <div style={{
                padding: '10px 14px', background: 'var(--dark)', borderRadius: '8px',
                marginBottom: '14px', display: 'flex', justifyContent: 'space-between', fontSize: '13px'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>אחוז מהעבודה</span>
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{sub.workPercentage}%</span>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                gap: '10px', marginBottom: '14px', fontSize: '13px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>סכום הסכם</div>
                  <div style={{ fontWeight: 600 }}>{formatCurrency(sub.contractAmount)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>שולם</div>
                  <div style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(sub.paid)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>ממתין</div>
                  <div style={{ fontWeight: 600, color: 'var(--warning)' }}>{formatCurrency(sub.pending)}</div>
                </div>
              </div>

              {/* פרוגרס תשלום */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>התקדמות תשלום</span>
                  <span style={{ color: 'var(--gold)' }}>{paidPercent}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--dark)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${paidPercent}%`, borderRadius: '3px',
                    background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))',
                  }} />
                </div>
              </div>

              {/* כפתור תשלום */}
              {showPayment === sub.id ? (
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="סכום לתשלום"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px' }}
                    autoFocus
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => handlePayment(sub.id)}>אשר</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setShowPayment(null); setPaymentAmount('') }}>ביטול</button>
                </div>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '14px', width: '100%', justifyContent: 'center' }}
                  onClick={() => setShowPayment(sub.id)}
                >
                  <CreditCard size={14} />
                  רשום תשלום
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* מודל הוספת קבלן */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>קבלן משנה חדש</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>שם הקבלן</label>
                <input required value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="שם מלא או שם חברה" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>טלפון</label>
                  <input value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="050-0000000" />
                </div>
                <div className="form-group">
                  <label>תחום</label>
                  <input required value={form.specialty} onChange={e => setForm(prev => ({ ...prev, specialty: e.target.value }))} placeholder="עבודות שלד, חשמל..." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>אחוז מהעבודה</label>
                  <input type="number" value={form.workPercentage} onChange={e => setForm(prev => ({ ...prev, workPercentage: e.target.value }))} placeholder="100" />
                </div>
                <div className="form-group">
                  <label>סכום הסכם (ש"ח)</label>
                  <input type="number" required value={form.contractAmount} onChange={e => setForm(prev => ({ ...prev, contractAmount: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">הוסף קבלן</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>ביטול</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
