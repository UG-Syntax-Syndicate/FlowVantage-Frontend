import { File, FileImage, FileSpreadsheet, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const DOCUMENT_ACCEPTED_TYPES =
  'application/pdf,text/csv,.csv,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*'

// 10MB ceiling on the *input* file. Images get downscaled well under this by
// prepareDocumentUpload; PDFs/Office docs pass through untouched to Firebase
// Storage, so this is the real cap for those.
export const DOCUMENT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024

const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
const ALLOWED_DOCUMENT_EXTENSIONS = ['.csv', '.doc', '.docx']

/**
 * Returns a user-facing error message, or null if the file is acceptable.
 * The `accept` attribute on the file input is advisory only (bypassable via
 * drag-and-drop or a manually crafted file), so this re-checks type and size
 * before a file is handed to prepareDocumentUpload.
 */
export function validateDocumentFile(file: File): string | null {
  const isImage = file.type.startsWith('image/')
  const hasAllowedExtension = ALLOWED_DOCUMENT_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))
  if (!isImage && !ALLOWED_DOCUMENT_MIME_TYPES.has(file.type) && !hasAllowedExtension) {
    return 'Please choose a PDF, Word document, CSV, or image file.'
  }
  if (file.size > DOCUMENT_UPLOAD_MAX_BYTES) {
    return `File must be smaller than ${Math.round(DOCUMENT_UPLOAD_MAX_BYTES / (1024 * 1024))}MB.`
  }
  return null
}

export function getDocumentIcon(mimeType: string): LucideIcon {
  if (mimeType.startsWith('image/')) return FileImage
  if (mimeType === 'text/csv') return FileSpreadsheet
  if (mimeType === 'application/pdf') return FileText
  if (mimeType.includes('word') || mimeType.includes('document')) return FileText
  return File
}

export function getDocumentIconColor(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'bg-violet-500'
  if (mimeType === 'text/csv') return 'bg-emerald-500'
  if (mimeType === 'application/pdf') return 'bg-rose-500'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'bg-sky-500'
  return 'bg-slate-400'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Parses raw CSV text into rows for a simple table preview. */
export function parseCsvText(text: string): string[][] {
  return text
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split(','))
}
