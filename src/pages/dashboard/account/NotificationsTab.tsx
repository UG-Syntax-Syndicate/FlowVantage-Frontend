import { Card, CardContent } from '../../../components/ui/card'
import { NotificationPreferencesSection } from '../../../components/dashboard/account/NotificationPreferencesSection'

export function NotificationsTab() {
  return (
    <Card>
      <CardContent className="[&>section]:border-b-0 [&>section]:py-0">
        <NotificationPreferencesSection />
      </CardContent>
    </Card>
  )
}
