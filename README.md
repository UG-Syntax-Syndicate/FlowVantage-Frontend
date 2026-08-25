# FlowVantage-Frontend
This is the frontend Repository for Flow Vantage, a centralized, web-based project management platform that replaces multiple disconnected applications with a single workspace for managing projects, contacts, calendars, emails, notes, and AI-assisted project organization.

## Authentication & account management

This project includes a fully functional Firebase-powered authentication and account-management system: email/password + Google + Microsoft sign-in, email verification, password reset, inactivity session timeout, and an account settings page (profile/avatar, change email, change password, notification preferences, data export, account deletion). All other dashboard modules (Projects, Contacts, Calendar, Email, Notes, AI Assistant) are placeholder screens for now.

### Local setup

1. Copy `.env.example` to `.env`.
2. Fill in your Firebase web app credentials (Project settings → General → Your apps).
3. Install dependencies: `npm install`
4. Start locally: `npm run dev`

No new environment variables are required beyond the 6 already listed in `.env.example` — Firestore and Storage use the same Firebase app config as Auth.

### Backend integration (optional)

This frontend can pair with the sibling `FlowVantage-Backend` repo (Express + SQLite + Firebase Admin): after every Firebase sign-in, `src/context/AuthProvider.tsx` exchanges the Firebase ID token for a backend session token via `POST /api/v1/auth/login` (`src/lib/backendApi.ts`), and `UserMenu` best-effort calls `POST /api/v1/auth/logout` on sign-out. This is intentionally **non-blocking** — if the backend isn't running or isn't deployed, auth and account management keep working entirely through Firebase, with only a console warning logged.

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
