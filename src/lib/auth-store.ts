import { create } from "zustand"
import { getCurrentUser } from "@/api/auth.ts"

interface AuthState {
  user: ReturnType<typeof getCurrentUser>
  refreshUser: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getCurrentUser(),

  refreshUser: () =>
    set({
      user: getCurrentUser(),
    }),
}))
