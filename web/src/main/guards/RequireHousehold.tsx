import { Navigate, Outlet } from "react-router"
import { useHousehold } from "../atoms/household"

// Wraps the Casa (shared) space: an authenticated user with no household yet is sent to finish
// onboarding instead of hitting NoHousehold errors on every shared-space RPC call.
export const RequireHousehold = () => {
  const household = useHousehold()

  if (household.status === "loading") {
    return null
  }
  if (household.status === "none") {
    return <Navigate to="/onboarding/household" replace />
  }
  return <Outlet />
}
