import { Building2, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { useWorkspace } from '../../../hooks/useWorkspace'

export function WorkspaceGeneralTab() {
  const { activeWorkspace, workspaces } = useWorkspace()

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Current workspace</CardTitle>
        </CardHeader>
        <CardContent>
          {activeWorkspace ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                {activeWorkspace.isPersonal ? <User size={18} strokeWidth={2} /> : <Building2 size={18} strokeWidth={2} />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {activeWorkspace.isPersonal ? 'Personal' : activeWorkspace.name}
                </p>
                <p className="text-sm text-slate-500">
                  {activeWorkspace.isPersonal
                    ? 'Private to you — nobody else can ever be added to this workspace.'
                    : `Organization · your role is ${activeWorkspace.memberRole}`}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Loading…</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All your workspaces</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {workspaces.map((workspace) => (
            <div key={workspace.id} className="flex items-center gap-3 py-3 first:pt-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                {workspace.isPersonal ? <User size={15} strokeWidth={2} /> : <Building2 size={15} strokeWidth={2} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                  {workspace.isPersonal ? 'Personal' : workspace.name}
                </p>
                <p className="text-xs text-slate-400 capitalize">{workspace.memberRole}</p>
              </div>
              {workspace.id === activeWorkspace?.id && (
                <span className="text-xs font-medium text-primary">Current</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
