import { useEffect, useRef, useState } from 'react'
import { Copy, RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useChatMessages, useSendChatMessage } from '../../hooks/useProjectsData'
import { showToast } from '../../lib/toast'
import { AiComposer } from '../../components/dashboard/ai/AiComposer'
import { QuickStartGrid } from '../../components/dashboard/ai/QuickStartGrid'
import { AiMessageContent } from '../../components/dashboard/ai/AiMessageContent'
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '../../components/ui/message-scroller'

const TABS = [
  { id: 'chats', label: 'Chats' },
  { id: 'colab', label: 'Colab' },
  { id: 'code', label: 'Code' },
] as const

type TabId = (typeof TABS)[number]['id']

function firstName(name?: string | null): string {
  if (!name) return 'there'
  return name.trim().split(/\s+/)[0]
}

function timeOfDayGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function AiAssistantPage() {
  const { userProfile, currentUser } = useAuth()
  const { data: messages = [] } = useChatMessages()
  const sendMessage = useSendChatMessage()
  const [draft, setDraft] = useState('')
  const [awaitingReply, setAwaitingReply] = useState(false)
  const [tab, setTab] = useState<TabId>('chats')
  const lastMessageRef = useRef<string | null>(null)

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last && last.id !== lastMessageRef.current) {
      lastMessageRef.current = last.id
      if (last.role === 'assistant') setAwaitingReply(false)
    }
  }, [messages])

  function submit(content: string) {
    const trimmed = content.trim()
    if (!trimmed) return
    setDraft('')
    setAwaitingReply(true)
    sendMessage.mutate(trimmed)
  }

  function handleRegenerate() {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUserMessage) submit(lastUserMessage.content)
  }

  const name = firstName(userProfile?.name ?? currentUser?.displayName)
  const hasConversation = messages.length > 0

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-orange-100 via-amber-50 to-white">
      <div className="flex shrink-0 justify-center pt-4">
        <div className="flex items-center gap-1 rounded-full bg-white/60 p-1 ring-1 ring-black/5 backdrop-blur-sm">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id !== 'chats') {
                  showToast('info', `${item.label} is coming soon`)
                  return
                }
                setTab(item.id)
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === item.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {hasConversation ? (
        <>
          <MessageScrollerProvider>
            <MessageScroller className="min-h-0 flex-1">
              <MessageScrollerViewport>
                <MessageScrollerContent className="mx-auto w-full max-w-2xl gap-6 px-4 py-8">
                  {messages.map((message, i) => {
                    const isLast = i === messages.length - 1
                    const isUser = message.role === 'user'
                    return (
                      <MessageScrollerItem key={message.id} scrollAnchor={isLast}>
                        {isUser ? (
                          <div className="flex justify-end">
                            <div className="max-w-[75%] rounded-2xl bg-primary/10 px-4 py-2.5 text-sm text-slate-800">
                              {message.content}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl bg-white/70 p-5 ring-1 ring-black/5 backdrop-blur-sm">
                            <AiMessageContent content={message.content} />
                            <div className="mt-3 flex items-center gap-1 text-slate-400">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(message.content).catch(() => {})
                                  showToast('success', 'Copied to clipboard')
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Copy response"
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => showToast('success', 'Thanks for the feedback')}
                                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Good response"
                              >
                                <ThumbsUp size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => showToast('info', 'Thanks for the feedback')}
                                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Bad response"
                              >
                                <ThumbsDown size={13} />
                              </button>
                              {isLast && (
                                <button
                                  type="button"
                                  onClick={handleRegenerate}
                                  className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100 hover:text-slate-600"
                                  aria-label="Regenerate response"
                                >
                                  <RotateCcw size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </MessageScrollerItem>
                    )
                  })}

                  {awaitingReply && (
                    <MessageScrollerItem scrollAnchor>
                      <div className="rounded-2xl bg-white/70 p-5 ring-1 ring-black/5 backdrop-blur-sm">
                        <span className="shimmer text-sm text-slate-500">Thinking…</span>
                      </div>
                    </MessageScrollerItem>
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
            </MessageScroller>
          </MessageScrollerProvider>

          <div className="shrink-0 px-4 pb-6">
            <div className="mx-auto w-full max-w-2xl">
              <AiComposer
                value={draft}
                onChange={setDraft}
                onSubmit={() => submit(draft)}
                placeholder="Continue the conversation…"
                disabled={sendMessage.isPending}
              />
              <p className="mt-3 text-center text-xs text-slate-400">
                FlowVantage AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">
          <div className="w-full max-w-2xl">
            <h1 className="mb-8 text-center text-4xl font-light tracking-tight text-slate-800">
              {timeOfDayGreeting()}, {name}
            </h1>

            <AiComposer
              value={draft}
              onChange={setDraft}
              onSubmit={() => submit(draft)}
              placeholder="How can I help you today?"
              disabled={sendMessage.isPending}
            />

            <div className="mt-8">
              <QuickStartGrid onSelect={submit} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
