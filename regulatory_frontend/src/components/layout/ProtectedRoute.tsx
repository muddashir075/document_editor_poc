import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types'

interface Props {
  children: React.ReactNode
  requiredRole?: UserRole
  /** If true, only blocks consultation (reviewer + admin allowed) */
  requiresInteraction?: boolean
}

export function ProtectedRoute({ children, requiredRole, requiresInteraction }: Props) {
  const { role, user } = useAuthStore()

  // Not logged in at all
  if (!user || user === 'guest') return <Navigate to="/login" replace />

  // Specific role required
  if (requiredRole && role !== requiredRole) {
    return (
      <div style={styles.denied}>
        <span style={{ fontSize: 40 }}>🔒</span>
        <h2 style={styles.title}>Access Restricted</h2>
        <p style={styles.msg}>
          This page requires the <strong>{requiredRole.replace('_', ' ')}</strong> role.
          You are signed in as <strong>{role.replace('_', ' ')}</strong>.
        </p>
      </div>
    )
  }

  // Consultation blocked from interaction pages
  if (requiresInteraction && role === 'consultation') {
    return (
      <div style={styles.denied}>
        <span style={{ fontSize: 40 }}>👁</span>
        <h2 style={styles.title}>Read-only Access</h2>
        <p style={styles.msg}>
          Consultation accounts have read-only access. Contact an administrator to upgrade your role.
        </p>
      </div>
    )
  }

  return <>{children}</>
}

const styles = {
  denied: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    justifyContent: 'center', height: '60vh', gap: 12, textAlign: 'center' as const,
  },
  title: { fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 },
  msg: { fontSize: 14, color: '#64748b', maxWidth: 400, lineHeight: 1.6 },
}
