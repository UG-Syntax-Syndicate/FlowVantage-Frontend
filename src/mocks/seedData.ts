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

// Was 10 hard-coded demo messages pointing at mock project ids ('p1', 'p2', ...)
// that no longer exist now that projects are real backend records - Email is
// still locked behind "coming soon" (see the module comment above), so an
// empty inbox is the honest state rather than stale, unclickable-through demo
// content.
export const MOCK_EMAILS: Email[] = []

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
