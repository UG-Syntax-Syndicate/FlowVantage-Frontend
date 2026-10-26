# FlowVantage-Frontend
This is the frontend Repository for Flow Vantage, a centralized, web-based project management platform that replaces multiple disconnected applications with a single workspace for managing projects, contacts, calendars, emails, notes, and AI-assisted project organization.

## Authentication & account management

This project includes a fully functional Firebase-powered authentication and account-management system: email/password + Google + Microsoft sign-in, email verification, password reset, inactivity session timeout, and an account settings page (profile/avatar, change email, change password, notification preferences, data export, account deletion).

## Dashboard modules

The dashboard modules are **not** placeholders — they read and write the `FlowVantage-Backend` API through `src/api/` (see the backend-integration section below). Each of the core modules supports full create/read/update/delete from the UI:

| Module | Create | Read | Update | Delete |
| --- | --- | --- | --- | --- |
| Projects | ✅ `CreateProjectModal` | ✅ list, folders, detail page | ✅ `EditProjectModal`, plus inline status and cover image | ✅ from the project's ⋯ menu (confirm by typing the name) |
| Tasks | ✅ `CreateTaskModal` | ✅ list, board, gantt, calendar | ✅ same modal in edit mode, plus inline status | ✅ from the task detail modal |
| Todos | ✅ inline in `TodosPanel` | ✅ project panel and calendar | ✅ rename + done toggle | ✅ from the todo detail modal |
| Contacts | ✅ `AddContactModal`, plus CSV/AI bulk import | ✅ table, detail modal | ✅ same modal in edit mode | ✅ from the row or the detail modal, or several at once by selecting them |
| Notes | ✅ `NoteFormModal` with a Markdown editor | ✅ cards, view modal (rendered Markdown) | ✅ same modal, plus pin toggle | ✅ from the view modal |
| Calendar events | ✅ "Add event" on the Calendar page | ✅ month/week/day views, event sheet | ✅ from the event sheet | ✅ from the event sheet |

Notes support rich text: the editor writes Markdown (bold, italics, bulleted and numbered lists, links, with a preview toggle) and the view modal renders it. Plain-text notes written before this still render unchanged, because plain text is valid Markdown.

Search (`/dashboard/search`) covers projects, tasks, contacts and notes. Projects, tasks and contacts are matched against the already-cached workspace data; notes go through the backend's `GET /notes/search`, so a note's body and tags are searched too, not just what its card shows.

## Integrations

Settings → Integrations is a grid of tiles. Clicking one opens that integration's own page, where connecting is a single button — no expanding panels, and no inline configuration that makes one integration look different from the rest.

Connection state always comes from the server, never from a hand-maintained list in the frontend, so a tile cannot claim something untrue. Each one shows **Connected**, **Not connected**, or **Unavailable on this server** — the last meaning the deployment has no vendor credentials, which the page explains instead of offering a button that would fail.

Connecting works one of two ways, decided by the vendor:

- **Sign in at the vendor** (Google, Outlook, Slack, Dropbox, Zoom) — you are sent to their own login, approve access, and come straight back. FlowVantage never sees your password.

  **Google is one sign-in for Calendar, Gmail and Drive.** Google issues a single authorisation per app per user, so connecting Google once turns on all three; the Gmail and Drive tiles are backed by that connection rather than asking you to sign in to the same account again. Unticking a product on Google's consent screen just leaves that tile disconnected.
- **Paste credentials** (Yuki, PerfectView) — neither offers a sign-in for third-party apps, so each takes the API credentials it does issue. They are encrypted before storage and never shown again.

WhatsApp and Google Calendar keep their own pages with their own settings (phone verification, sync-now) because both have more state than "connected or not".

Every integration can be disconnected from its own page. Gmail and Drive are backed by the Google connection, so theirs points at Google rather than offering a button that would appear to work and revoke nothing. Disconnecting Google unlinks Calendar with it.

When a provider has no credentials on the server, its page does not dead-end: it shows how to create them in that vendor's console, and the exact redirect URI to register — read from the server, so it matches what the API will actually send. The backend's `docs/integrations-setup.md` covers the same ground outside the app. Yuki and PerfectView need nothing from the server, since users supply their own credentials.

For Yuki and PerfectView, Connect opens a dialog with the vendor's own navigation steps beside the fields — both hide their credentials behind a role-gated menu most users have never opened, so the hard part is finding the screen, not pasting the key.

Once connected, a provider's page lists what the connection allows (read messages, send messages, upload files, push invoices…). That list comes from the backend's adapter registry, so it cannot claim an operation the server has no code for.

Reading and writing goes through one generic client — `readProviderData(provider, resource, params)` and `writeProviderData(provider, resource, body)` in `src/api/integrationsApi.ts`, with `useProviderData` / `useWriteProviderData` hooks. Every provider is reached the same way, so a feature needing Gmail messages or Slack channels does not need its own client. The in-app features that will use it (sending project mail through a connected mailbox, posting activity to Slack, attaching from Drive) are the next step.

Email composed in the app is stored against the workspace rather than sent, because no mailbox is connected for sending yet; the Email page and the composer both say so and link here.

Still outstanding: Outlook/Gmail mailbox connection and email auto-matching, "Join meeting" rooms (waiting on the Zoom integration), the AI summary/reminder features, project timeline/milestones, project archiving, contact tagging, and GDPR export/deletion. Language and Billing settings are deliberate "coming soon" screens.

### Local setup

1. Copy `.env.example` to `.env`.
2. Fill in your Firebase web app credentials (Project settings → General → Your apps).
3. Install dependencies: `npm install`
4. Start locally: `npm run dev`

No new environment variables are required beyond the 6 already listed in `.env.example` — Firestore and Storage use the same Firebase app config as Auth.

### Backend integration

This frontend pairs with the sibling `FlowVantage-Backend` repo (Express + Postgres + Firebase Admin): after every Firebase sign-in, `src/context/AuthProvider.tsx` exchanges the Firebase ID token for a backend session token via `POST /api/v1/auth/login` (`src/lib/backendApi.ts`), and `UserMenu` best-effort calls `POST /api/v1/auth/logout` on sign-out. This is intentionally **non-blocking** — if the backend isn't running or isn't deployed, auth and account management keep working entirely through Firebase, with only a console warning logged.

To use it locally:
1. Run `FlowVantage-Backend` (`npm install && npm run dev`) with its `FIREBASE_PROJECT_ID` set to the **same** Firebase project as this frontend's `VITE_FIREBASE_PROJECT_ID`, and its `CLIENT_ORIGIN` set to `http://localhost:5173`.
2. Set `VITE_BACKEND_API_BASE_URL` here to wherever it's running (defaults to `http://localhost:3000/api/v1`).

Account management (profile, avatar, password, email, notifications, data export, account deletion) intentionally stays Firebase-direct — the backend is not called for any of that, only for session issuance.

### Firebase console setup (required before auth fully works)

1. **Firestore Database** — create it (Native mode, any region).
2. **Cloud Storage** — enable the default bucket (already referenced by `VITE_FIREBASE_STORAGE_BUCKET`).
3. **Authentication → Sign-in method**:
   - Confirm **Email/Password** is enabled.
   - Enable **Google**.
   - Add **Microsoft**: register an app in the [Azure Portal](https://portal.azure.com) (App registrations → New registration), generate a client secret, then paste the Application (client) ID + secret into Firebase's Microsoft provider config. Set the redirect URI Firebase shows you (`https://<project-id>.firebaseapp.com/__/auth/handler`) in the Azure app's redirect URIs.
4. **Authentication → Settings → Authorized domains** — add your production domain (e.g. your Vercel domain). `localhost` is already authorized by default for local dev. Note: Google/Microsoft sign-in popups won't work on ephemeral Vercel preview-deployment URLs, only on `localhost` and your fixed production/custom domain.
5. **Authentication → Templates** — for both "Email address verification" and "Password reset" templates, set the **Action URL** to `https://<your-domain>/auth/action` (and separately test locally against `http://localhost:5173/auth/action` if needed).
6. **Firestore rules** — paste into the Rules tab:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
       match /auditLogs/{id} {
         allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
         allow read, update, delete: if false;
       }
     }
   }
   ```
7. **Storage rules** — paste into the Rules tab:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /avatars/{uid}/{fileName} {
         allow read: if true;
         allow write: if request.auth != null
           && request.auth.uid == uid
           && request.resource.size < 2 * 1024 * 1024
           && request.resource.contentType.matches('image/.*');
       }
     }
   }
   ```

### Deploying to Vercel

The app is a static Vite build with `vercel.json` already configured for client-side routing. To deploy:

1. Import the repo into Vercel (Framework Preset: Vite, auto-detected).
2. Set the same 6 `VITE_FIREBASE_*` environment variables from `.env.example` in the Vercel project's Environment Variables settings.
3. Complete the Firebase console setup above, including adding your production Vercel domain to Firebase's authorized domains and email template Action URLs.
4. Deploy.

Two-factor authentication is intentionally deferred to a later phase (it requires upgrading to Firebase's paid Blaze plan for SMS-based MFA).
