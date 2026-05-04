import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { NotificationBell } from '@/components/notifications/NotificationBell'

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  sgcan_admin:  { label: 'SGCAN Admin',  color: '#1d4ed8', bg: '#dbeafe' },
  reviewer:     { label: 'Reviewer',     color: '#6d28d9', bg: '#ede9fe' },
  consultation: { label: 'Consultation', color: '#0e7490', bg: '#cffafe' },
}

export function AppShell() {
  const { user, role, isAdmin, logout } = useAuthStore()
  const navigate = useNavigate()
  const roleStyle = ROLE_LABELS[role] ?? ROLE_LABELS.consultation

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={styles.header}>
        <NavLink to="/" style={styles.brand}>📋 RegulatoryDocs</NavLink>

        <nav style={styles.nav}>
          <NavLink to="/documents" style={navStyle}>Documents</NavLink>
          {isAdmin && <NavLink to="/admin" style={navStyle}>Admin Panel</NavLink>}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NotificationBell recipient={user} />
          <span
            style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 9999,
              background: roleStyle.bg, color: roleStyle.color,
            }}
          >
            {roleStyle.label}
          </span>
          <span style={{ fontSize: 13, color: '#64748b' }}>👤 {user}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Sign out</button>
        </div>
      </header>

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

const navStyle = ({ isActive }: { isActive: boolean }) => ({
  color: isActive ? '#2563eb' : '#64748b',
  textDecoration: 'none',
  fontWeight: isActive ? 600 : 400,
  fontSize: 14,
})

const styles = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', height: 56, background: '#fff',
    borderBottom: '1px solid #e2e8f0', position: 'sticky' as const, top: 0, zIndex: 100,
  },
  brand: { fontWeight: 700, fontSize: 16, color: '#1e293b', textDecoration: 'none' },
  nav: { display: 'flex', gap: 24 },
  main: { flex: 1, padding: '24px' },
  logoutBtn: {
    background: 'none', border: '1px solid #e2e8f0', borderRadius: 6,
    padding: '4px 10px', fontSize: 12, color: '#64748b', cursor: 'pointer',
  },
}
