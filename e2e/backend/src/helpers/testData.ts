import { randomUUID } from "node:crypto"

// A distinctive, greppable local part so any leftover row from a crashed run (cleanup runs in
// an `after` hook so this should be rare) is trivially identifiable in the database.
export const uniqueEmail = (label: string): string => `e2e+${label}-${randomUUID()}@nosko.test`

export const TEST_PASSWORD = "Correct-Horse-Battery-Staple-9!"

export const uniqueName = (label: string): string => `E2E ${label} ${randomUUID().slice(0, 8)}`
