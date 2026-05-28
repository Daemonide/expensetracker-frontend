"use client"

import * as React from "react"

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  type Column,
} from "@tanstack/react-table"

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

import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconPlus,
  IconArrowsSort,
} from "@tabler/icons-react"

import { toast } from "sonner"

import {
  type Category,
  type CategoryForm,
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/api/categories"

const SORT_FIELD_MAP: Record<string, string> = {
  categoryId: "id",
  name: "name",
}

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalElements, setTotalElements] = React.useState(0)

  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "categoryId", desc: false },
  ])

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [rowSelection, setRowSelection] = React.useState({})

  const [openSheet, setOpenSheet] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(
    null
  )
  const [form, setForm] = React.useState<CategoryForm>({ name: "" })

  // Confirmation dialog
  const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(null)

  const fetchCategories = React.useCallback(async () => {
    try {
      const sort = sorting[0]
      const sortField = SORT_FIELD_MAP[sort?.id ?? "categoryId"] ?? "id"
      const sortDirection = sort?.desc ? "DESC" : "ASC"

      const data = await getCategories({
        page: pagination.pageIndex,
        size: pagination.pageSize,
        sortField,
        sortDirection,
        search,
      })

      setCategories(data.content ?? [])
      setTotalPages(data.totalPages ?? 1)
      setTotalElements(data.totalElements ?? 0)
    } catch (err) {
      console.error(err)
      toast.error("Failed to fetch categories")
    }
  }, [pagination.pageIndex, pagination.pageSize, sorting, search])

  React.useEffect(() => {
    void fetchCategories()
  }, [fetchCategories])

  const handleSortingChange = (columnId: string) => {
    setSorting((prev) => {
      const current = prev[0]
      if (current?.id === columnId)
        return [{ id: columnId, desc: !current.desc }]
      return [{ id: columnId, desc: false }]
    })
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  const sortableHeader = (label: string, column: Column<Category>) => (
    <Button
      variant="ghost"
      className="px-0 hover:bg-transparent"
      onClick={() => handleSortingChange(column.id)}
    >
      {label}
      <IconArrowsSort className="ml-2 size-4" />
    </Button>
  )

  const openAddSheet = () => {
    setEditingCategory(null)
    setForm({ name: "" })
    setOpenSheet(true)
  }

  const openEditSheet = (category: Category) => {
    setEditingCategory(category)
    setForm({ name: category.name })
    setOpenSheet(true)
  }

  const handleSave = async () => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.categoryId, form)
        toast.success("Category updated")
      } else {
        await createCategory(form)
        toast.success("Category created")
      }
      setOpenSheet(false)
      await fetchCategories()
    } catch (err) {
      console.error(err)
      toast.error("Failed to save category")
    }
  }

  const handleDelete = async (categoryId: number) => {
    try {
      await deleteCategory(categoryId)
      toast.success("Category deleted")
      await fetchCategories()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete category")
    } finally {
      setDeleteTarget(null)
    }
  }

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "categoryId",
      header: ({ column }) => sortableHeader("ID", column),
    },
    {
      accessorKey: "name",
      header: ({ column }) => sortableHeader("Category Name", column),
    },
    {
      accessorKey: "expenseCount",
      header: "Expenses",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.expenseCount ?? 0}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const category = row.original
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
              <DropdownMenuItem onClick={() => openEditSheet(category)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500"
                onClick={() => setDeleteTarget(category)}
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
    data: categories,
    columns,
    state: { sorting, pagination, columnVisibility, rowSelection },
    manualSorting: true,
    manualPagination: true,
    pageCount: totalPages,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      {/* TOP BAR */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search... (press Enter)"
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
        <Button onClick={openAddSheet}>
          <IconPlus className="mr-2 size-4" />
          Add Category
        </Button>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
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
                <TableRow key={row.id}>
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
                  No categories found.
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
              disabled={pagination.pageIndex === 0}
              onClick={() => setPagination((p) => ({ ...p, pageIndex: 0 }))}
            >
              <IconChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.pageIndex === 0}
              onClick={() =>
                setPagination((p) => ({
                  ...p,
                  pageIndex: Math.max(0, p.pageIndex - 1),
                }))
              }
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.pageIndex + 1 >= totalPages}
              onClick={() =>
                setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))
              }
            >
              <IconChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.pageIndex + 1 >= totalPages}
              onClick={() =>
                setPagination((p) => ({ ...p, pageIndex: totalPages - 1 }))
              }
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
              {editingCategory ? "Edit Category" : "Add Category"}
            </SheetTitle>
            <SheetDescription>Fill category details below.</SheetDescription>
          </SheetHeader>
          <div className="m-3 space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ name: e.target.value })}
                placeholder="e.g. FOOD"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && form.name.trim()) {
                    void handleSave()
                  }
                }}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => void handleSave()}
              disabled={!form.name.trim()}
            >
              {editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* DELETE CONFIRMATION */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                "{deleteTarget?.name}"
              </span>
              .
              {(deleteTarget?.expenseCount ?? 0) > 0 && (
                <span className="mt-1 block text-destructive">
                  Warning: this category has {deleteTarget?.expenseCount}{" "}
                  expense
                  {deleteTarget?.expenseCount === 1 ? "" : "s"} linked to it.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={() =>
                deleteTarget && void handleDelete(deleteTarget.categoryId)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
