import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AuthLoadingOverlay } from './components/auth/AuthLoadingOverlay'
import { PublicOnlyRoute } from './routes/PublicOnlyRoute'
import { ProtectedRoute } from './routes/ProtectedRoute'

import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { AuthActionPage } from './pages/auth/AuthActionPage'
import { VerifyEmailPendingPage } from './pages/auth/VerifyEmailPendingPage'
import { SetupTwoFactorPage } from './pages/auth/SetupTwoFactorPage'

import { DashboardLayout } from './components/dashboard/DashboardLayout'
import { NotFoundPage } from './pages/NotFoundPage'

// Route-level code-splitting: each dashboard module ships as its own chunk
// instead of inflating the single bundle every auth-only visitor downloads.
const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome').then((m) => ({ default: m.DashboardHome })))
const ProjectsPage = lazy(() => import('./pages/dashboard/ProjectsPage').then((m) => ({ default: m.ProjectsPage })))
const ProjectDetailPage = lazy(() =>
  import('./pages/dashboard/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })),
)
const FolderProjectsPage = lazy(() =>
  import('./pages/dashboard/FolderProjectsPage').then((m) => ({ default: m.FolderProjectsPage })),
)
const ProjectDocumentsPage = lazy(() =>
  import('./pages/dashboard/ProjectDocumentsPage').then((m) => ({ default: m.ProjectDocumentsPage })),
)
const ContactsPage = lazy(() => import('./pages/dashboard/ContactsPage').then((m) => ({ default: m.ContactsPage })))
const CalendarPage = lazy(() => import('./pages/dashboard/CalendarPage').then((m) => ({ default: m.CalendarPage })))
const EmailPage = lazy(() => import('./pages/dashboard/EmailPage').then((m) => ({ default: m.EmailPage })))
const NotesPage = lazy(() => import('./pages/dashboard/NotesPage').then((m) => ({ default: m.NotesPage })))
const GlobalSearchPage = lazy(() =>
  import('./pages/dashboard/GlobalSearchPage').then((m) => ({ default: m.GlobalSearchPage })),
)
const AiAssistantPage = lazy(() =>
  import('./pages/dashboard/AiAssistantPage').then((m) => ({ default: m.AiAssistantPage })),
)
const AccountSettingsPage = lazy(() =>
  import('./pages/dashboard/AccountSettingsPage').then((m) => ({ default: m.AccountSettingsPage })),
)
const AccountTab = lazy(() =>
  import('./pages/dashboard/account/AccountTab').then((m) => ({ default: m.AccountTab })),
)
const NotificationsTab = lazy(() =>
  import('./pages/dashboard/account/NotificationsTab').then((m) => ({ default: m.NotificationsTab })),
)
const SettingsComingSoon = lazy(() =>
  import('./pages/dashboard/account/SettingsComingSoon').then((m) => ({ default: m.SettingsComingSoon })),
)

function RouteFallback() {
  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-100 border-t-primary" />
    </div>
  )
}

function RootRedirect() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <AuthLoadingOverlay />
  }

  return <Navigate to={currentUser ? '/dashboard' : '/login'} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route path="/auth/action" element={<AuthActionPage />} />
      <Route path="/verify-email-pending" element={<VerifyEmailPendingPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/setup-two-factor" element={<SetupTwoFactorPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<RouteFallback />}>
                <DashboardHome />
              </Suspense>
            }
          />
          <Route
            path="projects"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ProjectsPage />
              </Suspense>
            }
          />
          <Route
            path="projects/:projectId"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ProjectDetailPage />
              </Suspense>
            }
          />
          <Route
            path="projects/folders/:folderId"
            element={
              <Suspense fallback={<RouteFallback />}>
                <FolderProjectsPage />
              </Suspense>
            }
          />
          <Route
            path="projects/:projectId/documents"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ProjectDocumentsPage />
              </Suspense>
            }
          />
          <Route
            path="contacts"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ContactsPage />
              </Suspense>
            }
          />
          <Route
            path="calendar"
            element={
              <Suspense fallback={<RouteFallback />}>
                <CalendarPage />
              </Suspense>
            }
          />
          <Route
            path="email"
            element={
              <Suspense fallback={<RouteFallback />}>
                <EmailPage />
              </Suspense>
            }
          />
          <Route
            path="notes"
            element={
              <Suspense fallback={<RouteFallback />}>
                <NotesPage />
              </Suspense>
            }
          />
          <Route
            path="search"
            element={
              <Suspense fallback={<RouteFallback />}>
                <GlobalSearchPage />
              </Suspense>
            }
          />
          <Route
            path="ai-assistant"
            element={
              <Suspense fallback={<RouteFallback />}>
                <AiAssistantPage />
              </Suspense>
            }
          />
          <Route
            path="account"
            element={
              <Suspense fallback={<RouteFallback />}>
                <AccountSettingsPage />
              </Suspense>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<RouteFallback />}>
                  <AccountTab />
                </Suspense>
              }
            />
            <Route
              path="notifications"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <NotificationsTab />
                </Suspense>
              }
            />
            <Route
              path="integrations"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <SettingsComingSoon
                    title="Integrations"
                    description="Connect third-party apps and integrations. Coming soon."
                  />
                </Suspense>
              }
            />
            <Route
              path="language"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <SettingsComingSoon
                    title="Language & Region"
                    description="Choose your preferred language, timezone, and date format. Coming soon."
                  />
                </Suspense>
              }
            />
            <Route
              path="workspace/general"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <SettingsComingSoon
                    title="Workspace general settings"
                    description="Manage your workspace name, logo, and defaults. Coming soon."
                  />
                </Suspense>
              }
            />
            <Route
              path="workspace/members"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <SettingsComingSoon
                    title="Members"
                    description="Invite teammates and manage workspace roles. Coming soon."
                  />
                </Suspense>
              }
            />
            <Route
              path="workspace/billing"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <SettingsComingSoon title="Billing" description="Manage your plan and payment details. Coming soon." />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
