import type { AuthUserView } from "@nosko/contracts"

// The one genuinely web-only domain concept: everything else (users, households, accounts, ...)
// is already shared with the backend via @nosko/contracts, so re-declaring it here would just be
// duplication, not a real abstraction boundary.
export type Session =
  | { readonly status: "loading" }
  | { readonly status: "authenticated"; readonly user: AuthUserView }
  | { readonly status: "unauthenticated" }
