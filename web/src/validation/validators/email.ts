import type { FieldValidation } from "../protocols/FieldValidation"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const email =
  (message: string): FieldValidation =>
  (value) =>
    value === "" || EMAIL_PATTERN.test(value) ? null : message
