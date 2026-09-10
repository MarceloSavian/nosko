import { Schema } from "effect"

export const CategoryCap = Schema.Struct({
  id: Schema.UUID,
  householdId: Schema.UUID,
  cycleId: Schema.UUID,
  categoryId: Schema.UUID,
  capMinor: Schema.Int,
})
export type CategoryCap = typeof CategoryCap.Type

export interface NewCategoryCap {
  readonly householdId: string
  readonly cycleId: string
  readonly categoryId: string
  readonly capMinor: number
}
