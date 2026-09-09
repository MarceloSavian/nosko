import type { Locale } from "../../domain/models/Locale"

export type { Locale }

export interface RenderedEmail {
  readonly subject: string
  readonly text: string
  readonly html: string
}

interface EmailContent {
  readonly subject: string
  readonly text: string
  readonly body: string
}

const wrap = (body: string) =>
  `<div style="font-family: sans-serif; font-size: 15px; line-height: 1.5;">${body}</div>`

const render = (content: EmailContent): RenderedEmail => ({
  subject: content.subject,
  text: content.text,
  html: wrap(content.body),
})

const verificationEmailContent: Record<Locale, (code: string) => EmailContent> = {
  "pt-BR": (code) => ({
    subject: "Verifique seu email — nosko",
    text: `Seu código de verificação é ${code}. Ele expira em 15 minutos.`,
    body: `<p>Seu código de verificação é <strong>${code}</strong>.</p><p>Ele expira em 15 minutos.</p>`,
  }),
  en: (code) => ({
    subject: "Verify your email — nosko",
    text: `Your verification code is ${code}. It expires in 15 minutes.`,
    body: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 15 minutes.</p>`,
  }),
}

export const verificationEmail = (locale: Locale, code: string): RenderedEmail =>
  render(verificationEmailContent[locale](code))

const passwordResetEmailContent: Record<Locale, (code: string) => EmailContent> = {
  "pt-BR": (code) => ({
    subject: "Recuperar senha — nosko",
    text: `Use o código ${code} para redefinir sua senha. Ele expira em 15 minutos. Se não foi você, ignore este email.`,
    body: `<p>Use o código <strong>${code}</strong> para redefinir sua senha.</p><p>Ele expira em 15 minutos. Se não foi você, ignore este email.</p>`,
  }),
  en: (code) => ({
    subject: "Reset your password — nosko",
    text: `Use the code ${code} to reset your password. It expires in 15 minutes. If this wasn't you, ignore this email.`,
    body: `<p>Use the code <strong>${code}</strong> to reset your password.</p><p>It expires in 15 minutes. If this wasn't you, ignore this email.</p>`,
  }),
}

export const passwordResetEmail = (locale: Locale, code: string): RenderedEmail =>
  render(passwordResetEmailContent[locale](code))

const mfaOtpEmailContent: Record<Locale, (code: string) => EmailContent> = {
  "pt-BR": (code) => ({
    subject: "Código de verificação em duas etapas — nosko",
    text: `Seu código de acesso é ${code}. Ele expira em 5 minutos.`,
    body: `<p>Seu código de acesso é <strong>${code}</strong>.</p><p>Ele expira em 5 minutos.</p>`,
  }),
  en: (code) => ({
    subject: "Two-factor verification code — nosko",
    text: `Your sign-in code is ${code}. It expires in 5 minutes.`,
    body: `<p>Your sign-in code is <strong>${code}</strong>.</p><p>It expires in 5 minutes.</p>`,
  }),
}

export const mfaOtpEmail = (locale: Locale, code: string): RenderedEmail =>
  render(mfaOtpEmailContent[locale](code))

const householdInvitationEmailContent: Record<
  Locale,
  (inviterName: string, householdName: string, code: string) => EmailContent
> = {
  "pt-BR": (inviterName, householdName, code) => ({
    subject: `${inviterName} convidou você para a Casa ${householdName} — nosko`,
    text: `${inviterName} convidou você para gerenciar as finanças da Casa ${householdName} juntos no nosko. Código do convite: ${code}.`,
    body: `<p><strong>${inviterName}</strong> convidou você para gerenciar as finanças da Casa <strong>${householdName}</strong> juntos no nosko.</p><p>Código do convite: <strong>${code}</strong>.</p>`,
  }),
  en: (inviterName, householdName, code) => ({
    subject: `${inviterName} invited you to Casa ${householdName} — nosko`,
    text: `${inviterName} invited you to manage the finances of Casa ${householdName} together on nosko. Invitation code: ${code}.`,
    body: `<p><strong>${inviterName}</strong> invited you to manage the finances of Casa <strong>${householdName}</strong> together on nosko.</p><p>Invitation code: <strong>${code}</strong>.</p>`,
  }),
}

export const householdInvitationEmail = (
  locale: Locale,
  inviterName: string,
  householdName: string,
  code: string,
): RenderedEmail =>
  render(householdInvitationEmailContent[locale](inviterName, householdName, code))
