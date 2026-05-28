import api from "./axios"
import { jwtDecode } from "jwt-decode"

export interface LoginRequest {
  username: string
  password: string
  captchaToken: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  captchaToken: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
}

interface JwtPayload {
  sub: string
  email: string
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function getCurrentUser() {
  const token = localStorage.getItem("token")

  if (!token) return null

  try {
    const decoded = jwtDecode<JwtPayload>(token)

    return {
      username: capitalize(decoded.sub),
      email: decoded.email,
      avatar: `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(decoded.sub)}`,
    }
  } catch {
    return null
  }
}

export const login = (data: LoginRequest) =>
  api.post<AuthResponse>("/auth/login", data).then((r) => r.data)

export const register = (data: RegisterRequest) =>
  api.post<string>("/auth/register", data).then((r) => r.data)
