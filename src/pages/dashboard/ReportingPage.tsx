import { useEffect, useState } from 'react'
import { BarChart3, CheckCircle2, FileDown, FileText, FolderKanban, TriangleAlert } from 'lucide-react'
import { PageHeaderBar } from '../../components/dashboard/PageHeaderBar'
import { StatCard } from '../../components/dashboard/StatCard'
import { Button } from '../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Alert } from '../../components/common/Alert'
import { PortfolioCharts } from '../../components/reporting/PortfolioCharts'
import { ReportPreview, ReportPreviewSkeleton } from '../../components/reporting/ReportPreview'
import { useMembers, useProjects, useTasks } from '../../hooks/useProjectsData'
import { useDownloadProjectReport, useProjectReportData } from '../../hooks/useReportingData'
import { computeProjectStats, computeTaskStats } from '../../lib/taskStats'
import { showToast } from '../../lib/toast'
import type { ReportFormat } from '../../types/report'

/**
 * Two halves, because the data behind them is shaped differently.
 *
 * *Portfolio* is cross-project and computed client-side from the projects and
 * tasks the app already holds. *Project report* is per-project and comes from
 * the reporting API, which generates the document server-side so the same bytes
 * reach every user and the attribution is always present.
 *
 * The old Coming Soon copy promised "cross-project reports and analytics" while
 * the backend was per-project only; this page keeps that promise without
 * inventing an aggregation endpoint for sums that are a filter over cached data.
 */
export function ReportingPage() {
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: tasks = [] } = useTasks()
  const { data: members = [] } = useMembers()

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const downloadReport = useDownloadProjectReport()

  // Pick the first project once the list arrives, so the Project report tab is
  // never an empty picker above an empty preview. Keyed on the id rather than
  // the array so a background refetch does not reset the user's choice.
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null
  const { data: reportData, isLoading: reportLoading, isError: reportFailed } = useProjectReportData(selectedProjectId)

  const projectStats = computeProjectStats(projects)
  const taskStats = computeTaskStats(tasks)

  async function download(format: ReportFormat) {
    if (!selectedProject) return
    try {
      await downloadReport.mutateAsync({
        projectId: selectedProject.id,
        format,
        fallbackName: selectedProject.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase(),
      })
      showToast('success', `${format.toUpperCase()} report downloaded`)
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not generate this report')
    }
  }

  const downloading = downloadReport.isPending

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <PageHeaderBar
        title="Reporting"
        subtitle="Portfolio analytics, and a professional report for any project."
        searchPlaceholder="Search reports..."
      />

      <div className="flex flex-wrap gap-4">
        <StatCard
          icon={FolderKanban}
          label="Active projects"
          value={projectStats.total - projectStats.completed}
          variant="primary"
          shadowClass="shadow-[0px_10px_30px_0px_rgba(236,114,29,0.28)]"
        />
        <StatCard
          icon={CheckCircle2}
          label="Tasks completed"
          value={taskStats.completed}
          variant="default"
          shadowClass="shadow-[0px_10px_40px_10px_rgba(152,150,163,0.16)]"
        />
        <StatCard
          icon={TriangleAlert}
          label="Overdue tasks"
          value={taskStats.overdue}
          variant="default"
          shadowClass="shadow-[0px_10px_40px_10px_rgba(152,150,163,0.16)]"
        />
      </div>

      <Tabs defaultValue="portfolio">
        <TabsList>
          <TabsTrigger value="portfolio">
            <BarChart3 size={14} strokeWidth={2} />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="project">
            <FileText size={14} strokeWidth={2} />
            Project report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="mt-4">
          {projectsLoading ? (
            <div className="rounded-2xl border border-line bg-white p-5">
              <ReportPreviewSkeleton />
            </div>
          ) : (
            <PortfolioCharts projects={projects} tasks={tasks} members={members} />
          )}
        </TabsContent>

        <TabsContent value="project" className="mt-4">
          <div className="rounded-2xl border border-line bg-white shadow-[0px_10px_40px_10px_rgba(152,150,163,0.16)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div className="min-w-56">
                <Select
                  value={selectedProjectId ?? ''}
                  onValueChange={setSelectedProjectId}
                  disabled={projects.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a project" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!selectedProject || downloading}
                  loading={downloading && downloadReport.variables?.format === 'docx'}
                  onClick={() => download('docx')}
                >
                  <FileDown size={14} strokeWidth={2} />
                  DOCX
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedProject || downloading}
                  loading={downloading && downloadReport.variables?.format === 'pdf'}
                  onClick={() => download('pdf')}
                >
                  <FileDown size={14} strokeWidth={2} />
                  PDF
                </Button>
              </div>
            </div>

            <div className="px-5 py-5">
              {projects.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  Create a project first — a report is generated from one project's tasks, materials and timeline.
                </p>
              ) : reportFailed ? (
                <Alert variant="error">
                  Could not load this project's report data. It may have been deleted, or you may no longer be a member
                  of it.
                </Alert>
              ) : reportLoading || !reportData ? (
                <ReportPreviewSkeleton />
              ) : (
                <ReportPreview data={reportData} />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
