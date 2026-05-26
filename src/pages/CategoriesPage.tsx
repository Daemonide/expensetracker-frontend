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
  type PaginationState,
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
  IconDotsVertical,
  IconLayoutColumns,
  IconPlus,
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

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([])

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  const [rowSelection, setRowSelection] = React.useState({})

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const [openSheet, setOpenSheet] = React.useState(false)

  const [editingCategory, setEditingCategory] = React.useState<Category | null>(
    null
  )

  const [form, setForm] = React.useState<CategoryForm>({
    name: "",
  })

  const fetchCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      console.error(err)
      toast.error("Failed to fetch categories")
    }
  }

  React.useEffect(() => {
    fetchCategories()
  }, [])

  const openAddSheet = () => {
    setEditingCategory(null)

    setForm({
      name: "",
    })

    setOpenSheet(true)
  }

  const openEditSheet = (category: Category) => {
    setEditingCategory(category)

    setForm({
      name: category.name,
    })

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

      fetchCategories()
    } catch (err) {
      console.error(err)
      toast.error("Failed to save category")
    }
  }

  const handleDelete = async (categoryId: number) => {
    try {
      await deleteCategory(categoryId)

      toast.success("Category deleted")

      fetchCategories()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete category")
    }
  }

  const handleDeleteSelected = async () => {
    const selectedIDs = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.categoryId)

    try {
      await Promise.all(selectedIDs.map((id) => deleteCategory(id)))

      toast.success(`${selectedIDs.length} categories deleted`)

      setRowSelection({})

      fetchCategories()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete selected categories")
    }
  }

  const columns: ColumnDef<Category>[] = [
    {
      id: "select",

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

      enableSorting: false,
      enableHiding: false,
    },

    {
      accessorKey: "categoryId",

      header: "ID",
    },

    {
      accessorKey: "name",

      header: "Category Name",
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
                onClick={() => handleDelete(category.categoryId)}
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

    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },

    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,

    enableRowSelection: true,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search categories..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("name")?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />

        <div className="flex items-center gap-2">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected}>
              Delete Selected
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <IconLayoutColumns className="mr-2 size-4" />
                Columns
                <IconChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={openAddSheet}>
            <IconPlus className="mr-2 size-4" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 bg-muted">
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
                  No categories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Label>Rows per page</Label>

            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>

              <SelectContent side="top">
                {[5, 10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronsLeft className="size-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft className="size-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronRight className="size-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </SheetTitle>

            <SheetDescription>Fill category details below.</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>

              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <Button className="w-full" onClick={handleSave}>
              {editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
