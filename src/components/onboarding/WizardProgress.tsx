interface WizardProgressProps {
  current: number
  total: number
  labels: string[]
}

/**
 * The step indicator.
 *
 * Four filled bars, the same shape PasswordStrengthMeter uses, so the two
 * progress affordances in the signup journey read as the same idiom rather than
 * two unrelated inventions.
 */
export function WizardProgress({ current, total, labels }: WizardProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
          Step {current + 1} of {total}
        </p>
        <p className="text-xs text-slate-500">{labels[current]}</p>
      </div>
      <div className="flex gap-1" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
        {Array.from({ length: total }, (_, index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              index <= current ? 'bg-accent-500' : 'bg-slate-100'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
