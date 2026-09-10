import type { FieldValidation } from "../protocols/FieldValidation"

export const required =
  (message: string): FieldValidation =>
  (value) =>
    value.trim() === "" ? message : null
