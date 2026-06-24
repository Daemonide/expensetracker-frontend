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

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

import {
  IconChevronDown,
  IconCircleCheckFilled,
  IconCreditCard,
  IconDotsVertical,
  IconLoader,
  IconPlus,
  IconX,
  IconClock,
  IconFilter,
  IconFilterOff,
  IconSortAscending,
  IconSortDescending,
  IconWallet,
} from "@tabler/icons-react"

import { toast } from "sonner"

import {
  type Expense,
  type ExpenseForm,
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "@/api/expenses"

import { type Category, getCategories } from "@/api/categories"
import {
  type FinancialAccount,
  getFinancialAccounts,
} from "@/api/financial-accounts"

import { AVAILABLE_ICONS } from "@/lib/icons"
import { ACCOUNT_TYPE_CONFIG } from "@/lib/account-types"

type SortField =
  | "title"
  | "categoryName"
  | "status"
  | "amount"
  | "date"
  | "financialAccountName"

interface SortState {
  id: SortField
  desc: boolean
}

interface ExpenseGroup {
  key: string
  label: string
  items: Expense[]
}

const SORT_FIELD_MAP: Record<SortField, string> = {
  title: "title",
  amount: "amount",
  status: "status",
  date: "date",
  categoryName: "category.name",
  financialAccountName: "financialAccount.name",
}

const SORT_LABELS: Record<SortField, string> = {
  date: "Date",
  title: "Title",
  categoryName: "Category",
  status: "Status",
  amount: "Amount",
  financialAccountName: "Account",
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
})

function getDateKey(dateStr: string) {
  return dateStr.split("T")[0]
}

function formatDateLabel(dateStr: string) {
  const [year, month, day] = getDateKey(dateStr).split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

const STATUS_CONFIG: Record<
  Expense["status"],
  { icon: React.ReactNode; label: string }
> = {
  DONE: {
    icon: <IconCircleCheckFilled className="size-3.5 text-green-500" />,
    label: "Done",
  },
  IN_PROGRESS: {
    icon: <IconLoader className="size-3.5 animate-spin text-blue-500" />,
    label: "In Progress",
  },
  PENDING: {
    icon: <IconClock className="size-3.5 text-yellow-500" />,
    label: "Pending",
  },
  CANCELLED: {
    icon: <IconX className="size-3.5 text-red-500" />,
    label: "Cancelled",
  },
}

function StatusBadge({ status }: { status: Expense["status"] }) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge variant="outline" className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  )
}

function ExpenseCard({
  expense,
  selected,
  IconComponent,
  colorClass,
  AccountIcon,
  accountBandClass,
  onToggleSelect,
  onEdit,
  onDelete,
}: {
  expense: Expense
  selected: boolean
  IconComponent: React.ElementType
  colorClass: string
  AccountIcon: React.ElementType
  accountBandClass: string
  onToggleSelect: (id: number) => void
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}) {
  return (
    <Card
      className={`relative overflow-hidden transition-shadow hover:shadow-md ${
        selected ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${accountBandClass}`} />

      <CardContent className="flex items-start gap-3 p-4 pl-5">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(expense.expenseID)}
          className="mt-1"
        />

        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}
        >
          <IconComponent className="size-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate leading-tight font-medium">
              {expense.title}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mt-2 -mr-2 size-8 shrink-0"
                >
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(expense)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() => onDelete(expense)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="truncate text-sm text-muted-foreground">
            {expense.categoryName} · {formatDateLabel(expense.date)}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AccountIcon className="size-3.5" />
            <span className="truncate">{expense.financialAccountName}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <StatusBadge status={expense.status} />
            <span className="font-semibold">
              {currencyFormatter.format(Number(expense.amount))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ExpensesCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-start gap-3 p-4">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [financialAccounts, setFinancialAccounts] = React.useState<
    FinancialAccount[]
  >([])
  const [loading, setLoading] = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)

  const [totalPages, setTotalPages] = React.useState(1)
  const [totalElements, setTotalElements] = React.useState(0)

  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")

  const [statusFilter, setStatusFilter] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("")
  const [accountFilter, setAccountFilter] = React.useState("")
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")

  const hasActiveFilters = !!(
    statusFilter ||
    categoryFilter ||
    accountFilter ||
    dateFrom ||
    dateTo ||
    search
  )

  const [sorting, setSorting] = React.useState<SortState>({
    id: "date",
    desc: true,
  })
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 12,
  })

  const [openSheet, setOpenSheet] = React.useState(false)
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(
    null
  )

  const [deleteTarget, setDeleteTarget] = React.useState<Expense | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false)

  const [form, setForm] = React.useState<ExpenseForm>({
    title: "",
    amount: 0,
    date: "",
    categoryId: 0,
    status: "PENDING",
    financialAccountId: 0,
  })

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      form.title.trim() &&
      form.amount &&
      form.date &&
      form.categoryId &&
      form.financialAccountId
    ) {
      e.preventDefault()
      void handleSave()
    }
  }

  const fetchExpenses = React.useCallback(
    async (pageIndex: number, append: boolean) => {
      try {
        if (append) setLoadingMore(true)
        else setLoading(true)

        const sortField = SORT_FIELD_MAP[sorting.id] ?? "date"
        const sortDirection = sorting.desc ? "DESC" : "ASC"

        const response = await getExpenses({
          page: pageIndex,
          size: pagination.pageSize,
          sortField,
          sortDirection,
          search,
          status: statusFilter || undefined,
          categoryId: categoryFilter ? Number(categoryFilter) : undefined,
          financialAccountId: accountFilter ? Number(accountFilter) : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        })

        setExpenses((prev) =>
          append
            ? [...prev, ...(response.content ?? [])]
            : (response.content ?? [])
        )
        setTotalPages(response.totalPages ?? 1)
        setTotalElements(response.totalElements ?? 0)
        setPagination((p) => ({ ...p, pageIndex }))
      } catch (err) {
        console.error(err)
        toast.error(
          append ? "Failed to load more expenses" : "Failed to fetch expenses"
        )
      } finally {
        if (append) setLoadingMore(false)
        else setLoading(false)
      }
    },
    [
      pagination.pageSize,
      sorting,
      search,
      statusFilter,
      categoryFilter,
      accountFilter,
      dateFrom,
      dateTo,
    ]
  )

  React.useEffect(() => {
    void fetchExpenses(0, false)
  }, [fetchExpenses])

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories()
        setCategories(data.content ?? [])
      } catch (err) {
        console.error(err)
        toast.error("Failed to fetch categories")
      }
    }
    void fetchCategories()
  }, [])

  React.useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await getFinancialAccounts()
        setFinancialAccounts(data)
      } catch (err) {
        console.error(err)
        toast.error("Failed to fetch accounts")
      }
    }
    void fetchAccounts()
  }, [])

  const refetch = () => fetchExpenses(0, false)

  const handleLoadMore = () => {
    if (!loadingMore && pagination.pageIndex + 1 < totalPages) {
      void fetchExpenses(pagination.pageIndex + 1, true)
    }
  }

  const clearFilters = () => {
    setSearch("")
    setSearchInput("")
    setStatusFilter("")
    setCategoryFilter("")
    setAccountFilter("")
    setDateFrom("")
    setDateTo("")
  }

  const handleSortFieldChange = (value: string) => {
    const id = value as SortField
    setSorting({ id, desc: id === "amount" || id === "date" })
  }

  const toggleSortDirection = () => {
    setSorting((prev) => ({ ...prev, desc: !prev.desc }))
  }

  const groups = React.useMemo<ExpenseGroup[]>(() => {
    const result: ExpenseGroup[] = []
    for (const expense of expenses) {
      let key: string
      let label: string

      if (sorting.id === "categoryName") {
        key = `cat-${expense.categoryId}`
        label = expense.categoryName
      } else if (sorting.id === "financialAccountName") {
        key = `acct-${expense.financialAccountId}`
        label = expense.financialAccountName
      } else if (sorting.id === "status") {
        key = `status-${expense.status}`
        label = STATUS_CONFIG[expense.status]?.label ?? expense.status
      } else {
        key = getDateKey(expense.date)
        label = formatDateLabel(expense.date)
      }

      const lastGroup = result[result.length - 1]
      if (lastGroup && lastGroup.key === key) {
        lastGroup.items.push(expense)
      } else {
        result.push({ key, label, items: [expense] })
      }
    }
    return result
  }, [expenses, sorting.id])

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allLoadedSelected =
    expenses.length > 0 && expenses.every((e) => selectedIds.has(e.expenseID))
  const someLoadedSelected = expenses.some((e) => selectedIds.has(e.expenseID))

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      expenses.forEach((e) => {
        if (allLoadedSelected) next.delete(e.expenseID)
        else next.add(e.expenseID)
      })
      return next
    })
  }

  const toggleGroupSelect = (group: ExpenseGroup) => {
    const groupExpenseIds = group.items.map((e) => e.expenseID)
    const allGroupSelected = groupExpenseIds.every((id) => selectedIds.has(id))

    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allGroupSelected) {
        groupExpenseIds.forEach((id) => next.delete(id))
      } else {
        groupExpenseIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const openAddSheet = () => {
    setEditingExpense(null)
    setForm({
      title: "",
      amount: 0,
      date: "",
      categoryId: categories[0]?.categoryId ?? 0,
      status: "PENDING",
      financialAccountId: financialAccounts[0]?.id ?? 0,
    })
    setOpenSheet(true)
  }

  const openEditSheet = (expense: Expense) => {
    setEditingExpense(expense)
    setForm({
      title: expense.title,
      amount: expense.amount,
      date: expense.date.split("T")[0],
      categoryId: expense.categoryId,
      status: expense.status,
      financialAccountId: expense.financialAccountId,
    })
    setOpenSheet(true)
  }

  const handleSave = async () => {
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.expenseID, form)
        toast.success("Expense updated")
      } else {
        await createExpense(form)
        toast.success("Expense created")
      }
      setOpenSheet(false)
      await refetch()
    } catch (err) {
      console.error(err)
      toast.error("Failed to save expense")
    }
  }

  const handleDelete = async (expenseID: number) => {
    try {
      await deleteExpense(expenseID)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(expenseID)
        return next
      })
      toast.success("Expense deleted")
      await refetch()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete expense")
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds)
    try {
      await Promise.all(ids.map((id) => deleteExpense(id)))
      toast.success(
        `${ids.length} expense${ids.length !== 1 ? "s" : ""} deleted`
      )
      setSelectedIds(new Set())
      await refetch()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete selected expenses")
    } finally {
      setBulkDeleteOpen(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          placeholder="Search title... (press Enter)"
          className="w-full bg-background sm:max-w-sm"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setSearch(searchInput)
          }}
        />

        <div className="flex w-full gap-2 sm:w-auto">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              className="flex-1 sm:flex-none"
              onClick={() => setBulkDeleteOpen(true)}
            >
              Delete ({selectedIds.size})
            </Button>
          )}

          <Button onClick={openAddSheet} className="flex-1 sm:flex-none">
            <IconPlus className="mr-2 size-4" />
            Add Expense
          </Button>
        </div>

        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <Label className="text-sm whitespace-nowrap text-muted-foreground">
            Sort by
          </Label>
          <Select value={sorting.id} onValueChange={handleSortFieldChange}>
            <SelectTrigger className="h-9 flex-1 bg-background sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORT_LABELS).map(([id, label]) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 bg-background"
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

      <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3 shadow-sm sm:flex sm:flex-wrap sm:items-end">
        <div className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:mb-1.5">
          <IconFilter className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium sm:hidden">Filters</span>
        </div>

        <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select
            value={statusFilter || "ALL"}
            onValueChange={(value) =>
              setStatusFilter(value === "ALL" ? "" : value)
            }
          >
            <SelectTrigger className="h-8 w-full bg-background sm:w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => (
                <SelectItem key={statusKey} value={statusKey}>
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select
            value={categoryFilter || "ALL"}
            onValueChange={(value) =>
              setCategoryFilter(value === "ALL" ? "" : value)
            }
          >
            <SelectTrigger className="h-8 w-full bg-background sm:w-48">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {categories.map((c) => {
                const iconId = c.iconName || "default"
                const iconConfig =
                  AVAILABLE_ICONS.find((i) => i.id === iconId) ||
                  AVAILABLE_ICONS[AVAILABLE_ICONS.length - 1]
                const IconComponent = iconConfig.icon

                return (
                  <SelectItem key={c.categoryId} value={String(c.categoryId)}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex size-5 shrink-0 items-center justify-center rounded-md ${iconConfig.colorClass}`}
                      >
                        <IconComponent className="size-3" />
                      </div>
                      <span className="truncate">{c.name}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
          <Label className="text-xs text-muted-foreground">Account</Label>
          <Select
            value={accountFilter || "ALL"}
            onValueChange={(value) =>
              setAccountFilter(value === "ALL" ? "" : value)
            }
          >
            <SelectTrigger className="h-8 w-full bg-background sm:w-44">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All accounts</SelectItem>
              {financialAccounts.map((account) => {
                const config = ACCOUNT_TYPE_CONFIG[account.type]
                const AccountIcon = config.icon

                return (
                  <SelectItem key={account.id} value={String(account.id)}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex size-5 shrink-0 items-center justify-center rounded-md ${config.chipClass}`}
                      >
                        <AccountIcon className="size-3" />
                      </div>
                      <span className="truncate">{account.name}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-1 flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input
            type="date"
            className="h-8 w-full bg-background sm:w-36"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="col-span-1 flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input
            type="date"
            className="h-8 w-full bg-background sm:w-36"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="col-span-2 h-8 gap-1 text-muted-foreground sm:col-span-1"
            onClick={clearFilters}
          >
            <IconFilterOff className="size-4" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={
              allLoadedSelected
                ? true
                : someLoadedSelected
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={toggleSelectAll}
            disabled={expenses.length === 0}
          />
          <Label className="text-sm text-muted-foreground">
            {selectedIds.size > 0
              ? `${selectedIds.size} selected`
              : "Select all"}
          </Label>
        </div>

        <div className="text-sm text-muted-foreground">
          {loading ? (
            <Skeleton className="h-4 w-40" />
          ) : (
            `Showing ${expenses.length} of ${totalElements} expenses`
          )}
        </div>
      </div>

      {loading ? (
        <ExpensesCardSkeleton count={pagination.pageSize} />
      ) : groups.length > 0 ? (
        <div className="space-y-8">
          {groups.map((group) => {
            const groupExpenseIds = group.items.map((e) => e.expenseID)
            const allGroupSelected =
              groupExpenseIds.length > 0 &&
              groupExpenseIds.every((id) => selectedIds.has(id))
            const someGroupSelected = groupExpenseIds.some((id) =>
              selectedIds.has(id)
            )

            let GroupIcon: React.ReactNode = null

            if (sorting.id === "categoryName" && group.items.length > 0) {
              const targetItem = group.items[0]
              const category = categories.find(
                (c) => c.categoryId === targetItem.categoryId
              )
              const iconId = category?.iconName || "default"
              const iconConfig =
                AVAILABLE_ICONS.find((i) => i.id === iconId) ||
                AVAILABLE_ICONS[AVAILABLE_ICONS.length - 1]
              const IconComponent = iconConfig.icon

              GroupIcon = (
                <div
                  className={`flex size-6 shrink-0 items-center justify-center rounded-md ${iconConfig.colorClass}`}
                >
                  <IconComponent className="size-3.5" />
                </div>
              )
            } else if (
              sorting.id === "financialAccountName" &&
              group.items.length > 0
            ) {
              const targetItem = group.items[0]
              const account = financialAccounts.find(
                (a) => a.id === targetItem.financialAccountId
              )
              const config = account ? ACCOUNT_TYPE_CONFIG[account.type] : null
              const Icon = config?.icon ?? IconWallet

              GroupIcon = (
                <div
                  className={`flex size-6 shrink-0 items-center justify-center rounded-md ${
                    config?.chipClass ?? "bg-muted"
                  }`}
                >
                  <Icon className="size-3.5" />
                </div>
              )
            } else if (sorting.id === "status" && group.items.length > 0) {
              const targetItem = group.items[0]
              const config = STATUS_CONFIG[targetItem.status]

              if (config && React.isValidElement(config.icon)) {
                GroupIcon = React.cloneElement(config.icon, {
                  className: "size-4.5 shrink-0",
                } as React.HTMLAttributes<SVGElement>)
              }
            }

            return (
              <div key={group.key} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={
                      allGroupSelected
                        ? true
                        : someGroupSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={() => toggleGroupSelect(group)}
                    aria-label={`Select all in ${group.label}`}
                  />

                  <div className="flex items-center gap-2">
                    {GroupIcon}
                    <h3 className="text-base font-semibold">{group.label}</h3>
                  </div>

                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {group.items.length} expense
                    {group.items.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((expense) => {
                    const category = categories.find(
                      (c) => c.categoryId === expense.categoryId
                    )
                    const iconId = category?.iconName || "default"
                    const iconConfig =
                      AVAILABLE_ICONS.find((i) => i.id === iconId) ||
                      AVAILABLE_ICONS[AVAILABLE_ICONS.length - 1]

                    const account = financialAccounts.find(
                      (a) => a.id === expense.financialAccountId
                    )
                    const accountConfig = account
                      ? ACCOUNT_TYPE_CONFIG[account.type]
                      : null

                    return (
                      <ExpenseCard
                        key={expense.expenseID}
                        expense={expense}
                        selected={selectedIds.has(expense.expenseID)}
                        IconComponent={iconConfig.icon}
                        colorClass={iconConfig.colorClass}
                        AccountIcon={accountConfig?.icon ?? IconWallet}
                        accountBandClass={
                          accountConfig?.bandClass ?? "bg-muted-foreground/30"
                        }
                        onToggleSelect={toggleSelect}
                        onEdit={openEditSheet}
                        onDelete={(e) => setDeleteTarget(e)}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          <IconCreditCard className="size-8" />
          <p>No expenses found.</p>
        </div>
      )}

      {!loading &&
        groups.length > 0 &&
        (pagination.pageIndex + 1 < totalPages ? (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <IconLoader className="mr-2 size-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <IconChevronDown className="mr-2 size-4" />
                  Load more
                </>
              )}
            </Button>
          </div>
        ) : (
          <p className="pt-2 text-center text-sm text-muted-foreground">
            You&apos;ve reached the end · {totalElements} expense
            {totalElements !== 1 ? "s" : ""} total
          </p>
        ))}

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingExpense ? "Edit Expense" : "Add Expense"}
            </SheetTitle>
            <SheetDescription>Fill expense details below.</SheetDescription>
          </SheetHeader>

          <div className="m-3 space-y-4" onKeyDown={handleFormKeyDown}>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={form.amount === 0 ? "" : form.amount}
                onChange={(e) => {
                  const raw = e.target.value
                  setForm({ ...form, amount: raw === "" ? 0 : Number(raw) })
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={String(form.categoryId)}
                onValueChange={(value) =>
                  setForm({ ...form, categoryId: Number(value) })
                }
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => {
                    const iconId = category.iconName || "default"
                    const iconConfig =
                      AVAILABLE_ICONS.find((i) => i.id === iconId) ||
                      AVAILABLE_ICONS[AVAILABLE_ICONS.length - 1]
                    const IconComponent = iconConfig.icon

                    return (
                      <SelectItem
                        key={category.categoryId}
                        value={String(category.categoryId)}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex size-6 shrink-0 items-center justify-center rounded-md ${iconConfig.colorClass}`}
                          >
                            <IconComponent className="size-3.5" />
                          </div>
                          <span className="truncate">{category.name}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Account</Label>
              <Select
                value={String(form.financialAccountId)}
                onValueChange={(value) =>
                  setForm({ ...form, financialAccountId: Number(value) })
                }
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {financialAccounts.map((account) => {
                    const config = ACCOUNT_TYPE_CONFIG[account.type]
                    const AccountIcon = config.icon

                    return (
                      <SelectItem key={account.id} value={String(account.id)}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex size-6 shrink-0 items-center justify-center rounded-md ${config.chipClass}`}
                          >
                            {" "}
                            <AccountIcon className="size-3.5" />{" "}
                          </div>{" "}
                          <span className="truncate">{account.name}</span>{" "}
                        </div>{" "}
                      </SelectItem>
                    )
                  })}{" "}
                </SelectContent>{" "}
              </Select>{" "}
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    status: value as ExpenseForm["status"],
                  })
                }
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => (
                    <SelectItem key={statusKey} value={statusKey}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={() => void handleSave()}
              disabled={
                !form.title.trim() ||
                !form.amount ||
                !form.date ||
                !form.categoryId ||
                !form.financialAccountId
              }
            >
              {editingExpense ? "Update Expense" : "Create Expense"}
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
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                "{deleteTarget?.title}"
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={() =>
                deleteTarget && void handleDelete(deleteTarget.expenseID)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} expenses?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size} selected expenses.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={() => void handleDeleteSelected()}
            >
              Delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
