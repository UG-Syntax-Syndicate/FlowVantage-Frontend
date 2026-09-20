import type { ChatMessage, Email } from '../types/project'

/**
 * Email and AI Assistant are the only features still on mock data - both are
 * locked behind the "coming soon" nav treatment since neither has a real
 * backend endpoint yet (see navItems.ts/Sidebar.tsx). Every other seed array
 * that used to live here (projects, tasks, todos, folders, members, notes,
 * contacts, meetings, documents) has been replaced by real backend calls in
 * src/api/projectsApi.ts.
 */

function addDays(base: Date, days: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

const today = new Date()

const EMAIL_HOUR_MS = 3_600_000

export const MOCK_EMAILS: Email[] = [
  {
    id: 'e1',
    projectId: 'p1',
    folder: 'inbox',
    senderName: 'Ellie Novak',
    senderColor: '#6366f1',
    subject: 'Design review notes',
    snippet: 'Left a few comments on the button primitives, mostly around focus states.',
    body: 'Left a few comments on the button primitives, mostly around focus states. The disabled variant needs more contrast, and I think the medium size is a touch too small for our default text scale. Happy to hop on a call if it is faster than back-and-forth over Figma comments.',
    receivedAt: new Date(today.getTime() - 1 * EMAIL_HOUR_MS).toISOString(),
    starred: true,
    read: false,
  },
  {
    id: 'e2',
    projectId: 'p1',
    folder: 'inbox',
    senderName: 'Figma',
    senderColor: '#0ea5e9',
    subject: 'New comments on Hikoko Design System',
    snippet: 'Marcus Reid and 2 others commented on your file.',
    body: 'Marcus Reid and 2 others commented on your file "Hikoko Design System". Open the file to see the latest activity, including new annotations on the spacing scale and a question about the modal shadow token.',
    receivedAt: new Date(today.getTime() - 3 * EMAIL_HOUR_MS).toISOString(),
    starred: false,
    read: false,
  },
  {
    id: 'e3',
    projectId: null,
    folder: 'inbox',
    senderName: 'Dropbox',
    senderColor: '#3b82f6',
    subject: 'Your weekly storage summary',
    snippet: 'You used 68% of your storage this month across shared folders.',
    body: 'You used 68% of your storage this month across shared folders. At this pace you will reach your limit in about 7 weeks. Upgrade your plan or clear out old file versions to free up space.',
    receivedAt: new Date(today.getTime() - 6 * EMAIL_HOUR_MS).toISOString(),
    starred: false,
    read: true,
  },
  {
    id: 'e4',
    projectId: 'p2',
    folder: 'inbox',
    senderName: 'Priya Shah',
    senderColor: '#22c55e',
    subject: 'Offline sync test results',
    snippet: 'Ran the field test on three devices — sync held up on all of them.',
    body: 'Ran the field test on three devices — sync held up on all of them, even after forcing airplane mode mid-write. One edge case: reconnecting on a very slow connection queued duplicate requests. Filed a ticket, should be a quick fix.',
    receivedAt: addDays(today, -1),
    starred: false,
    read: true,
  },
  {
    id: 'e5',
    projectId: null,
    folder: 'inbox',
    senderName: 'Vercel',
    senderColor: '#0f172a',
    subject: 'Deployment succeeded: flowvantage-frontend',
    snippet: 'Your latest commit was deployed to production.',
    body: 'Your latest commit was deployed to production successfully. Build completed in 48s with no warnings. View the deployment logs and analytics from your dashboard.',
    receivedAt: addDays(today, -1),
    starred: false,
    read: true,
  },
  {
    id: 'e6',
    projectId: 'p6',
    folder: 'inbox',
    senderName: 'Amara Bello',
    senderColor: '#f43f5e',
    subject: 'Speaker list for the meetup',
    snippet: 'Confirmed two speakers so far, waiting to hear back from a third.',
    body: 'Confirmed two speakers so far, waiting to hear back from a third by end of week. If they can not make it, I have a backup in mind from last year’s event who was a big hit with the crowd.',
    receivedAt: addDays(today, -2),
    starred: true,
    read: true,
  },
  {
    id: 'e7',
    projectId: 'p3',
    folder: 'inbox',
    senderName: 'Amara Bello',
    senderColor: '#f43f5e',
    subject: 'Campaign assets are ready for review',
    snippet: 'Dropped the hero and pricing section mocks in the shared folder.',
    body: 'Dropped the hero and pricing section mocks in the shared folder. Two versions of the hero for you to pick between — one is more image-led, the other leans on typography. Let me know your favorite by Thursday so we can lock it in for launch.',
    receivedAt: addDays(today, -3),
    starred: false,
    read: true,
  },
  {
    id: 'e8',
    projectId: 'p3',
    folder: 'drafts',
    senderName: 'You',
    senderColor: '#94a3b8',
    subject: 'Follow-up on Q3 launch timeline',
    snippet: 'Draft: Wanted to check in on where we landed for the launch date...',
    body: 'Draft: Wanted to check in on where we landed for the launch date. Last we spoke it was tentatively the third week of the quarter, but I want to confirm before we lock in the campaign calendar.',
    receivedAt: addDays(today, -1),
    starred: false,
    read: true,
  },
  {
    id: 'e9',
    projectId: null,
    folder: 'pending',
    senderName: 'Werner Osei',
    senderColor: '#ec721d',
    subject: 'Introduction to new hires',
    snippet: 'Queued to send once the onboarding docs are finalized.',
    body: 'Queued to send once the onboarding docs are finalized. This will go out to the whole team introducing the two new hires starting next Monday.',
    receivedAt: addDays(today, -1),
    starred: false,
    read: true,
  },
  {
    id: 'e10',
    projectId: null,
    folder: 'spam',
    senderName: 'Unknown Sender',
    senderColor: '#64748b',
    subject: "You've won a prize!",
    snippet: 'Click here to claim your reward before it expires.',
    body: 'Click here to claim your reward before it expires. This offer is only available for the next 24 hours, act now to avoid missing out.',
    receivedAt: addDays(today, -5),
    starred: false,
    read: true,
  },
]

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'cm1',
    role: 'user',
    content: "What's at risk on Billing Migration?",
    createdAt: addDays(today, 0),
  },
  {
    id: 'cm2',
    role: 'assistant',
    content:
      'Billing Migration is marked urgent priority with a deadline in 5 days. "Cut over webhook listeners" is still To Do and due in 5 days, and "Reconcile historic ledger data" is In Progress but was due 2 days ago — that one is overdue. I\'d confirm with Marcus Reid before the cutover window.',
    createdAt: addDays(today, 0),
  },
  {
    id: 'cm3',
    role: 'user',
    content: 'Summarize everything in progress across my projects.',
    createdAt: addDays(today, 0),
  },
  {
    id: 'cm4',
    role: 'assistant',
    content:
      'You have 5 tasks in progress right now: "Develop Search and Filter Functionality" and "Document component usage guidelines" on Hikoko Design System, "Prototype offline sync flow" and "Team Collaboration workspace screen" on Mobile App Revamp, and "Reconcile historic ledger data" on Billing Migration. Hikoko Design System and Mobile App Revamp both have deadlines within the next three weeks.',
    createdAt: addDays(today, 0),
  },
  {
    id: 'cm5',
    role: 'user',
    content: 'Draft a quick status update I can send about Q3 Marketing Site.',
    createdAt: addDays(today, 0),
  },
  {
    id: 'cm6',
    role: 'assistant',
    content:
      'Here\'s a draft:\n\n"Q3 Marketing Site is in planning with a Sep 30 target. Hero and pricing section designs are queued, campaign copy is in progress, and analytics tracking is scoped. No blockers yet — next milestone is locking the hero direction with Amara this week."\n\nWant me to save this as a note or add it to your drafts?',
    createdAt: addDays(today, 0),
  },
]
