"use client"

import * as React from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getExpenses, type Expense } from "@/api/expenses"
import {
  IconReceipt,
  IconTrendingUp,
  IconClock,
  IconCircleCheckFilled,
} from "@tabler/icons-react"
import { toast } from "sonner"

const CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
]

const STATUS_COLORS: Record<string, string> = {
  DONE: "#22c55e",
  IN_PROGRESS: "#3b82f6",
  PENDING: "#eab308",
  CANCELLED: "#ef4444",
}

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function getLast6Months() {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (5 - i))
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("default", { month: "short", year: "2-digit" }),
      amount: 0,
    }
  })
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-2 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 Skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-1 h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full rounded-md" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-1 h-4 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full rounded-md" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 Skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="mt-1 h-4 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[220px] w-full rounded-md" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-1 h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const data = await getExpenses({
          page: 0,
          size: 1000,
          sortField: "date",
          sortDirection: "DESC",
        })
        setExpenses(data.content ?? [])
      } catch {
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }
    void fetchAll()
  }, [])

  const now = new Date()
  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0)

  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date)
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    )
  })
  const thisMonthAmount = thisMonthExpenses.reduce((s, e) => s + e.amount, 0)

  const pendingAmount = expenses
    .filter((e) => e.status === "PENDING")
    .reduce((s, e) => s + e.amount, 0)

  const doneAmount = expenses
    .filter((e) => e.status === "DONE")
    .reduce((s, e) => s + e.amount, 0)

  const categoryMap: Record<string, number> = {}
  expenses.forEach((e) => {
    categoryMap[e.categoryName] = (categoryMap[e.categoryName] || 0) + e.amount
  })
  const categoryData = Object.entries(categoryMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)

  const monthlyData = getLast6Months()
  expenses.forEach((e) => {
    const key = e.date.substring(0, 7)
    const month = monthlyData.find((m) => m.key === key)
    if (month) month.amount += e.amount
  })

  const statusData = (["DONE", "IN_PROGRESS", "PENDING", "CANCELLED"] as const)
    .map((s) => ({
      status: s,
      name: s
        .split("_")
        .map((w) => w[0] + w.slice(1).toLowerCase())
        .join(" "),
      count: expenses.filter((e) => e.status === s).length,
      amount: expenses
        .filter((e) => e.status === s)
        .reduce((sum, e) => sum + e.amount, 0),
    }))
    .filter((s) => s.count > 0)

  const recent = expenses.slice(0, 5)

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
            <IconReceipt className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(totalAmount)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {expenses.length} expenses total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <IconTrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatINR(thisMonthAmount)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {thisMonthExpenses.length} expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <IconClock className="size-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(pendingAmount)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {expenses.filter((e) => e.status === "PENDING").length} expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <IconCircleCheckFilled className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(doneAmount)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {expenses.filter((e) => e.status === "DONE").length} expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>Spending over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                  }
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-lg border bg-popover p-3 text-popover-foreground shadow-md">
                        <p className="mb-1 text-sm font-medium">{label}</p>
                        {payload.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-4 text-sm"
                          >
                            <span>{item.name}</span>
                            <span className="font-medium">
                              {formatINR(Number(item.value))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366f1"
                  fill="url(#colorAmount)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Top categories by amount</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                  }
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={90}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.35 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-lg border bg-popover p-3 text-popover-foreground shadow-md">
                        <p className="mb-1 text-sm font-medium">{label}</p>
                        {payload.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-4 text-sm"
                          >
                            <span>{item.name}</span>
                            <span className="font-medium">
                              {formatINR(Number(item.value))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
                <Bar dataKey="amount" radius={4}>
                  {categoryData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By Status</CardTitle>
            <CardDescription>Expense count distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="count"
                  nameKey="name"
                >
                  {statusData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={STATUS_COLORS[entry.status] ?? CHART_COLORS[i]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const item = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-popover p-3 text-popover-foreground shadow-md">
                        <p className="mb-1 text-sm font-medium">{item.name}</p>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span>Expenses</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span>Amount</span>
                          <span className="font-medium">
                            {formatINR(item.amount)}
                          </span>
                        </div>
                      </div>
                    )
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Your last 5 expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No expenses yet
              </p>
            ) : (
              <div className="space-y-4">
                {recent.map((e) => (
                  <div
                    key={e.expenseID}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.categoryName} · {e.date.split("T")[0]}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatINR(e.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
