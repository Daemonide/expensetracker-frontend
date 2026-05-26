import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { login } from "@/api/auth"
import { Button } from "@/components/ui/button.tsx"

export default function LoginPage() {
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    try {
      setLoading(true)
      setError("")

      const response = await login({
        username,
        password,
      })

      localStorage.setItem("token", response.token)

      navigate("/expenses")
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid username or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm space-y-4 rounded-xl border p-6"
      >
        <div>
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Username</label>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          disabled={loading || !username.trim() || !password.trim()}
          className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </div>
  )
}
