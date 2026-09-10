import { ApiClient } from "../../infra/http/apiClient"

// Each export is an atom: presentation reads/mutates through these, never through ApiClient or
// the raw RPC tag strings directly. Callers pass `reactivityKeys: ["session"]` alongside the
// payload for mutations that should refresh meAtom below (see SESSION_KEYS in main/atoms/session.ts).
export const signUpAtom = ApiClient.mutation("auth.signUp")
export const verifyEmailAtom = ApiClient.mutation("auth.verifyEmail")
export const resendVerificationAtom = ApiClient.mutation("auth.resendVerification")
export const requestPasswordResetAtom = ApiClient.mutation("auth.requestPasswordReset")
export const resetPasswordAtom = ApiClient.mutation("auth.resetPassword")
export const meAtom = ApiClient.query("auth.me", undefined, { reactivityKeys: ["session"] })
export const mfaEnrollAtom = ApiClient.mutation("auth.mfaEnroll")
export const mfaConfirmEnrollAtom = ApiClient.mutation("auth.mfaConfirmEnroll")
export const mfaDisableAtom = ApiClient.mutation("auth.mfaDisable")
