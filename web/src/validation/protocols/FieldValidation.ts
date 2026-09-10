// A field rule returns an error message (already localised by the caller) or null when valid.
// Composed in validation/validate.ts: the first non-null result wins, mirroring the reference
// clean-react ValidationComposite but as plain functions (no classes, matching this codebase's
// functional style).
export type FieldValidation = (
  value: string,
  allValues: Readonly<Record<string, string>>,
) => string | null
