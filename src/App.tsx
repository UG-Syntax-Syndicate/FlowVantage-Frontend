import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AuthLoadingOverlay } from './components/auth/AuthLoadingOverlay'
import { BrandedLoadingOverlay } from './components/common/BrandedLoadingOverlay'
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
const NotesPage = lazy(() => import('./pages/dashboard/NotesPage').then((m) => ({ default: m.NotesPage })))
const GlobalSearchPage = lazy(() =>
  import('./pages/dashboard/GlobalSearchPage').then((m) => ({ default: m.GlobalSearchPage })),
)
// EmailPage and AiAssistantPage stay in the tree (working, mock-backed UI)
// but are deliberately unreferenced here - both routes render ComingSoonPage
// instead, since neither has a real backend yet. See navItems.ts/Sidebar.tsx
// for the matching locked nav-item treatment.
const AccountSettingsPage = lazy(() =>
  import('./pages/dashboard/AccountSettingsPage').then((m) => ({ default: m.AccountSettingsPage })),
)
const AccountTab = lazy(() =>
  import('./pages/dashboard/account/AccountTab').then((m) => ({ default: m.AccountTab })),
)
const NotificationsTab = lazy(() =>
  import('./pages/dashboard/account/NotificationsTab').then((m) => ({ default: m.NotificationsTab })),
)
const WorkspaceGeneralTab = lazy(() =>
  import('./pages/dashboard/account/WorkspaceGeneralTab').then((m) => ({ default: m.WorkspaceGeneralTab })),
)
const WorkspaceMembersTab = lazy(() =>
  import('./pages/dashboard/account/WorkspaceMembersTab').then((m) => ({ default: m.WorkspaceMembersTab })),
)
const InviteAcceptPage = lazy(() =>
  import('./pages/InviteAcceptPage').then((m) => ({ default: m.InviteAcceptPage })),
)
const ComingSoonPage = lazy(() =>
  import('./components/dashboard/ComingSoonPage').then((m) => ({ default: m.ComingSoonPage })),
)

function RouteFallback() {
  return (
    <div className="relative h-full min-h-[50vh]">
      <BrandedLoadingOverlay />
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
        <Route
          path="/invite/:token"
          element={
            <Suspense fallback={<RouteFallback />}>
              <InviteAcceptPage />
            </Suspense>
          }
        />
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
                <ComingSoonPage title="Email" description="A unified inbox for project and client email. Coming soon." />
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
                <ComingSoonPage
                  title="AI Assistant"
                  description="AI-assisted project organization and summaries. Coming soon."
                />
              </Suspense>
            }
          />
          <Route
            path="inventory"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ComingSoonPage title="Inventory" description="Track equipment and assets. Coming soon." />
              </Suspense>
            }
          />
          <Route
            path="reporting"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ComingSoonPage title="Reporting" description="Cross-project reports and analytics. Coming soon." />
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
                  <ComingSoonPage
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
                  <ComingSoonPage
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
                  <WorkspaceGeneralTab />
                </Suspense>
              }
            />
            <Route
              path="workspace/members"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <WorkspaceMembersTab />
                </Suspense>
              }
            />
            <Route
              path="workspace/billing"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <ComingSoonPage title="Billing" description="Manage your plan and payment details. Coming soon." />
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
