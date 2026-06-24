import * as React from "react"
import { motion, type Variants } from "framer-motion"
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
  ReferenceLine,
  Rectangle,
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
  IconChartBar,
  IconChartLine,
  IconChartArea,
  IconChartDonut,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { type DashboardResponse, getDashboard } from "@/api/dashboard.ts"
import {
  getFinancialAccounts,
  type FinancialAccount,
} from "@/api/financial-accounts.ts"

// ── Constants ─────────────────────────────────────────────────────────────────

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

const STATUS_META: Record<string, { color: string; label: string }> = {
  DONE: { color: "#16a34a", label: "Done" },
  IN_PROGRESS: { color: "#2563eb", label: "In Progress" },
  PENDING: { color: "#d97706", label: "Pending" },
  CANCELLED: { color: "#dc2626", label: "Cancelled" },
}

const STATUS_ORDER = ["DONE", "IN_PROGRESS", "PENDING", "CANCELLED"]

// ── Chart types ───────────────────────────────────────────────────────────────

type TrendChartType = "area" | "bar"
type AccountLineType = "straight" | "smooth"
type CategoryChartType = "bar" | "pie"

// ── Animation variants ────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatShortINR(v: number) {
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(1)}L`
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(0)}k`
  return `₹${v}`
}

function formatDate(iso: string) {
  return new Date(iso.split("T")[0]).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })
}

// ── Animated counter ──────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = React.useState(0)
  React.useEffect(() => {
    if (!target) {
      const t = setTimeout(() => setValue(0), 0)
      return () => clearTimeout(t)
    }
    let frame = 0
    const steps = Math.ceil(duration / 16)
    const timer = setInterval(() => {
      frame++
      const eased = 1 - Math.pow(1 - frame / steps, 4)
      setValue(Math.round(eased * target))
      if (frame >= steps) {
        setValue(target)
        clearInterval(timer)
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return value
}

// ── Shared tooltip ────────────────────────────────────────────────────────────

interface TooltipEntry {
  name?: string
  value?: number | string
  color?: string
  payload?: any
}

function SharedTooltip({
  active,
  payload,
  label,
  valueFormatter = formatINR,
}: {
  active?: boolean
  payload?: ReadonlyArray<TooltipEntry>
  label?: string
  valueFormatter?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border bg-popover px-3.5 py-2.5 text-popover-foreground shadow-xl">
      {label && (
        <p className="mb-1.5 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          {label}
        </p>
      )}
      {payload.map((item, i) => {
        const count = item.payload?.count
        return (
          <div
            key={i}
            className="flex items-center justify-between gap-8 text-sm"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground capitalize">
              {item.color && (
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ background: item.color }}
                />
              )}
              {item.name}
            </span>
            <span className="flex items-center gap-1.5 font-semibold tabular-nums">
              {valueFormatter(Number(item.value))}
              {typeof count === "number" && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({count})
                </span>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Trend badge ───────────────────────────────────────────────────────────────

function TrendBadge({
  current,
  previous,
}: {
  current: number
  previous: number
}) {
  if (previous === 0) {
    return current === 0 ? null : (
      <span className="text-xs text-muted-foreground">New this month</span>
    )
  }
  const pct = ((current - previous) / previous) * 100
  if (Math.abs(pct) < 0.01) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <IconMinus className="size-3" /> No change
      </span>
    )
  }
  const isUp = pct > 0
  const Icon = isUp ? IconTrendingUp : IconTrendingDown
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? "text-red-500" : "text-green-500"}`}
    >
      <Icon className="size-3" />
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

// ── Chart type toggle ─────────────────────────────────────────────────────────

function ChartTypeToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: Array<{ value: T; icon: React.ElementType; label: string }>
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
      {options.map(({ value: v, icon: Icon, label }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          title={label}
          className={`flex items-center justify-center rounded-md p-1.5 transition-colors ${
            value === v
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  )
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({
  title,
  amount,
  countLabel,
  icon: Icon,
  accentClass,
  iconBgClass,
  trend,
}: {
  title: string
  amount: number
  countLabel: string
  icon: React.ElementType
  accentClass: string
  iconBgClass: string
  trend?: React.ReactNode
}) {
  const animated = useCountUp(amount)
  return (
    <motion.div variants={fadeUp}>
      <Card className="relative flex h-full flex-col justify-between overflow-hidden">
        <div className={`absolute inset-x-0 top-0 h-[3px] ${accentClass}`} />
        <CardHeader className="flex flex-row items-start justify-between pt-5 pb-2">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            {title}
          </p>
          <div className={`rounded-lg p-2 ${iconBgClass}`}>
            <Icon className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-5">
          <div className="text-2xl font-bold tracking-tight tabular-nums">
            {formatINR(animated)}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{countLabel}</p>
            {trend}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Status legend ─────────────────────────────────────────────────────────────

function StatusLegend({
  data,
}: {
  data: Array<{
    status: string
    name: string
    count: number
    amount: number
    fill: string
  }>
}) {
  return (
    <div className="mt-4 space-y-2.5">
      {data.map((item) => (
        <div key={item.status} className="flex items-center gap-2 text-sm">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: item.fill }}
          />
          <span className="flex-1 text-muted-foreground">{item.name}</span>
          <span className="font-medium tabular-nums">{item.count}</span>
          <span className="w-16 text-right text-xs text-muted-foreground tabular-nums">
            {formatShortINR(item.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Theme-aware grid color ────────────────────────────────────────────────────

function useGridColor() {
  const [isDark, setIsDark] = React.useState(() =>
    document.documentElement.classList.contains("dark")
  )
  React.useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark"))
    )
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])
  return isDark ? "#475569" : "#cbd5e1"
}

// ── Legend swatches ───────────────────────────────────────────────────────────

function LineSwatch({
  color,
  dashed = false,
}: {
  color: string
  dashed?: boolean
}) {
  return (
    <span
      className="inline-block h-0 w-5 shrink-0"
      style={{
        borderTopWidth: 2,
        borderTopStyle: dashed ? "dashed" : "solid",
        borderTopColor: color,
      }}
      aria-hidden
    />
  )
}

function DotSwatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block size-2.5 shrink-0 rounded-sm"
      style={{ background: color }}
      aria-hidden
    />
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-40" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="min-h-[140px] overflow-hidden">
            <div className="h-[3px] animate-pulse bg-muted" />
            <CardHeader className="flex flex-row items-start justify-between pt-5 pb-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="size-8 rounded-lg" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="mt-2 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Monthly trend chart ───────────────────────────────────────────────────────

function MonthlyTrendChart({
  data,
  chartType,
  avgMonthly,
  gridColor,
}: {
  data: Array<{ month: string; amount: number }>
  chartType: TrendChartType
  avgMonthly: number
  gridColor: string
}) {
  const commonProps = { data, margin: { top: 8, right: 0, bottom: 0, left: 0 } }

  const sharedChildren = (
    <>
      <CartesianGrid
        strokeDasharray="4 4"
        stroke={gridColor}
        strokeOpacity={0.6}
        horizontal={false}
        vertical
      />
      <XAxis
        dataKey="month"
        tick={{ fontSize: 12 }}
        axisLine={false}
        tickLine={false}
        dy={8}
      />
      <YAxis
        tick={{ fontSize: 12 }}
        axisLine={false}
        tickLine={false}
        tickFormatter={formatShortINR}
        width={50}
      />
      {avgMonthly > 0 && (
        <ReferenceLine
          y={avgMonthly}
          stroke="#22c55e"
          strokeDasharray="5 4"
          strokeWidth={2}
        />
      )}
      <Tooltip
        content={(props) => (
          <SharedTooltip
            active={props.active}
            payload={props.payload as ReadonlyArray<TooltipEntry>}
            label={props.label as string}
          />
        )}
      />
    </>
  )

  if (chartType === "bar") {
    return (
      <BarChart {...commonProps}>
        {sharedChildren}
        <Bar
          dataKey="amount"
          name="Spent"
          fill="#6366f1"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    )
  }

  return (
    <AreaChart {...commonProps}>
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
        </linearGradient>
      </defs>
      {sharedChildren}
      <Area
        type="monotone"
        dataKey="amount"
        name="Spent"
        stroke="#6366f1"
        strokeWidth={2.5}
        fill="url(#trendGrad)"
        dot={{ r: 3.5, fill: "#6366f1", strokeWidth: 0 }}
        activeDot={{ r: 5, fill: "#6366f1", stroke: "white", strokeWidth: 2 }}
      />
    </AreaChart>
  )
}

// ── Account stacked chart ─────────────────────────────────────────────────────

interface AccountTrendPoint {
  month: string
  [accountName: string]: string | number
}

function buildAccountTrendData(
  accountTrend: DashboardResponse["accountMonthlyTrend"],
  months: string[],
  accounts: FinancialAccount[]
): AccountTrendPoint[] {
  const lookup = new Map<string, number>()
  for (const row of accountTrend) {
    lookup.set(`${row.month}|${row.accountId}`, row.amount)
  }

  return months.map((month) => {
    const point: AccountTrendPoint = { month }
    for (const acc of accounts) {
      point[acc.name] = lookup.get(`${month}|${acc.id}`) ?? 0
    }
    return point
  })
}

function AccountStackedChart({
  data,
  accounts,
  gridColor,
  lineType,
}: {
  data: AccountTrendPoint[]
  accounts: FinancialAccount[]
  gridColor: string
  lineType: AccountLineType
}) {
  if (!data.length || !accounts.length) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        No account data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <defs>
          {accounts.map((acc, i) => (
            <linearGradient
              key={acc.id}
              id={`accGrad${acc.id}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={CHART_COLORS[i % CHART_COLORS.length]}
                stopOpacity={0.35}
              />
              <stop
                offset="100%"
                stopColor={CHART_COLORS[i % CHART_COLORS.length]}
                stopOpacity={0.05}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray="4 4"
          stroke={gridColor}
          strokeOpacity={0.6}
          horizontal={false}
          vertical
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatShortINR}
          width={50}
        />
        <Tooltip
          content={(props) => (
            <SharedTooltip
              active={props.active}
              payload={props.payload as ReadonlyArray<TooltipEntry>}
              label={props.label as string}
            />
          )}
        />
        {accounts.map((acc, i) => (
          <Area
            key={acc.id}
            type={lineType === "smooth" ? "monotone" : "linear"}
            dataKey={acc.name}
            name={acc.name}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            fill={`url(#accGrad${acc.id})`}
            stackId="accounts"
            dot={false}
            activeDot={{
              r: 4,
              fill: CHART_COLORS[i % CHART_COLORS.length],
              stroke: "white",
              strokeWidth: 2,
            }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Category chart ────────────────────────────────────────────────────────────

function CategoryChart({
  data,
  chartType,
  gridColor,
}: {
  data: Array<{
    category: string
    amount: number
    fill: string
    count?: number
  }>
  chartType: CategoryChartType
  gridColor: string
}) {
  if (chartType === "pie") {
    return (
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              strokeWidth={0}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const item = payload[0].payload as (typeof data)[number]
                return (
                  <div className="rounded-xl border bg-popover px-3.5 py-2.5 text-popover-foreground shadow-xl">
                    <p className="mb-1.5 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                      {item.category}
                    </p>
                    <div className="flex justify-between gap-6 text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="flex items-center gap-1.5 font-semibold tabular-nums">
                        {formatINR(item.amount)}
                        {typeof item.count === "number" && (
                          <span className="text-xs font-normal text-muted-foreground">
                            ({item.count})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          barCategoryGap="28%"
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            stroke={gridColor}
            strokeOpacity={0.6}
            horizontal={false}
            vertical
          />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatShortINR}
          />
          <YAxis
            type="category"
            dataKey="category"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const item = payload[0].payload
              return (
                <div className="rounded-xl border bg-popover px-3.5 py-2.5 text-popover-foreground shadow-xl">
                  <p className="mb-1.5 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                    {label}
                  </p>
                  <div className="flex justify-between gap-6 text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="flex items-center gap-1.5 font-semibold tabular-nums">
                      {formatINR(Number(payload[0].value))}
                      {typeof item?.count === "number" && (
                        <span className="text-xs font-normal text-muted-foreground">
                          ({item.count})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )
            }}
          />
          <Bar
            dataKey="amount"
            shape={(props) => (
              <Rectangle
                {...props}
                fill={props.payload.fill}
                radius={[0, 5, 5, 0]}
              />
            )}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const gridColor = useGridColor()

  const [dashboard, setDashboard] = React.useState<DashboardResponse | null>(
    null
  )
  const [accounts, setAccounts] = React.useState<FinancialAccount[]>([])
  const [loading, setLoading] = React.useState(true)

  const [trendChartType, setTrendChartType] =
    React.useState<TrendChartType>("area")
  const [accountLineType, setAccountLineType] = React.useState<AccountLineType>(
    () => {
      const saved = localStorage.getItem("accountLineType")

      return saved === "smooth" || saved === "straight"
        ? (saved as AccountLineType)
        : "straight"
    }
  )

  React.useEffect(() => {
    localStorage.setItem("accountLineType", accountLineType)
  }, [accountLineType])
  const [categoryChartType, setCategoryChartType] =
    React.useState<CategoryChartType>("bar")

  React.useEffect(() => {
    void (async () => {
      try {
        setLoading(true)
        const [dash, accs] = await Promise.all([
          getDashboard(),
          getFinancialAccounts(),
        ])
        setDashboard(dash)
        setAccounts(accs)
      } catch (err) {
        console.error(err)
        toast.error("Failed to load dashboard", {
          description: "Unable to fetch dashboard data. Please try again.",
        })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <DashboardSkeleton />

  if (!dashboard) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              Failed to load dashboard data.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
      fill:
        STATUS_META[s.status]?.color ??
        CHART_COLORS[STATUS_ORDER.indexOf(s.status)],
    }))

  const categoryData = dashboard.categorySummary.map((item, i) => ({
    ...item,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const avgMonthly =
    dashboard.monthlyTrend.length > 0
      ? dashboard.monthlyTrend.reduce((s, m) => s + m.amount, 0) /
        dashboard.monthlyTrend.length
      : 0

  const lastMonthAmount = dashboard.monthlyTrend.at(-2)?.amount ?? 0
  const thisMonthAmount = dashboard.monthlyTrend.at(-1)?.amount ?? 0

  const monthLabels = dashboard.monthlyTrend.map((m) => m.month)
  const accountIdsInTrend = new Set(
    dashboard.accountMonthlyTrend.map((r) => r.accountId)
  )
  const activeAccounts = accounts.filter((a) => accountIdsInTrend.has(a.id))

  const accountTrendData = buildAccountTrendData(
    dashboard.accountMonthlyTrend,
    monthLabels,
    activeAccounts
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      {/* ── Summary cards ── */}
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <SummaryCard
          title="Total Spent"
          amount={dashboard.totalSpent}
          countLabel={`${dashboard.totalExpenses} expenses`}
          icon={IconReceipt}
          accentClass="bg-indigo-500"
          iconBgClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
        />
        <SummaryCard
          title="This Month"
          amount={dashboard.thisMonthSpent}
          countLabel={`${dashboard.thisMonthExpenses} expenses`}
          icon={IconTrendingUp}
          accentClass="bg-violet-500"
          iconBgClass="bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
          trend={
            <TrendBadge current={thisMonthAmount} previous={lastMonthAmount} />
          }
        />
        <SummaryCard
          title="Pending"
          amount={dashboard.pendingAmount}
          countLabel={`${dashboard.pendingExpenses} awaiting`}
          icon={IconClock}
          accentClass="bg-amber-400"
          iconBgClass="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
        />
        <SummaryCard
          title="Completed"
          amount={dashboard.completedAmount}
          countLabel={`${dashboard.completedExpenses} paid out`}
          icon={IconCircleCheckFilled}
          accentClass="bg-emerald-500"
          iconBgClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
        />
      </motion.div>

      {/* ── Monthly trend + Status donut ── */}
      <motion.div
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="min-w-0 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-col items-start gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Monthly Trend</CardTitle>
              <CardDescription>Spending over the last 6 months</CardDescription>
            </div>
            <ChartTypeToggle
              value={trendChartType}
              onChange={setTrendChartType}
              options={[
                { value: "area", icon: IconChartArea, label: "Area chart" },
                { value: "bar", icon: IconChartBar, label: "Bar chart" },
              ]}
            />
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <MonthlyTrendChart
                  data={dashboard.monthlyTrend}
                  chartType={trendChartType}
                  avgMonthly={avgMonthly}
                  gridColor={gridColor}
                />
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-center gap-5">
              <div className="flex items-center gap-1.5">
                <LineSwatch color="#6366f1" />
                <span className="text-xs text-muted-foreground">Spent</span>
              </div>
              {avgMonthly > 0 && (
                <div className="flex items-center gap-1.5">
                  <LineSwatch color="#22c55e" dashed />
                  <span className="text-xs text-muted-foreground">
                    Monthly Avg ({formatShortINR(Math.round(avgMonthly))})
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 shadow-sm">
          <CardHeader>
            <CardTitle>By Status</CardTitle>
            <CardDescription>Expense count distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={80}
                    paddingAngle={2}
                    strokeWidth={0}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const item = payload[0]
                        .payload as (typeof statusData)[number]
                      return (
                        <div className="rounded-xl border bg-popover px-3.5 py-2.5 text-popover-foreground shadow-xl">
                          <p className="mb-1.5 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                            {item.name}
                          </p>
                          <div className="flex justify-between gap-6 text-sm">
                            <span className="text-muted-foreground">
                              Expenses
                            </span>
                            <span className="font-semibold">{item.count}</span>
                          </div>
                          <div className="flex justify-between gap-6 text-sm">
                            <span className="text-muted-foreground">
                              Amount
                            </span>
                            <span className="font-semibold tabular-nums">
                              {formatINR(item.amount)}
                            </span>
                          </div>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <StatusLegend data={statusData} />
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Spending by Account ── */}
      {activeAccounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="min-w-0 shadow-sm">
            <CardHeader className="flex flex-col items-start gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Spending by Account</CardTitle>
                <CardDescription>
                  Stacked monthly breakdown across your financial accounts
                </CardDescription>
              </div>
              <ChartTypeToggle
                value={accountLineType}
                onChange={setAccountLineType}
                options={[
                  {
                    value: "straight",
                    icon: IconChartLine,
                    label: "Straight lines",
                  },
                  {
                    value: "smooth",
                    icon: IconChartArea,
                    label: "Curved lines",
                  },
                ]}
              />
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
                <AccountStackedChart
                  data={accountTrendData}
                  accounts={activeAccounts}
                  gridColor={gridColor}
                  lineType={accountLineType}
                />
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1.5">
                {activeAccounts.map((acc, i) => (
                  <div key={acc.id} className="flex items-center gap-1.5">
                    <LineSwatch color={CHART_COLORS[i % CHART_COLORS.length]} />
                    <span className="text-xs text-muted-foreground">
                      {acc.name}
                      <span className="ml-1 opacity-50">
                        ({acc.type.charAt(0) + acc.type.slice(1).toLowerCase()})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Recent expenses + Category chart ── */}
      <motion.div
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="min-w-0 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>
              Your last {Math.min(dashboard.recentExpenses.length, 5)} expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.recentExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <IconReceipt className="mb-2 size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No expenses yet</p>
              </div>
            ) : (
              <div className="-mx-2 space-y-0.5">
                {dashboard.recentExpenses.map((e, i) => {
                  const color = CHART_COLORS[i % CHART_COLORS.length]
                  return (
                    <div
                      key={e.expenseID}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
                    >
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                        style={{ background: `${color}18`, color }}
                      >
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {e.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {e.categoryName} · {formatDate(e.date)}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatINR(e.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 shadow-sm">
          <CardHeader className="flex flex-col items-start gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Top categories by total amount</CardDescription>
            </div>
            <ChartTypeToggle
              value={categoryChartType}
              onChange={setCategoryChartType}
              options={[
                { value: "bar", icon: IconChartBar, label: "Bar chart" },
                { value: "pie", icon: IconChartDonut, label: "Donut chart" },
              ]}
            />
          </CardHeader>
          <CardContent>
            <CategoryChart
              data={categoryData}
              chartType={categoryChartType}
              gridColor={gridColor}
            />
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
              {categoryData.map((item) => (
                <div key={item.category} className="flex items-center gap-1.5">
                  <DotSwatch color={item.fill} />
                  <span className="text-xs text-muted-foreground">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
