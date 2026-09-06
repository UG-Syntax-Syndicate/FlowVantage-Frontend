import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useEmails, useProjects, useToggleEmailStar } from '../../hooks/useProjectsData'
import { EmailDetailModal } from '../projects/EmailDetailModal'
import { formatInboxTimestamp } from '../../lib/formatDate'
import { getPersonPhoto } from '../../lib/avatars'
import { Avatar } from '../common/Avatar'
import { Card } from '../ui/card'
import { EASE_PREMIUM, slideVariants, useCarousel } from '../../lib/motion'

export function EmailSlider() {
  const { data: emails = [], isLoading } = useEmails()
  const { data: projects = [] } = useProjects()
  const toggleStar = useToggleEmailStar()
  const [viewingEmail, setViewingEmail] = useState(false)

  const projectById = new Map(projects.map((p) => [p.id, p]))

  // One slide per project: its most recent inbox email.
  const latestByProject = new Map<string, (typeof emails)[number]>()
  for (const email of emails) {
    if (!email.projectId || email.folder !== 'inbox') continue
    const current = latestByProject.get(email.projectId)
    if (!current || new Date(email.receivedAt).getTime() > new Date(current.receivedAt).getTime()) {
      latestByProject.set(email.projectId, email)
    }
  }
  const slides = [...latestByProject.values()].sort(
    (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
  )

  const { index, direction, goBy, goTo } = useCarousel(slides.length)
  const email = slides[index]
  const project = email ? projectById.get(email.projectId!) : undefined

  return (
    <Card className="gap-3 overflow-visible rounded-2xl border border-line bg-white p-4 shadow-[0px_10px_40px_10px_rgba(152,150,163,0.16)] ring-0">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Latest Emails</h2>
        <Link to="/dashboard/email" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
      ) : !email ? (
        <p className="py-6 text-center text-sm text-slate-400">No project emails yet.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={email.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: EASE_PREMIUM }}
                className="flex flex-col gap-2.5"
              >
                <div className="flex items-start gap-3">
                  <Avatar photoURL={getPersonPhoto(email.senderName)} name={email.senderName} size={36} bgColor={email.senderColor} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${email.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
                        {email.senderName}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-400">{formatInboxTimestamp(email.receivedAt)}</span>
                    </div>
                    {project && (
                      <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                        {project.name}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleStar.mutate(email.id)}
                    aria-label={email.starred ? 'Unstar email' : 'Star email'}
                    className="mt-0.5 shrink-0 text-slate-300 hover:text-amber-400"
                  >
                    <Star size={14} className={email.starred ? 'fill-amber-400 text-amber-400' : ''} />
                  </button>
                </div>

                <button type="button" onClick={() => setViewingEmail(true)} className="text-left">
                  <p className={`truncate text-sm ${email.read ? 'text-slate-700' : 'font-medium text-slate-900'}`}>
                    {email.subject}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{email.snippet}</p>
                </button>
              </motion.div>
            </AnimatePresence>
          </div>

          {slides.length > 1 && (
            <div className="mt-1 flex items-center justify-between">
              <div className="flex gap-1.5">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Show email ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? 'w-5 bg-primary' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => goBy(-1)}
                  aria-label="Previous email"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => goBy(1)}
                  aria-label="Next email"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {viewingEmail && email && (
        <EmailDetailModal
          email={email}
          projectName={project?.name}
          onClose={() => setViewingEmail(false)}
          onToggleStar={() => toggleStar.mutate(email.id)}
        />
      )}
    </Card>
  )
}
