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

import { DashboardLayout } from './components/dashboard/DashboardLayout'
import { DashboardHome } from './pages/dashboard/DashboardHome'
import { ProjectsPage } from './pages/dashboard/ProjectsPage'
import { ContactsPage } from './pages/dashboard/ContactsPage'
import { CalendarPage } from './pages/dashboard/CalendarPage'
import { EmailPage } from './pages/dashboard/EmailPage'
import { NotesPage } from './pages/dashboard/NotesPage'
import { GlobalSearchPage } from './pages/dashboard/GlobalSearchPage'
import { AiAssistantPage } from './pages/dashboard/AiAssistantPage'
import { AccountSettingsPage } from './pages/dashboard/AccountSettingsPage'
import { NotFoundPage } from './pages/NotFoundPage'

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
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="email" element={<EmailPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="search" element={<GlobalSearchPage />} />
          <Route path="ai-assistant" element={<AiAssistantPage />} />
          <Route path="account" element={<AccountSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
