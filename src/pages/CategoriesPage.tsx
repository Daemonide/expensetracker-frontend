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
    {
      id: "categoryId",
      desc: false,
    },
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

  const [form, setForm] = React.useState<CategoryForm>({
    name: "",
  })

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

              <DropdownMenuItem
                onClick={() => {
                  setEditingCategory(category)
                  setForm({
                    name: category.name,
                  })
                  setOpenSheet(true)
                }}
              >
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-red-500"
                onClick={() => void deleteCategory(category.categoryId)}
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
      pagination,
      columnVisibility,
      rowSelection,
    },
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
      <Input
        placeholder="Search..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setSearch(searchInput)

            setPagination((p) => ({
              ...p,
              pageIndex: 0,
            }))
          }
        }}
      />

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
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={pagination.pageIndex === 0}
            onClick={() =>
              setPagination((p) => ({
                ...p,
                pageIndex: 0,
              }))
            }
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

          <div className="text-sm font-medium">
            Page {pagination.pageIndex + 1} of {totalPages}
          </div>

          <Button
            variant="outline"
            size="icon"
            disabled={pagination.pageIndex + 1 >= totalPages}
            onClick={() =>
              setPagination((p) => ({
                ...p,
                pageIndex: p.pageIndex + 1,
              }))
            }
          >
            <IconChevronRight className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            disabled={pagination.pageIndex + 1 >= totalPages}
            onClick={() =>
              setPagination((p) => ({
                ...p,
                pageIndex: totalPages - 1,
              }))
            }
          >
            <IconChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
