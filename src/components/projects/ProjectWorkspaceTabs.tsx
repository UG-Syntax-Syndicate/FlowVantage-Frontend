import { MessageCircle, MessagesSquare, Package } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ProjectInventoryPanel } from './ProjectInventoryPanel'
import { ProjectWhatsAppPanel } from './ProjectWhatsAppPanel'
import { ProjectMessagesPanel } from '../collaboration/ProjectMessagesPanel'
import { useUnreadMessageCounts } from '../../hooks/useCollaborationData'

interface ProjectWorkspaceTabsProps {
  projectId: string
}

/**
 * The project's secondary surfaces, tabbed.
 *
 * ProjectDetailPage was one long main column plus a sidebar of panels, and the
 * sidebar was already carrying three. Stacking materials, the message thread
 * and notification settings on top of that would make the page a scroll
 * marathon, so the surfaces that are "a thing you go and do" rather than "a
 * thing you glance at" live here instead.
 */
export function ProjectWorkspaceTabs({ projectId }: ProjectWorkspaceTabsProps) {
  const { data: unreadCounts = {} } = useUnreadMessageCounts()
  const unread = unreadCounts[projectId] ?? 0

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)]">
      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat">
            <MessagesSquare size={14} strokeWidth={2} />
            Chat
            {unread > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none font-semibold text-white">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="materials">
            <Package size={14} strokeWidth={2} />
            Materials
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            <MessageCircle size={14} strokeWidth={2} />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <ProjectMessagesPanel projectId={projectId} />
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <ProjectInventoryPanel projectId={projectId} />
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-4">
          <ProjectWhatsAppPanel projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
