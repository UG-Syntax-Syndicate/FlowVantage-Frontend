import { Download, Trash2, X } from 'lucide-react'
import type { ProjectDocument } from '../../types/project'
import { formatDateTime } from '../../lib/formatDate'
import { formatFileSize, getDocumentIcon, getDocumentIconColor, parseCsvDataUrl } from '../../lib/documents'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

interface DocumentPreviewModalProps {
  document: ProjectDocument
  onClose: () => void
  onDelete: () => void
}

export function DocumentPreviewModal({ document, onClose, onDelete }: DocumentPreviewModalProps) {
  const Icon = getDocumentIcon(document.mimeType)
  const iconColor = getDocumentIconColor(document.mimeType)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="flex-row items-center justify-between gap-4 border-b border-line px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${iconColor}`}>
              <Icon size={18} strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate text-sm font-semibold text-slate-900">{document.name}</DialogTitle>
              <p className="text-xs text-slate-400">
                {formatFileSize(document.size)} · Uploaded {formatDateTime(document.uploadedAt)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-slate-400">
            <a
              href={document.dataUrl}
              download={document.name}
              aria-label="Download document"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 hover:text-slate-700"
            >
              <Download size={15} />
            </a>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete document"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={16} />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-5">
          <DocumentPreviewBody document={document} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DocumentPreviewBody({ document }: { document: ProjectDocument }) {
  if (document.mimeType.startsWith('image/')) {
    return <img src={document.dataUrl} alt={document.name} className="mx-auto max-h-[60vh] rounded-lg" />
  }

  if (document.mimeType === 'application/pdf') {
    return <iframe src={document.dataUrl} title={document.name} className="h-[65vh] w-full rounded-lg border border-line" />
  }

  if (document.mimeType === 'text/csv') {
    const rows = parseCsvDataUrl(document.dataUrl)
    const [header, ...body] = rows
    return (
      <div className="overflow-x-auto rounded-lg border border-line">
        <Table>
          {header && (
            <TableHeader className="bg-slate-50 text-xs font-medium text-slate-500">
              <TableRow className="hover:bg-transparent">
                {header.map((cell, i) => (
                  <TableHead key={i} className="px-3 py-2">
                    {cell}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          )}
          <TableBody>
            {body.map((row, i) => (
              <TableRow key={i} className="border-t border-line/70">
                {row.map((cell, j) => (
                  <TableCell key={j} className="px-3 py-2 text-slate-700">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-slate-400">
      <p>Preview isn&apos;t available for this file type in the demo.</p>
      <a href={document.dataUrl} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
        Open in a new tab
      </a>
    </div>
  )
}
