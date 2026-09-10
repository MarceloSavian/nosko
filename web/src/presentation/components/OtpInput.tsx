import { type ClipboardEvent, type KeyboardEvent, useRef } from "react"

const LENGTH = 6

export const OtpInput = ({
  value,
  onChange,
  autoFocus = false,
}: {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly autoFocus?: boolean
}) => {
  const inputRefs = useRef<ReadonlyArray<HTMLInputElement | null>>([])
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "")

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice()
    next[index] = digit
    onChange(next.join(""))
  }

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1)
    setDigit(index, digit)
    if (digit !== "" && index < LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && digits[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH)
    if (pasted.length === 0) return
    event.preventDefault()
    onChange(pasted.padEnd(LENGTH, ""))
    inputRefs.current[Math.min(pasted.length, LENGTH - 1)]?.focus()
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length code boxes, index is a stable identity
          key={index}
          ref={(el) => {
            const refs = inputRefs.current as Array<HTMLInputElement | null>
            refs[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          // biome-ignore lint/a11y/noAutofocus: deliberate for a dedicated code-entry screen the user lands on to type a code immediately
          autoFocus={autoFocus && index === 0}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="h-14 w-11 rounded-2xl bg-slate-100 text-center text-2xl font-semibold text-slate-900 shadow-inner outline-none focus:ring-2 focus:ring-emerald-600 sm:h-16 sm:w-14 dark:bg-slate-800 dark:text-slate-100"
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
