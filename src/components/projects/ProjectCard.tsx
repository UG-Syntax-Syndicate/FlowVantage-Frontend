import { Link } from 'react-router-dom'
import { Folder as FolderIcon } from 'lucide-react'
import type { Project } from '../../types/project'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      to={`/dashboard/projects/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0px_10px_32px_4px_rgba(152,150,163,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0px_14px_36px_6px_rgba(152,150,163,0.22)]"
    >
      <div
        className="relative h-28 w-full bg-cover bg-center"
        style={project.image ? { backgroundImage: `url(${project.image})` } : { background: project.coverGradient }}
      >
        <div
          className="absolute -bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md"
          style={{ backgroundColor: project.color }}
        >
          <FolderIcon size={18} strokeWidth={1.9} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4 pt-6">
        <div>
          <p className="truncate text-sm font-semibold text-slate-900">{project.name}</p>
          <p className="truncate text-xs text-slate-400">{project.tagline}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}
