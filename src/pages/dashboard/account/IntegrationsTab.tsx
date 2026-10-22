import { Card, CardContent } from '../../../components/ui/card'
import { WhatsAppSection } from '../../../components/dashboard/account/WhatsAppSection'

/**
 * Account settings → Integrations.
 *
 * This replaces a ComingSoonPage. WhatsApp notifications had a complete backend
 * — preferences, phone verification, per-project groups and a delivery log —
 * and no UI whatsoever, so there was nowhere to answer the question "where do I
 * configure WhatsApp?".
 *
 * Per-project configuration deliberately does not live here: linking a group to
 * a project is project configuration, not a user preference, so it sits on the
 * project itself. This page is only the things that belong to *you*.
 */
export function IntegrationsTab() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <WhatsAppSection />
        </CardContent>
      </Card>
    </div>
  )
}
