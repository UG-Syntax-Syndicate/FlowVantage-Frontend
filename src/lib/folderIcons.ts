import { Users, Handshake, User, Heart, Sparkles, Megaphone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Folder } from '../types/project'

export const FOLDER_ICONS: Record<Folder['icon'], LucideIcon> = {
  users: Users,
  handshake: Handshake,
  user: User,
  heart: Heart,
  sparkles: Sparkles,
  megaphone: Megaphone,
}
