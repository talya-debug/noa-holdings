import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Check, FileText } from 'lucide-react'
import { formatCurrency, formatDate } from '../data/mockData'
import { getProject, getChangeOrder, approveChangeOrder } from '../data/store'

// דף חיצוני ללקוח — בלי סיידבר, ממותג
export default function ChangeOrderApproval() {
  const { projectId, changeId } = useParams()
  const pid = Number(projectId)
  const coId = Number(changeId)
  const project = getProject(pid)
  const [co, setCO] = useState(() => getChangeOrder(coId))
  const [name, setName] = useState('')
  const [approved, setApproved] = useState(false)

  if (!project || !co) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '40px', maxWidth: '400px' }}>
          <div style={{ color: 'var(--text-muted)' }}>תוספת לא נמצאה או שהלינק לא תקין</div>
        </div>
      </div>
    )
  }

  if (co.status === 'approved') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Check size={40} color="var(--success)" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--gold)', marginBottom: '8px' }}>תוספת זו כבר אושרה</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            אושר ע"י {co.approvedBy} ב-{formatDate(co.approvedDate)}
          </p>
        </div>
      </div>
    )
  }

  const items = co.items || []
  const totalSell = items.reduce((s, i) => s + (i.clientPrice * i.quantity), 0)
  const totalWithVat = Math.round(totalSell * 1.18)
  const vat = totalWithVat - totalSell

  if (approved) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Check size={40} color="var(--success)" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--gold)', marginBottom: '8px' }}>
            התוספת אושרה בהצלחה!
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
            תודה, {name}. האישור נשמר במערכת.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            סכום: <strong style={{ color: 'var(--gold)' }}>{formatCurrency(totalSell)}</strong>
          </p>
        </div>
      </div>
    )
  }

  const handleApprove = () => {
    if (!name.trim()) { alert('נא להזין שם לאישור'); return }
    approveChangeOrder(coId, name.trim())
    setApproved(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', padding: '20px' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        {/* כותרת ממותגת */}
        <div style={{
          textAlign: 'center', padding: '28px 20px', marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))',
          borderRadius: '16px', border: '1px solid var(--gold-border)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: '22px', fontWeight: 800,
            color: 'var(--dark)', fontFamily: 'Arial',
          }}>NH</div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gold)', marginBottom: '4px' }}>
            תוספת לאישור
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{project.name}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{co.number} | {formatDate(co.date)}</p>
        </div>

        {/* תיאור */}
        {co.description && (
          <div className="card" style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--gold)' }}>תיאור: </strong>{co.description}
            </div>
          </div>
        )}

        {/* פריטים */}
        <div className="card" style={{ marginBottom: '16px', padding: 0 }}>
          <div style={{ padding: '16px 20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', margin: 0 }}>
              פירוט ({items.length} פריטים)
            </h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>פריט</th><th>יחידה</th><th>כמות</th><th>מחיר</th><th>סה"כ</th></tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td>{item.unit}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.clientPrice)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{formatCurrency(item.clientPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* סיכום */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>סה"כ</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(totalSell)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>מע"מ 18%</span>
              <span>{formatCurrency(vat)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '2px solid var(--gold-border)', fontSize: '18px', fontWeight: 700, color: 'var(--gold)' }}>
              <span>סה"כ לתשלום</span>
              <span>{formatCurrency(totalWithVat)}</span>
            </div>
          </div>
        </div>

        {/* אישור */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px' }}>
            אישור התוספת
          </h3>
          <div className="form-group">
            <label>שם מאשר</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="שם מלא" autoFocus />
          </div>
          <button className="btn btn-primary" onClick={handleApprove}
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '16px', fontWeight: 600 }}>
            <Check size={18} />
            מאשר/ת את התוספת
          </button>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
            לחיצה על "מאשר" מהווה הסכמה לביצוע העבודות ולתשלום בהתאם
          </p>
        </div>

        <div style={{ textAlign: 'center', padding: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
          נעה אחזקות © 2026
        </div>
      </div>
    </div>
  )
}
