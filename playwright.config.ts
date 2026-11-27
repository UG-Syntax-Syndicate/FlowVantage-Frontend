import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end smoke tests: a real browser, the real app, and real Firebase
 * Auth (the local emulator, under a demo project, so nothing touches the live
 * Firebase project). The FlowVantage API is replaced per test by an
 * in-memory fake (e2e/fake-api.ts), so the suite needs no backend, database
 * or secrets and runs the same locally and in CI.
 */

const PORT = 5174
const EMULATOR_PROJECT = 'demo-flowvantage'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `npx firebase emulators:start --only auth --project ${EMULATOR_PROJECT}`,
      url: 'http://127.0.0.1:9099',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `npx vite --port ${PORT} --strictPort --host 127.0.0.1`,
      url: `http://127.0.0.1:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        VITE_USE_FIREBASE_EMULATOR: 'true',
        VITE_FIREBASE_API_KEY: 'demo-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: `${EMULATOR_PROJECT}.firebaseapp.com`,
        VITE_FIREBASE_PROJECT_ID: EMULATOR_PROJECT,
        VITE_FIREBASE_APP_ID: '1:000000000000:web:0000000000000000',
        VITE_BACKEND_API_BASE_URL: '/api/v1',
        VITE_SENTRY_DSN: '',
      },
    },
  ],
})
