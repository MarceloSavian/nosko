import { type InputHTMLAttributes, useId } from "react"

export const Input = ({
  label,
  error,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  readonly label: string
  readonly error?: string | null
}) => {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        id={id}
        className={`rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 ${className}`}
        aria-invalid={error !== null && error !== undefined ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error ? (
        <span id={`${id}-error`} className="text-sm text-rose-600 dark:text-rose-400">
          {error}
        </span>
      ) : null}
    </div>
  )
}
