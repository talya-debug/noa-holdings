import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate, getStatusLabel, getStatusBadgeClass, calcQuoteTotals } from '../data/mockData'
import { getProjects, getQuotes, getMilestones, deleteProject } from '../data/store'

export default function Projects() {
  const [projects, setProjects] = useState(getProjects())
  const quotes = getQuotes()
  const milestones = getMilestones()

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>פרויקטים</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {projects.length} פרויקטים | {projects.filter(p => p.status === 'active').length} פעילים
          </p>
        </div>
        <Link to="/quotes" className="btn btn-primary">הצעה חדשה</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {projects.map(project => {
          const quote = quotes.find(q => q.id === project.quoteId)
          const totals = quote ? calcQuoteTotals(quote.items || []) : { totalCost: 0, totalSell: 0, profitMargin: 0 }
          const projMilestones = milestones.filter(m => m.projectId === project.id)
          const paidCount = projMilestones.filter(m => m.billingStatus === 'שולם').length

          return (
            <Link key={project.id} to={`/project/${project.id}`} className="card" style={{
              textDecoration: 'none', color: 'inherit', cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{project.name}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    {project.clientName}
                  </div>
                  {project.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <MapPin size={13} />{project.address}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className={`badge ${getStatusBadgeClass(project.status)}`}>{getStatusLabel(project.status)}</span>
                  <button onClick={e => {
                    e.preventDefault(); e.stopPropagation()
                    if (confirm(`למחוק את הפרויקט "${project.name}" וכל הנתונים שלו?`)) {
                      deleteProject(project.id); setProjects(getProjects())
                    }
                  }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', opacity: 0.6 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* סיכום כספי */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px',
                padding: '12px', background: 'var(--dark)', borderRadius: '8px', fontSize: '13px',
                marginBottom: '14px'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>עלות</div>
                  <div style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatCurrency(totals.totalCost)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>מכירה</div>
                  <div style={{ fontWeight: 600, color: 'var(--gold)' }}>{formatCurrency(totals.totalSell)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>רווחיות</div>
                  <div style={{ fontWeight: 600, color: totals.profitMargin > 20 ? 'var(--success)' : 'var(--warning)' }}>{totals.profitMargin}%</div>
                </div>
              </div>

              {/* התקדמות אבני דרך */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>אבני דרך</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{paidCount}/{projMilestones.length} שולמו</span>
                </div>
                <div style={{ height: '6px', background: 'var(--dark)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${projMilestones.length > 0 ? Math.round((paidCount / projMilestones.length) * 100) : 0}%`,
                    borderRadius: '3px',
                    background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))',
                  }} />
                </div>
              </div>

              {project.startDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />{formatDate(project.startDate)}
                  </span>
                  {project.expectedEnd && <span>{formatDate(project.expectedEnd)}</span>}
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {projects.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          אין פרויקטים. אשר הצעת מחיר כדי ליצור פרויקט אוטומטית.
        </div>
      )}
    </div>
  )
}
