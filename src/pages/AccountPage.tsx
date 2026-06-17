import { useState, type FormEvent } from "react"
import { changePassword, updateAccount } from "@/api/account"
import { useAuthStore } from "@/lib/auth-store"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage } from "@/components/ui/avatar"

import { toast } from "sonner"
import { Check, X } from "lucide-react"

// Define a type for your API errors to avoid using 'any'
interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
}

// Removed the `export` keyword to satisfy React Fast Refresh
const PASSWORD_CRITERIA = [
  { id: "length", label: "8+ characters", test: (p: string) => p.length >= 8 },
  {
    id: "uppercase",
    label: "Uppercase letter",
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: "lowercase",
    label: "Lowercase letter",
    test: (p: string) => /[a-z]/.test(p),
  },
  { id: "number", label: "Number", test: (p: string) => /[0-9]/.test(p) },
  // Removed the unnecessary escape character before the opening bracket '['
  {
    id: "special",
    label: "Special character",
    test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p),
  },
]

export default function AccountPage() {
  const currentUser = useAuthStore((s) => s.user)
  const refreshUser = useAuthStore((s) => s.refreshUser)

  const [email, setEmail] = useState(currentUser?.email || "")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const isPasswordValid = PASSWORD_CRITERIA.every((c) => c.test(newPassword))
  const doPasswordsMatch =
    newPassword === confirmPassword && confirmPassword.length > 0
  const isFormValid =
    currentPassword.length > 0 && isPasswordValid && doPasswordsMatch

  async function handleAccountUpdate(e: FormEvent) {
    e.preventDefault()

    try {
      await updateAccount({ email })

      const token = localStorage.getItem("token")

      if (token) {
        const parts = token.split(".")
        const payload = JSON.parse(atob(parts[1]))
        payload.email = email
        parts[1] = btoa(JSON.stringify(payload))
        localStorage.setItem("token", parts.join("."))
      }

      refreshUser()
      toast.success("Account updated")
    } catch (err: unknown) {
      // Replaced 'any' with the ApiError interface
      const msg =
        (err as ApiError)?.response?.data?.message ?? "Failed to update account"
      toast.error(msg)
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault()

    if (!isFormValid) {
      toast.error("Please ensure all password requirements are met")
      return
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      toast.success("Password updated")
    } catch (err: unknown) {
      // Replaced 'any' with the ApiError interface
      const msg =
        (err as ApiError)?.response?.data?.message ??
        "Failed to update password"
      toast.error(msg)
    }
  }

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={currentUser?.avatar} />
            </Avatar>
            <div>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleAccountUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={currentUser?.username || ""} disabled />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password securely</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="rounded-md bg-muted/50 p-4">
              <p className="mb-2 text-sm font-medium">Password requirements:</p>
              <ul className="space-y-1.5 text-sm">
                {PASSWORD_CRITERIA.map((criterion) => {
                  const isValid = criterion.test(newPassword)
                  const isStarted = newPassword.length > 0

                  return (
                    <li
                      key={criterion.id}
                      className={`flex items-center gap-2 transition-colors ${
                        isValid
                          ? "text-green-600"
                          : isStarted
                            ? "text-red-500"
                            : "text-muted-foreground"
                      }`}
                    >
                      {isValid ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span>{criterion.label}</span>
                    </li>
                  )
                })}

                <li
                  className={`flex items-center gap-2 transition-colors ${
                    doPasswordsMatch
                      ? "text-green-600"
                      : confirmPassword.length > 0
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {doPasswordsMatch ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  <span>Passwords match</span>
                </li>
              </ul>
            </div>

            <Button type="submit" disabled={!isFormValid}>
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
