import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../data/firebase'
import { LogIn } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('מייל או סיסמה שגויים')
      } else if (err.code === 'auth/too-many-requests') {
        setError('יותר מדי נסיונות. נסה שוב בעוד כמה דקות')
      } else {
        setError('שגיאה בהתחברות')
      }
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--dark)',
      direction: 'rtl',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'var(--dark-card)',
        borderRadius: '16px',
        padding: '40px 32px',
        border: '1px solid var(--dark-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        {/* לוגו */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontSize: '36px',
            fontWeight: 900,
            color: 'var(--gold)',
            fontFamily: 'Arial',
            letterSpacing: '2px',
          }}>
            NH
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            marginTop: '4px',
          }}>
            NOA HOLDINGS
          </div>
          <div style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginTop: '12px',
          }}>
            מערכת ניהול פרויקטים
          </div>
        </div>

        {/* טופס */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>מייל</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              dir="ltr"
              style={{ textAlign: 'left' }}
            />
          </div>

          <div className="form-group">
            <label>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              dir="ltr"
              style={{ textAlign: 'left' }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'var(--danger-bg)',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: '8px',
              color: 'var(--danger)',
              fontSize: '13px',
              marginBottom: '16px',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', fontSize: '15px', justifyContent: 'center' }}
          >
            <LogIn size={18} />
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>
      </div>
    </div>
  )
}
