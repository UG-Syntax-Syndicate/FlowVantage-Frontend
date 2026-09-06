import type { Member } from '../../types/project'
import { Avatar } from '../common/Avatar'
import { AvatarGroup, AvatarGroupCount } from '../ui/avatar'

interface AvatarStackProps {
  members: Member[]
  size?: number
  max?: number
}

const MEMBER_COLORS = [
  'bg-accent-500',
  'bg-indigo-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-fuchsia-500',
  'bg-rose-500',
]

function colorForMember(id: string): string {
  const hash = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return MEMBER_COLORS[hash % MEMBER_COLORS.length]
}

export function AvatarStack({ members, size = 28, max = 3 }: AvatarStackProps) {
  const visible = members.slice(0, max)
  const overflow = members.length - visible.length

  return (
    <AvatarGroup>
      {visible.map((member) => (
        <Avatar key={member.id} photoURL={member.photoURL} name={member.name} size={size} bgClassName={colorForMember(member.id)} />
      ))}
      {overflow > 0 && (
        <AvatarGroupCount style={{ width: size, height: size }} className="text-xs font-medium">
          +{overflow}
        </AvatarGroupCount>
      )}
    </AvatarGroup>
  )
}
