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

import { AVAILABLE_ICONS } from "@/lib/icons"

type SortField = "title" | "categoryName" | "status" | "amount" | "date"

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
}

const SORT_LABELS: Record<SortField, string> = {
  date: "Date",
  title: "Title",
  categoryName: "Category",
  status: "Status",
  amount: "Amount",
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
  onToggleSelect,
  onEdit,
  onDelete,
}: {
  expense: Expense
  selected: boolean
  IconComponent: React.ElementType
  colorClass: string
  onToggleSelect: (id: number) => void
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}) {
  return (
    <Card
      className={`relative transition-shadow hover:shadow-md ${
        selected ? "ring-2 ring-primary" : ""
      }`}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(expense.expenseID)}
          className="mt-1"
        />

        {/* Global color class and icon dynamically injected here */}
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
  const [loading, setLoading] = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)

  const [totalPages, setTotalPages] = React.useState(1)
  const [totalElements, setTotalElements] = React.useState(0)

  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")

  const [statusFilter, setStatusFilter] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("")
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")

  const hasActiveFilters = !!(
    statusFilter ||
    categoryFilter ||
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
  })

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      form.title.trim() &&
      form.amount &&
      form.date &&
      form.categoryId
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

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search title... (press Enter)"
          className="max-w-sm bg-background"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setSearch(searchInput)
          }}
        />

        {selectedIds.size > 0 && (
          <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
            Delete Selected ({selectedIds.size})
          </Button>
        )}

        <Button onClick={openAddSheet}>
          <IconPlus className="mr-2 size-4" />
          Add Expense
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Sort by</Label>
          <Select value={sorting.id} onValueChange={handleSortFieldChange}>
            <SelectTrigger className="h-9 w-36 bg-background">
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

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/40 p-3 shadow-sm">
        <IconFilter className="mb-1.5 size-4 shrink-0 text-muted-foreground" />

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select
            value={statusFilter || "ALL"}
            onValueChange={(value) =>
              setStatusFilter(value === "ALL" ? "" : value)
            }
          >
            <SelectTrigger className="h-8 w-36 bg-background">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select
            value={categoryFilter || "ALL"}
            onValueChange={(value) =>
              setCategoryFilter(value === "ALL" ? "" : value)
            }
          >
            <SelectTrigger className="h-8 w-40 bg-background">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.categoryId} value={String(c.categoryId)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input
            type="date"
            className="h-8 w-36 bg-background"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input
            type="date"
            className="h-8 w-36 bg-background"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-muted-foreground"
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
                  <h3 className="text-base font-semibold">{group.label}</h3>
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
                    // Get the full global config object for this specific icon
                    const iconConfig =
                      AVAILABLE_ICONS.find((i) => i.id === iconId) ||
                      AVAILABLE_ICONS[AVAILABLE_ICONS.length - 1]

                    return (
                      <ExpenseCard
                        key={expense.expenseID}
                        expense={expense}
                        selected={selectedIds.has(expense.expenseID)}
                        IconComponent={iconConfig.icon}
                        colorClass={iconConfig.colorClass} // Pass down the specific color mapping
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
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: Number(e.target.value) })
                }
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
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: Number(e.target.value) })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {categories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as ExpenseForm["status"],
                  })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <Button
              className="w-full"
              onClick={() => void handleSave()}
              disabled={
                !form.title.trim() ||
                !form.amount ||
                !form.date ||
                !form.categoryId
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
