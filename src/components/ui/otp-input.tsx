import { useRef } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import { cn } from 'cn'

interface OtpInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
  disabled?: boolean
}

/** A row of individual single-digit boxes for entering a TOTP code, with auto-advance and paste support. */
export function OtpInput({ length = 6, value, onChange, autoFocus, disabled }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  function updateAt(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = digits.slice()
    next[index] = digit
    onChange(next.join(''))
    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    event.preventDefault()
    onChange(pasted)
    refs.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <div className="flex gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          placeholder="0"
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          onChange={(event) => updateAt(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          className={cn(
            'h-11 w-10 rounded-lg border border-input bg-transparent text-center text-lg font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
          )}
        />
      ))}
    </div>
  )
}
