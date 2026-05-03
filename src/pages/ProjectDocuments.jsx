import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getProject, getDocuments, addDocument, deleteDocument } from '../data/store'
import { formatDate } from '../data/mockData'
import { Upload, FolderOpen, FileText, Image, File, Trash2, Download, Search, Plus, X } from 'lucide-react'

// קטגוריות מסמכים
const DOC_CATEGORIES = [
  { key: 'plans', label: 'תוכניות', icon: '📐' },
  { key: 'permits', label: 'היתרים ואישורים', icon: '📋' },
  { key: 'contracts', label: 'חוזים', icon: '📝' },
  { key: 'invoices', label: 'חשבוניות', icon: '💰' },
  { key: 'photos', label: 'תמונות מהשטח', icon: '📷' },
  { key: 'protocols', label: 'פרוטוקולים', icon: '📄' },
  { key: 'insurance', label: 'ביטוחים', icon: '🛡️' },
  { key: 'other', label: 'כללי', icon: '📁' },
]

// אייקון לפי סוג קובץ
function getFileIcon(fileName) {
  const ext = fileName?.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <Image size={18} style={{ color: 'var(--success)' }} />
  if (['pdf'].includes(ext)) return <FileText size={18} style={{ color: 'var(--danger)' }} />
  if (['doc', 'docx'].includes(ext)) return <FileText size={18} style={{ color: 'var(--info)' }} />
  if (['xls', 'xlsx'].includes(ext)) return <FileText size={18} style={{ color: 'var(--success)' }} />
  return <File size={18} style={{ color: 'var(--text-muted)' }} />
}

// פורמט גודל קובץ
function formatSize(bytes) {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function ProjectDocuments() {
  const { id } = useParams()
  const projectId = Number(id)
  const project = getProject(projectId)
  const [docs, setDocs] = useState(() => getDocuments(projectId))
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('plans')
  const [uploadNote, setUploadNote] = useState('')
  const fileRef = useRef()

  if (!project) return <div className="card"><h2>פרויקט לא נמצא</h2></div>

  // סינון
  const filtered = docs.filter(d => {
    if (activeCategory !== 'all' && d.category !== activeCategory) return false
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.note?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // ספירה לכל קטגוריה
  const countByCategory = (cat) => docs.filter(d => d.category === cat).length

  // העלאת קבצים
  const handleUpload = () => {
    const files = fileRef.current?.files
    if (!files || files.length === 0) return

    const newDocs = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      newDocs.push(addDocument({
        projectId,
        name: file.name,
        category: uploadCategory,
        size: file.size,
        type: file.type,
        note: uploadNote,
        uploadedBy: 'מנהל',
        date: new Date().toISOString().split('T')[0],
      }))
    }
    setDocs(getDocuments(projectId))
    setShowUpload(false)
    setUploadNote('')
    if (fileRef.current) fileRef.current.value = ''
  }

  // מחיקה
  const handleDelete = (docId) => {
    if (!confirm('למחוק את המסמך?')) return
    deleteDocument(docId)
    setDocs(getDocuments(projectId))
  }

  return (
    <div className="animate-in">
      {/* כותרת */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>ניהול מסמכים</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>{project.name}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
          <Upload size={16} />העלאת מסמך
        </button>
      </div>

      {/* קטגוריות */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${activeCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('all')}
        >
          הכל ({docs.length})
        </button>
        {DOC_CATEGORIES.map(cat => (
          <button key={cat.key}
            className={`btn btn-sm ${activeCategory === cat.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.icon} {cat.label} ({countByCategory(cat.key)})
          </button>
        ))}
      </div>

      {/* חיפוש */}
      <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '400px' }}>
        <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="חיפוש מסמך..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingRight: '36px' }}
        />
      </div>

      {/* רשימת מסמכים */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FolderOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
            {docs.length === 0 ? 'אין מסמכים עדיין — העלה את המסמך הראשון' : 'לא נמצאו מסמכים'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>שם קובץ</th>
                <th>קטגוריה</th>
                <th>הערה</th>
                <th>גודל</th>
                <th>תאריך</th>
                <th>העלה</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => {
                const cat = DOC_CATEGORIES.find(c => c.key === doc.category)
                return (
                  <tr key={doc.id}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                      {getFileIcon(doc.name)}
                      {doc.name}
                    </td>
                    <td>
                      <span className="badge badge-gold">{cat?.icon} {cat?.label || doc.category}</span>
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.note || '-'}
                    </td>
                    <td>{formatSize(doc.size)}</td>
                    <td>{formatDate(doc.date)}</td>
                    <td>{doc.uploadedBy}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-sm btn-secondary" title="הורדה לא זמינה — מטא-דאטה בלבד" disabled style={{ opacity: 0.4 }}>
                          <Download size={14} />
                        </button>
                        <button className="btn btn-sm btn-danger" title="מחיקה" onClick={() => handleDelete(doc.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* סיכום */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '24px' }}>
        {DOC_CATEGORIES.map(cat => {
          const count = countByCategory(cat.key)
          return (
            <div key={cat.key} className="card" style={{ padding: '16px', textAlign: 'center', cursor: 'pointer', opacity: count > 0 ? 1 : 0.5 }}
              onClick={() => setActiveCategory(cat.key)}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>{cat.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gold)' }}>{count}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cat.label}</div>
            </div>
          )
        })}
      </div>

      {/* מודל העלאה */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>העלאת מסמך</h2>
              <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label>קבצים</label>
              <input type="file" ref={fileRef} multiple style={{ padding: '8px' }} />
            </div>

            <div className="form-group">
              <label>קטגוריה</label>
              <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}>
                {DOC_CATEGORIES.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.icon} {cat.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>הערה (אופציונלי)</label>
              <input type="text" value={uploadNote} onChange={e => setUploadNote(e.target.value)} placeholder="למשל: תוכנית קונסטרוקציה מעודכנת" />
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleUpload}>
                <Upload size={16} />העלאה
              </button>
              <button className="btn btn-secondary" onClick={() => setShowUpload(false)}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
