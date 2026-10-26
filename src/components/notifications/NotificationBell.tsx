import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  BellOff,
  CheckCheck,
  FolderKanban,
  MessageSquare,
  SquareCheckBig,
  UserPlus,
  X,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Avatar } from '../common/Avatar'
import { Skeleton } from '../ui/skeleton'
import { formatCompactAgo } from '../../lib/formatDate'
import {
  useDismissNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../../hooks/useNotifications'
import type { Notification } from '../../types/notification'

/**
 * Icon per event type, shown when a notification has no actor (a system
 * event, or one whose actor has since been deleted). Unknown types fall
 * through to the bell rather than rendering nothing, so a backend that ships
 * a new event type degrades instead of breaking.
 */
const ICON_BY_TYPE: Record<string, typeof Bell> = {
  'task.assigned': SquareCheckBig,
  'task.commented': MessageSquare,
  'message.posted': MessageSquare,
  'project.member_added': UserPlus,
  'project.status_changed': FolderKanban,
  'invitation.accepted': UserPlus,
}

function NotificationIcon({ notification }: { notification: Notification }) {
  if (notification.actorPhotoURL || notification.actorName) {
    return <Avatar photoURL={notification.actorPhotoURL} name={notification.actorName} size={32} />
  }

  const Icon = ICON_BY_TYPE[notification.type] ?? Bell
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-100 text-primary">
      <Icon size={15} strokeWidth={2} aria-hidden="true" />
    </span>
  )
}

interface NotificationRowProps {
  notification: Notification
  onOpen: (notification: Notification) => void
  onDismiss: (id: string) => void
}

function NotificationRow({ notification, onOpen, onDismiss }: NotificationRowProps) {
  const unread = notification.readAt === null

  return (
    <li className="group relative">
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
      >
        <NotificationIcon notification={notification} />

        <span className="min-w-0 flex-1">
          <span className={`block text-sm ${unread ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
            {notification.title}
          </span>
          {notification.body && (
            <span className="mt-0.5 block truncate text-xs text-slate-500">{notification.body}</span>
          )}
          <span className="mt-1 block text-[11px] text-slate-400">
            {formatCompactAgo(notification.createdAt)}
          </span>
        </span>

        {/* The unread marker moves aside for the dismiss button rather than
            stacking with it - two dots in the same corner read as a single
            broken control. */}
        {unread && (
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary group-hover:invisible"
            aria-label="Unread"
          />
        )}
      </button>

      <button
        type="button"
        onClick={() => onDismiss(notification.id)}
        aria-label="Dismiss notification"
        className="absolute top-2.5 right-2 hidden h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 group-hover:flex focus-visible:flex focus-visible:outline-none"
      >
        <X size={13} strokeWidth={2.2} />
      </button>
    </li>
  )
}

/**
 * The header bell: unread badge, feed, and the two actions that feed needs.
 *
 * The badge count and the list arrive in one response, and the feed is
 * invalidated by the SSE `notification` event (see useRealtimeSync), so this
 * stays current without polling.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const dismiss = useDismissNotification()

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  function handleOpen(notification: Notification) {
    if (notification.readAt === null) {
      markRead.mutate(notification.id)
    }
    if (notification.link) {
      setOpen(false)
      navigate(notification.link)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        title="Notifications"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 outline-none hover:bg-slate-100 hover:text-slate-600 data-[state=open]:bg-slate-100 data-[state=open]:text-slate-600"
      >
        <Bell size={18} strokeWidth={1.9} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[22rem] max-w-[calc(100vw-2rem)] gap-0 p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-60"
            >
              <CheckCheck size={13} strokeWidth={2} />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[22rem] overflow-y-auto p-1.5">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <BellOff size={22} strokeWidth={1.8} className="text-slate-300" aria-hidden="true" />
              <p className="text-sm font-medium text-slate-600">You're all caught up</p>
              <p className="max-w-[16rem] text-xs text-slate-400">
                Assignments, comments and invitations to your projects will show up here.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onOpen={handleOpen}
                  onDismiss={(id) => dismiss.mutate(id)}
                />
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
