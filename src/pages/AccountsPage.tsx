import * as React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { Card, CardContent } from "@/components/ui/card"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

import {
  IconDotsVertical,
  IconPlus,
  IconWallet,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react"

import { toast } from "sonner"

import {
  type FinancialAccount,
  type FinancialAccountForm,
  createFinancialAccount,
  deleteFinancialAccount,
  getFinancialAccounts,
  updateFinancialAccount,
} from "@/api/financial-accounts"

import {
  ACCOUNT_TYPE_CONFIG,
  ACCOUNT_TYPE_OPTIONS,
  type FinancialAccountType,
} from "@/lib/account-types"

type SortField = "name" | "type"

function AccountCard({
  account,
  onEdit,
  onDelete,
}: {
  account: FinancialAccount
  onEdit: (account: FinancialAccount) => void
  onDelete: (account: FinancialAccount) => void
}) {
  const config = ACCOUNT_TYPE_CONFIG[account.type]
  const Icon = config.icon

  return (
    <Card className="relative overflow-hidden transition-all hover:border-muted-foreground/30 hover:shadow-md">
      {/* Vertical band of color identifying the account type */}
      <div className={`absolute inset-y-0 left-0 w-1.5 ${config.bandClass}`} />

      <CardContent className="flex items-center gap-4 p-4 pl-6">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${config.chipClass}`}
        >
          <Icon className="size-6" />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-base font-semibold tracking-tight">
              {account.name}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-2 size-8 shrink-0"
                >
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(account)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500"
                  onClick={() => onDelete(account)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-muted-foreground">{config.label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function AccountsCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="size-12 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function AccountsPage() {
  const [accounts, setAccounts] = React.useState<FinancialAccount[]>([])
  const [loading, setLoading] = React.useState(true)

  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")

  const [sorting, setSorting] = React.useState<{
    id: SortField
    desc: boolean
  }>({ id: "name", desc: false })

  const [openSheet, setOpenSheet] = React.useState(false)
  const [editingAccount, setEditingAccount] =
    React.useState<FinancialAccount | null>(null)
  const [form, setForm] = React.useState<FinancialAccountForm>({
    name: "",
    type: "BANK",
  })

  const [deleteTarget, setDeleteTarget] =
    React.useState<FinancialAccount | null>(null)

  const fetchAccounts = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await getFinancialAccounts()
      setAccounts(data)
    } catch (err) {
      console.error(err)
      toast.error("Failed to fetch accounts")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchAccounts()
  }, [fetchAccounts])

  const visibleAccounts = React.useMemo(() => {
    let list = accounts
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((a) => a.name.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => {
      const cmp =
        sorting.id === "name"
          ? a.name.localeCompare(b.name)
          : ACCOUNT_TYPE_CONFIG[a.type].label.localeCompare(
              ACCOUNT_TYPE_CONFIG[b.type].label
            )
      return sorting.desc ? -cmp : cmp
    })
  }, [accounts, search, sorting])

  const toggleSortDirection = () => {
    setSorting((prev) => ({ ...prev, desc: !prev.desc }))
  }

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && form.name.trim()) {
      e.preventDefault()
      void handleSave()
    }
  }

  const openAddSheet = () => {
    setEditingAccount(null)
    setForm({ name: "", type: "BANK" })
    setOpenSheet(true)
  }

  const openEditSheet = (account: FinancialAccount) => {
    setEditingAccount(account)
    setForm({ name: account.name, type: account.type })
    setOpenSheet(true)
  }

  const handleSave = async () => {
    try {
      if (editingAccount) {
        await updateFinancialAccount(editingAccount.id, form)
        toast.success("Account updated")
      } else {
        await createFinancialAccount(form)
        toast.success("Account created")
      }
      setOpenSheet(false)
      await fetchAccounts()
    } catch (err) {
      console.error(err)
      toast.error("Failed to save account")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteFinancialAccount(id)
      toast.success("Account deleted")
      await fetchAccounts()
    } catch (err) {
      console.error(err)
      toast.error(
        "Failed to delete account. It may still have expenses linked to it."
      )
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search accounts... (press Enter)"
          className="max-w-sm bg-background"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setSearch(searchInput)
          }}
        />
        <Button onClick={openAddSheet}>
          <IconPlus className="mr-2 size-4" />
          Add Account
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Sort by</Label>
          <Select
            value={sorting.id}
            onValueChange={(value) =>
              setSorting((prev) => ({ ...prev, id: value as SortField }))
            }
          >
            <SelectTrigger className="h-9 w-32 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="bg-background"
            onClick={toggleSortDirection}
            title={sorting.desc ? "Descending" : "Ascending"}
          >
            {sorting.desc ? (
              <IconSortDescending className="size-4" />
            ) : (
              <IconSortAscending className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {loading ? (
          <Skeleton className="h-4 w-40" />
        ) : (
          `Showing ${visibleAccounts.length} of ${accounts.length} accounts`
        )}
      </div>

      {loading ? (
        <AccountsCardSkeleton />
      ) : visibleAccounts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={openEditSheet}
              onDelete={(a) => setDeleteTarget(a)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          <IconWallet className="size-8" />
          <p>No accounts found.</p>
        </div>
      )}

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingAccount ? "Edit Account" : "Add Account"}
            </SheetTitle>
            <SheetDescription>
              Provide the account name and type.
            </SheetDescription>
          </SheetHeader>

          <div className="m-3 space-y-4" onKeyDown={handleFormKeyDown}>
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. HDFC Savings, Amex Card"
              />
            </div>

            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select
                value={form.type}
                onValueChange={(value) =>
                  setForm({ ...form, type: value as FinancialAccountType })
                }
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPE_OPTIONS.map((type) => {
                    const config = ACCOUNT_TYPE_CONFIG[type]
                    const Icon = config.icon
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex size-6 shrink-0 items-center justify-center rounded-md ${config.chipClass}`}
                          >
                            <Icon className="size-3.5" />
                          </div>
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="mt-2 w-full"
              onClick={() => void handleSave()}
              disabled={!form.name.trim()}
            >
              {editingAccount ? "Update Account" : "Create Account"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                "{deleteTarget?.name}"
              </span>
              . If expenses are still linked to this account, deletion will fail
              until they're reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && void handleDelete(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
