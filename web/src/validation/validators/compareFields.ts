import type { FieldValidation } from "../protocols/FieldValidation"

export const compareFields =
  (otherField: string, message: string): FieldValidation =>
  (value, allValues) =>
    value === "" || value === allValues[otherField] ? null : message
