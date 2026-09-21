import { postJsonAuthedWithTimeout } from '../lib/backendApi'
import { readBackendSessionToken } from '../lib/backendSession'
import type { HeaderMappingSuggestion } from '../lib/contactImport'

// LLM calls routinely take longer than the app's default 5s request
// timeout (src/lib/backendApi.ts) - give AI endpoints more room.
const AI_TIMEOUT_MS = 25000

export type AiProvider = 'openai' | 'gemini'

const AI_PROVIDER_STORAGE_KEY = 'flowvantage.aiProvider'

/** The user's last-picked AI provider (CSV mapping, Venon), persisted per-browser. Defaults to OpenAI. */
export function getStoredAiProvider(): AiProvider {
  try {
    const stored = localStorage.getItem(AI_PROVIDER_STORAGE_KEY)
    return stored === 'gemini' ? 'gemini' : 'openai'
  } catch {
    return 'openai'
  }
}

export function setStoredAiProvider(provider: AiProvider): void {
  try {
    localStorage.setItem(AI_PROVIDER_STORAGE_KEY, provider)
  } catch {
    // Best-effort only - a private/locked-down browser just won't remember the choice.
  }
}

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
 * Asks the backend's AI provider to map a CSV's headers to contact fields.
 * Purely additive: callers should catch failures and fall back to the
 * existing hardcoded alias-based parser (src/lib/contactImport.ts) rather
 * than blocking import on AI availability.
 */
export async function suggestCsvHeaderMapping(
  provider: AiProvider,
  headers: string[],
  sampleRows: string[][],
): Promise<HeaderMappingSuggestion[]> {
  const { data } = await postJsonAuthedWithTimeout<ApiEnvelope<HeaderMappingSuggestion[]>>(
    '/ai-assistant/csv-mapping',
    { provider, headers, sampleRows },
    authToken(),
    AI_TIMEOUT_MS,
  )
  return data
}
