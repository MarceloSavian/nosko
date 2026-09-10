import { Navigate, Outlet, useLocation } from "react-router"
import { useSession } from "../atoms/session"

// Wraps every non-public route: presentation pages never check the session themselves.
export const RequireAuth = () => {
  const session = useSession()
  const location = useLocation()

  if (session.status === "loading") {
    return null
  }
  if (session.status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}
