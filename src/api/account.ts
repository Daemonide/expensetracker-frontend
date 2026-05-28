import api from "./axios"

export interface UpdateAccountRequest {
  email: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export const updateAccount = (data: UpdateAccountRequest) =>
  api.put("/account", data).then((r) => r.data)

export const changePassword = (data: ChangePasswordRequest) =>
  api.put("/account/password", data).then((r) => r.data)
