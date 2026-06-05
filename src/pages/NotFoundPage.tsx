import { Link } from "react-router-dom"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>

      <Link to="/dashboard" className="rounded-md border px-4 py-2">
        Go to Dashboard
      </Link>
    </div>
  )
}
