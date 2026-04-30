'use client'

import { useState } from 'react'
import { useRenovacoes, useCreateRenovacao } from '@/hooks/use-renovacoes'
import { formatBRL, formatDateBR } from '@/lib/constants'
import { ChevronDown, RefreshCw, AlertTriangle } from 'lucide-react'
import type { ApoliceWithRelations } from '@/types/domain'

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
}

function urgencyTone(days: number): { bg: string; color: string; label: string } {
  if (days < 0)  return { bg: 'var(--rz-danger-soft)', color: 'var(--rz-danger)',  label: `Venceu há ${Math.abs(days)}d` }
  if (days < 15) return { bg: 'var(--rz-danger-soft)', color: 'var(--rz-danger)',  label: `${days}d` }
  if (days < 30) return { bg: 'var(--rz-amber-soft)',  color: '#92400e',            label: `${days}d` }
  if (days < 60) return { bg: '#fef9c3',               color: '#713f12',            label: `${days}d` }
  return           { bg: 'var(--rz-lime-soft)',        color: 'var(--rz-deep)',     label: `${days}d` }
}

function DaysBadge({ days }: { days: number }) {
  const t = urgencyTone(days)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
      background: t.bg, color: t.color,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {days <= 0 && <AlertTriangle size={9} />}
      {t.label}
    </span>
  )
}

function fmtBRLk(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
  return formatBRL(v)
}

function SelectChip({ label, value, onChange, options }: {
  label: string; value: string
  onChange: (v: string) => void
  options: { id: string; label: string }[]
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: 38, padding: '0 28px 0 10px', fontSize: 13, fontWeight: 500,
          background: value ? '#e3ede9' : 'var(--rz-white)',
          color: 'var(--rz-ink)',
          border: `1px solid ${value ? 'var(--rz-deep)' : 'var(--rz-line)'}`,
          borderRadius: 6, appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <option value="">{label}</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--rz-text-2)', pointerEvents: 'none' }} />
    </div>
  )
}

function RenovarButton({ apolice }: { apolice: ApoliceWithRelations }) {
  const { mutate, isPending } = useCreateRenovacao()
  return (
    <button
      onClick={(e) => { e.stopPropagation(); mutate(apolice) }}
      disabled={isPending}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        height: 30, padding: '0 12px', borderRadius: 6,
        background: 'var(--rz-deep)', color: 'var(--rz-lime)',
        fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
        border: 'none', cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.6 : 1,
        whiteSpace: 'nowrap',
        transition: 'opacity 120ms ease',
      }}
    >
      <RefreshCw size={11} />
      {isPending ? 'Criando…' : 'Renovar'}
    </button>
  )
}

const HORIZONTE_OPTIONS = [
  { id: '15',  label: 'Próximos 15 dias' },
  { id: '30',  label: 'Próximos 30 dias' },
  { id: '60',  label: 'Próximos 60 dias' },
  { id: '90',  label: 'Próximos 90 dias' },
  { id: '180', label: 'Próximos 6 meses' },
]

const PAGE_SIZE = 20

export function RenovacoesTable() {
  const [horizonte, setHorizonte] = useState('60')
  const { data: apolices, isLoading } = useRenovacoes(Number(horizonte))
  const [page, setPage] = useState(0)

  const total = apolices?.length ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paged = apolices?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) ?? []

  const vencendo15 = apolices?.filter((a) => daysUntil(a.vigencia_fim) < 15).length ?? 0
  const vencendo30 = apolices?.filter((a) => { const d = daysUntil(a.vigencia_fim); return d >= 15 && d < 30 }).length ?? 0
  const vencendo60 = apolices?.filter((a) => { const d = daysUntil(a.vigencia_fim); return d >= 30 && d < 60 }).length ?? 0
  const totalIS = apolices?.reduce((s, a) => s + (a.importancia_segurada ?? 0), 0) ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 1, background: 'var(--rz-line)',
        border: '1px solid var(--rz-line)', borderRadius: 6, overflow: 'hidden',
      }}>
        {[
          { l: 'Urgente (< 15d)', v: String(vencendo15), tone: vencendo15 > 0 ? 'var(--rz-danger)' : undefined },
          { l: 'Atenção (15–30d)', v: String(vencendo30), tone: vencendo30 > 0 ? '#92400e' : undefined },
          { l: '30–60 dias', v: String(vencendo60) },
          { l: 'IS em risco', v: fmtBRLk(totalIS), sub: `${total} apólices` },
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--rz-white)', padding: 16 }}>
            <div className="rz-eyebrow" style={{ marginBottom: 8 }}>{k.l}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: k.tone ?? 'var(--rz-ink)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{k.v}</div>
            {k.sub && <div style={{ fontSize: 11, color: 'var(--rz-text-2)', marginTop: 4 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <SelectChip
          label="Horizonte"
          value={horizonte}
          onChange={(v) => { setHorizonte(v || '60'); setPage(0) }}
          options={HORIZONTE_OPTIONS}
        />
        <span style={{ fontSize: 12, color: 'var(--rz-text-2)', marginLeft: 4 }}>
          {isLoading ? 'Carregando…' : `${total} apólice${total !== 1 ? 's' : ''} para renovar`}
        </span>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rz-card" style={{ padding: 16 }}>
                <div className="rz-skeleton" style={{ height: 12, width: 100, borderRadius: 4, marginBottom: 8 }} />
                <div className="rz-skeleton" style={{ height: 16, width: 200, borderRadius: 4, marginBottom: 6 }} />
                <div className="rz-skeleton" style={{ height: 11, width: 140, borderRadius: 4 }} />
              </div>
            ))
          : total === 0
          ? <div style={{ textAlign: 'center', color: 'var(--rz-text-2)', fontSize: 13, padding: '48px 0' }}>
              <RefreshCw size={24} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
              Nenhuma apólice vencendo nesse período
            </div>
          : paged.map((apolice) => {
              const days = daysUntil(apolice.vigencia_fim)
              const t = urgencyTone(days)
              return (
                <div key={apolice.id} className="rz-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--rz-text-3)', fontFamily: 'var(--font-mono, monospace)', marginBottom: 2 }}>
                        {apolice.numero_apolice}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rz-ink)', lineHeight: 1.2 }}>
                        {apolice.tomador?.razao_social}
                      </div>
                    </div>
                    <DaysBadge days={days} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: 'var(--rz-lime-soft)', color: 'var(--rz-deep)', fontWeight: 500 }}>
                      {apolice.modalidade?.nome}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--rz-text-2)' }}>{apolice.seguradora?.nome}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--rz-ink)', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtBRLk(apolice.importancia_segurada ?? 0)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--rz-text-2)' }}>
                      Vence {formatDateBR(apolice.vigencia_fim)}
                    </span>
                    <RenovarButton apolice={apolice} />
                  </div>
                </div>
              )
            })
        }
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', paddingTop: 4 }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              style={{ flex: 1, height: 44, fontSize: 13, fontWeight: 500, borderRadius: 8, border: '1px solid var(--rz-line)', background: 'var(--rz-white)', cursor: page === 0 ? 'not-allowed' : 'pointer', color: page === 0 ? 'var(--rz-text-3)' : 'var(--rz-ink)' }}>
              ← Anterior
            </button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              style={{ flex: 1, height: 44, fontSize: 13, fontWeight: 500, borderRadius: 8, border: '1px solid var(--rz-line)', background: page >= totalPages - 1 ? 'var(--rz-fog)' : 'var(--rz-deep)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', color: page >= totalPages - 1 ? 'var(--rz-text-3)' : 'var(--rz-paper)' }}>
              Próximo →
            </button>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="rz-card hidden md:block" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--rz-fog)', borderBottom: '1px solid var(--rz-line)' }}>
                {['Apólice / Tomador', 'Modalidade', 'Seguradora', 'Vencimento', 'IS', 'Prêmio', 'Prazo', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 14px',
                    textAlign: i >= 4 && i <= 5 ? 'right' : 'left',
                    fontSize: 10, fontWeight: 600, color: 'var(--rz-text-2)',
                    textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--rz-line-2)' }}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} style={{ padding: '12px 14px' }}>
                          <div className="rz-skeleton" style={{ height: 12, borderRadius: 4, width: j === 0 ? 140 : j === 4 || j === 5 ? 70 : 90 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : total === 0
                ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '48px 14px', textAlign: 'center', color: 'var(--rz-text-2)', fontSize: 13 }}>
                        Nenhuma apólice vencendo nos próximos {horizonte} dias
                      </td>
                    </tr>
                  )
                : paged.map((apolice) => {
                    const days = daysUntil(apolice.vigencia_fim)
                    return (
                      <tr
                        key={apolice.id}
                        style={{ borderBottom: '1px solid var(--rz-line-2)', transition: 'background 120ms ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--rz-fog)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 11, color: 'var(--rz-text-2)', fontFamily: 'var(--font-mono, monospace)' }}>
                              {apolice.numero_apolice}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--rz-ink)' }}>
                              {apolice.tomador?.razao_social}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, fontWeight: 500, background: 'var(--rz-lime-soft)', color: 'var(--rz-deep)' }}>
                            {apolice.modalidade?.nome}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--rz-ink)' }}>
                          {apolice.seguradora?.nome}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 12, color: 'var(--rz-ink)' }}>{formatDateBR(apolice.vigencia_fim)}</span>
                            <span style={{ fontSize: 10, color: 'var(--rz-text-3)' }}>Início: {formatDateBR(apolice.vigencia_inicio)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <span style={{ color: 'var(--rz-text-2)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>
                            {fmtBRLk(apolice.importancia_segurada ?? 0)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <span style={{ fontWeight: 600, color: 'var(--rz-ink)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>
                            {fmtBRLk(apolice.premio ?? 0)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <DaysBadge days={days} />
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <RenovarButton apolice={apolice} />
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>

        <div style={{
          padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--rz-fog)', borderTop: '1px solid var(--rz-line)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--rz-text-2)' }}>
            {total === 0 ? 'Nenhuma apólice' : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} de ${total} apólices`}
          </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                style={{ height: 36, padding: '0 14px', fontSize: 12, fontWeight: 500, background: 'transparent', color: page === 0 ? 'var(--rz-text-3)' : 'var(--rz-ink)', border: '1px solid var(--rz-line)', borderRadius: 6, cursor: page === 0 ? 'not-allowed' : 'pointer' }}>Anterior</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                style={{ height: 36, padding: '0 14px', fontSize: 12, fontWeight: 500, background: page >= totalPages - 1 ? 'var(--rz-fog)' : 'var(--rz-white)', color: page >= totalPages - 1 ? 'var(--rz-text-3)' : 'var(--rz-ink)', border: '1px solid var(--rz-line)', borderRadius: 6, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>Próximo</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
