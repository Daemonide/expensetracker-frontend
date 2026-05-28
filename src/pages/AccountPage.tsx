import { useState } from "react"
import { changePassword, updateAccount } from "@/api/account"
import { getCurrentUser } from "@/api/auth"
import { validatePassword } from "@/lib/password"

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
  const currentUser = getCurrentUser()

  const [email, setEmail] = useState(currentUser?.email || "")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function handleAccountUpdate(e: React.FormEvent) {
    e.preventDefault()

    try {
      setError("")
      setMessage("")

      await updateAccount({
        email,
      })

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

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()

    const validation = validatePassword(newPassword)

    if (validation) {
      toast.error(validation)
      return
    }

    try {
      setError("")
      setMessage("")

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

      {message && <p className="text-sm text-green-500">{message}</p>}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
