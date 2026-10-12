import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Uploads source maps so Sentry stack traces name real files and lines
    // instead of minified bundle offsets. Inert without an auth token, which is
    // the normal state locally - the token is CI-only and must not be
    // committed.
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: !process.env.SENTRY_AUTH_TOKEN,
      // Delete the .map files after upload so they are not served publicly;
      // 'hidden' below already keeps the comment out of the bundles.
      sourcemaps: { filesToDeleteAfterUpload: ['dist/**/*.map'] },
    }),
  ],
  build: {
    // 'hidden' emits the maps for upload but omits the sourceMappingURL
    // comment, so browsers never fetch them and the source is not exposed.
    // Previously off entirely (Vite's default), which would have made every
    // reported stack trace unreadable.
    sourcemap: 'hidden',
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
