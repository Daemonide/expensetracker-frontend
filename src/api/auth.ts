import api from "./axios"

export interface LoginRequest {
  username: string
  password: string
  captchaToken: string
}

export interface RegisterRequest {
  username: string
  password: string
  captchaToken: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
}

export const login = (data: LoginRequest) =>
  api.post<AuthResponse>("/auth/login", data).then((r) => r.data)

export const register = (data: RegisterRequest) =>
  api.post<string>("/auth/register", data).then((r) => r.data)
