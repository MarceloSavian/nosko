import type { Locale } from "../../domain/models/Locale"

export type { Locale }

export interface RenderedEmail {
  readonly subject: string
  readonly text: string
  readonly html: string
}

const wrap = (body: string) =>
  `<div style="font-family: sans-serif; font-size: 15px; line-height: 1.5;">${body}</div>`

export const verificationEmail = (locale: Locale, code: string): RenderedEmail =>
  locale === "pt-BR"
    ? {
        subject: "Verifique seu email — nosko",
        text: `Seu código de verificação é ${code}. Ele expira em 15 minutos.`,
        html: wrap(
          `<p>Seu código de verificação é <strong>${code}</strong>.</p><p>Ele expira em 15 minutos.</p>`,
        ),
      }
    : {
        subject: "Verify your email — nosko",
        text: `Your verification code is ${code}. It expires in 15 minutes.`,
        html: wrap(
          `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 15 minutes.</p>`,
        ),
      }

export const passwordResetEmail = (locale: Locale, code: string): RenderedEmail =>
  locale === "pt-BR"
    ? {
        subject: "Recuperar senha — nosko",
        text: `Use o código ${code} para redefinir sua senha. Ele expira em 15 minutos. Se não foi você, ignore este email.`,
        html: wrap(
          `<p>Use o código <strong>${code}</strong> para redefinir sua senha.</p><p>Ele expira em 15 minutos. Se não foi você, ignore este email.</p>`,
        ),
      }
    : {
        subject: "Reset your password — nosko",
        text: `Use the code ${code} to reset your password. It expires in 15 minutes. If this wasn't you, ignore this email.`,
        html: wrap(
          `<p>Use the code <strong>${code}</strong> to reset your password.</p><p>It expires in 15 minutes. If this wasn't you, ignore this email.</p>`,
        ),
      }

export const mfaOtpEmail = (locale: Locale, code: string): RenderedEmail =>
  locale === "pt-BR"
    ? {
        subject: "Código de verificação em duas etapas — nosko",
        text: `Seu código de acesso é ${code}. Ele expira em 5 minutos.`,
        html: wrap(
          `<p>Seu código de acesso é <strong>${code}</strong>.</p><p>Ele expira em 5 minutos.</p>`,
        ),
      }
    : {
        subject: "Two-factor verification code — nosko",
        text: `Your sign-in code is ${code}. It expires in 5 minutes.`,
        html: wrap(
          `<p>Your sign-in code is <strong>${code}</strong>.</p><p>It expires in 5 minutes.</p>`,
        ),
      }

export const householdInvitationEmail = (
  locale: Locale,
  inviterName: string,
  householdName: string,
  code: string,
): RenderedEmail =>
  locale === "pt-BR"
    ? {
        subject: `${inviterName} convidou você para a Casa ${householdName} — nosko`,
        text: `${inviterName} convidou você para gerenciar as finanças da Casa ${householdName} juntos no nosko. Código do convite: ${code}.`,
        html: wrap(
          `<p><strong>${inviterName}</strong> convidou você para gerenciar as finanças da Casa <strong>${householdName}</strong> juntos no nosko.</p><p>Código do convite: <strong>${code}</strong>.</p>`,
        ),
      }
    : {
        subject: `${inviterName} invited you to Casa ${householdName} — nosko`,
        text: `${inviterName} invited you to manage the finances of Casa ${householdName} together on nosko. Invitation code: ${code}.`,
        html: wrap(
          `<p><strong>${inviterName}</strong> invited you to manage the finances of Casa <strong>${householdName}</strong> together on nosko.</p><p>Invitation code: <strong>${code}</strong>.</p>`,
        ),
      }
