import type {
  ChatMessage,
  Contact,
  Email,
  Folder,
  Meeting,
  Member,
  Note,
  Project,
  ProjectDocument,
  Task,
  Todo,
} from '../types/project'
import { getPersonPhoto, pickAvatar } from '../lib/avatars'

function addDays(base: Date, days: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function atHour(base: Date, dayOffset: number, hour: number, minute = 0): string {
  const d = new Date(base)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

const today = new Date()

export const MOCK_MEMBERS: Member[] = [
  { id: 'u1', name: 'Werner Osei', photoURL: getPersonPhoto('Werner Osei') },
  { id: 'u2', name: 'Ellie Novak', photoURL: getPersonPhoto('Ellie Novak') },
  { id: 'u3', name: 'Marcus Reid', photoURL: getPersonPhoto('Marcus Reid') },
  { id: 'u4', name: 'Priya Shah', photoURL: getPersonPhoto('Priya Shah') },
  { id: 'u5', name: 'Daniel Cho', photoURL: getPersonPhoto('Daniel Cho') },
  { id: 'u6', name: 'Amara Bello', photoURL: getPersonPhoto('Amara Bello') },
]

interface ContactSeed {
  company: string
  contactName: string
  role: string
  email: string
  niche: string
  status: Contact['status']
  stage: Contact['stage']
}

const CONTACT_SEEDS: ContactSeed[] = [
  { company: 'Zephyr Marketing', contactName: 'Jessica Miller', role: 'CMO', email: 'jessica@zephyr.co', niche: 'Marketing', status: 'new_client', stage: 'in_progress' },
  { company: 'BoldFrame', contactName: 'Rachel Kim', role: 'CEO', email: 'rachel@bframe.co', niche: 'Creative', status: 'potential_client', stage: 'proposal_sent' },
  { company: 'NeuraTech', contactName: 'David Lin', role: 'CTO', email: 'david@neuratech.ai', niche: 'Medical', status: 'old_client', stage: 'in_progress' },
  { company: 'Casa Loma', contactName: 'Isabella Conte', role: 'Owner', email: 'isabella@casaloma.it', niche: 'Real estate', status: 'old_client', stage: 'completed' },
  { company: 'Adspire', contactName: 'Lucas Meyer', role: 'CEO', email: 'lucas@adspire.io', niche: 'Marketing', status: 'blacklist', stage: 'rejected' },
  { company: 'Healora', contactName: 'Dr. Nadia Patel', role: 'Owner', email: 'nadia@healora.org', niche: 'Medical', status: 'new_client', stage: 'in_progress' },
  { company: 'Orbit Creators', contactName: 'Kenji Yamato', role: 'PM', email: 'kenji@orbit.jp', niche: 'Influencers', status: 'new_client', stage: 'in_progress' },
  { company: 'Archipoint', contactName: 'Sofia Novak', role: 'Founder', email: 'sofia@archipoint.co', niche: 'Creative', status: 'old_client', stage: 'completed' },
  { company: 'NomadLab', contactName: 'Alex Wu', role: 'Ops Lead', email: 'alex@nomadlab.co', niche: 'Marketing', status: 'potential_client', stage: 'proposal_sent' },
  { company: 'Nova Estates', contactName: 'Elena Sanchez', role: 'CMO', email: 'elena@nova.co.uk', niche: 'Real estate', status: 'old_client', stage: 'in_progress' },
  { company: 'Pulse Health', contactName: 'Dr. Thomas Kline', role: 'Owner', email: 'thomas@pulse.io', niche: 'Medical', status: 'old_client', stage: 'in_progress' },
  { company: 'FlowInfluence', contactName: 'Brian Cho', role: 'CEO', email: 'brian@flow.com', niche: 'Influencers', status: 'old_client', stage: 'completed' },
  { company: 'Lumen Realty', contactName: 'Grace Fontaine', role: 'Broker', email: 'grace@lumenrealty.com', niche: 'Real estate', status: 'new_client', stage: 'in_progress' },
  { company: 'Vantage Studios', contactName: 'Omar Haddad', role: 'Creative Director', email: 'omar@vantagestudios.co', niche: 'Creative', status: 'potential_client', stage: 'proposal_sent' },
  { company: 'Northwind Clinics', contactName: 'Dr. Sarah Lee', role: 'Medical Director', email: 'sarah@northwindclinics.com', niche: 'Medical', status: 'old_client', stage: 'completed' },
  { company: 'Bright Path Media', contactName: 'Tyler Brooks', role: 'Growth Lead', email: 'tyler@brightpathmedia.com', niche: 'Marketing', status: 'new_client', stage: 'in_progress' },
  { company: 'Muse Collective', contactName: 'Amelia Ross', role: 'Founder', email: 'amelia@musecollective.co', niche: 'Influencers', status: 'potential_client', stage: 'proposal_sent' },
  { company: 'Cedar & Stone Realty', contactName: 'Marcus Webb', role: 'Principal', email: 'marcus@cedarstone.com', niche: 'Real estate', status: 'blacklist', stage: 'rejected' },
  { company: 'Harbor Design Co.', contactName: 'Lena Fischer', role: 'Art Director', email: 'lena@harbordesign.co', niche: 'Creative', status: 'new_client', stage: 'in_progress' },
  { company: 'Vitality Wellness', contactName: 'Dr. Priya Nair', role: 'Founder', email: 'priya@vitalitywellness.com', niche: 'Medical', status: 'potential_client', stage: 'proposal_sent' },
  { company: 'Ember Growth', contactName: 'Chris Donovan', role: 'Head of Marketing', email: 'chris@embergrowth.io', niche: 'Marketing', status: 'old_client', stage: 'in_progress' },
  { company: 'Skyline Influence', contactName: 'Nina Osei', role: 'Talent Manager', email: 'nina@skylineinfluence.com', niche: 'Influencers', status: 'old_client', stage: 'completed' },
  { company: 'Meridian Properties', contactName: 'Jonathan Blake', role: 'CEO', email: 'jonathan@meridianprops.com', niche: 'Real estate', status: 'new_client', stage: 'in_progress' },
  { company: 'Pixel & Ink', contactName: 'Yara Haddad', role: 'Studio Lead', email: 'yara@pixelandink.co', niche: 'Creative', status: 'potential_client', stage: 'proposal_sent' },
  { company: 'Clearview Health Group', contactName: 'Dr. Marcus Reid', role: 'Chief Medical Officer', email: 'marcus.reid@clearviewhealth.com', niche: 'Medical', status: 'blacklist', stage: 'rejected' },
  { company: 'Catalyst Brands', contactName: 'Sophie Turner', role: 'VP Marketing', email: 'sophie@catalystbrands.com', niche: 'Marketing', status: 'new_client', stage: 'in_progress' },
  { company: 'Wanderlist Media', contactName: 'Diego Alvarez', role: 'Creator Relations', email: 'diego@wanderlistmedia.com', niche: 'Influencers', status: 'potential_client', stage: 'proposal_sent' },
  { company: 'Ironwood Realty Group', contactName: 'Claire Bennett', role: 'Managing Broker', email: 'claire@ironwoodrealty.com', niche: 'Real estate', status: 'old_client', stage: 'completed' },
  { company: 'Studio Verve', contactName: 'Noah Kim', role: 'Creative Partner', email: 'noah@studioverve.co', niche: 'Creative', status: 'new_client', stage: 'in_progress' },
  { company: 'Everwell Medical', contactName: 'Dr. Amara Bello', role: 'Practice Owner', email: 'amara.bello@everwellmed.com', niche: 'Medical', status: 'old_client', stage: 'in_progress' },
  { company: 'Momentum Digital', contactName: 'Jake Sullivan', role: 'Performance Lead', email: 'jake@momentumdigital.com', niche: 'Marketing', status: 'potential_client', stage: 'proposal_sent' },
  { company: 'Halo Creators Network', contactName: 'Mia Chen', role: 'Partnerships', email: 'mia@halocreators.com', niche: 'Influencers', status: 'new_client', stage: 'in_progress' },
]

export const MOCK_CONTACTS: Contact[] = CONTACT_SEEDS.map((seed, index) => ({
  id: `c${index + 1}`,
  company: seed.company,
  contactName: seed.contactName,
  role: seed.role,
  email: seed.email,
  photoURL: pickAvatar(seed.email),
  status: seed.status,
  niche: seed.niche,
  stage: seed.stage,
  createdAt: addDays(today, -(index * 3 + 1)),
}))

export const MOCK_FOLDERS: Folder[] = [
  { id: 'f1', name: 'Team Projects', icon: 'users', color: '#ec4899', createdAt: addDays(today, -150) },
  { id: 'f2', name: 'Collaborations', icon: 'handshake', color: '#22c55e', createdAt: addDays(today, -150) },
  { id: 'f3', name: 'Personal Projects', icon: 'user', color: '#f59e0b', createdAt: addDays(today, -150) },
  { id: 'f4', name: 'Charities', icon: 'heart', color: '#0ea5e9', createdAt: addDays(today, -150) },
  { id: 'f5', name: 'Self-improvement', icon: 'sparkles', color: '#8b5cf6', createdAt: addDays(today, -150) },
  { id: 'f6', name: 'Influencing & Brand', icon: 'megaphone', color: '#6366f1', createdAt: addDays(today, -150) },
]

export const GRADIENTS = {
  sunset: 'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #ec4899 100%)',
  violet: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
  amber: 'linear-gradient(135deg, #f59e0b 0%, #fb923c 50%, #f43f5e 100%)',
  ocean: 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 50%, #34d399 100%)',
  dusk: 'linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #0ea5e9 100%)',
  bloom: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #fbbf24 100%)',
}

export const GRADIENT_PALETTE = Object.values(GRADIENTS)
export const PROJECT_COLOR_PALETTE = ['#ec721d', '#6366f1', '#0ea5e9', '#22c55e', '#a855f7', '#f43f5e']
export const FOLDER_COLOR_PALETTE = ['#ec4899', '#22c55e', '#f59e0b', '#0ea5e9', '#8b5cf6', '#6366f1']

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Hikoko Design System',
    tagline: 'A design system for every FlowVantage surface',
    description: 'Build the shared component library and design tokens.',
    status: 'in_progress',
    color: '#ec721d',
    image: null,
    coverGradient: GRADIENTS.sunset,
    tags: ['Design System', 'AI', 'Team'],
    category: 'Design',
    folderId: 'f1',
    priority: 'high',
    trackedSeconds: 141_600,
    memberIds: ['u1', 'u2', 'u3'],
    startDate: addDays(today, -18),
    dueDate: addDays(today, 12),
    createdAt: addDays(today, -20),
  },
  {
    id: 'p2',
    name: 'Mobile App Revamp',
    tagline: 'Faster, offline-first field operations',
    description: 'Redesign the mobile experience for the field-ops team.',
    status: 'in_progress',
    color: '#6366f1',
    image: null,
    coverGradient: GRADIENTS.violet,
    tags: ['Mobile', 'UX', '3 People'],
    category: 'Product',
    folderId: 'f1',
    priority: 'high',
    trackedSeconds: 96_300,
    memberIds: ['u2', 'u4', 'u5'],
    startDate: addDays(today, -10),
    dueDate: addDays(today, 20),
    createdAt: addDays(today, -12),
  },
  {
    id: 'p3',
    name: 'Q3 Marketing Site',
    tagline: 'Landing pages built for the Q3 push',
    description: 'Landing pages and campaign tracking for the Q3 launch.',
    status: 'planning',
    color: '#0ea5e9',
    image: null,
    coverGradient: GRADIENTS.ocean,
    tags: ['Marketing', 'Growth'],
    category: 'Marketing',
    folderId: 'f6',
    priority: 'medium',
    trackedSeconds: 18_000,
    memberIds: ['u1', 'u6'],
    startDate: addDays(today, 2),
    dueDate: addDays(today, 30),
    createdAt: addDays(today, -3),
  },
  {
    id: 'p4',
    name: 'Billing Migration',
    tagline: 'Safer billing, zero downtime',
    description: 'Move subscription billing onto the new payments provider.',
    status: 'on_hold',
    color: '#94a3b8',
    image: null,
    coverGradient: GRADIENTS.dusk,
    tags: ['Finance', 'Migration'],
    category: 'Engineering',
    folderId: 'f2',
    priority: 'urgent',
    trackedSeconds: 205_200,
    memberIds: ['u3', 'u5'],
    startDate: addDays(today, -25),
    dueDate: addDays(today, 5),
    createdAt: addDays(today, -30),
  },
  {
    id: 'p5',
    name: 'Customer Onboarding Flow',
    tagline: 'Faster time-to-value for new teams',
    description: 'Reduce time-to-first-value for new workspace signups.',
    status: 'completed',
    color: '#22c55e',
    image: null,
    coverGradient: GRADIENTS.bloom,
    tags: ['Onboarding', 'Growth', 'Shipped'],
    category: 'Growth',
    folderId: 'f2',
    priority: 'medium',
    trackedSeconds: 288_000,
    memberIds: ['u1', 'u4', 'u6'],
    startDate: addDays(today, -40),
    dueDate: addDays(today, -5),
    createdAt: addDays(today, -45),
  },
  {
    id: 'p6',
    name: 'Community Meetup Series',
    tagline: 'Bringing the local dev community together',
    description: 'Plan and run a quarterly meetup series for local developers.',
    status: 'planning',
    color: '#0ea5e9',
    image: null,
    coverGradient: GRADIENTS.amber,
    tags: ['Community', 'Nonprofit'],
    category: 'Fashion',
    folderId: 'f4',
    priority: 'low',
    trackedSeconds: 7_200,
    memberIds: ['u6', 'u2'],
    startDate: addDays(today, 5),
    dueDate: addDays(today, 45),
    createdAt: addDays(today, -2),
  },
  {
    id: 'p7',
    name: 'Personal Reading List',
    tagline: 'A curated stack for leveling up',
    description: 'Track books and courses for this quarter’s learning goals.',
    status: 'in_progress',
    color: '#8b5cf6',
    image: null,
    coverGradient: GRADIENTS.violet,
    tags: ['Learning', 'Personal'],
    category: 'Growth',
    folderId: 'f5',
    priority: 'low',
    trackedSeconds: 32_400,
    memberIds: ['u1'],
    startDate: addDays(today, -30),
    dueDate: addDays(today, 60),
    createdAt: addDays(today, -30),
  },
]

export const MOCK_TODOS: Todo[] = [
  { id: 'td1', projectId: 'p1', title: 'Sync token naming with brand team', done: false, tags: ['Design', 'Sync'], dueDate: addDays(today, 4), createdAt: addDays(today, -1) },
  { id: 'td2', projectId: 'p1', title: 'Order a new design review monitor', done: true, tags: ['Shopping'], dueDate: addDays(today, -2), createdAt: addDays(today, -6) },
  { id: 'td3', projectId: 'p2', title: 'Test offline mode on an old Android', done: false, tags: ['QA'], dueDate: addDays(today, 6), createdAt: addDays(today, -2) },
  { id: 'td4', projectId: 'p3', title: 'Draft social captions for launch day', done: false, tags: ['Marketing'], dueDate: addDays(today, 3), createdAt: addDays(today, -1) },
  { id: 'td5', projectId: 'p4', title: 'Schedule downtime window with support', done: false, tags: ['Ops'], dueDate: addDays(today, 2), createdAt: addDays(today, -4) },
  { id: 'td6', projectId: 'p5', title: 'Send retro invite to the team', done: true, tags: ['Team'], dueDate: addDays(today, -8), createdAt: addDays(today, -9) },
  { id: 'td7', projectId: 'p6', title: 'Confirm venue deposit', done: false, tags: ['Budget'], dueDate: addDays(today, 10), createdAt: addDays(today, -3) },
  { id: 'td8', projectId: 'p7', title: 'Order the design-systems course', done: true, tags: ['Books'], dueDate: addDays(today, -5), createdAt: addDays(today, -7) },
  { id: 'td9', projectId: 'p7', title: 'Cancel unused course subscription', done: false, tags: ['Admin'], dueDate: addDays(today, 5), createdAt: today.toISOString() },
]

export const MOCK_NOTES: Note[] = [
  {
    id: 'n1',
    projectId: 'p1',
    title: 'Component naming conventions',
    body: 'Keep it BEM-ish: block-element--modifier, all lowercase, no abbreviations. Every primitive gets its own folder with a colocated stories file. When in doubt, name it after what it renders, not where it is used, so it stays reusable across surfaces.',
    excerpt: 'Keep it BEM-ish: block-element--modifier, all lowercase, no abbreviations.',
    color: 'blue',
    pinned: true,
    tags: ['Design'],
    createdAt: addDays(today, -1),
  },
  {
    id: 'n2',
    projectId: 'p2',
    title: 'Ideas for the onboarding tour',
    body: 'Three-step tour max. Skip button always visible. Test with a first-time field user before shipping to the whole cohort. Keep copy under two sentences per step, and point at real UI instead of a floating illustration.',
    excerpt: 'Three-step tour max. Skip button always visible. Test with a first-time field user.',
    color: 'green',
    pinned: false,
    tags: ['UX'],
    createdAt: addDays(today, -2),
  },
  {
    id: 'n3',
    projectId: 'p4',
    title: 'Rollback plan draft',
    body: 'Keep the old billing path live in read-only mode for two weeks post-cutover. Mirror writes to both systems during the transition window, and alert on any diff between the two ledgers bigger than a cent.',
    excerpt: 'Keep the old billing path live in read-only mode for two weeks post-cutover.',
    color: 'purple',
    pinned: false,
    tags: ['Ops'],
    createdAt: addDays(today, -4),
  },
  {
    id: 'n4',
    projectId: 'p5',
    title: 'Retro takeaways',
    body: 'Guided checklist cut time-to-first-value by half. Do this for every new flow going forward. The biggest win came from removing optional steps entirely rather than just making them collapsible.',
    excerpt: 'Guided checklist cut time-to-first-value by half. Do this for every new flow.',
    color: 'yellow',
    pinned: false,
    tags: ['Growth'],
    createdAt: addDays(today, -9),
  },
  {
    id: 'n5',
    projectId: 'p6',
    title: 'Speaker outreach list',
    body: 'Reach out to last year’s attendees first — warmer leads than cold outreach. Aim for a mix of one senior name and one first-time speaker per meetup to keep the lineup approachable.',
    excerpt: 'Reach out to last year’s attendees first — warmer leads than cold outreach.',
    color: 'red',
    pinned: false,
    tags: ['Community'],
    createdAt: addDays(today, -3),
  },
  {
    id: 'n6',
    projectId: 'p7',
    title: 'Quotes worth remembering',
    body: '"All models are wrong, but some are useful." Keep this in mind for the systems book — the goal isn’t a perfect model, it’s one that changes how you’d act.',
    excerpt: '"All models are wrong, but some are useful." Keep this in mind for the systems book.',
    color: 'gray',
    pinned: true,
    tags: ['Learning'],
    createdAt: today.toISOString(),
  },
  {
    id: 'n7',
    projectId: null,
    title: 'Workspace conventions',
    body: 'New projects default to the Team Projects folder unless they are personal. Every project needs at least one tag before it leaves the planning status, so the folder filters stay useful.',
    excerpt: 'New projects default to the Team Projects folder unless they are personal.',
    color: 'blue',
    pinned: false,
    tags: ['Workspace'],
    createdAt: addDays(today, -6),
  },
]

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

function placeholderImageDataUrl(label: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="480" height="320" fill="${color}"/><text x="50%" y="50%" font-family="sans-serif" font-size="28" fill="white" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function csvDataUrl(rows: string[][]): string {
  const csv = rows.map((row) => row.join(',')).join('\n')
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
}

export const MOCK_DOCUMENTS: ProjectDocument[] = [
  {
    id: 'd1',
    projectId: 'p1',
    name: 'Design-Tokens-Audit.csv',
    mimeType: 'text/csv',
    dataUrl: csvDataUrl([
      ['Token', 'Category', 'Value', 'Status'],
      ['color-primary', 'Color', '#ec721d', 'Approved'],
      ['color-navy', 'Color', '#0d062d', 'Approved'],
      ['spacing-sm', 'Spacing', '8px', 'Approved'],
      ['spacing-md', 'Spacing', '16px', 'In review'],
      ['radius-lg', 'Radius', '16px', 'Approved'],
    ]),
    size: 2_400,
    uploadedAt: addDays(today, -3),
  },
  {
    id: 'd2',
    projectId: 'p1',
    name: 'Component-Cover.png',
    mimeType: 'image/svg+xml',
    dataUrl: placeholderImageDataUrl('Component Cover', '#ec721d'),
    size: 18_200,
    uploadedAt: addDays(today, -1),
  },
  {
    id: 'd3',
    projectId: 'p2',
    name: 'Field-Test-Summary.csv',
    mimeType: 'text/csv',
    dataUrl: csvDataUrl([
      ['Device', 'OS', 'Result'],
      ['Pixel 6', 'Android 14', 'Pass'],
      ['iPhone 12', 'iOS 17', 'Pass'],
      ['Galaxy A54', 'Android 13', 'Needs retest'],
    ]),
    size: 1_100,
    uploadedAt: addDays(today, -2),
  },
  {
    id: 'd4',
    projectId: 'p3',
    name: 'Campaign-Moodboard.png',
    mimeType: 'image/svg+xml',
    dataUrl: placeholderImageDataUrl('Campaign Moodboard', '#0ea5e9'),
    size: 24_600,
    uploadedAt: addDays(today, -4),
  },
]

export const MOCK_MEETINGS: Meeting[] = [
  {
    id: 'm1',
    projectId: 'p1',
    title: 'Design system sync',
    withCompany: 'Arc Company',
    startTime: atHour(today, 0, 14, 0),
    endTime: atHour(today, 0, 15, 0),
  },
  {
    id: 'm2',
    projectId: 'p2',
    title: 'Mobile revamp check-in',
    withCompany: 'Field Ops Team',
    startTime: atHour(today, 1, 10, 30),
    endTime: atHour(today, 1, 11, 0),
  },
  {
    id: 'm3',
    projectId: 'p3',
    title: 'Q3 campaign kickoff',
    withCompany: 'Growth Team',
    startTime: atHour(today, 2, 9, 0),
    endTime: atHour(today, 2, 9, 30),
  },
]

let taskSeq = 1
function makeTask(partial: Omit<Task, 'id' | 'createdAt'>): Task {
  return { ...partial, id: `t${taskSeq++}`, createdAt: partial.startDate }
}

export const MOCK_TASKS: Task[] = [
  // Hikoko Design System
  makeTask({ projectId: 'p1', title: 'Define color and spacing tokens', status: 'done', priority: 'high', assigneeIds: ['u1'], startDate: addDays(today, -18), dueDate: addDays(today, -12) }),
  makeTask({ projectId: 'p1', title: 'Build Button and Input primitives', status: 'done', priority: 'medium', assigneeIds: ['u2'], startDate: addDays(today, -14), dueDate: addDays(today, -8) }),
  makeTask({ projectId: 'p1', title: 'Develop Search and Filter Functionality', status: 'in_progress', priority: 'high', assigneeIds: ['u1', 'u3'], startDate: addDays(today, -6), dueDate: addDays(today, 3) }),
  makeTask({ projectId: 'p1', title: 'Document component usage guidelines', status: 'in_progress', priority: 'low', assigneeIds: ['u2'], startDate: addDays(today, -4), dueDate: addDays(today, 6) }),
  makeTask({ projectId: 'p1', title: 'Accessibility audit of core components', status: 'in_review', priority: 'urgent', assigneeIds: ['u3'], startDate: addDays(today, -2), dueDate: addDays(today, -1) }),
  makeTask({ projectId: 'p1', title: 'Publish v1 to the internal registry', status: 'todo', priority: 'medium', assigneeIds: ['u1'], startDate: addDays(today, 4), dueDate: addDays(today, 12) }),

  // Mobile App Revamp
  makeTask({ projectId: 'p2', title: 'Audit current navigation IA', status: 'done', priority: 'medium', assigneeIds: ['u4'], startDate: addDays(today, -10), dueDate: addDays(today, -6) }),
  makeTask({ projectId: 'p2', title: 'Prototype offline sync flow', status: 'in_progress', priority: 'high', assigneeIds: ['u2', 'u5'], startDate: addDays(today, -5), dueDate: addDays(today, 4) }),
  makeTask({ projectId: 'p2', title: 'Team Collaboration workspace screen', status: 'in_progress', priority: 'high', assigneeIds: ['u4'], startDate: addDays(today, -3), dueDate: addDays(today, 2) }),
  makeTask({ projectId: 'p2', title: 'QA pass on Android tablets', status: 'todo', priority: 'medium', assigneeIds: ['u5'], startDate: addDays(today, 6), dueDate: addDays(today, 14) }),
  makeTask({ projectId: 'p2', title: 'Push notification opt-in review', status: 'in_review', priority: 'low', assigneeIds: ['u2'], startDate: addDays(today, -1), dueDate: addDays(today, 1) }),

  // Q3 Marketing Site
  makeTask({ projectId: 'p3', title: 'Draft campaign landing page copy', status: 'todo', priority: 'medium', assigneeIds: ['u6'], startDate: addDays(today, 2), dueDate: addDays(today, 9) }),
  makeTask({ projectId: 'p3', title: 'Wire up analytics tracking plan', status: 'todo', priority: 'low', assigneeIds: ['u1'], startDate: addDays(today, 5), dueDate: addDays(today, 16) }),
  makeTask({ projectId: 'p3', title: 'Design hero and pricing sections', status: 'todo', priority: 'high', assigneeIds: ['u6'], startDate: addDays(today, 3), dueDate: addDays(today, 11) }),

  // Billing Migration
  makeTask({ projectId: 'p4', title: 'Map legacy invoice fields', status: 'done', priority: 'medium', assigneeIds: ['u3'], startDate: addDays(today, -25), dueDate: addDays(today, -18) }),
  makeTask({ projectId: 'p4', title: 'Reconcile historic ledger data', status: 'in_progress', priority: 'urgent', assigneeIds: ['u5'], startDate: addDays(today, -9), dueDate: addDays(today, -2) }),
  makeTask({ projectId: 'p4', title: 'Cut over webhook listeners', status: 'todo', priority: 'high', assigneeIds: ['u3'], startDate: addDays(today, 1), dueDate: addDays(today, 5) }),

  // Customer Onboarding Flow (completed project)
  makeTask({ projectId: 'p5', title: 'Ship guided setup checklist', status: 'done', priority: 'medium', assigneeIds: ['u4'], startDate: addDays(today, -40), dueDate: addDays(today, -30) }),
  makeTask({ projectId: 'p5', title: 'Add in-app product tour', status: 'done', priority: 'medium', assigneeIds: ['u1'], startDate: addDays(today, -30), dueDate: addDays(today, -20) }),
  makeTask({ projectId: 'p5', title: 'Post-launch retro and metrics review', status: 'done', priority: 'low', assigneeIds: ['u6'], startDate: addDays(today, -10), dueDate: addDays(today, -5) }),

  // Community Meetup Series
  makeTask({ projectId: 'p6', title: 'Book a venue for the first meetup', status: 'todo', priority: 'medium', assigneeIds: ['u6'], startDate: addDays(today, 5), dueDate: addDays(today, 18) }),
  makeTask({ projectId: 'p6', title: 'Line up two speakers', status: 'todo', priority: 'high', assigneeIds: ['u2'], startDate: addDays(today, 6), dueDate: addDays(today, 22) }),

  // Personal Reading List
  makeTask({ projectId: 'p7', title: 'Finish "Thinking in Systems"', status: 'in_progress', priority: 'low', assigneeIds: ['u1'], startDate: addDays(today, -10), dueDate: addDays(today, 7) }),
  makeTask({ projectId: 'p7', title: 'Start the design-systems course', status: 'todo', priority: 'low', assigneeIds: ['u1'], startDate: addDays(today, 8), dueDate: addDays(today, 30) }),
]

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'cm1',
    role: 'user',
    content: "What's at risk on Billing Migration?",
    createdAt: atHour(today, 0, 9, 2),
  },
  {
    id: 'cm2',
    role: 'assistant',
    content:
      'Billing Migration is marked urgent priority with a deadline in 5 days. "Cut over webhook listeners" is still To Do and due in 5 days, and "Reconcile historic ledger data" is In Progress but was due 2 days ago — that one is overdue. I\'d confirm with Marcus Reid before the cutover window.',
    createdAt: atHour(today, 0, 9, 3),
  },
  {
    id: 'cm3',
    role: 'user',
    content: 'Summarize everything in progress across my projects.',
    createdAt: atHour(today, 0, 9, 14),
  },
  {
    id: 'cm4',
    role: 'assistant',
    content:
      'You have 5 tasks in progress right now: "Develop Search and Filter Functionality" and "Document component usage guidelines" on Hikoko Design System, "Prototype offline sync flow" and "Team Collaboration workspace screen" on Mobile App Revamp, and "Reconcile historic ledger data" on Billing Migration. Hikoko Design System and Mobile App Revamp both have deadlines within the next three weeks.',
    createdAt: atHour(today, 0, 9, 15),
  },
  {
    id: 'cm5',
    role: 'user',
    content: 'Draft a quick status update I can send about Q3 Marketing Site.',
    createdAt: atHour(today, 0, 9, 26),
  },
  {
    id: 'cm6',
    role: 'assistant',
    content:
      'Here\'s a draft:\n\n"Q3 Marketing Site is in planning with a Sep 30 target. Hero and pricing section designs are queued, campaign copy is in progress, and analytics tracking is scoped. No blockers yet — next milestone is locking the hero direction with Amara this week."\n\nWant me to save this as a note or add it to your drafts?',
    createdAt: atHour(today, 0, 9, 27),
  },
]
