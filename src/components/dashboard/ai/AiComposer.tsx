import type { KeyboardEvent } from 'react'
import { ArrowUp, ChevronDown, Globe, Mic, Paperclip, Plus } from 'lucide-react'
import { Textarea } from '../../ui/textarea'

interface AiComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder: string
  disabled?: boolean
}

/** The rounded chat input card shared by the empty state and the active conversation. */
export function AiComposer({ value, onChange, onSubmit, placeholder, disabled }: AiComposerProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (value.trim() && !disabled) onSubmit()
    }
  }

  return (
    <div className="rounded-3xl bg-white/80 p-4 shadow-[0_20px_50px_-20px_rgba(120,60,20,0.25)] ring-1 ring-black/5 backdrop-blur-sm">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        className="max-h-40 min-h-0 resize-none border-none bg-transparent px-1 py-0 text-[15px] shadow-none placeholder:text-slate-400 focus-visible:ring-0"
      />

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-slate-400">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 hover:text-slate-600" aria-label="Add">
            <Plus size={17} strokeWidth={1.9} />
          </button>
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 hover:text-slate-600" aria-label="Attach a file">
            <Paperclip size={16} strokeWidth={1.9} />
          </button>
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 hover:text-slate-600" aria-label="Search the web">
            <Globe size={16} strokeWidth={1.9} />
          </button>
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 hover:text-slate-600" aria-label="Voice input">
            <Mic size={16} strokeWidth={1.9} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-sm font-medium text-slate-500">
            FlowVantage AI
            <ChevronDown size={14} />
          </span>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim() || disabled}
            aria-label="Send message"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            <ArrowUp size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  )
}
