import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Wallet } from "lucide-react"
import { Turnstile } from "react-turnstile"

import { login } from "@/api/auth"
import { useAuthStore } from "@/lib/auth-store"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function LoginPage() {
  const navigate = useNavigate()

  const refreshUser = useAuthStore((s) => s.refreshUser)

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState("")

  // used to fully remount Turnstile after failed login
  const [turnstileKey, setTurnstileKey] = useState(0)

  async function handleLogin(e: FormEvent) {
    e.preventDefault()

    try {
      setLoading(true)
      setError("")

      const response = await login({
        username,
        password,
        captchaToken,
      })

      localStorage.setItem("token", response.accessToken)
      localStorage.setItem("refreshToken", response.refreshToken)

      refreshUser()

      navigate("/dashboard")
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Invalid username or password"

      setError(msg)

      // reset captcha after failed login
      setCaptchaToken("")
      setTurnstileKey((prev) => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wallet className="size-4" />
          </div>
          Expense Tracker
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>

            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Username</Label>

                <Input
                  id="username"
                  type="text"
                  placeholder="your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>

                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Turnstile
                key={turnstileKey}
                sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken("")}
                onError={() => setCaptchaToken("")}
                theme="auto"
              />

              <Button
                type="submit"
                className="w-full"
                disabled={
                  loading ||
                  !username.trim() ||
                  !password.trim() ||
                  !captchaToken
                }
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  to="/register"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Sign up
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="px-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  )
}
