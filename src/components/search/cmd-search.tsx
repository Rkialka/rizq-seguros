'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, FileText, Shield, ArrowRight, Building2 } from 'lucide-react'
import { formatDateBR } from '@/lib/constants'

interface SearchResult {
  id: string
  type: 'proposta' | 'apolice' | 'tomador'
  numero: string
  tomador: string
  status: string
  href: string
  sub?: string
}

const STATUS_PT: Record<string, string> = {
  cotacao_pendente: 'Cotação Pendente',
  em_analise: 'Em Análise',
  em_analise_credito: 'Em Análise (Crédito)',
  subscricao: 'Subscrição',
  em_emissao: 'Em Emissão',
  aprovada: 'Aprovada',
  emitida: 'Emitida',
  rejeitada: 'Rejeitada',
  erro_emissao: 'Erro na Emissão',
  vigente: 'Vigente',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
  encerrada: 'Encerrada',
}

export function openCmdSearch() {
  window.dispatchEvent(new CustomEvent('cmd-search:open'))
}

export function CmdSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ⌘K / Ctrl+K listener + custom open event
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    const openHandler = () => setOpen(true)
    window.addEventListener('keydown', handler)
    window.addEventListener('cmd-search:open', openHandler)
    return () => {
      window.removeEventListener('keydown', handler)
      window.removeEventListener('cmd-search:open', openHandler)
    }
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const supabase = createClient()
        const q = `%${query.trim()}%`

        const [propostasRes, apolicesRes, tomadoresRes] = await Promise.all([
          supabase
            .from('propostas')
            .select('id, numero_proposta, status, objeto, tomador:tomadores(razao_social)')
            .or(`numero_proposta.ilike.${q},objeto.ilike.${q}`)
            .limit(5),
          supabase
            .from('apolices')
            .select('id, numero_apolice, status, objeto, vigencia_fim, tomador:tomadores(razao_social)')
            .or(`numero_apolice.ilike.${q},objeto.ilike.${q}`)
            .limit(5),
          supabase
            .from('tomadores')
            .select('id, razao_social, cnpj')
            .ilike('razao_social', `%${query.trim()}%`)
            .limit(4),
        ])

        const propostas: SearchResult[] = (propostasRes.data ?? []).map((p: any) => ({
          id: p.id,
          type: 'proposta' as const,
          numero: p.numero_proposta,
          tomador: p.tomador?.razao_social ?? '—',
          status: STATUS_PT[p.status] ?? p.status,
          href: `/propostas/${p.id}`,
          sub: p.objeto ?? undefined,
        }))

        const apolices: SearchResult[] = (apolicesRes.data ?? []).map((a: any) => ({
          id: a.id,
          type: 'apolice' as const,
          numero: a.numero_apolice,
          tomador: a.tomador?.razao_social ?? '—',
          status: STATUS_PT[a.status] ?? a.status,
          href: `/apolices/${a.id}`,
          sub: a.vigencia_fim ? `Vence ${formatDateBR(a.vigencia_fim)}` : undefined,
        }))

        const tomadores: SearchResult[] = (tomadoresRes.data ?? []).map((t: any) => ({
          id: t.id,
          type: 'tomador' as const,
          numero: t.cnpj ?? '',
          tomador: t.razao_social ?? '—',
          status: 'Tomador',
          href: `/tomadores/${t.id}`,
        }))

        setResults([...propostas, ...apolices, ...tomadores])
        setSelectedIndex(0)
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const navigate = useCallback((result: SearchResult) => {
    router.push(result.href)
    setOpen(false)
  }, [router])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) navigate(results[selectedIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const propostaResults = results.filter((r) => r.type === 'proposta')
  const apoliceResults = results.filter((r) => r.type === 'apolice')
  const tomadorResults = results.filter((r) => r.type === 'tomador')

  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(3,26,19,0.48)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '10vh',
        backdropFilter: 'blur(2px)',
      }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{
          width: '100%', maxWidth: 560,
          background: 'var(--rz-white)',
          borderRadius: 10,
          boxShadow: '0 16px 48px rgba(3,26,19,0.24)',
          border: '1px solid var(--rz-line)',
          overflow: 'hidden',
          margin: '0 16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px', borderBottom: '1px solid var(--rz-line)',
          height: 52,
        }}>
          <Search size={16} style={{ color: 'var(--rz-text-2)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar proposta, apólice, tomador…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 15, color: 'var(--rz-ink)',
              fontFamily: 'inherit', background: 'transparent',
            }}
          />
          <kbd style={{
            fontSize: 10, color: 'var(--rz-text-3)',
            background: 'var(--rz-fog)', border: '1px solid var(--rz-line)',
            borderRadius: 4, padding: '2px 5px',
            fontFamily: 'var(--font-mono, monospace)',
          }}>Esc</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--rz-text-3)', fontSize: 13 }}>
              Buscando…
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--rz-text-2)', fontSize: 13 }}>
              Nenhum resultado para &quot;{query}&quot;
            </div>
          )}

          {!loading && results.length === 0 && query.length < 2 && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div className="rz-eyebrow" style={{ marginBottom: 8, padding: '0 4px' }}>Atalhos</div>
              {[
                { label: 'Propostas', href: '/propostas', icon: FileText },
                { label: 'Apólices', href: '/apolices', icon: Shield },
                { label: 'Tomadores', href: '/tomadores', icon: Building2 },
              ].map(({ label, href, icon: Icon }) => (
                <button
                  key={href}
                  onClick={() => { router.push(href); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 6, border: 'none',
                    background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                    width: '100%', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--rz-fog)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon size={14} style={{ color: 'var(--rz-text-2)' }} />
                  <span style={{ fontSize: 13, color: 'var(--rz-ink)' }}>{label}</span>
                  <ArrowRight size={12} style={{ marginLeft: 'auto', color: 'var(--rz-text-3)' }} />
                </button>
              ))}
            </div>
          )}

          {!loading && results.length > 0 && (
            <div style={{ padding: 8 }}>
              {propostaResults.length > 0 && (
                <>
                  <div className="rz-eyebrow" style={{ padding: '6px 10px 4px' }}>Propostas</div>
                  {propostaResults.map((r) => {
                    const globalIndex = results.indexOf(r)
                    return (
                      <ResultRow
                        key={r.id}
                        result={r}
                        selected={selectedIndex === globalIndex}
                        onSelect={() => navigate(r)}
                        onHover={() => setSelectedIndex(globalIndex)}
                      />
                    )
                  })}
                </>
              )}
              {apoliceResults.length > 0 && (
                <>
                  <div className="rz-eyebrow" style={{ padding: '10px 10px 4px' }}>Apólices</div>
                  {apoliceResults.map((r) => {
                    const globalIndex = results.indexOf(r)
                    return (
                      <ResultRow
                        key={r.id}
                        result={r}
                        selected={selectedIndex === globalIndex}
                        onSelect={() => navigate(r)}
                        onHover={() => setSelectedIndex(globalIndex)}
                      />
                    )
                  })}
                </>
              )}
              {tomadorResults.length > 0 && (
                <>
                  <div className="rz-eyebrow" style={{ padding: '10px 10px 4px' }}>Tomadores</div>
                  {tomadorResults.map((r) => {
                    const globalIndex = results.indexOf(r)
                    return (
                      <ResultRow
                        key={r.id}
                        result={r}
                        selected={selectedIndex === globalIndex}
                        onSelect={() => navigate(r)}
                        onHover={() => setSelectedIndex(globalIndex)}
                      />
                    )
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--rz-line-2)',
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--rz-fog)',
        }}>
          {[
            { keys: ['↑', '↓'], label: 'navegar' },
            { keys: ['↵'], label: 'abrir' },
            { keys: ['Esc'], label: 'fechar' },
          ].map(({ keys, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--rz-text-3)' }}>
              {keys.map((k) => (
                <kbd key={k} style={{
                  background: 'var(--rz-white)', border: '1px solid var(--rz-line)',
                  borderRadius: 3, padding: '1px 4px', fontSize: 9,
                  fontFamily: 'var(--font-mono, monospace)',
                }}>{k}</kbd>
              ))}
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}

function ResultRow({
  result,
  selected,
  onSelect,
  onHover,
}: {
  result: SearchResult
  selected: boolean
  onSelect: () => void
  onHover: () => void
}) {
  const Icon = result.type === 'proposta' ? FileText : result.type === 'apolice' ? Shield : Building2
  const iconBg = result.type === 'proposta' ? '#dbeafe' : result.type === 'apolice' ? '#dff0e8' : 'var(--rz-fog)'
  const iconColor = result.type === 'proposta' ? '#1d4ed8' : result.type === 'apolice' ? 'var(--rz-moss)' : 'var(--rz-text-2)'
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '9px 10px', borderRadius: 6, border: 'none',
        background: selected ? 'var(--rz-fog)' : 'transparent',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={13} style={{ color: iconColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            fontSize: 11, fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--rz-text-3)', letterSpacing: '0.06em', flexShrink: 0,
          }}>
            {result.numero}
          </span>
          <span style={{
            fontSize: 13, fontWeight: 600, color: 'var(--rz-ink)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {result.tomador}
          </span>
        </div>
        {result.sub && (
          <div style={{ fontSize: 11, color: 'var(--rz-text-2)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {result.sub}
          </div>
        )}
      </div>
      <span style={{
        fontSize: 10, padding: '2px 7px', borderRadius: 999,
        background: 'var(--rz-fog)', color: 'var(--rz-text-2)',
        border: '1px solid var(--rz-line-2)', flexShrink: 0,
      }}>
        {result.status}
      </span>
    </button>
  )
}
