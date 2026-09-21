import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { CheckCircle2, FileUp, Loader2, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { showToast } from '../../lib/toast'
import { parseContactFile, type ParsedContact } from '../../lib/contactImport'
import { useBulkImportContacts } from '../../hooks/useProjectsData'
import { useProjects } from '../../hooks/useProjectsData'
import { useWorkspace } from '../../hooks/useWorkspace'
import type { ContactVisibility } from '../../types/project'

interface ImportContactsModalProps {
  onClose: () => void
}

interface Row extends ParsedContact {
  selected: boolean
}

const ACCEPTED = '.csv,.vcf,text/csv,text/vcard,text/x-vcard'

export function ImportContactsModal({ onClose }: ImportContactsModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { activeWorkspace } = useWorkspace()
  const { data: projects = [] } = useProjects()
  const bulkImport = useBulkImportContacts()

  const [rows, setRows] = useState<Row[]>([])
  const [parsing, setParsing] = useState(false)
  const [projectId, setProjectId] = useState<string>('none')
  const [visibility, setVisibility] = useState<ContactVisibility>('private')
  const [result, setResult] = useState<{ created: number; duplicates: number; failed: number } | null>(null)

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    setParsing(true)
    try {
      const parsedPerFile = await Promise.all(files.map((file) => parseContactFile(file)))
      const parsed = parsedPerFile.flat()
      if (parsed.length === 0) {
        showToast('error', 'No contacts found in that file')
        return
      }
      setRows((prev) => [...prev, ...parsed.map((contact) => ({ ...contact, selected: true }))])
    } catch {
      showToast('error', 'Could not read that file')
    } finally {
      setParsing(false)
    }
  }

  function toggleRow(index: number) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, selected: !row.selected } : row)))
  }

  function toggleAll(selected: boolean) {
    setRows((prev) => prev.map((row) => ({ ...row, selected })))
  }

  const selectedRows = rows.filter((row) => row.selected)
  const allSelected = rows.length > 0 && selectedRows.length === rows.length

  async function handleImport() {
    if (selectedRows.length === 0) return

    try {
      const outcome = await bulkImport.mutateAsync({
        workspaceId: activeWorkspace?.id,
        contacts: selectedRows.map((row) => ({
          firstName: row.firstName,
          lastName: row.lastName || undefined,
          email: row.email || undefined,
          phone: row.phone || undefined,
          company: row.company || undefined,
          role: row.role || undefined,
          projectId: projectId === 'none' ? null : projectId,
          visibility,
        })),
      })
      setResult({ created: outcome.createdCount, duplicates: outcome.duplicateCount, failed: outcome.failedCount })
    } catch {
      showToast('error', 'Import failed - please try again')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import contacts</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 size={36} strokeWidth={1.7} className="text-emerald-500" />
            <p className="text-sm font-medium text-slate-800">
              Imported {result.created} contact{result.created === 1 ? '' : 's'}
            </p>
            <p className="text-sm text-slate-500">
              {result.duplicates > 0 && `${result.duplicates} skipped as likely duplicates. `}
              {result.failed > 0 && `${result.failed} couldn't be imported.`}
            </p>
            <Button type="button" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {rows.length === 0 ? (
              <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-primary hover:text-primary">
                {parsing ? (
                  <Loader2 size={22} strokeWidth={1.7} className="animate-spin" />
                ) : (
                  <FileUp size={22} strokeWidth={1.7} />
                )}
                <span className="text-xs font-medium">
                  {parsing ? 'Reading file…' : 'Choose CSV or vCard (.vcf) files'}
                </span>
                <span className="text-xs text-slate-400">Outlook/Google CSV exports and vCard files both work</span>
                <input ref={inputRef} type="file" accept={ACCEPTED} multiple className="hidden" onChange={handleFiles} />
              </label>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={allSelected} onCheckedChange={(checked) => toggleAll(Boolean(checked))} />
                    <span className="text-sm text-slate-600">
                      {selectedRows.length} of {rows.length} selected
                    </span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
                    <Upload size={14} strokeWidth={2} />
                    Add more files
                  </Button>
                  <input ref={inputRef} type="file" accept={ACCEPTED} multiple className="hidden" onChange={handleFiles} />
                </div>

                <div className="max-h-56 overflow-y-auto rounded-lg border border-line">
                  {rows.map((row, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-b-0"
                    >
                      <Checkbox checked={row.selected} onCheckedChange={() => toggleRow(index)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {[row.firstName, row.lastName].filter(Boolean).join(' ') || '(no name)'}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {[row.email, row.phone, row.company].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tag to project</Label>
                    <Select value={projectId} onValueChange={setProjectId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No project</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {activeWorkspace && !activeWorkspace.isPersonal && (
                    <div>
                      <Label>Visibility</Label>
                      <Select value={visibility} onValueChange={(v) => setVisibility(v as ContactVisibility)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Only me</SelectItem>
                          <SelectItem value="shared">Shared with workspace</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleImport}
                    loading={bulkImport.isPending}
                    disabled={bulkImport.isPending || selectedRows.length === 0}
                  >
                    Import {selectedRows.length} contact{selectedRows.length === 1 ? '' : 's'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
