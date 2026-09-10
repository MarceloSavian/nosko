import type { ButtonHTMLAttributes } from "react"

type Variant = "primary" | "secondary"
type Accent = "casa" | "pessoal"

const variantClasses = (variant: Variant, accent: Accent) => {
  if (variant === "secondary") {
    return "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
  }
  return accent === "pessoal"
    ? "bg-indigo-600 text-white hover:bg-indigo-700"
    : "bg-emerald-600 text-white hover:bg-emerald-700"
}

export const Button = ({
  variant = "primary",
  accent = "casa",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: Variant
  readonly accent?: Accent
  readonly loading?: boolean
}) => (
  <button
    type="button"
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-md transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses(variant, accent)} ${className}`}
    {...props}
  >
    {loading ? "…" : children}
  </button>
)
