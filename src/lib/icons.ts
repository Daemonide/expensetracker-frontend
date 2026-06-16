// src/lib/icons.ts
import {
  IconToolsKitchen2,
  IconCar,
  IconBolt,
  IconShoppingBag,
  IconDeviceGamepad2,
  IconHeartbeat,
  IconHome,
  IconPlane,
  IconSchool,
  IconReceipt,
} from "@tabler/icons-react"

export const AVAILABLE_ICONS = [
  {
    id: "food",
    icon: IconToolsKitchen2,
    label: "Food",
    colorClass:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-orange-500/20 border-orange-500/20 active:bg-orange-500/20",
  },
  {
    id: "transport",
    icon: IconCar,
    label: "Transport",
    colorClass:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20 border-blue-500/20 active:bg-blue-500/20",
  },
  {
    id: "utilities",
    icon: IconBolt,
    label: "Utilities",
    colorClass:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20 border-amber-500/20 active:bg-amber-500/20",
  },
  {
    id: "shopping",
    icon: IconShoppingBag,
    label: "Shopping",
    colorClass:
      "bg-pink-500/10 text-pink-600 dark:text-pink-400 ring-pink-500/20 border-pink-500/20 active:bg-pink-500/20",
  },
  {
    id: "entertainment",
    icon: IconDeviceGamepad2,
    label: "Entertainment",
    colorClass:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/20 border-purple-500/20 active:bg-purple-500/20",
  },
  {
    id: "health",
    icon: IconHeartbeat,
    label: "Health",
    colorClass:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20 border-rose-500/20 active:bg-rose-500/20",
  },
  {
    id: "home",
    icon: IconHome,
    label: "Home",
    colorClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20 border-emerald-500/20 active:bg-emerald-500/20",
  },
  {
    id: "travel",
    icon: IconPlane,
    label: "Travel",
    colorClass:
      "bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/20 border-sky-500/20 active:bg-sky-500/20",
  },
  {
    id: "education",
    icon: IconSchool,
    label: "Education",
    colorClass:
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20 border-indigo-500/20 active:bg-indigo-500/20",
  },
  {
    id: "default",
    icon: IconReceipt,
    label: "Other",
    colorClass:
      "bg-slate-500/10 text-slate-600 dark:text-slate-400 ring-slate-500/20 border-slate-500/20 active:bg-slate-500/20",
  },
]
