import { Link } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import type { Folder } from '../../types/project'
import { formatShortDate } from '../../lib/formatDate'
import { FOLDER_ICONS } from '../../lib/folderIcons'

interface FolderCardProps {
  folder: Folder
}

export function FolderCard({ folder }: FolderCardProps) {
  const Icon = FOLDER_ICONS[folder.icon]

  return (
    <Link
      to={`/dashboard/projects/folders/${folder.id}`}
      className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left transition hover:border-slate-300 hover:shadow-sm"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ backgroundColor: folder.color }}
      >
        <Icon size={19} strokeWidth={1.9} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{folder.name}</p>
        <p className="text-xs text-slate-400">{formatShortDate(folder.createdAt)}</p>
      </div>
      <MoreHorizontal size={16} className="shrink-0 text-slate-300" />
    </Link>
  )
}
