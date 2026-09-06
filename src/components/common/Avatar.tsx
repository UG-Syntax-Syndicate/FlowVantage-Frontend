import { cn } from '../../lib/utils'
import { Avatar as AvatarRoot, AvatarFallback, AvatarImage } from '../ui/avatar'

interface AvatarProps {
  photoURL?: string | null
  name?: string | null
  size?: number
  ringed?: boolean
  bgClassName?: string
  bgColor?: string
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '')
  return initials.join('') || '?'
}

export function Avatar({ photoURL, name, size = 36, ringed = false, bgClassName, bgColor }: AvatarProps) {
  const style = { width: size, height: size }
  const ringClasses = ringed ? 'ring-2 ring-accent-400 ring-offset-2 ring-offset-rail' : ''

  return (
    <AvatarRoot style={style} className={cn('size-auto', ringClasses)}>
      {photoURL && <AvatarImage src={photoURL} alt={name ?? 'User avatar'} />}
      <AvatarFallback
        style={bgColor ? { backgroundColor: bgColor } : undefined}
        className={cn('font-medium text-white', !bgColor && (bgClassName ?? 'bg-accent-500'))}
      >
        <span style={{ fontSize: size * 0.4 }}>{getInitials(name)}</span>
      </AvatarFallback>
    </AvatarRoot>
  )
}
