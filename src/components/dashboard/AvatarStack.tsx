import type { Member } from '../../types/project'
import { Avatar } from '../common/Avatar'
import { AvatarGroup, AvatarGroupCount } from '../ui/avatar'
import { memberColorClass } from '../../lib/memberColor'

interface AvatarStackProps {
  members: Member[]
  size?: number
  max?: number
}

export function AvatarStack({ members, size = 28, max = 3 }: AvatarStackProps) {
  const visible = members.slice(0, max)
  const overflow = members.length - visible.length

  return (
    <AvatarGroup>
      {visible.map((member) => (
        <Avatar key={member.id} photoURL={member.photoURL} name={member.name} size={size} bgClassName={memberColorClass(member.id)} />
      ))}
      {overflow > 0 && (
        <AvatarGroupCount style={{ width: size, height: size }} className="text-xs font-medium">
          +{overflow}
        </AvatarGroupCount>
      )}
    </AvatarGroup>
  )
}
