import { randomUUID } from "node:crypto"

export const uniqueEmail = (label: string): string => `e2e-web+${label}-${randomUUID()}@nosko.test`

export const TEST_PASSWORD = "Correct-Horse-Battery-Staple-9!"

export const uniqueName = (label: string): string => `E2E Web ${label} ${randomUUID().slice(0, 8)}`
