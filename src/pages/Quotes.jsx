import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, FileText, X, ArrowLeft, FolderKanban, Trash2, Upload, Copy } from 'lucide-react'
import { calcQuoteTotals, formatCurrency, formatDate, getStatusLabel, getStatusBadgeClass } from '../data/mockData'
import { getQuotes, addQuote, deleteQuote, duplicateQuote, getProjects, getBOQQuotes, deleteBOQQuote } from '../data/store'

export default function Quotes() {
  const [quotes, setQuotes] = useState(getQuotes())
  const [boqQuotes, setBOQQuotes] = useState(getBOQQuotes())
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ clientName: '', clientPhone: '', address: '' })
  const navigate = useNavigate()
  const projects = getProjects()

  const handleSubmit = (e) => {
    e.preventDefault()
    const quote = addQuote({ ...form })
    setQuotes(getQuotes())
    setShowModal(false)
    setForm({ clientName: '', clientPhone: '', address: '' })
    navigate(`/quote/${quote.id}`)
  }

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>הצעות מחיר</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{quotes.length} הצעות</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/boq/new" className="btn btn-secondary">
            <Upload size={16} />כתב כמויות
          </Link>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />הצעה חדשה (מחירון)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
        {quotes.map(q => {
          const totals = calcQuoteTotals(q.items || [])
          const linkedProject = q.status === 'approved' ? projects.find(p => p.quoteId === q.id) : null

          return (
            <Link key={q.id} to={`/quote/${q.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{
                border: '1px solid transparent', transition: 'border-color 0.15s', cursor: 'pointer',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold-border)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <FileText size={16} color="var(--gold)" />
                      <span style={{ fontWeight: 600, fontSize: '15px' }}>{q.number}</span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>{q.clientName}</div>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(q.status)}`}>{getStatusLabel(q.status)}</span>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {q.address} • {formatDate(q.date)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ background: 'var(--dark)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>עלות</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{formatCurrency(totals.totalCost)}</div>
                  </div>
                  <div style={{ background: 'var(--dark)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>מכירה</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)' }}>{formatCurrency(totals.totalSell)}</div>
                  </div>
                  <div style={{ background: 'var(--dark)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>רווח</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--success)' }}>{totals.profitMargin}%</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {q.items && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{q.items.length} פריטים</div>
                  )}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={e => {
                      e.preventDefault(); e.stopPropagation()
                      const dup = duplicateQuote(q.id)
                      if (dup) { setQuotes(getQuotes()); navigate(`/quote/${dup.id}`) }
                    }} style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer', padding: '4px' }}
                      title="שכפל הצעה">
                      <Copy size={14} />
                    </button>
                    {q.status !== 'approved' && (
                      <button onClick={e => {
                        e.preventDefault(); e.stopPropagation()
                        if (confirm(`למחוק את הצעה ${q.number}?`)) { deleteQuote(q.id); setQuotes(getQuotes()) }
                      }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {linkedProject && (
                  <Link to={`/project/${linkedProject.id}`} onClick={e => e.stopPropagation()} style={{
                    display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px',
                    fontSize: '13px', color: 'var(--gold)', textDecoration: 'none',
                    padding: '8px 12px', background: 'rgba(212,175,55,0.08)', borderRadius: '8px',
                  }}>
                    <FolderKanban size={14} />
                    פרויקט: {linkedProject.name}
                    <ArrowLeft size={14} />
                  </Link>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* כתב כמויות */}
      {boqQuotes.length > 0 && (
        <>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--gold)', margin: '32px 0 16px' }}>כתבי כמויות</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {boqQuotes.map(q => {
              const totalSell = (q.items || []).reduce((s, i) => s + (i.clientPrice * i.quantity), 0)
              const linkedProject = q.status === 'approved' ? projects.find(p => p.boqQuoteId === q.id) : null
              return (
                <Link key={q.id} to={`/boq/${q.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card" style={{ border: '1px solid transparent', transition: 'border-color 0.15s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold-border)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Upload size={16} color="var(--info)" />
                        <span style={{ fontWeight: 600, fontSize: '15px' }}>{q.number}</span>
                        <span className="badge badge-info" style={{ fontSize: '11px' }}>כתב כמויות</span>
                      </div>
                      <span className={`badge ${getStatusBadgeClass(q.status)}`}>{getStatusLabel(q.status)}</span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>{q.clientName}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{q.address} • {formatDate(q.date)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(q.items || []).length} סעיפים</span>
                      {totalSell > 0 && <span style={{ fontWeight: 600, color: 'var(--gold)' }}>{formatCurrency(totalSell)}</span>}
                      {q.status !== 'approved' && (
                        <button onClick={e => {
                          e.preventDefault(); e.stopPropagation()
                          if (confirm(`למחוק את ${q.number}?`)) { deleteBOQQuote(q.id); setBOQQuotes(getBOQQuotes()) }
                        }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {linkedProject && (
                      <Link to={`/project/${linkedProject.id}`} onClick={e => e.stopPropagation()} style={{
                        display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px',
                        fontSize: '13px', color: 'var(--gold)', textDecoration: 'none',
                        padding: '8px 12px', background: 'rgba(212,175,55,0.08)', borderRadius: '8px',
                      }}>
                        <FolderKanban size={14} />פרויקט: {linkedProject.name}<ArrowLeft size={14} />
                      </Link>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}

      {quotes.length === 0 && boqQuotes.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <FileText size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <div>אין הצעות מחיר. לחץ "הצעה חדשה" להתחיל.</div>
        </div>
      )}

      {/* מודל הצעה חדשה */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>הצעת מחיר חדשה</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)} style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>שם הלקוח</label>
                <input required value={form.clientName} onChange={e => setForm(prev => ({ ...prev, clientName: e.target.value }))} placeholder="משפחת ישראלי" />
              </div>
              <div className="form-group">
                <label>טלפון</label>
                <input required value={form.clientPhone} onChange={e => setForm(prev => ({ ...prev, clientPhone: e.target.value }))} placeholder="054-1234567" />
              </div>
              <div className="form-group">
                <label>כתובת</label>
                <input required value={form.address} onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))} placeholder="עיר, רחוב ומספר" />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">צור הצעה</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>ביטול</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
