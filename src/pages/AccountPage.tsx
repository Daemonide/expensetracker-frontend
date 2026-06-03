import { useState, type FormEvent } from "react"
import { changePassword, updateAccount } from "@/api/account"
import { validatePassword } from "@/lib/password"
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

export default function AccountPage() {
  const currentUser = useAuthStore((s) => s.user)
  const refreshUser = useAuthStore((s) => s.refreshUser)

  const [email, setEmail] = useState(currentUser?.email || "")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  async function handleAccountUpdate(e: FormEvent) {
    e.preventDefault()

    try {
      await updateAccount({
        email,
      })

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
      const msg =
        (
          err as {
            response?: {
              data?: {
                message?: string
              }
            }
          }
        )?.response?.data?.message ?? "Failed to update account"

      toast.error(msg)
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault()

    const validation = validatePassword(newPassword)

    if (validation) {
      toast.error(validation)
      return
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
      })

      setCurrentPassword("")
      setNewPassword("")

      toast.success("Password updated")
    } catch (err: unknown) {
      const msg =
        (
          err as {
            response?: {
              data?: {
                message?: string
              }
            }
          }
        )?.response?.data?.message ?? "Failed to update password"

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

            <div className="text-sm text-muted-foreground">
              Password must contain:
              <ul className="mt-2 ml-4 list-disc">
                <li>8+ characters</li>
                <li>Uppercase letter</li>
                <li>Lowercase letter</li>
                <li>Number</li>
                <li>Special character</li>
              </ul>
            </div>

            <Button type="submit">Change Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
