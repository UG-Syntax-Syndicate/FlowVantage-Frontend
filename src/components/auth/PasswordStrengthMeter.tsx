import { Check, X } from 'lucide-react'
import { getPasswordStrength } from '../../lib/passwordStrength'

const LEVEL_STYLE = {
  weak: { label: 'Weak', bar: 'bg-rose-500', text: 'text-rose-600' },
  fair: { label: 'Fair', bar: 'bg-amber-500', text: 'text-amber-600' },
  good: { label: 'Good', bar: 'bg-yellow-500', text: 'text-yellow-600' },
  strong: { label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-600' },
} as const

interface PasswordStrengthMeterProps {
  password: string
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { score, level, requirements } = getPasswordStrength(password)
  const style = LEVEL_STYLE[level]
  const filledBars = Math.max(score, password.length > 0 ? 1 : 0)

  if (!password) return null

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < filledBars ? style.bar : 'bg-slate-100'}`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${style.text}`}>{style.label}</span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {requirements.map((req) => (
          <li
            key={req.label}
            className={`flex items-center gap-1.5 text-xs ${req.met ? 'text-slate-600' : 'text-slate-400'}`}
          >
            {req.met ? (
              <Check size={13} strokeWidth={2.5} className="shrink-0 text-emerald-500" />
            ) : (
              <X size={13} strokeWidth={2.5} className="shrink-0 text-slate-300" />
            )}
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
