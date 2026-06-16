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
  IconChevronDown,
  IconDotsVertical,
  IconLoader,
  IconPlus,
  IconFolder,
  IconSortAscending,
  IconSortDescending,
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

import { AVAILABLE_ICONS } from "@/lib/icons"

type SortField = "id" | "name"

interface SortState {
  id: SortField
  desc: boolean
}

const SORT_LABELS: Record<SortField, string> = {
  id: "Date Created",
  name: "Category Name",
}


function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}) {
  const iconConfig =
    AVAILABLE_ICONS.find((i) => i.id === category.iconName) ||
    AVAILABLE_ICONS[AVAILABLE_ICONS.length - 1]
  const IconComponent = iconConfig.icon

  return (
    <Card className="transition-all hover:border-muted-foreground/30 hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${iconConfig.colorClass}`}
        >
          <IconComponent className="size-6" />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-base font-semibold tracking-tight">
              {category.name}
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
                <DropdownMenuItem onClick={() => onEdit(category)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500"
                  onClick={() => onDelete(category)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-muted-foreground">
            {category.expenseCount ?? 0} expense
            {category.expenseCount !== 1 ? "s" : ""} linked
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function CategoriesCardSkeleton({ count = 6 }: { count?: number }) {
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

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalElements, setTotalElements] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)

  const [search, setSearch] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")

  const [sorting, setSorting] = React.useState<SortState>({
    id: "id",
    desc: false,
  })

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 12,
  })

  const [openSheet, setOpenSheet] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(
    null
  )
  const [form, setForm] = React.useState<CategoryForm>({
    name: "",
    iconName: "default",
  })

  const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(null)

  const fetchCategories = React.useCallback(
    async (pageIndex: number, append: boolean) => {
      try {
        if (append) setLoadingMore(true)
        else setLoading(true)

        const sortDirection = sorting.desc ? "DESC" : "ASC"

        const data = await getCategories({
          page: pageIndex,
          size: pagination.pageSize,
          sortField: sorting.id,
          sortDirection,
          search,
        })

        setCategories((prev) =>
          append ? [...prev, ...(data.content ?? [])] : (data.content ?? [])
        )
        setTotalPages(data.totalPages ?? 1)
        setTotalElements(data.totalElements ?? 0)
        setPagination((p) => ({ ...p, pageIndex }))
      } catch (err) {
        console.error(err)
        toast.error(
          append
            ? "Failed to load more categories"
            : "Failed to fetch categories"
        )
      } finally {
        if (append) setLoadingMore(false)
        else setLoading(false)
      }
    },
    [pagination.pageSize, sorting, search]
  )

  React.useEffect(() => {
    void fetchCategories(0, false)
  }, [fetchCategories])

  const handleLoadMore = () => {
    if (!loadingMore && pagination.pageIndex + 1 < totalPages) {
      void fetchCategories(pagination.pageIndex + 1, true)
    }
  }

  const handleSortFieldChange = (value: string) => {
    setSorting((prev) => ({ ...prev, id: value as SortField }))
  }

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
    setEditingCategory(null)
    setForm({ name: "", iconName: "default" })
    setOpenSheet(true)
  }

  const openEditSheet = (category: Category) => {
    setEditingCategory(category)
    setForm({
      name: category.name,
      iconName: category.iconName || "default",
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
      void fetchCategories(0, false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to save category")
    }
  }

  const handleDelete = async (categoryId: number) => {
    try {
      await deleteCategory(categoryId)
      toast.success("Category deleted")
      void fetchCategories(0, false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete category")
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search categories... (press Enter)"
          className="max-w-sm bg-background"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setSearch(searchInput)
            }
          }}
        />
        <Button onClick={openAddSheet}>
          <IconPlus className="mr-2 size-4" />
          Add Category
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Sort by</Label>
          <Select value={sorting.id} onValueChange={handleSortFieldChange}>
            <SelectTrigger className="h-9 w-40 bg-background">
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

      <div className="text-sm text-muted-foreground">
        {loading ? (
          <Skeleton className="h-4 w-40" />
        ) : (
          `Showing ${categories.length} of ${totalElements} categories`
        )}
      </div>

      {loading ? (
        <CategoriesCardSkeleton count={pagination.pageSize} />
      ) : categories.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard
                key={category.categoryId}
                category={category}
                onEdit={openEditSheet}
                onDelete={(c) => setDeleteTarget(c)}
              />
            ))}
          </div>

          {pagination.pageIndex + 1 < totalPages && (
            <div className="flex justify-center pt-4">
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
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          <IconFolder className="size-8" />
          <p>No categories found.</p>
        </div>
      )}

      {/* Styled Sheets for Add/Edit Actions */}
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </SheetTitle>
            <SheetDescription>
              Provide basic details and style your category layout.
            </SheetDescription>
          </SheetHeader>
          <div className="m-3 space-y-6" onKeyDown={handleFormKeyDown}>
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Vacation, Groceries"
              />
            </div>

            <div className="space-y-2">
              <Label>Select Accent Icon</Label>
              <div className="grid grid-cols-5 gap-2">
                {AVAILABLE_ICONS.map((iconDef) => {
                  const Icon = iconDef.icon
                  const isSelected = form.iconName === iconDef.id
                  return (
                    <Button
                      key={iconDef.id}
                      type="button"
                      variant="outline"
                      className={`size-11 rounded-xl border p-0 transition-all ${
                        isSelected
                          ? `${iconDef.colorClass} border-transparent ring-2 ring-primary ring-offset-2`
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setForm({ ...form, iconName: iconDef.id })}
                      title={iconDef.label}
                    >
                      <Icon className="size-5" />
                    </Button>
                  )
                })}
              </div>
            </div>

            <Button
              className="mt-4 w-full"
              onClick={() => void handleSave()}
              disabled={!form.name.trim()}
            >
              {editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Structured Confirmation Dialog */}
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
                <span className="mt-2 block rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                  Warning: This category contains {deleteTarget?.expenseCount}{" "}
                  linked expense{deleteTarget?.expenseCount === 1 ? "" : "s"}.
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
