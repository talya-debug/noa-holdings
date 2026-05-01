import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { ExternalLink, Camera, Users as UsersIcon, AlertCircle, Check, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate, categoryIcons } from '../data/mockData'
import { getProject, getWorkLogs, getProjectSettings, getProjectTasks, deleteWorkLog } from '../data/store'

export default function WorkLogs() {
  const { id } = useParams()
  const pid = Number(id)
  const project = getProject(pid)
  const [logs, setLogs] = useState(() => getWorkLogs().filter(l => l.projectId === pid).sort((a, b) => b.date.localeCompare(a.date)))

  const handleDeleteLog = (logId) => {
    if (!confirm('למחוק את היומן הזה?')) return
    deleteWorkLog(logId)
    setLogs(getWorkLogs().filter(l => l.projectId === pid).sort((a, b) => b.date.localeCompare(a.date)))
  }
  const settings = getProjectSettings(pid)

  const totalLabor = logs.reduce((s, l) => s + (l.laborCost || 0), 0)
  const totalActualLabor = logs.reduce((s, l) => s + (l.actualLaborCost || l.laborCost || 0), 0)
  const totalWorkerDays = logs.reduce((s, l) => s + l.workersCount, 0)

  const logLink = `${window.location.origin}${window.location.pathname}#/log/${id}`

  return (
    <div className="animate-in">
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>יומני עבודה</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{project?.name}</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          navigator.clipboard.writeText(logLink)
          alert('הלינק הועתק! שלח אותו למנהל העבודה בוואטסאפ')
        }}>
          <ExternalLink size={18} />
          העתק לינק למנהל עבודה
        </button>
      </div>

      {/* סטטיסטיקות */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px', marginBottom: '24px'
      }}>
        {[
          { label: 'ימי עבודה', value: logs.length, color: 'var(--info)' },
          { label: 'סה"כ עובדים/ימים', value: totalWorkerDays, color: 'var(--gold)' },
          { label: 'עלות סגירה (ללקוח)', value: formatCurrency(totalLabor), color: 'var(--warning)' },
          { label: 'עלות בפועל', value: formatCurrency(totalActualLabor), color: 'var(--danger)' },
          { label: 'רווח עבודה', value: formatCurrency(totalLabor - totalActualLabor), color: 'var(--success)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* לינק למנהל עבודה */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))',
        border: '1px solid var(--gold-border)', borderRadius: 'var(--radius)',
        padding: '20px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px'
      }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--gold)', marginBottom: '4px' }}>
            לינק קבוע למנהל עבודה
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            שלח את הלינק הזה בוואטסאפ - מנהל העבודה ממלא כל יום מהטלפון
          </div>
        </div>
        <div style={{
          background: 'var(--dark)', padding: '10px 16px', borderRadius: '8px',
          fontSize: '13px', color: 'var(--text-secondary)', direction: 'ltr',
          fontFamily: 'monospace', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
          cursor: 'pointer',
        }}
          onClick={() => { navigator.clipboard.writeText(logLink); alert('הועתק!') }}
        >
          {logLink}
        </div>
      </div>

      {/* רשימת יומנים */}
      {logs.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          אין יומנים עדיין. שלח את הלינק למנהל העבודה, או
          <a href={`#/log/${id}`} target="_blank" style={{ color: 'var(--gold)', marginRight: '4px', marginLeft: '4px' }}>
            פתח את הטופס בעצמך
          </a>
          כדי לנסות.
        </div>
      )}

      {logs.map(log => (
        <div key={log.id} className="card" style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            marginBottom: '12px', flexWrap: 'wrap', gap: '8px'
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                {formatDate(log.date)} - {log.managerName}
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UsersIcon size={13} /> {log.workersCount} עובדים
                </span>
                {log.photos > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Camera size={13} /> {log.photos} תמונות
                  </span>
                )}
                {log.signature && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}>
                    <Check size={13} /> חתימה
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold)' }}>
                  {formatCurrency(log.laborCost || 0)}
                </div>
                {log.actualLaborCost && log.actualLaborCost !== log.laborCost && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    עלות: {formatCurrency(log.actualLaborCost)}
                  </div>
                )}
              </div>
              <button onClick={() => handleDeleteLog(log.id)}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', opacity: 0.6 }}
                title="מחק יומן">
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* פירוט עבודות לפי קטגוריה - entries חדש */}
          {log.entries && log.entries.length > 0 ? (
            <div style={{ marginBottom: '10px' }}>
              {log.entries.map((entry, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', background: 'var(--dark)', borderRadius: '6px',
                  marginBottom: '4px', fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-gold" style={{ fontSize: '11px' }}>
                      {categoryIcons[entry.category] || ''} {entry.category}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{entry.workersCount} עובדים</span>
                    {entry.description && (
                      <span style={{ color: 'var(--text-secondary)' }}>- {entry.description}</span>
                    )}
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--gold)', whiteSpace: 'nowrap' }}>
                    {formatCurrency(entry.clientCost || 0)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <>
              {log.categories && log.categories.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {log.categories.map((cat, i) => (
                    <span key={i} className="badge badge-gold">{cat}</span>
                  ))}
                </div>
              )}

              {log.description && (
                <div style={{
                  padding: '12px', background: 'var(--dark)', borderRadius: '8px',
                  fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6
                }}>
                  {log.description}
                </div>
              )}
            </>
          )}

          {log.issues && (
            <div style={{
              padding: '10px 12px', background: 'var(--danger-bg)', borderRadius: '8px',
              marginTop: '8px', fontSize: '13px', color: 'var(--danger)',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <AlertCircle size={14} />
              {log.issues}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
