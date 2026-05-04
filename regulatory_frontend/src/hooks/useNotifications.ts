import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/api/notifications'

export const useNotifications = (recipient: string, unreadOnly = false) =>
  useQuery({
    queryKey: ['notifications', recipient, unreadOnly],
    queryFn: () => notificationsApi.list(recipient, unreadOnly),
    refetchInterval: 30_000, // poll every 30s
  })

export const useMarkRead = (recipient: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', recipient] }),
  })
}

export const useMarkAllRead = (recipient: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(recipient),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', recipient] }),
  })
}
