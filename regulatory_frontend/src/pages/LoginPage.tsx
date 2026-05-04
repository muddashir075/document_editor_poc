import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, type UserRole } from '@/store/authStore'
import { Button } from '@/components/ui/Button'

const ROLES: { value: UserRole; label: string; description: string; color: string }[] = [
  {
    value: 'sgcan_admin',
    label: 'SGCAN Administrator',
    description: 'Create, edit, manage documents. Accept or reject suggestions.',
    color: '#2563eb',
  },
  {
    value: 'reviewer',
    label: 'Member Country Reviewer',
    description: 'Comment on documents, cast votes, propose changes.',
    color: '#7c3aed',
  },
  {
    value: 'consultation',
    label: 'Consultation (Read-only)',
    description: 'View documents, comments, and votes. No editing.',
    color: '#0891b2',
  },
]

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<UserRole>('consultation')
  const { setUser } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = () => {
    if (!username.trim()) return
    setUser(username.trim(), role)
    navigate('/documents')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>📋</div>
        <h1 style={styles.title}>RegulatoryDocs</h1>
        <p style={styles.subtitle}>Collaborative Document Review Platform</p>

        <div style={styles.form}>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Enter your username"
            style={styles.input}
            autoFocus
          />

          <p style={styles.roleLabel}>Select your role</p>
          <div style={styles.roleGrid}>
            {ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                style={{
                  ...styles.roleCard,
                  borderColor: role === r.value ? r.color : '#e2e8f0',
                  background: role === r.value ? `${r.color}10` : '#fff',
                  boxShadow: role === r.value ? `0 0 0 2px ${r.color}40` : 'none',
                }}
              >
                <span style={{ ...styles.roleTitle, color: r.color }}>{r.label}</span>
                <span style={styles.roleDesc}>{r.description}</span>
              </button>
            ))}
          </div>

          <Button
            onClick={handleLogin}
            disabled={!username.trim()}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            Enter Platform
          </Button>
        </div>

        <p style={styles.note}>
          Demo mode — no password required. Role determines what actions are available.
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#f1f5f9',
  },
  card: {
    background: '#fff', borderRadius: 16, padding: 40, width: 460,
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)', textAlign: 'center' as const,
  },
  logo: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  input: {
    padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
    fontSize: 14, fontFamily: 'inherit', textAlign: 'left' as const,
  },
  roleLabel: { fontSize: 12, fontWeight: 600, color: '#64748b', textAlign: 'left' as const, margin: 0 },
  roleGrid: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
  roleCard: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start',
    padding: '10px 14px', borderRadius: 8, border: '2px solid',
    cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s',
    gap: 2,
  },
  roleTitle: { fontSize: 13, fontWeight: 700 },
  roleDesc: { fontSize: 11, color: '#64748b', lineHeight: 1.4 },
  note: { fontSize: 11, color: '#94a3b8', marginTop: 20 },
}
