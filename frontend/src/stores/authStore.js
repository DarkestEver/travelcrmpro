import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      // Set authentication data
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      // Update user data
      setUser: (user) => set({ user }),

      // Update tokens
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      // Logout
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),

      // Check if user has role
      hasRole: (roles) => {
        const { user } = useAuthStore.getState()
        if (!user) return false
        return roles.includes(user.role)
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)
