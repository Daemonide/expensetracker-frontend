import { create } from "zustand"
import { getCurrentUser } from "@/api/auth.ts"

interface User {
  username: string
  email: string
  avatar?: string
}

interface AuthState {
  user: User | null
  refreshUser: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getCurrentUser(),

  refreshUser: () =>
    set({
      user: getCurrentUser(),
    }),

  logout: () =>
    set({
      user: null,
    }),
}))
