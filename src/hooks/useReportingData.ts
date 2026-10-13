import { useMutation, useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import * as reportingApi from '../api/reportingApi'
import { useAuth } from './useAuth'
import type { ReportFormat } from '../types/report'

/**
 * The report's data, for the in-app preview.
 *
 * `staleTime: 0` deliberately overrides the client default: a report is a
 * snapshot someone is about to export, so showing a 30-second-old figure next
 * to a download button that will contain the current one is worse than a
 * refetch.
 */
export function useProjectReportData(projectId: string | null) {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.reportData(projectId ?? 'none'),
    queryFn: () => reportingApi.fetchProjectReportData(projectId as string),
    enabled: Boolean(backendSessionToken) && Boolean(projectId),
    staleTime: 0,
  })
}

/**
 * Downloads a report. A mutation rather than a query because it has a side
 * effect (a file lands on disk) and must only run when asked - and because
 * `isPending` is exactly the per-button spinner state the page needs.
 */
export function useDownloadProjectReport() {
  return useMutation({
    mutationFn: ({
      projectId,
      format,
      fallbackName,
    }: {
      projectId: string
      format: ReportFormat
      fallbackName?: string
    }) => reportingApi.downloadProjectReport(projectId, format, fallbackName),
  })
}
