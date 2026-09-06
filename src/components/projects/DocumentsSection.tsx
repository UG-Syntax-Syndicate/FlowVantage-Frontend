import { useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, Upload } from 'lucide-react'
import { useDeleteDocument, useDocuments, useUploadDocument } from '../../hooks/useProjectsData'
import { DocumentPreviewModal } from './DocumentPreviewModal'
import { formatFileSize, getDocumentIcon, getDocumentIconColor } from '../../lib/documents'
import { formatShortDate } from '../../lib/formatDate'
import { showToast } from '../../lib/toast'
import type { ProjectDocument } from '../../types/project'

interface DocumentsSectionProps {
  projectId: string
}

const COMPACT_COUNT = 3
const ACCEPTED_TYPES =
  'application/pdf,text/csv,.csv,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function DocumentsSection({ projectId }: DocumentsSectionProps) {
  const { data: documents = [], isLoading } = useDocuments()
  const uploadDocument = useUploadDocument()
  const deleteDocument = useDeleteDocument()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [previewingDoc, setPreviewingDoc] = useState<ProjectDocument | null>(null)

  const projectDocuments = documents
    .filter((d) => d.projectId === projectId)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

  const visibleDocuments = projectDocuments.slice(0, COMPACT_COUNT)
  const hiddenCount = projectDocuments.length - COMPACT_COUNT

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      await uploadDocument.mutateAsync({
        projectId,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataUrl,
        size: file.size,
      })
      showToast('success', 'Document uploaded')
    } catch {
      showToast('error', 'Could not upload that file')
    }
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteDocument.mutateAsync(documentId)
      showToast('success', 'Document deleted')
      setPreviewingDoc(null)
    } catch {
      showToast('error', 'Could not delete this document')
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <FolderOpen size={16} strokeWidth={1.9} className="text-primary" />
          Documents ({projectDocuments.length})
        </h2>
        <div className="flex items-center gap-3">
          {projectDocuments.length > 0 && (
            <Link
              to={`/dashboard/projects/${projectId}/documents`}
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadDocument.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            <Upload size={13} strokeWidth={2} />
            {uploadDocument.isPending ? 'Uploading…' : 'Upload'}
          </button>
          <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {isLoading ? (
        <p className="py-4 text-sm text-slate-400">Loading documents…</p>
      ) : projectDocuments.length === 0 ? (
        <p className="py-4 text-sm text-slate-400">No documents yet — upload the first one.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {visibleDocuments.map((doc) => {
            const Icon = getDocumentIcon(doc.mimeType)
            const iconColor = getDocumentIconColor(doc.mimeType)
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setPreviewingDoc(doc)}
                className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-left hover:border-slate-300 hover:bg-slate-50/60"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${iconColor}`}>
                  <Icon size={16} strokeWidth={1.9} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{doc.name}</p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(doc.size)} · {formatShortDate(doc.uploadedAt)}
                  </p>
                </div>
              </button>
            )
          })}
          {hiddenCount > 0 && (
            <Link
              to={`/dashboard/projects/${projectId}/documents`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-line px-3 py-2.5 text-sm font-medium text-slate-500 hover:border-slate-300 hover:bg-slate-50/60"
            >
              +{hiddenCount} more
            </Link>
          )}
        </div>
      )}

      {previewingDoc && (
        <DocumentPreviewModal
          document={previewingDoc}
          onClose={() => setPreviewingDoc(null)}
          onDelete={() => handleDelete(previewingDoc.id)}
        />
      )}
    </div>
  )
}
