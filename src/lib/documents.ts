import { File, FileImage, FileSpreadsheet, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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

/** Parses a small CSV data URL (base64 or percent-encoded) into rows for a simple table preview. */
export function parseCsvDataUrl(dataUrl: string): string[][] {
  const commaIndex = dataUrl.indexOf(',')
  const header = dataUrl.slice(0, commaIndex)
  const encoded = dataUrl.slice(commaIndex + 1)
  const text = header.includes(';base64') ? atob(encoded) : decodeURIComponent(encoded)
  return text
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split(','))
}
