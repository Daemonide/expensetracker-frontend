"use client"

import * as React from "react"

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Column,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  type Updater,
  type RowSelectionState,
} from "@tanstack/react-table"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconX,
  IconClock,
  IconArrowsSort,
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

const SORT_FIELD_MAP: Record<string, string> = {
  title: "title",
  amount: "amount",
  status: "status",
  date: "date",
  categoryName: "category.name",
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])

  const [totalPages, setTotalPages] = React.useState(1)
  const [totalElements, setTotalElements] = React.useState(0)

  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "date", desc: true },
  ])

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const [openSheet, setOpenSheet] = React.useState(false)
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(
    null
  )

  const [form, setForm] = React.useState<ExpenseForm>({
    title: "",
    amount: 0,
    date: "",
    categoryId: 0,
    status: "PENDING",
  })

  const fetchExpenses = React.useCallback(async () => {
    try {
      const sortField = SORT_FIELD_MAP[sorting[0]?.id ?? "date"] ?? "date"
      const sortDirection = sorting[0]?.desc ? "DESC" : "ASC"

      const response = await getExpenses(
        pagination.pageIndex,
        pagination.pageSize,
        sortField,
        sortDirection,
        search
      )

      setExpenses(response.content ?? [])
      setTotalPages(response.totalPages ?? 1)
      setTotalElements(response.totalElements ?? 0)
    } catch (err) {
      console.error(err)
      toast.error("Failed to fetch expenses")
    }
  }, [pagination.pageIndex, pagination.pageSize, sorting, search])

  React.useEffect(() => {
    void fetchExpenses()
  }, [fetchExpenses])

  React.useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [search])

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

  const rowSelection = React.useMemo<RowSelectionState>(() => {
    const selection: RowSelectionState = {}
    expenses.forEach((expense, index) => {
      if (selectedIds.has(expense.expenseID)) {
        selection[String(index)] = true
      }
    })
    return selection
  }, [expenses, selectedIds])

  const handleRowSelectionChange = (updater: Updater<RowSelectionState>) => {
    const newSelection =
      typeof updater === "function" ? updater(rowSelection) : updater

    setSelectedIds((prev) => {
      const next = new Set(prev)
      expenses.forEach((expense, index) => {
        if (newSelection[String(index)]) {
          next.add(expense.expenseID)
        } else {
          next.delete(expense.expenseID)
        }
      })
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
      await fetchExpenses()
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
      await fetchExpenses()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete expense")
    }
  }

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds)
    try {
      await Promise.all(ids.map((id) => deleteExpense(id)))
      toast.success(`${ids.length} expenses deleted`)
      setSelectedIds(new Set())
      await fetchExpenses()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete selected expenses")
    }
  }

  const handleSortingChange = (columnId: string) => {
    setSorting((prev) => {
      const current = prev[0]

      if (current?.id === columnId) {
        return [
          {
            id: columnId,
            desc: !current.desc,
          },
        ]
      }

      return [
        {
          id: columnId,
          desc: false,
        },
      ]
    })

    setPagination((p) => ({
      ...p,
      pageIndex: 0,
    }))
  }

  const sortableHeader = (label: string, column: Column<Expense>) => (
    <Button
      variant="ghost"
      className="px-0 hover:bg-transparent"
      onClick={() => handleSortingChange(column.id)}
    >
      {label}
      <IconArrowsSort className="ml-2 size-4" />
    </Button>
  )

  const columns: ColumnDef<Expense>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={
            expenses.length > 0 &&
            (expenses.every((e) => selectedIds.has(e.expenseID)) ||
              (expenses.some((e) => selectedIds.has(e.expenseID)) &&
                "indeterminate"))
          }
          onCheckedChange={(value) => {
            setSelectedIds((prev) => {
              const next = new Set(prev)
              expenses.forEach((e) => {
                if (value === true) next.add(e.expenseID)
                else next.delete(e.expenseID)
              })
              return next
            })
          }}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => sortableHeader("Title", column),
    },
    {
      accessorKey: "categoryName",
      header: ({ column }) => sortableHeader("Category", column),
    },
    {
      accessorKey: "status",
      header: ({ column }) => sortableHeader("Status", column),
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge variant="outline" className="gap-1">
            {status === "DONE" ? (
              <IconCircleCheckFilled className="size-4 text-green-500" />
            ) : status === "IN_PROGRESS" ? (
              <IconLoader className="size-4 animate-spin text-blue-500" />
            ) : status === "PENDING" ? (
              <IconClock className="size-4 text-yellow-500" />
            ) : (
              <IconX className="size-4 text-red-500" />
            )}
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => sortableHeader("Amount", column),
      cell: ({ row }) => {
        const amount = Number(row.getValue("amount"))
        return (
          <div>
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
            }).format(amount)}
          </div>
        )
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => sortableHeader("Date", column),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        const expense = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openEditSheet(expense)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500"
                onClick={() => void handleDelete(expense.expenseID)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: expenses,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    pageCount: totalPages,
    manualPagination: true,
    manualSorting: true,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: handleRowSelectionChange,
    onPaginationChange: setPagination,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="w-full space-y-4">
      {/* TOP BAR */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search title... (press Enter)"
          className="max-w-sm"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setSearch(searchInput)
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }
          }}
        />

        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            onClick={() => void handleDeleteSelected()}
          >
            Delete Selected ({selectedIds.size})
          </Button>
        )}

        <Button onClick={openAddSheet}>
          <IconPlus className="mr-2 size-4" />
          Add Expense
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <IconLayoutColumns className="mr-2 size-4" />
              Columns
              <IconChevronDown className="ml-2 size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No expenses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          {totalElements === 0
            ? 0
            : pagination.pageIndex * pagination.pageSize + 1}{" "}
          to{" "}
          {Math.min(
            (pagination.pageIndex + 1) * pagination.pageSize,
            totalElements
          )}{" "}
          of {totalElements} entries
          {selectedIds.size > 0 && (
            <span className="ml-2 font-medium text-foreground">
              · {selectedIds.size} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Rows per page</Label>
            <Select
              value={`${pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm font-medium">
            Page {pagination.pageIndex + 1} of {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPagination((p) => ({ ...p, pageIndex: 0 }))}
              disabled={pagination.pageIndex === 0}
            >
              <IconChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))
              }
              disabled={pagination.pageIndex === 0}
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))
              }
              disabled={pagination.pageIndex + 1 >= totalPages}
            >
              <IconChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setPagination((p) => ({ ...p, pageIndex: totalPages - 1 }))
              }
              disabled={pagination.pageIndex + 1 >= totalPages}
            >
              <IconChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* SHEET */}
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingExpense ? "Edit Expense" : "Add Expense"}
            </SheetTitle>
            <SheetDescription>Fill expense details below.</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
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
                className="w-full rounded-md border border-input bg-background px-3 py-2"
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
                className="w-full rounded-md border border-input bg-background px-3 py-2"
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
    </div>
  )
}
