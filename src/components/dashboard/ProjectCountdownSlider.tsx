import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Project } from '../../types/project'
import { useCountdown } from '../../hooks/useCountdown'

interface ProjectCountdownSliderProps {
  projects: Project[]
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 backdrop-blur-sm">
      <span className="text-lg font-bold tabular-nums text-white">{String(value).padStart(2, '0')}</span>
      <span className="text-[9px] tracking-wide text-white/60 uppercase">{label}</span>
    </div>
  )
}

export function ProjectCountdownSlider({ projects }: ProjectCountdownSliderProps) {
  const [index, setIndex] = useState(0)
  const project = projects[index]
  const countdown = useCountdown(project?.dueDate ?? new Date().toISOString())

  if (!project) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border border-line bg-white text-sm text-slate-400">
        No projects yet
      </div>
    )
  }

  function go(delta: number) {
    setIndex((current) => (current + delta + projects.length) % projects.length)
  }

  return (
    <div
      className="relative flex h-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-cover bg-center p-5 shadow-[0px_16px_36px_8px_rgba(0,0,0,0.25)]"
      style={project.image ? { backgroundImage: `url(${project.image})` } : { background: project.coverGradient }}
    >
      <div className="absolute inset-0 bg-black/35" aria-hidden />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-white/60 uppercase">Project Deadline</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-white">{project.name}</p>
        </div>
        {projects.length > 1 && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous project"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next project"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        {countdown.isPast ? (
          <p className="text-sm font-medium text-white/80">Deadline has passed</p>
        ) : (
          <div className="flex items-end gap-2">
            {countdown.days > 0 && <TimeBlock value={countdown.days} label="days" />}
            <TimeBlock value={countdown.hours} label="hrs" />
            <TimeBlock value={countdown.minutes} label="min" />
            <TimeBlock value={countdown.seconds} label="sec" />
          </div>
        )}

        {projects.length > 1 && (
          <div className="mt-3 flex gap-1.5">
            {projects.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show ${p.name}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
