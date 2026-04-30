'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface ToolEvent {
  label: string
  done: boolean
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolEvents?: ToolEvent[]
  streaming?: boolean
}

const SUGGESTED_PROMPTS = [
  'Mostre o resumo completo de [nome do cliente]',
  'Quais propostas estão em cotação pendente?',
  'Crie uma proposta de Garantia para [cliente]',
  'Mude o status da proposta [número] para em análise',
]

function TypingCursor() {
  return (
    <span style={{
      display: 'inline-block',
      width: 2,
      height: '1em',
      background: 'var(--rz-deep)',
      marginLeft: 2,
      verticalAlign: 'text-bottom',
      animation: 'rz-blink 1s step-end infinite',
    }} />
  )
}

function ToolPill({ label, done }: { label: string; done: boolean }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: 'var(--rz-fog)',
      borderRadius: 999,
      padding: '3px 10px',
      fontSize: 11,
      color: 'var(--rz-text-2)',
      fontWeight: 500,
      marginBottom: 4,
      marginRight: 4,
    }}>
      {done ? (
        <span style={{ color: 'var(--rz-moss)', fontSize: 11 }}>✓</span>
      ) : (
        <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
      )}
      {label}
    </span>
  )
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
    }

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      toolEvents: [],
      streaming: true,
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput('')
    setLoading(true)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      // Build conversation history (all messages including new user message)
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })

      if (!res.ok || !res.body) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: 'Erro ao conectar com o agente.', streaming: false }
              : m
          )
        )
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          let event: Record<string, unknown>
          try {
            event = JSON.parse(raw)
          } catch {
            continue
          }

          if (event.type === 'tool_start') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id
                  ? {
                      ...m,
                      toolEvents: [
                        ...(m.toolEvents ?? []),
                        { label: event.label as string, done: false },
                      ],
                    }
                  : m
              )
            )
          } else if (event.type === 'tool_end') {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantMsg.id) return m
                const events = [...(m.toolEvents ?? [])]
                // Mark the last pending event with this label as done
                const idx = events.findLastIndex(
                  (e) => !e.done && e.label === TOOL_LABELS_MAP[event.name as string]
                )
                if (idx !== -1) events[idx] = { ...events[idx], done: true }
                return { ...m, toolEvents: events }
              })
            )
          } else if (event.type === 'delta') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, content: m.content + (event.text as string) }
                  : m
              )
            )
          } else if (event.type === 'done') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, streaming: false } : m
              )
            )
          } else if (event.type === 'error') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id
                  ? {
                      ...m,
                      content: `Erro: ${event.text as string}`,
                      streaming: false,
                    }
                  : m
              )
            )
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                content: `Erro: ${err instanceof Error ? err.message : String(err)}`,
                streaming: false,
              }
            : m
        )
      )
    } finally {
      setLoading(false)
      // Ensure streaming is false
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id && m.streaming ? { ...m, streaming: false } : m
        )
      )
    }
  }, [loading, messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      <style>{`
        @keyframes rz-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rz-chat-wrap {
          display: flex;
          flex-direction: column;
          height: calc(100dvh - 60px);
          max-height: calc(100dvh - 60px);
          overflow: hidden;
          background: var(--rz-paper);
        }
        @media (max-width: 1023px) {
          /* 60px topbar + 64px mobile nav */
          .rz-chat-wrap {
            height: calc(100dvh - 124px);
            max-height: calc(100dvh - 124px);
          }
        }
      `}</style>
      <div className="rz-chat-wrap">
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--rz-line)',
          background: 'var(--rz-white)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--rz-ink)', margin: 0 }}>
                Chat IA
              </h1>
              <p className="rz-eyebrow" style={{ marginTop: 2 }}>
                Assistente da corretora
              </p>
            </div>
            <span style={{
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 999,
              background: 'var(--rz-fog)',
              color: 'var(--rz-text-2)',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 500,
              letterSpacing: '0.02em',
              border: '1px solid var(--rz-line)',
            }}>
              claude-sonnet-4-6
            </span>
          </div>
        </div>

        {/* Messages area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {messages.length === 0 ? (
            /* Empty state */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 16,
              padding: '40px 24px',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'var(--rz-deep)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--rz-lime)', fontSize: 22, fontWeight: 700,
              }}>
                R
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--rz-ink)', margin: '0 0 4px' }}>
                  Como posso ajudar?
                </p>
                <p style={{ fontSize: 13, color: 'var(--rz-text-2)', margin: 0 }}>
                  Pergunte sobre clientes, propostas ou apólices
                </p>
              </div>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
                maxWidth: 480,
              }}>
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 999,
                      border: '1px solid var(--rz-line)',
                      background: 'var(--rz-white)',
                      color: 'var(--rz-text-2)',
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 120ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--rz-fog)'
                      e.currentTarget.style.color = 'var(--rz-ink)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--rz-white)'
                      e.currentTarget.style.color = 'var(--rz-text-2)'
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {msg.role === 'user' ? (
                  <div style={{
                    background: 'var(--rz-deep)',
                    color: 'var(--rz-paper)',
                    borderRadius: '12px 12px 2px 12px',
                    padding: '10px 14px',
                    maxWidth: '80%',
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content}
                  </div>
                ) : (
                  <div style={{
                    background: 'var(--rz-white)',
                    border: '1px solid var(--rz-line)',
                    borderRadius: '12px 12px 12px 2px',
                    padding: '12px 16px',
                    maxWidth: '85%',
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}>
                    {/* Tool events */}
                    {(msg.toolEvents?.length ?? 0) > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        {msg.toolEvents!.map((te, i) => (
                          <ToolPill key={i} label={te.label} done={te.done} />
                        ))}
                      </div>
                    )}

                    {/* Content or skeleton */}
                    {msg.content ? (
                      <div style={{ color: 'var(--rz-ink)', whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                        {msg.streaming && <TypingCursor />}
                      </div>
                    ) : msg.streaming ? (
                      /* Skeleton loader */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div className="rz-skeleton" style={{ height: 14, borderRadius: 4, width: '80%' }} />
                        <div className="rz-skeleton" style={{ height: 14, borderRadius: 4, width: '60%' }} />
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{
          borderTop: '1px solid var(--rz-line)',
          padding: '12px 16px',
          background: 'var(--rz-white)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre um cliente, proposta ou apólice…"
              rows={1}
              disabled={loading}
              style={{
                flex: 1,
                resize: 'none',
                border: '1px solid var(--rz-line)',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                background: loading ? 'var(--rz-fog)' : 'var(--rz-paper)',
                color: 'var(--rz-ink)',
                lineHeight: 1.5,
                maxHeight: 120,
                overflowY: 'auto',
                transition: 'border-color 120ms ease',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--rz-deep)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--rz-line)' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                border: 'none',
                background: loading || !input.trim() ? 'var(--rz-fog)' : 'var(--rz-deep)',
                color: loading || !input.trim() ? 'var(--rz-text-3)' : 'var(--rz-lime)',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 120ms ease',
              }}
            >
              {loading ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
          <p style={{
            fontSize: 11,
            color: 'var(--rz-text-3)',
            margin: '6px 0 0',
            textAlign: 'center',
          }}>
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </>
  )
}

// Map tool names to labels (used for marking tool_end)
const TOOL_LABELS_MAP: Record<string, string> = {
  buscar_cliente: '🔍 Buscando cliente…',
  get_propostas_cliente: '📋 Carregando propostas…',
  get_apolices_cliente: '📄 Carregando apólices…',
  get_atividades_cliente: '💬 Carregando histórico de atividades…',
  get_resumo_financeiro: '📊 Calculando resumo financeiro…',
  listar_propostas: '📋 Listando propostas…',
  listar_modalidades: '🏷️ Listando modalidades…',
  atualizar_status_proposta: '✏️ Atualizando status…',
  criar_proposta: '➕ Criando proposta…',
}
