import { create } from 'zustand'

interface UiState {
  // Active panel in document viewer: 'comments' | 'votes' | 'changes' | 'versions'
  activePanel: string
  setActivePanel: (panel: string) => void

  // Selected paragraph for inline actions
  selectedParagraphId: string | null
  setSelectedParagraphId: (id: string | null) => void

  // Selected text for inline comment
  selectedText: string | null
  selectionOffsets: { start: number; end: number } | null
  setSelection: (text: string | null, offsets: { start: number; end: number } | null) => void

  // Online collaborators in current document
  onlineUsers: string[]
  setOnlineUsers: (users: string[]) => void
  addOnlineUser: (user: string) => void
  removeOnlineUser: (user: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  activePanel: 'comments',
  setActivePanel: (panel) => set({ activePanel: panel }),

  selectedParagraphId: null,
  setSelectedParagraphId: (id) => set({ selectedParagraphId: id }),

  selectedText: null,
  selectionOffsets: null,
  setSelection: (text, offsets) => set({ selectedText: text, selectionOffsets: offsets }),

  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOnlineUser: (user) => set((s) => ({ onlineUsers: [...new Set([...s.onlineUsers, user])] })),
  removeOnlineUser: (user) => set((s) => ({ onlineUsers: s.onlineUsers.filter(u => u !== user) })),
}))
