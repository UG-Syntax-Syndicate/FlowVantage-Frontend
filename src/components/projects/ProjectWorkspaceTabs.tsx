import { Package } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ProjectInventoryPanel } from './ProjectInventoryPanel'

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
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)]">
      <Tabs defaultValue="materials">
        <TabsList>
          <TabsTrigger value="materials">
            <Package size={14} strokeWidth={2} />
            Materials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="mt-4">
          <ProjectInventoryPanel projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
