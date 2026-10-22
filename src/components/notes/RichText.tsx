import ReactMarkdown from 'react-markdown'

/**
 * Renders a saved note. Note bodies are stored as Markdown (see
 * RichTextEditor), so anything written before this existed still renders
 * correctly - plain text is valid Markdown.
 */
export function RichText({ children }: { children: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      <ReactMarkdown
        components={{
          a: ({ children: linkChildren, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              {linkChildren}
            </a>
          ),
          ul: ({ children: listChildren }) => <ul className="list-disc space-y-1 pl-5">{listChildren}</ul>,
          ol: ({ children: listChildren }) => <ol className="list-decimal space-y-1 pl-5">{listChildren}</ol>,
          strong: ({ children: boldChildren }) => <strong className="font-semibold">{boldChildren}</strong>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
