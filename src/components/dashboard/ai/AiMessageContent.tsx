import ReactMarkdown from 'react-markdown'

interface AiMessageContentProps {
  content: string
}

/** Renders an assistant message's markdown (headings, bold, lists, rules) with app-consistent prose styling. */
export function AiMessageContent({ content }: AiMessageContentProps) {
  return (
    <div className="prose-ai text-sm leading-relaxed text-slate-700">
      <ReactMarkdown
        components={{
          h1: (props) => <h3 className="mt-4 mb-2 text-base font-semibold text-slate-900 first:mt-0" {...props} />,
          h2: (props) => <h3 className="mt-4 mb-2 text-base font-semibold text-slate-900 first:mt-0" {...props} />,
          h3: (props) => <h4 className="mt-3 mb-1.5 text-sm font-semibold text-slate-900 first:mt-0" {...props} />,
          p: (props) => <p className="mb-3 last:mb-0" {...props} />,
          ul: (props) => <ul className="mb-3 list-disc space-y-1.5 pl-5 last:mb-0" {...props} />,
          ol: (props) => <ol className="mb-3 list-decimal space-y-1.5 pl-5 last:mb-0" {...props} />,
          li: (props) => <li className="pl-1" {...props} />,
          strong: (props) => <strong className="font-semibold text-slate-900" {...props} />,
          hr: () => <hr className="my-4 border-slate-200" />,
          a: (props) => <a className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer" {...props} />,
          code: (props) => <code className="rounded bg-slate-100 px-1 py-0.5 text-[13px]" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
