import { toast } from 'sonner'

const VARIANT_CLASSES = {
  success: '!border-emerald-200 !bg-emerald-50 !text-emerald-700',
  error: '!border-rose-200 !bg-rose-50 !text-rose-700',
  info: '!border-accent-200 !bg-accent-50 !text-accent-700',
} as const

export function showToast(variant: keyof typeof VARIANT_CLASSES, message: string, description?: string) {
  toast[variant](message, { description, classNames: { toast: VARIANT_CLASSES[variant] } })
}

export { toast }
