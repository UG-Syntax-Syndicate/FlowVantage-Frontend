import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Bold, Italic, Link as LinkIcon, List, ListOrdered } from 'lucide-react'
import { RichText } from './RichText'

interface RichTextEditorProps {
  /** The note body, as Markdown. */
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/**
 * A small Markdown editor: a formatting toolbar over a plain textarea, with a
 * preview toggle. Deliberately not a WYSIWYG tree - the body stays a Markdown
 * string, so it round-trips through the existing `content` column untouched
 * and every note written before this existed still reads correctly.
 */
export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = useState(false)

  /**
   * Applies new text and restores the caret. React has already re-rendered the
   * textarea by the next frame, which is why the selection is set there rather
   * than synchronously.
   */
  function apply(next: string, selectionStart: number, selectionEnd: number) {
    onChange(next)
    requestAnimationFrame(() => {
      const element = textareaRef.current
      if (!element) return
      element.focus()
      element.setSelectionRange(selectionStart, selectionEnd)
    })
  }

  /** Wraps the selection in a marker, or inserts `fallback` if nothing is selected. */
  function wrap(marker: string, fallback: string) {
    const element = textareaRef.current
    if (!element) return
    const start = element.selectionStart
    const end = element.selectionEnd
    const selected = value.slice(start, end) || fallback
    const next = value.slice(0, start) + marker + selected + marker + value.slice(end)
    apply(next, start + marker.length, start + marker.length + selected.length)
  }

  /** Prefixes every line the selection touches, for list formatting. */
  function prefixLines(makePrefix: (index: number) => string) {
    const element = textareaRef.current
    if (!element) return
    const start = element.selectionStart
    const end = element.selectionEnd
    const lineStart = start === 0 ? 0 : value.lastIndexOf('\n', start - 1) + 1
    const nextBreak = value.indexOf('\n', end)
    const lineEnd = nextBreak === -1 ? value.length : nextBreak
    const block = value
      .slice(lineStart, lineEnd)
      .split('\n')
      .map((line, index) => makePrefix(index) + line)
      .join('\n')
    apply(value.slice(0, lineStart) + block + value.slice(lineEnd), lineStart, lineStart + block.length)
  }

  function addLink() {
    const element = textareaRef.current
    if (!element) return
    const entered = window.prompt('Link address (for example https://example.com)')
    if (!entered) return
    // A bare "example.com" would otherwise be read as a relative path.
    const url = /^(https?:\/\/|mailto:)/i.test(entered) ? entered : `https://${entered}`
    const start = element.selectionStart
    const end = element.selectionEnd
    const label = value.slice(start, end) || url
    const markdown = `[${label}](${url})`
    apply(value.slice(0, start) + markdown + value.slice(end), start + markdown.length, start + markdown.length)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.ctrlKey || event.metaKey)) return
    const key = event.key.toLowerCase()
    if (key === 'b') {
      event.preventDefault()
      wrap('**', 'bold text')
    } else if (key === 'i') {
      event.preventDefault()
      wrap('*', 'italic text')
    }
  }

  const toolbarButton =
    'inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-40'

  return (
    <div className="rounded-lg border border-input">
      <div className="flex items-center gap-1 border-b border-input p-1" role="toolbar" aria-label="Text formatting">
        <button
          type="button"
          className={toolbarButton}
          aria-label="Bold"
          title="Bold (Ctrl+B)"
          disabled={preview}
          onClick={() => wrap('**', 'bold text')}
        >
          <Bold size={15} strokeWidth={2} />
        </button>
        <button
          type="button"
          className={toolbarButton}
          aria-label="Italic"
          title="Italic (Ctrl+I)"
          disabled={preview}
          onClick={() => wrap('*', 'italic text')}
        >
          <Italic size={15} strokeWidth={2} />
        </button>
        <button
          type="button"
          className={toolbarButton}
          aria-label="Bulleted list"
          title="Bulleted list"
          disabled={preview}
          onClick={() => prefixLines(() => '- ')}
        >
          <List size={15} strokeWidth={2} />
        </button>
        <button
          type="button"
          className={toolbarButton}
          aria-label="Numbered list"
          title="Numbered list"
          disabled={preview}
          onClick={() => prefixLines((index) => `${index + 1}. `)}
        >
          <ListOrdered size={15} strokeWidth={2} />
        </button>
        <button
          type="button"
          className={toolbarButton}
          aria-label="Link"
          title="Link"
          disabled={preview}
          onClick={addLink}
        >
          <LinkIcon size={15} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => setPreview((current) => !current)}
          className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {preview ? (
        <div className="min-h-32 p-3 text-slate-600">
          {value.trim() ? <RichText>{value}</RichText> : <p className="text-sm text-slate-400">Nothing to preview</p>}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? 'Write your note…'}
          className="min-h-32 w-full resize-y bg-transparent p-3 text-sm outline-none placeholder:text-muted-foreground"
        />
      )}
    </div>
  )
}
