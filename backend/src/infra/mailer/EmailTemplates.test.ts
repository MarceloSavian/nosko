import { describe, expect, it } from "@jest/globals"
import {
  householdInvitationEmail,
  mfaOtpEmail,
  passwordResetEmail,
  verificationEmail,
} from "./EmailTemplates"

describe("verificationEmail", () => {
  it("renders pt-BR", () => {
    const email = verificationEmail("pt-BR", "123456")
    expect(email.subject).toContain("Verifique")
    expect(email.text).toContain("123456")
    expect(email.html).toContain("123456")
  })

  it("renders en", () => {
    const email = verificationEmail("en", "123456")
    expect(email.subject).toContain("Verify")
    expect(email.text).toContain("123456")
  })
})

describe("passwordResetEmail", () => {
  it("renders pt-BR", () => {
    const email = passwordResetEmail("pt-BR", "654321")
    expect(email.subject).toContain("Recuperar")
    expect(email.text).toContain("654321")
  })

  it("renders en", () => {
    const email = passwordResetEmail("en", "654321")
    expect(email.subject).toContain("Reset")
    expect(email.html).toContain("654321")
  })
})

describe("mfaOtpEmail", () => {
  it("renders pt-BR", () => {
    const email = mfaOtpEmail("pt-BR", "111222")
    expect(email.subject).toContain("duas etapas")
    expect(email.text).toContain("111222")
  })

  it("renders en", () => {
    const email = mfaOtpEmail("en", "111222")
    expect(email.subject).toContain("Two-factor")
    expect(email.html).toContain("111222")
  })
})

describe("householdInvitationEmail", () => {
  it("renders pt-BR with the inviter, household, and code", () => {
    const email = householdInvitationEmail("pt-BR", "Marcelo", "Marcelo & Gabriele", "ABC123")
    expect(email.subject).toContain("Marcelo")
    expect(email.text).toContain("Marcelo & Gabriele")
    expect(email.html).toContain("ABC123")
  })

  it("renders en with the inviter, household, and code", () => {
    const email = householdInvitationEmail("en", "Marcelo", "Marcelo & Gabriele", "ABC123")
    expect(email.subject).toContain("invited")
    expect(email.text).toContain("ABC123")
  })
})
