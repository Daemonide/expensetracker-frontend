import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Wallet } from "lucide-react"
import { register } from "@/api/auth"
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
import Turnstile from "react-turnstile"
import { validatePassword } from "@/lib/password.ts"
import { toast } from "sonner"

export default function RegisterPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState("")
  const [email, setEmail] = useState("")

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    const passwordError = validatePassword(password)

    if (passwordError) {
      toast.error(passwordError)
      return
    }
    if (password !== confirm) {
      toast.error("Passwords do not match")
      return
    }
    try {
      setLoading(true)
      setError("")
      await register({
        username,
        email,
        password,
        captchaToken,
      })
      toast.success("Account created successfully")
      navigate("/login")
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Registration failed"
      toast.error(msg)
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
            <CardTitle className="text-xl">Create an account</CardTitle>
            <CardDescription>Enter your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              <Turnstile
                sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                onVerify={(token) => setCaptchaToken(token)}
                theme="auto"
              />
              <Button
                type="submit"
                className="w-full"
                disabled={
                  loading ||
                  !username.trim() ||
                  !password.trim() ||
                  !confirm.trim() ||
                  !captchaToken
                }
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="px-6 text-center text-xs text-muted-foreground">
          By signing up, you agree to our{" "}
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
