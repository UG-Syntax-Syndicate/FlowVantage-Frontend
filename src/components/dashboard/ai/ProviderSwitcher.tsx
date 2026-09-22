import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import type { AiProvider } from '../../../api/aiApi'

interface ProviderSwitcherProps {
  value: AiProvider
  onChange: (provider: AiProvider) => void
  className?: string
}

/**
 * Shared Groq/Gemini picker used by both the CSV-import AI mapping
 * (ImportContactsModal) and Venon AI (AiAssistantPage) - the two features
 * that call the backend's ai-assistant module, which supports either provider.
 */
export function ProviderSwitcher({ value, onChange, className }: ProviderSwitcherProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AiProvider)}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="groq">Groq</SelectItem>
        <SelectItem value="gemini">Gemini</SelectItem>
      </SelectContent>
    </Select>
  )
}
