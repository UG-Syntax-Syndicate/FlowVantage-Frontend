export type PasswordStrengthLevel = 'weak' | 'fair' | 'good' | 'strong'

export interface PasswordRequirement {
  label: string
  met: boolean
}

interface RequirementRule {
  label: string
  test: (password: string) => boolean
}

const REQUIREMENT_RULES: RequirementRule[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Upper and lowercase letters', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: 'At least one number', test: (p) => /\d/.test(p) },
  { label: 'At least one symbol', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export interface PasswordStrength {
  /** 0-4: number of requirements met. */
  score: number
  level: PasswordStrengthLevel
  requirements: PasswordRequirement[]
}

function levelForScore(score: number): PasswordStrengthLevel {
  if (score <= 1) return 'weak'
  if (score === 2) return 'fair'
  if (score === 3) return 'good'
  return 'strong'
}

/** Simple, dependency-free password strength check — no external scoring library. */
export function getPasswordStrength(password: string): PasswordStrength {
  const requirements = REQUIREMENT_RULES.map((rule) => ({ label: rule.label, met: rule.test(password) }))
  const score = requirements.filter((r) => r.met).length
  return { score, level: levelForScore(score), requirements }
}

/** Signup requires every requirement met (level === 'strong'), not just a passing score. */
export function isPasswordStrong(password: string): boolean {
  return getPasswordStrength(password).level === 'strong'
}
