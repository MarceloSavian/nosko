export const ErrorBanner = ({ message }: { readonly message: string }) => (
  <div
    role="alert"
    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300"
  >
    {message}
  </div>
)
