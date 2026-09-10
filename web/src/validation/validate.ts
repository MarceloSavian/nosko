import type { FieldValidation } from "./protocols/FieldValidation"

export const validate = (
  value: string,
  allValues: Readonly<Record<string, string>>,
  rules: ReadonlyArray<FieldValidation>,
): string | null => {
  for (const rule of rules) {
    const error = rule(value, allValues)
    if (error !== null) return error
  }
  return null
}
