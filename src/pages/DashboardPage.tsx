"use client"

import * as React from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
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
import {
  IconReceipt,
  IconTrendingUp,
  IconClock,
  IconCircleCheckFilled,
  IconMinus,
  IconTrendingDown,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { type DashboardResponse, getDashboard } from "@/api/dashboard.ts"

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

function TrendBadge({
  current,
  previous,
}: {
  current: number
  previous: number
}) {
  if (previous === 0) {
    if (current === 0) return null
    return <span className="text-xs text-muted-foreground">New this month</span>
  }

  const pct = ((current - previous) / previous) * 100

  if (Math.abs(pct) < 0.01) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <IconMinus className="size-3" />
        Same as last month
      </span>
    )
  }

  const isIncrease = pct > 0
  const colorClass = isIncrease ? "text-red-500" : "text-green-500"
  const Icon = isIncrease ? IconTrendingUp : IconTrendingDown

  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${colorClass}`}
    >
      <Icon className="size-3" />
      {Math.abs(pct).toFixed(1)}% vs last month
    </span>
  )
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
  const [dashboard, setDashboard] = React.useState<DashboardResponse | null>(
    null
  )
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)

        const data = await getDashboard()

        setDashboard(data)
      } catch (error) {
        console.error(error)

        toast.error("Failed to load dashboard", {
          description:
            "Unable to fetch dashboard data. Please try again later.",
        })
      } finally {
        setLoading(false)
      }
    }

    void fetchDashboard()
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!dashboard) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">
            Failed to load dashboard data.
          </p>
        </CardContent>
      </Card>
    )
  }

  const STATUS_ORDER = ["DONE", "IN_PROGRESS", "PENDING", "CANCELLED"]

  const statusData = [...dashboard.statusSummary]
    .sort(
      (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
    )
    .map((s) => ({
      ...s,
      name: s.status
        .split("_")
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(" "),
    }))

  const pieData = statusData.map((item, index) => ({
    ...item,
    fill: STATUS_COLORS[item.status] ?? CHART_COLORS[index],
  }))

  const categoryData = dashboard.categorySummary.map((item, index) => ({
    ...item,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }))

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
            <div className="text-2xl font-bold">
              {formatINR(dashboard.totalSpent)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {dashboard.totalExpenses} expenses total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <TrendBadge
              current={
                dashboard.monthlyTrend[dashboard.monthlyTrend.length - 1]
                  ?.amount ?? 0
              }
              previous={
                dashboard.monthlyTrend[dashboard.monthlyTrend.length - 2]
                  ?.amount ?? 0
              }
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatINR(dashboard.thisMonthSpent)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {dashboard.thisMonthExpenses} expenses
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
            <div className="text-2xl font-bold">
              {formatINR(dashboard.pendingAmount)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {dashboard.pendingExpenses} expenses
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
            <div className="text-2xl font-bold">
              {formatINR(dashboard.completedAmount)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {dashboard.completedExpenses} expenses
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
              <AreaChart data={dashboard.monthlyTrend}>
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
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
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
                  dataKey="category"
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
                <Bar dataKey="amount" radius={4} />
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
                  data={pieData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                />
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
            {dashboard.recentExpenses.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No expenses yet
              </p>
            ) : (
              <div className="space-y-4">
                {dashboard.recentExpenses.map((e) => (
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
