import { ProfileSection } from '../../components/dashboard/account/ProfileSection'
import { ChangeEmailSection } from '../../components/dashboard/account/ChangeEmailSection'
import { ChangePasswordSection } from '../../components/dashboard/account/ChangePasswordSection'
import { NotificationPreferencesSection } from '../../components/dashboard/account/NotificationPreferencesSection'
import { DataExportSection } from '../../components/dashboard/account/DataExportSection'
import { DeleteAccountSection } from '../../components/dashboard/account/DeleteAccountSection'

export function AccountSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Account settings</h1>
        <p className="text-sm text-slate-500">Manage your profile, security, and data.</p>
      </div>

      <ProfileSection />
      <ChangeEmailSection />
      <ChangePasswordSection />
      <NotificationPreferencesSection />
      <DataExportSection />
      <DeleteAccountSection />
    </div>
  )
}
