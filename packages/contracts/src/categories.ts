import * as Rpc from "@effect/rpc/Rpc"
import * as RpcGroup from "@effect/rpc/RpcGroup"
import { Schema } from "effect"
import { AuthMiddleware } from "./authMiddleware.ts"
import { NoHousehold } from "./errors/householdErrors.ts"

export const CategoryScope = Schema.Literal("household", "personal")
export type CategoryScope = typeof CategoryScope.Type

export const CategoryView = Schema.Struct({
  id: Schema.UUID,
  scope: CategoryScope,
  ownerUserId: Schema.NullOr(Schema.UUID),
  name: Schema.String,
  color: Schema.NullOr(Schema.String),
  sortOrder: Schema.Int,
})
export type CategoryView = typeof CategoryView.Type

export const CategoriesRpcs = RpcGroup.make(
  Rpc.make("categories.list", {
    success: Schema.Array(CategoryView),
    error: NoHousehold,
  }).middleware(AuthMiddleware),
)
