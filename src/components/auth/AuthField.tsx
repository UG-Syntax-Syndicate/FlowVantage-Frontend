import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

/** The auth pages' input style, previously copied verbatim into four files. */
export const AUTH_INPUT_CLASS =
  'w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-100'

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** The validation message, usually `errors.field?.message`. */
  error?: string
  /** Shown under the label - what the field is for, or why it is being asked. */
  hint?: ReactNode
  /** Marks the field as volunteered rather than required. */
  optional?: boolean
}

/**
 * Label + input + error, for the auth and onboarding pages.
 *
 * Extracted because the class string above was duplicated verbatim in
 * SignupPage (twice), LoginPage and ForgotPasswordPage, and the onboarding
 * wizard adds roughly eight more fields across four steps. A dozen copies of a
 * style string is a dozen places for it to drift.
 *
 * `forwardRef` so react-hook-form's `register()` spread works unchanged:
 * `<AuthField label="City" {...register('city')} />`.
 *
 * The dashboard has its own shadcn Input/Label pair. These two families are
 * deliberately not merged - the auth surface has its own visual language, and
 * the wizard continues straight on from signup, so it stays in this one.
 */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, error, hint, optional, id, className, ...inputProps },
  ref,
) {
  const fieldId = id ?? inputProps.name
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={fieldId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        {optional && <span className="text-xs text-slate-400">Optional</span>}
      </div>

      <input
        ref={ref}
        id={fieldId}
        className={className ? `${AUTH_INPUT_CLASS} ${className}` : AUTH_INPUT_CLASS}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...inputProps}
      />

      {hint && (
        <p id={hintId} className="text-xs text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
})

interface AuthSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: ReactNode
  optional?: boolean
  children: ReactNode
}

/**
 * The same shape for a native `<select>`.
 *
 * Native rather than the dashboard's Radix Select: the wizard's country and
 * timezone lists run to hundreds of entries, and a native select gives
 * type-to-find and the platform's own picker on mobile for free.
 */
export const AuthSelect = forwardRef<HTMLSelectElement, AuthSelectProps>(function AuthSelect(
  { label, error, hint, optional, id, className, children, ...selectProps },
  ref,
) {
  const fieldId = id ?? selectProps.name
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={fieldId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        {optional && <span className="text-xs text-slate-400">Optional</span>}
      </div>

      <select
        ref={ref}
        id={fieldId}
        className={`${AUTH_INPUT_CLASS} bg-white ${className ?? ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...selectProps}
      >
        {children}
      </select>

      {hint && (
        <p id={hintId} className="text-xs text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
})
