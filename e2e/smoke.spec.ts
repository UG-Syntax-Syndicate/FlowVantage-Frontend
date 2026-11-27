import { expect, test, type Page } from '@playwright/test'
import { createEmulatorUser, installFakeApi } from './fake-api.ts'

/**
 * The path every user takes first: sign in, land on the dashboard, create a
 * project, add a task to it. Fails on any console error, which is how the
 * dashboard's render loop for users with no projects was found.
 */

function failOnConsoleErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

test('sign in, create a project, add a task', async ({ page, request }) => {
  const errors = failOnConsoleErrors(page)
  const user = await createEmulatorUser(request, 'demo-flowvantage')
  const api = await installFakeApi(page, user)

  await page.goto('/login')
  await page.getByPlaceholder('Example@email.com').fill(user.email)
  await page.getByPlaceholder('at least 8 characters').fill(user.password)
  await page.locator('button[type="submit"]').click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  // A brand-new user's dashboard, with no projects, renders without errors.
  // The project countdown used to loop here ("Maximum update depth exceeded").
  await expect(page.getByText('No projects yet')).toBeVisible()
  // The loop built up over a few seconds of ticking, so give it time to show.
  await page.waitForTimeout(4000)
  expect(errors).toEqual([])

  await page.getByRole('button', { name: 'Add Project' }).click()
  await page.getByPlaceholder('e.g. Website Relaunch').fill('Website relaunch')
  await page.getByRole('button', { name: 'Create project' }).click()

  await expect.poll(() => api.projects.length).toBe(1)
  const projectId = String(api.projects[0].id)

  await page.goto(`/dashboard/projects/${projectId}`)
  await expect(page.getByText('Website relaunch').first()).toBeVisible()

  await page.getByRole('tab', { name: 'Timeline' }).click()
  await page.getByRole('button', { name: 'Add Task' }).first().click()
  await page.getByPlaceholder('e.g. Write launch announcement').fill('Draft the homepage copy')
  await page.getByRole('button', { name: 'Add task', exact: true }).click()

  await expect.poll(() => api.tasks.map((task) => task.title)).toEqual(['Draft the homepage copy'])
  expect(api.tasks[0].project_id).toBe(projectId)
  await expect(page.getByText('Draft the homepage copy').first()).toBeVisible()
  await page.screenshot({ path: 'test-results/after-task.png' })

  expect(errors).toEqual([])
})
