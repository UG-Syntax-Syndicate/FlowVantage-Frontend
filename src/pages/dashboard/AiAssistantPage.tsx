import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Copy, RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useChatMessages, useSendChatMessage } from '../../hooks/useProjectsData'
import { useTypewriter } from '../../hooks/useTypewriter'
import { showToast } from '../../lib/toast'
import { getStoredAiProvider, setStoredAiProvider, type AiProvider } from '../../api/aiApi'
import { AiComposer } from '../../components/dashboard/ai/AiComposer'
import { QuickStartGrid } from '../../components/dashboard/ai/QuickStartGrid'
import { AiMessageContent } from '../../components/dashboard/ai/AiMessageContent'
import { ProviderSwitcher } from '../../components/dashboard/ai/ProviderSwitcher'
import { BrandedLoadingOverlay } from '../../components/common/BrandedLoadingOverlay'
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

/** FlowVantage mark used as the AI's avatar next to its replies; briefly pulses once when `pulse` is set. */
function AiAvatar({ pulse }: { pulse?: boolean }) {
  return (
    <motion.img
      src="/flow-vantage-logo2.png"
      alt=""
      className="mt-0.5 h-6 w-6 shrink-0 rounded-full"
      animate={pulse ? { scale: [1, 1.3, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    />
  )
}


/** Reveals an assistant reply a few characters at a time when it's the newly arrived one, then reports completion. */
function AssistantMessageBody({ content, animate, onDone }: { content: string; animate: boolean; onDone?: () => void }) {
  const shown = useTypewriter(content, animate)
  const firedRef = useRef(false)

  useLayoutEffect(() => {
    if (animate && !firedRef.current && shown === content) {
      firedRef.current = true
      onDone?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, content, animate])

  return <AiMessageContent content={shown} />
}

export function AiAssistantPage() {
  const { userProfile, currentUser } = useAuth()
  const { data: messages = [], isLoading: messagesLoading } = useChatMessages()
  const sendMessage = useSendChatMessage()
  const [draft, setDraft] = useState('')
  const [awaitingReply, setAwaitingReply] = useState(false)
  const [tab, setTab] = useState<TabId>('chats')
  const [provider, setProvider] = useState<AiProvider>(getStoredAiProvider)
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  const [pulseAvatarId, setPulseAvatarId] = useState<string | null>(null)
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null)
  const lastMessageRef = useRef<string | null>(null)
  const hasLoadedInitialRef = useRef(false)

  // useLayoutEffect (not useEffect) so the optimistic user bubble is cleared in the same
  // paint that the real, server-confirmed messages show up - no duplicate-bubble flash.
  useLayoutEffect(() => {
    // Wait for the initial fetch to settle before establishing the baseline - if we instead
    // waited for "any message exists", a brand-new conversation (empty history) would never
    // set the baseline, and its very first reply would get stuck as "history".
    if (messagesLoading) return

    const last = messages[messages.length - 1]

    if (!hasLoadedInitialRef.current) {
      hasLoadedInitialRef.current = true
      lastMessageRef.current = last ? last.id : null
      return
    }

    if (last && last.id !== lastMessageRef.current) {
      lastMessageRef.current = last.id
      if (last.role === 'assistant') {
        setAwaitingReply(false)
        setPendingUserMessage(null)
        setTypingMessageId(last.id)
      }
    }
  }, [messages, messagesLoading])

  function handleProviderChange(next: AiProvider) {
    setProvider(next)
    setStoredAiProvider(next)
  }

  function submit(content: string) {
    const trimmed = content.trim()
    if (!trimmed) return
    setDraft('')
    setPendingUserMessage(trimmed)
    setAwaitingReply(true)
    sendMessage.mutate(
      { content: trimmed, provider },
      {
        onError: (error) => {
          setAwaitingReply(false)
          setPendingUserMessage(null)
          setDraft(trimmed)
          showToast('error', error instanceof Error ? error.message : "Venon AI couldn't reach the AI provider. Please try again.")
        },
      },
    )
  }

  function handleRegenerate() {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUserMessage) submit(lastUserMessage.content)
  }

  const name = firstName(userProfile?.name ?? currentUser?.displayName)
  const hasConversation = messages.length > 0 || pendingUserMessage !== null

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-orange-100 via-amber-50 to-white">
      {messagesLoading && <BrandedLoadingOverlay message="Loading conversation…" />}
      <div className="flex shrink-0 items-center justify-center gap-3 pt-4">
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
        <ProviderSwitcher value={provider} onChange={handleProviderChange} className="h-8 w-28 bg-white/60 text-xs ring-1 ring-black/5 backdrop-blur-sm" />
      </div>

      {hasConversation ? (
        <>
          <MessageScrollerProvider>
            <MessageScroller className="min-h-0 flex-1">
              <MessageScrollerViewport>
                <MessageScrollerContent className="mx-auto w-full max-w-2xl gap-6 px-4 py-8">
                  {messages.map((message, i) => {
                    const isLast = i === messages.length - 1 && !pendingUserMessage
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
                          <div className="flex items-start gap-3">
                            <AiAvatar pulse={message.id === pulseAvatarId} />
                            <div className="min-w-0 flex-1 rounded-2xl bg-white/70 p-5 ring-1 ring-black/5 backdrop-blur-sm">
                              <AssistantMessageBody
                                content={message.content}
                                animate={message.id === typingMessageId}
                                onDone={() => {
                                  setTypingMessageId((id) => (id === message.id ? null : id))
                                  setPulseAvatarId(message.id)
                                  window.setTimeout(() => {
                                    setPulseAvatarId((id) => (id === message.id ? null : id))
                                  }, 500)
                                }}
                              />
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
                          </div>
                        )}
                      </MessageScrollerItem>
                    )
                  })}

                  {pendingUserMessage && (
                    <MessageScrollerItem scrollAnchor={!awaitingReply}>
                      <div className="flex justify-end">
                        <div className="max-w-[75%] rounded-2xl bg-primary/10 px-4 py-2.5 text-sm text-slate-800">
                          {pendingUserMessage}
                        </div>
                      </div>
                    </MessageScrollerItem>
                  )}

                  {awaitingReply && (
                    <MessageScrollerItem scrollAnchor>
                      <div className="flex items-center gap-3 pl-1">
                        <motion.img
                          src="/flow-vantage-logo2.png"
                          alt=""
                          className="h-7 w-7 rounded-full"
                          animate={{ scale: [1, 1.15, 1], opacity: [0.55, 1, 0.55] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        />
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
                Venon AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">
          <div className="w-full max-w-2xl">
            <h1 className="mb-2 text-center text-4xl font-light tracking-tight text-slate-800">
              {timeOfDayGreeting()}, {name}
            </h1>
            <p className="mb-6 text-center text-sm text-slate-500">
              I'm Venon AI, your workspace assistant. Ask me about your contacts, tasks, or projects.
            </p>

            <AiComposer
              value={draft}
              onChange={setDraft}
              onSubmit={() => submit(draft)}
              placeholder="Ask Venon AI anything about your workspace…"
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
