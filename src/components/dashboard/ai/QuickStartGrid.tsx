import { AlertTriangle, CalendarClock, Layers, PenLine } from 'lucide-react'

interface QuickStartItem {
  icon: typeof Layers
  title: string
  description: string
  prompt: string
}

const QUICK_START_ITEMS: QuickStartItem[] = [
  {
    icon: Layers,
    title: 'Project status',
    description: 'Summarize progress across all your active projects.',
    prompt: 'Give me a status summary across my projects.',
  },
  {
    icon: AlertTriangle,
    title: "What's overdue",
    description: 'Find tasks that are overdue or at risk of slipping.',
    prompt: 'What tasks are overdue or at risk right now?',
  },
  {
    icon: PenLine,
    title: 'Draft an update',
    description: 'Draft a short status update to share with your team.',
    prompt: 'Draft a status update for the marketing team.',
  },
  {
    icon: CalendarClock,
    title: 'Upcoming meetings',
    description: "See what's on your calendar this week.",
    prompt: "What's on my calendar this week?",
  },
]

interface QuickStartGridProps {
  onSelect: (prompt: string) => void
}

export function QuickStartGrid({ onSelect }: QuickStartGridProps) {
  return (
    <div className="w-full">
      <p className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">Quick start</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {QUICK_START_ITEMS.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => onSelect(item.prompt)}
            className="flex items-start gap-3 rounded-2xl bg-white/60 p-4 text-left ring-1 ring-black/5 backdrop-blur-sm transition hover:bg-white/90"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
              <item.icon size={16} strokeWidth={1.9} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">{item.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
