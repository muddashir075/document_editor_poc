import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'sgcan_admin' | 'reviewer' | 'consultation'

interface AuthState {
  user: string
  role: UserRole
  // Convenience helpers
  isAdmin: boolean
  isReviewer: boolean
  isConsultation: boolean
  setUser: (user: string, role: UserRole) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: import.meta.env.VITE_DEFAULT_USER ?? 'guest',
      role: 'consultation' as UserRole,
      isAdmin: false,
      isReviewer: false,
      isConsultation: true,
      setUser: (user, role) =>
        set({
          user,
          role,
          isAdmin: role === 'sgcan_admin',
          isReviewer: role === 'reviewer',
          isConsultation: role === 'consultation',
        }),
      logout: () =>
        set({ user: 'guest', role: 'consultation', isAdmin: false, isReviewer: false, isConsultation: true }),
    }),
    { name: 'auth' }
  )
)
