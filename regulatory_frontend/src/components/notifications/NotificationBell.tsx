import { useState } from 'react'
import { useNotifications, useMarkAllRead } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { parseUTC } from '@/lib/dateUtils'

interface Props { recipient: string }

export function NotificationBell({ recipient }: Props) {
  const [open, setOpen] = useState(false)
  const { data: notifications = [] } = useNotifications(recipient)
  const markAll = useMarkAllRead(recipient)
  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications, ${unread} unread`}
        style={styles.bell}
      >
        🔔
        {unread > 0 && <span style={styles.badge}>{unread}</span>}
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.dropHeader}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Notifications</span>
            {unread > 0 && (
              <button style={styles.markAll} onClick={() => markAll.mutate()}>
                Mark all read
              </button>
            )}
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifications.length === 0 && (
              <p style={styles.empty}>No notifications</p>
            )}
            {notifications.map(n => (
              <div key={n.id} style={{ ...styles.item, opacity: n.is_read ? 0.5 : 1 }}>
                <span style={styles.dot(n.is_read)} />
                <div>
                  <p style={{ fontSize: 12, margin: 0 }}>{n.message}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                    {formatDistanceToNow(parseUTC(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  bell: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 18,
    position: 'relative' as const,
    padding: 4,
  },
  badge: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    background: '#dc2626',
    color: '#fff',
    borderRadius: 9999,
    fontSize: 9,
    fontWeight: 700,
    padding: '1px 4px',
    lineHeight: 1.4,
  },
  dropdown: {
    position: 'absolute' as const,
    right: 0,
    top: 36,
    width: 320,
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    zIndex: 200,
  },
  dropHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderBottom: '1px solid #e2e8f0',
  },
  markAll: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: 11,
    cursor: 'pointer',
  },
  item: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    padding: '10px 14px',
    borderBottom: '1px solid #f1f5f9',
  },
  dot: (read: boolean) => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: read ? '#cbd5e1' : '#2563eb',
    marginTop: 4,
    flexShrink: 0,
  }),
  empty: { padding: 16, textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 },
}
