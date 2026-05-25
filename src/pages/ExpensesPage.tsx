// ExpensesPage.tsx

"use client"

import * as React from "react"

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus } from "lucide-react"

import {
  IconCircleCheckFilled,
  IconClock,
  IconLoader,
  IconX,
} from "@tabler/icons-react"

import { toast } from "sonner"

import {
  type Expense,
  type ExpenseForm,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/api/expenses"

import { type Category, getCategories } from "@/api/categories"

export default function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  const [rowSelection, setRowSelection] = React.useState({})

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

  const fetchExpenses = async () => {
    try {
      setExpenses(await getExpenses())
    } catch (err) {
      console.error(err)
      toast.error("Failed to fetch expenses")
    }
  }

  const fetchCategories = async () => {
    try {
      setCategories(await getCategories())
    } catch (err) {
      console.error(err)
      toast.error("Failed to fetch categories")
    }
  }

  React.useEffect(() => {
    fetchExpenses()
    fetchCategories()
  }, [])

  React.useEffect(() => {
    if (categories.length > 0) {
      setForm((f) => ({
        ...f,
        categoryId:
          f.categoryId === 0 ? categories[0].categoryId : f.categoryId,
      }))
    }
  }, [categories])

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

  const handleDeleteSelected = async () => {
    const selectedIDs = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.expenseID)

    try {
      await Promise.all(selectedIDs.map((id) => deleteExpense(id)))

      toast.success(`${selectedIDs.length} expense(s) deleted`)

      setRowSelection({})

      fetchExpenses()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete selected expenses")
    }
  }

  const handleSave = async () => {
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.expenseID, form)
        toast.success("Expense updated")
      } else {
        await createExpense(form)
        toast.success("Expense added")
      }

      setOpenSheet(false)

      fetchExpenses()
    } catch (err) {
      console.error(err)
      toast.error("Failed to save expense")
    }
  }

  const handleDelete = async (expenseID: number) => {
    try {
      await deleteExpense(expenseID)

      toast.success("Expense deleted")

      fetchExpenses()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete expense")
    }
  }

  const columns: ColumnDef<Expense>[] = [
    {
      id: "select",
      size: 40,
      enableSorting: false,
      enableHiding: false,

      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        </div>
      ),

      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        </div>
      ),
    },

    {
      accessorKey: "title",

      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },

    {
      accessorKey: "categoryName",

      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },

    {
      accessorKey: "status",

      header: "Status",

      cell: ({ row }) => {
        const status = row.original.status

        return (
          <Badge
            variant="outline"
            className="gap-1 px-2 py-1 text-muted-foreground"
          >
            {status === "DONE" ? (
              <IconCircleCheckFilled className="size-4 fill-green-500 text-green-500" />
            ) : status === "IN_PROGRESS" ? (
              <IconLoader className="size-4 animate-spin text-blue-500" />
            ) : status === "PENDING" ? (
              <IconClock className="size-4 text-yellow-500" />
            ) : (
              <IconX className="size-4 text-red-500" />
            )}

            {status === "DONE"
              ? "Done"
              : status === "IN_PROGRESS"
                ? "In Progress"
                : status === "PENDING"
                  ? "Pending"
                  : "Cancelled"}
          </Badge>
        )
      },
    },

    {
      accessorKey: "amount",

      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),

      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"))

        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount)

        return <div className="font-medium">{formatted}</div>
      },
    },

    {
      accessorKey: "date",

      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },

    {
      id: "actions",
      size: 60,
      enableSorting: false,
      enableHiding: false,

      cell: ({ row }) => {
        const expense = row.original

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>

                  <DropdownMenuItem onClick={() => openEditSheet(expense)}>
                    Edit Expense
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="text-red-500"
                    onClick={() => handleDelete(expense.expenseID)}
                  >
                    Delete Expense
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: expenses,
    columns,

    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,

    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),

    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 py-4">
        <Input
          placeholder="Filter titles..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("title")?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />

        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <Button variant="destructive" onClick={handleDeleteSelected}>
            Delete Selected ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
        )}

        <Button onClick={openAddSheet}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuGroup>
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(value) =>
                      col.toggleVisibility(Boolean(value))
                    }
                  >
                    {col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {!header.isPlaceholder &&
                      flexRender(
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

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>

        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingExpense ? "Edit Expense" : "Add Expense"}
            </SheetTitle>

            <SheetDescription>
              Fill in the expense details below.
            </SheetDescription>
          </SheetHeader>

          <div className="m-3 space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>

              <Input
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>

              <Input
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Date</Label>

              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    date: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>

              <select
                value={String(form.categoryId)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    categoryId: Number(e.target.value),
                  })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {categories.map((category) => (
                  <option
                    key={category.categoryId}
                    value={String(category.categoryId)}
                  >
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
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <Button className="w-full" onClick={handleSave}>
              {editingExpense ? "Update Expense" : "Add Expense"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
