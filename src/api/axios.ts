import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:8080",
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  const isAuthRoute =
    config.url?.includes("/auth/login") ||
    config.url?.includes("/auth/register")

  if (token && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute =
      error?.config?.url?.includes("/auth/login") ||
      error?.config?.url?.includes("/auth/register")

    if (error?.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default api
