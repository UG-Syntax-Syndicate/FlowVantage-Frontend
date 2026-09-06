import { Bell, Video } from 'lucide-react'
import type { Meeting, Project } from '../../types/project'
import { formatTime } from '../../lib/formatDate'
import { showToast } from '../../lib/toast'
import { Card } from '../ui/card'

interface MeetingReminderCardProps {
  meeting: Meeting | null
  project: Project | null
}

export function MeetingReminderCard({ meeting, project }: MeetingReminderCardProps) {
  return (
    <Card className="gap-3 overflow-visible rounded-2xl bg-gradient-to-br from-navy to-[#241a52] p-4 text-white shadow-[0px_16px_36px_8px_rgba(13,6,45,0.35)] ring-0">
      <div className="flex items-center justify-between">
        <p className="truncate text-sm text-white/70">
          {meeting ? `Next up${project ? ` on ${project.name}` : ''}` : 'No meetings scheduled'}
        </p>
        <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium tracking-wide text-white/50 uppercase">
          <Bell size={12} strokeWidth={2} />
          Reminders
        </div>
      </div>

      {meeting ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3.5 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{meeting.title}</p>
            <p className="mt-0.5 truncate text-xs text-white/60">
              with {meeting.withCompany} · {formatTime(meeting.startTime)}–{formatTime(meeting.endTime)}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-white/10 px-3.5 py-3 text-xs text-white/60">Your calendar is clear for now.</div>
      )}

      <button
        type="button"
        onClick={() => showToast('info', 'Meeting rooms aren’t wired up yet')}
        disabled={!meeting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Video size={16} strokeWidth={2} />
        Start Meeting
      </button>
    </Card>
  )
}
