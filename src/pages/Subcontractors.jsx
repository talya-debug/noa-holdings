import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Users, FileText, AlertTriangle, Plus, CreditCard, Trash2, ChevronDown, ChevronUp, Upload } from 'lucide-react'
import { formatCurrency, formatDate } from '../data/mockData'
import { getProject, getSubcontractors, saveSubcontractors, addSubcontractor, deleteSubcontractor, addDocument } from '../data/store'

export default function Subcontractors() {
  const { id } = useParams()
  const pid = Number(id)
  const project = getProject(pid)
  const [subs, setSubs] = useState(getSubcontractors().filter(s => s.projectId === pid))
  const [showAdd, setShowAdd] = useState(false)
  const [showPayment, setShowPayment] = useState(null)
  const [showHistory, setShowHistory] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')

  const [form, setForm] = useState({
    name: '', phone: '', specialty: '', contractAmount: ''
  })

  const totalContracts = subs.reduce((s, c) => s + c.contractAmount, 0)
  const totalPaid = subs.reduce((s, c) => s + c.paid, 0)

  const handleAdd = (e) => {
    e.preventDefault()
    addSubcontractor({
      ...form,
      projectId: pid,
      contractAmount: Number(form.contractAmount),
      paid: 0,
      pending: 0,
      hasContract: false,
      payments: [],
    })
    setSubs(getSubcontractors().filter(s => s.projectId === pid))
    setShowAdd(false)
    setForm({ name: '', phone: '', specialty: '', contractAmount: '' })
  }

  const handleDelete = (subId, name) => {
    if (!confirm(`למחוק את הקבלן "${name}"?`)) return
    deleteSubcontractor(subId)
    setSubs(getSubcontractors().filter(s => s.projectId === pid))
  }

  // תשלום עם היסטוריה
  const handlePayment = (subId) => {
    const amount = Math.abs(Number(paymentAmount))
    if (!amount) return
    const allSubs = getSubcontractors()
    const idx = allSubs.findIndex(s => s.id === subId)
    if (idx === -1) return
    allSubs[idx].paid = (allSubs[idx].paid || 0) + amount
    if (!allSubs[idx].payments) allSubs[idx].payments = []
    allSubs[idx].payments.push({
      date: new Date().toISOString().split('T')[0],
      amount,
      note: paymentNote || '',
    })
    saveSubcontractors(allSubs)
    setSubs(allSubs.filter(s => s.projectId === pid))
    setShowPayment(null)
    setPaymentAmount('')
    setPaymentNote('')
  }

  // סימון הסכם חתום + יצירת מסמך
  const handleToggleContract = (subId) => {
    const allSubs = getSubcontractors()
    const idx = allSubs.findIndex(s => s.id === subId)
    if (idx === -1) return
    const sub = allSubs[idx]
    const newStatus = !sub.hasContract
    allSubs[idx].hasContract = newStatus
    saveSubcontractors(allSubs)
    // אם מסמנים שיש הסכם — יוצרים רשומת מסמך
    if (newStatus) {
      addDocument({
        projectId: pid,
        name: `הסכם — ${sub.name}`,
        category: 'contracts',
        size: 0,
        type: '',
        note: `הסכם חתום עם ${sub.name} (${sub.specialty})`,
        uploadedBy: 'מהדף קב"מ',
        date: new Date().toISOString().split('T')[0],
      })
    }
    setSubs(allSubs.filter(s => s.projectId === pid))
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
          <Plus size={18} />הוסף קבלן
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
          { label: 'יתרה לתשלום', value: formatCurrency(totalContracts - totalPaid), color: 'var(--warning)' },
          { label: 'קבלנים', value: subs.length, color: 'var(--info)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {subs.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          אין קבלני משנה עדיין. לחץ "הוסף קבלן" להתחיל.
        </div>
      )}

      {/* כרטיסי קבלנים */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: '16px' }}>
        {subs.map(sub => {
          const paidPercent = sub.contractAmount > 0 ? Math.round((sub.paid / sub.contractAmount) * 100) : 0
          const remaining = sub.contractAmount - sub.paid
          const payments = sub.payments || []

          return (
            <div key={sub.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{sub.name}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {sub.specialty} {sub.phone && `| ${sub.phone}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => handleToggleContract(sub.id)}
                    className={`badge ${sub.hasContract ? 'badge-success' : 'badge-warning'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                    title={sub.hasContract ? 'לחץ לביטול הסכם' : 'לחץ לסמן הסכם חתום'}>
                    {sub.hasContract ? <><FileText size={12} /> הסכם חתום</> : <><Upload size={12} /> סמן הסכם חתום</>}
                  </button>
                  <button onClick={() => handleDelete(sub.id, sub.name)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                    title="מחק קבלן">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* סכומים */}
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
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>יתרה</div>
                  <div style={{ fontWeight: 600, color: remaining > 0 ? 'var(--warning)' : 'var(--success)' }}>{formatCurrency(remaining)}</div>
                </div>
              </div>

              {/* פרוגרס */}
              <div style={{ marginBottom: '14px' }}>
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

              {/* היסטוריית תשלומים */}
              {payments.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div onClick={() => setShowHistory(showHistory === sub.id ? null : sub.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    <span>{payments.length} תשלומים</span>
                    {showHistory === sub.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                  {showHistory === sub.id && (
                    <div style={{ background: 'var(--dark)', borderRadius: '8px', padding: '8px' }}>
                      {payments.map((p, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', padding: '6px 8px',
                          borderBottom: i < payments.length - 1 ? '1px solid var(--dark-border)' : 'none',
                          fontSize: '12px',
                        }}>
                          <span style={{ color: 'var(--text-muted)' }}>{formatDate(p.date)}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{p.note}</span>
                          <span style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* כפתור תשלום — תמיד זמין */}
              {showPayment === sub.id ? (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input type="number" placeholder="סכום" value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px' }} autoFocus />
                  </div>
                  <input placeholder="הערה (אופציונלי)" value={paymentNote}
                    onChange={e => setPaymentNote(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', marginBottom: '8px' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handlePayment(sub.id)}>אשר תשלום</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setShowPayment(null); setPaymentAmount(''); setPaymentNote('') }}>ביטול</button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-primary btn-sm"
                  style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}
                  onClick={() => setShowPayment(sub.id)}>
                  <CreditCard size={14} />רשום תשלום
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* מודל הוספת קבלן — בלי אחוז מהעבודה */}
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
                  <input required value={form.specialty} onChange={e => setForm(prev => ({ ...prev, specialty: e.target.value }))} placeholder="חשמל, אינסטלציה..." />
                </div>
              </div>
              <div className="form-group">
                <label>סכום הסכם (ש"ח)</label>
                <input type="number" min="0" required value={form.contractAmount} onChange={e => setForm(prev => ({ ...prev, contractAmount: e.target.value }))} placeholder="0" />
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
