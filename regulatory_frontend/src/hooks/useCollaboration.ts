import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import type { WsMessage } from '@/types'

const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000'

export function useCollaboration(documentId: number) {
  const ws = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()
  const { addOnlineUser, removeOnlineUser } = useUiStore()
  const { user } = useAuthStore()

  const send = useCallback((msg: Omit<WsMessage, 'user' | 'document_id'>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg))
    }
  }, [])

  useEffect(() => {
    const socket = new WebSocket(`${WS_BASE}/ws/collaborate/${documentId}?user=${encodeURIComponent(user)}`)
    ws.current = socket

    socket.onmessage = (event) => {
      const msg: WsMessage = JSON.parse(event.data)
      switch (msg.type) {
        case 'user_joined':
          if (msg.user) addOnlineUser(msg.user)
          break
        case 'user_left':
          if (msg.user) removeOnlineUser(msg.user)
          break
        case 'comment_added':
          queryClient.invalidateQueries({ queryKey: ['comments', documentId] })
          break
        case 'vote_cast':
          queryClient.invalidateQueries({ queryKey: ['votes', documentId] })
          queryClient.invalidateQueries({ queryKey: ['vote-summary', documentId] })
          break
        case 'text_change':
          queryClient.invalidateQueries({ queryKey: ['changes', documentId] })
          break
      }
    }

    socket.onclose = () => removeOnlineUser(user)

    return () => socket.close()
  }, [documentId, user, queryClient, addOnlineUser, removeOnlineUser])

  return { send }
}
