import type { FieldValidation } from "../protocols/FieldValidation"

export const minLength =
  (length: number, message: string): FieldValidation =>
  (value) =>
    value === "" || value.length >= length ? null : message
