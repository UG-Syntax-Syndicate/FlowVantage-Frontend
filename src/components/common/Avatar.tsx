interface AvatarProps {
  photoURL?: string | null
  name?: string | null
  size?: number
  ringed?: boolean
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '')
  return initials.join('') || '?'
}

export function Avatar({ photoURL, name, size = 36, ringed = false }: AvatarProps) {
  const style = { width: size, height: size }

  const ringClasses = ringed ? 'ring-2 ring-accent-400 ring-offset-2 ring-offset-rail' : ''

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name ?? 'User avatar'}
        style={style}
        className={`rounded-full object-cover ${ringClasses}`}
      />
    )
  }

  return (
    <div
      style={style}
      className={`flex items-center justify-center rounded-full bg-accent-500 font-medium text-white ${ringClasses}`}
    >
      <span style={{ fontSize: size * 0.4 }}>{getInitials(name)}</span>
    </div>
  )
}
