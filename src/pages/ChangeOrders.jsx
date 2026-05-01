import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { Plus, FileText, Check, Clock, X, Trash2, ExternalLink } from 'lucide-react'
import { formatCurrency, formatDate } from '../data/mockData'
import { getProject, getChangeOrders, deleteChangeOrder } from '../data/store'

export default function ChangeOrders() {
  const { id } = useParams()
  const pid = Number(id)
  const project = getProject(pid)
  const [orders, setOrders] = useState(() => getChangeOrders(pid).sort((a, b) => b.date.localeCompare(a.date)))

  if (!project) return <div className="animate-in"><div className="card" style={{ textAlign: 'center', padding: '40px' }}>פרויקט לא נמצא</div></div>

  const approved = orders.filter(o => o.status === 'approved')
  const pending = orders.filter(o => o.status === 'sent')
  const totalApproved = approved.reduce((s, o) => s + (o.items || []).reduce((is, i) => is + i.clientPrice * i.quantity, 0), 0)

  const handleDelete = (coId) => {
    if (!confirm('למחוק את התוספת?')) return
    deleteChangeOrder(coId)
    setOrders(getChangeOrders(pid))
  }

  const statusConfig = {
    draft: { label: 'טיוטה', badge: 'badge-info', icon: FileText },
    sent: { label: 'נשלח ללקוח', badge: 'badge-warning', icon: Clock },
    approved: { label: 'מאושר', badge: 'badge-success', icon: Check },
    rejected: { label: 'נדחה', badge: 'badge-danger', icon: X },
  }

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>תוספות ושינויים</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{project.name}</p>
        </div>
        <Link to={`/change/${id}/new`} className="btn btn-primary" style={{ textDecoration: 'none' }}>
          <Plus size={18} />תוספת חדשה
        </Link>
      </div>

      {/* סטטיסטיקות */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'סה"כ תוספות', value: orders.length, color: 'var(--text-primary)' },
          { label: 'מאושרות', value: approved.length, color: 'var(--success)' },
          { label: 'ממתינות', value: pending.length, color: 'var(--warning)' },
          { label: 'סכום מאושר', value: formatCurrency(totalApproved), color: 'var(--gold)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* רשימת תוספות */}
      {orders.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          אין תוספות ושינויים.
          <Link to={`/change/${id}/new`} style={{ color: 'var(--gold)', marginRight: '4px' }}>צור תוספת חדשה</Link>
        </div>
      )}

      {orders.map(co => {
        const totalSell = (co.items || []).reduce((s, i) => s + i.clientPrice * i.quantity, 0)
        const config = statusConfig[co.status] || statusConfig.draft

        return (
          <div key={co.id} className="card" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '16px' }}>{co.number}</span>
                  <span className={`badge ${config.badge}`}>{config.label}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {formatDate(co.date)} | {(co.items || []).length} פריטים
                  {co.description && ` | ${co.description}`}
                </div>
                {co.approvedBy && (
                  <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '4px' }}>
                    אושר ע"י {co.approvedBy} ב-{formatDate(co.approvedDate)}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold)' }}>
                  {formatCurrency(totalSell)}
                </span>

                {co.status === 'draft' && (
                  <>
                    <Link to={`/change/${id}/${co.id}`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                      ערוך
                    </Link>
                    <button onClick={() => handleDelete(co.id)} className="btn btn-sm"
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px' }}>
                      <Trash2 size={16} />
                    </button>
                  </>
                )}

                {co.status === 'sent' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}#/approve/${id}/${co.id}`
                    navigator.clipboard.writeText(url)
                    alert('לינק האישור הועתק! שלח ללקוח')
                  }}>
                    <ExternalLink size={14} />העתק לינק
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
