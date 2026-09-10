import { Navigate, Outlet } from "react-router"
import { useSession } from "../atoms/session"

// Wraps the public auth pages (landing, login, signup, ...): an already-authenticated visitor is
// sent into the app instead of seeing the login form again.
export const RequireGuest = () => {
  const session = useSession()

  if (session.status === "loading") {
    return null
  }
  if (session.status === "authenticated") {
    return <Navigate to="/household" replace />
  }
  return <Outlet />
}
