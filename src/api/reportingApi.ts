import { getJson, getBlob } from '../lib/backendApi'
import { readBackendSessionToken } from '../lib/backendSession'
import { saveBlob } from '../lib/download'
import type { ProjectReportData, ReportFormat } from '../types/report'

/**
 * Client for /api/v1/reporting.
 *
 * Reports are generated server-side and streamed as bytes, not assembled in the
 * browser: the same document then reaches every user regardless of their
 * browser, and the "Powered by FlowVantage" attribution is always present
 * because the renderer puts it there.
 */

function authToken(): string {
  const token = readBackendSessionToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  return token
}

interface ApiEnvelope<T> {
  success: boolean
  data: T
}

/**
 * The report's underlying data, for the in-app preview.
 *
 * Same endpoint the renderers read, which is the point: a preview built from a
 * second query could show figures the download then contradicts.
 */
export async function fetchProjectReportData(projectId: string): Promise<ProjectReportData> {
  const { data } = await getJson<ApiEnvelope<ProjectReportData>>(
    `/reporting/projects/${projectId}/report-data`,
    authToken(),
  )
  return data
}

/**
 * Downloads a project report and saves it.
 *
 * Falls back to a locally-built filename only if the server sent no
 * Content-Disposition - normally the server's name wins, since it is the one
 * that has been sanitised against the project's title.
 */
export async function downloadProjectReport(
  projectId: string,
  format: ReportFormat,
  fallbackName = 'project-report',
): Promise<void> {
  const { blob, filename } = await getBlob(
    `/reporting/projects/${projectId}/report?format=${format}`,
    authToken(),
  )
  saveBlob(blob, filename || `${fallbackName}.${format}`)
}
