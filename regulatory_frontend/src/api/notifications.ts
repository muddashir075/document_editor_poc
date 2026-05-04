import client from './client'
import type { Notification } from '@/types'

const BASE = '/api/v1/notifications'

export const notificationsApi = {
  list: (recipient: string, unreadOnly = false) =>
    client.get<Notification[]>(`${BASE}/${recipient}`, { params: { unread_only: unreadOnly } }).then(r => r.data),
  markRead: (id: number) => client.patch<Notification>(`${BASE}/${id}/read`).then(r => r.data),
  markAllRead: (recipient: string) => client.patch(`${BASE}/read-all/${recipient}`).then(r => r.data),
}
