import { useRef, useState, type ChangeEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronRight, FolderOpen, Upload } from 'lucide-react'
import { useDeleteDocument, useDocuments, useProjects, useUploadDocument } from '../../hooks/useProjectsData'
import { PageHeaderBar } from '../../components/dashboard/PageHeaderBar'
import { DocumentPreviewModal } from '../../components/projects/DocumentPreviewModal'
import { formatFileSize, getDocumentIcon, getDocumentIconColor } from '../../lib/documents'
import { formatShortDate } from '../../lib/formatDate'
import { showToast } from '../../lib/toast'
import type { ProjectDocument } from '../../types/project'

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

export function ProjectDocumentsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: documents = [], isLoading: documentsLoading } = useDocuments()
  const uploadDocument = useUploadDocument()
  const deleteDocument = useDeleteDocument()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewingDoc, setPreviewingDoc] = useState<ProjectDocument | null>(null)

  const project = projects.find((p) => p.id === projectId)
  const projectDocuments = documents
    .filter((d) => d.projectId === projectId)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

  if (!projectsLoading && !project) {
    return <Navigate to="/dashboard/projects" replace />
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !projectId) return
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
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <PageHeaderBar title="Documents" />

      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link to="/dashboard/projects" className="hover:text-slate-700">
          Projects
        </Link>
        <ChevronRight size={14} className="text-slate-300" />
        {project ? (
          <Link to={`/dashboard/projects/${project.id}`} className="hover:text-slate-700">
            {project.name}
          </Link>
        ) : (
          <span>Project</span>
        )}
        <ChevronRight size={14} className="text-slate-300" />
        <span className="font-medium text-slate-900">Documents</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <FolderOpen size={20} strokeWidth={1.9} className="text-primary" />
          Documents ({projectDocuments.length})
        </h1>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadDocument.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-60"
        >
          <Upload size={15} strokeWidth={2} />
          {uploadDocument.isPending ? 'Uploading…' : 'Upload'}
        </button>
        <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} className="hidden" onChange={handleFileChange} />
      </div>

      {documentsLoading ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading documents…</p>
      ) : projectDocuments.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">No documents yet — upload the first one.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {projectDocuments.map((doc) => {
            const Icon = getDocumentIcon(doc.mimeType)
            const iconColor = getDocumentIconColor(doc.mimeType)
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setPreviewingDoc(doc)}
                className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-[0px_10px_28px_4px_rgba(152,150,163,0.12)] hover:-translate-y-0.5 hover:shadow-[0px_14px_32px_6px_rgba(152,150,163,0.2)]"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${iconColor}`}>
                  <Icon size={20} strokeWidth={1.9} />
                </span>
                <div className="min-w-0 w-full">
                  <p className="truncate text-sm font-semibold text-slate-900">{doc.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatFileSize(doc.size)} · {formatShortDate(doc.uploadedAt)}
                  </p>
                </div>
              </button>
            )
          })}
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
