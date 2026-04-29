'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApolices } from '@/hooks/use-apolices'
import { useSeguradoras } from '@/hooks/use-propostas'
import { APOLICE_STATUS, formatBRL, formatDateBR } from '@/lib/constants'
import { Search, ChevronRight, ChevronDown, Download } from 'lucide-react'

function exportCSV(rows: any[], filename: string) {
  const headers = ['Apólice', 'Tomador', 'Modalidade', 'Seguradora', 'Vigência Início', 'Vigência Fim', 'IS', 'Prêmio', 'Status']
  const csvRows = rows.map(a => [
    a.numero_apolice,
    (a.tomador as any)?.razao_social ?? '',
    (a.modalidade as any)?.nome ?? '',
    (a.seguradora as any)?.nome ?? '',
    a.vigencia_inicio,
    a.vigencia_fim,
    a.importancia_segurada ?? '',
    a.premio ?? '',
    a.status,
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  const csv = [headers.join(','), ...csvRows].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function fmtBRLk(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
  return formatBRL(v)
}

function StatusChip({ status, days }: { status: string; days: number }) {
  const tone =
    status === 'vencida' ? 'danger'
    : status === 'cancelada' || status === 'encerrada' ? 'neutral'
    : days < 30 ? 'amber'
    : 'moss'

  const styles: Record<string, { bg: string; color: string }> = {
    moss:    { bg: 'var(--rz-lime-soft)',   color: 'var(--rz-deep)' },
    amber:   { bg: 'var(--rz-amber-soft)',  color: '#6e4d10' },
    danger:  { bg: 'var(--rz-danger-soft)', color: 'var(--rz-danger)' },
    neutral: { bg: 'var(--rz-mist)',        color: 'var(--rz-text-2)' },
  }
  const s = styles[tone]
  const label =
    status === 'vigente' ? 'Vigente'
    : status === 'vencida' ? 'Vencida'
    : status === 'cancelada' ? 'Cancelada'
    : 'Encerrada'

  return (
    <span style={{
      fontSize: 10,
      padding: '2px 8px',
      borderRadius: 999,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: s.color, display: 'inline-block' }} />
      {label}
    </span>
  )
}

function SelectChip({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { id: string; label: string }[]
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: 38,
          padding: '0 28px 0 10px',
          fontSize: 13,
          fontWeight: 500,
          background: value ? '#e3ede9' : 'var(--rz-white)',
          color: 'var(--rz-ink)',
          border: `1px solid ${value ? 'var(--rz-deep)' : 'var(--rz-line)'}`,
          borderRadius: 6,
          appearance: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <option value="">{label}: Todos</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--rz-text-2)', pointerEvents: 'none' }} />
    </div>
  )
}

const PAGE_SIZE = 20

export function ApolicesTable() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [seguradoraFilter, setSeguradoraFilter] = useState<string>('')
  const [page, setPage] = useState(0)

  const { data: apolices, isLoading } = useApolices({
    search: search || undefined,
    status: statusFilter || undefined,
    seguradora_id: seguradoraFilter || undefined,
  })
  const { data: seguradoras } = useSeguradoras()

  const totalCount = apolices?.length ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const paged = apolices?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) ?? []

  const vigentes  = apolices?.filter((a) => a.status === 'vigente')?.length ?? 0
  const vencendo  = apolices?.filter((a) => {
    const d = Math.ceil((new Date(a.vigencia_fim).getTime() - Date.now()) / 86400000)
    return a.status === 'vigente' && d <= 30
  })?.length ?? 0
  const vencidas  = apolices?.filter((a) => a.status === 'vencida')?.length ?? 0
  const totalIS   = apolices?.reduce((s, a) => s + (a.importancia_segurada ?? 0), 0) ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 1, background: 'var(--rz-line)',
        border: '1px solid var(--rz-line)', borderRadius: 6, overflow: 'hidden',
      }}>
        {[
          { l: 'Vigentes', v: String(vigentes), sub: `${fmtBRLk(totalIS)} em IS` },
          { l: 'Vencendo 30d', v: String(vencendo), sub: 'em risco de renovação', tone: 'var(--rz-amber)' as string },
          { l: 'Vencidas', v: String(vencidas), sub: 'aguardando renovação', tone: 'var(--rz-danger)' as string },
          { l: 'Total', v: String(apolices?.length ?? 0), sub: 'apólices na carteira' },
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--rz-white)', padding: 16 }}>
            <div className="rz-eyebrow" style={{ marginBottom: 8 }}>{k.l}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: k.tone ?? 'var(--rz-ink)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{k.v}</div>
            <div style={{ fontSize: 11, color: 'var(--rz-text-2)', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', flex: 1,
          background: 'var(--rz-white)', border: '1px solid var(--rz-line)', borderRadius: 6,
        }}>
          <Search size={13} style={{ color: 'var(--rz-text-2)', flexShrink: 0 }} />
          <input
            placeholder="Buscar por nº apólice, tomador, CNPJ…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none', outline: 'none', flex: 1, fontSize: 13,
              fontFamily: 'inherit', background: 'transparent', color: 'var(--rz-ink)',
            }}
          />
        </div>
        <SelectChip
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={APOLICE_STATUS.map((s) => ({ id: s.id, label: s.label }))}
        />
        <SelectChip
          label="Seguradora"
          value={seguradoraFilter}
          onChange={setSeguradoraFilter}
          options={(seguradoras ?? []).map((s) => ({ id: s.id, label: s.nome }))}
        />
        {(search || statusFilter || seguradoraFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setSeguradoraFilter(''); setPage(0) }}
            style={{ fontSize: 11, color: 'var(--rz-pine)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Limpar
          </button>
        )}
        <button
          onClick={() => exportCSV(apolices ?? [], 'apolices.csv')}
          disabled={!apolices || apolices.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid var(--rz-line)',
            background: 'var(--rz-white)', color: 'var(--rz-ink)',
            fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
            opacity: (!apolices || apolices.length === 0) ? 0.5 : 1,
            marginLeft: 'auto',
          }}
        >
          <Download size={12} />
          Exportar CSV
        </button>
      </div>

      {/* Mobile card list (hidden on md+) */}
      <div className="flex flex-col gap-2 md:hidden">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rz-card" style={{ padding: 16 }}>
                <div className="rz-skeleton" style={{ height: 12, width: 100, borderRadius: 4, marginBottom: 8 }} />
                <div className="rz-skeleton" style={{ height: 16, width: 200, borderRadius: 4, marginBottom: 6 }} />
                <div className="rz-skeleton" style={{ height: 11, width: 140, borderRadius: 4 }} />
              </div>
            ))
          : totalCount === 0
          ? <div style={{ textAlign: 'center', color: 'var(--rz-text-2)', fontSize: 13, padding: '32px 0' }}>Nenhuma apólice encontrada</div>
          : paged.map((apolice) => {
              const days = Math.ceil((new Date(apolice.vigencia_fim).getTime() - Date.now()) / 86400000)
              const daysTone = apolice.status === 'vencida' ? 'var(--rz-danger)' : days < 30 ? '#6e4d10' : 'var(--rz-moss)'
              return (
                <div
                  key={apolice.id}
                  className="rz-card"
                  onClick={() => router.push(`/apolices/${apolice.id}`)}
                  style={{ padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--rz-text-3)', fontFamily: 'var(--font-mono, monospace)', marginBottom: 2 }}>
                        {apolice.numero_apolice}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rz-ink)', lineHeight: 1.2 }}>
                        {(apolice.tomador as any)?.razao_social}
                      </div>
                    </div>
                    <StatusChip status={apolice.status} days={days} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--rz-ink)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtBRLk(apolice.importancia_segurada ?? 0)}
                    </span>
                    {(apolice.modalidade as any)?.nome && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: 'var(--rz-lime-soft)', color: 'var(--rz-deep)', fontWeight: 500 }}>
                        {(apolice.modalidade as any)?.nome}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: daysTone, fontWeight: 600, marginLeft: 'auto' }}>
                      {apolice.status === 'vencida' ? `Venceu há ${Math.abs(days)}d` : `Vence em ${days}d`}
                    </span>
                  </div>
                </div>
              )
            })
        }
        {/* Mobile pagination */}
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

      {/* Desktop table (hidden on mobile) */}
      <div className="rz-card hidden md:block" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--rz-fog)', borderBottom: '1px solid var(--rz-line)' }}>
                {['Apólice / Tomador', 'Modalidade', 'Seguradora', 'Vigência', 'IS', 'Prêmio', 'Status', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 14px',
                    textAlign: i >= 4 && i <= 5 ? 'right' : 'left',
                    fontSize: 10, fontWeight: 600, color: 'var(--rz-text-2)',
                    textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--rz-line-2)' }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} style={{ padding: '12px 14px' }}>
                        <div className="rz-skeleton" style={{ height: 12, borderRadius: 4, width: j === 0 ? 140 : j === 4 || j === 5 ? 70 : 90 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : totalCount === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '32px 14px', textAlign: 'center', color: 'var(--rz-text-2)', fontSize: 13 }}>
                    Nenhuma apólice encontrada
                  </td>
                </tr>
              ) : (
                paged.map((apolice) => {
                  const days = Math.ceil((new Date(apolice.vigencia_fim).getTime() - Date.now()) / 86400000)
                  const daysTone = apolice.status === 'vencida' ? 'var(--rz-danger)' : days < 30 ? '#6e4d10' : 'var(--rz-text-2)'
                  return (
                    <tr
                      key={apolice.id}
                      onClick={() => router.push(`/apolices/${apolice.id}`)}
                      style={{
                        borderBottom: '1px solid var(--rz-line-2)',
                        cursor: 'pointer',
                        transition: 'background 120ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--rz-fog)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      {/* Apólice + Tomador */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 11, color: 'var(--rz-text-2)', fontFamily: 'var(--font-mono, monospace)' }}>
                            {apolice.numero_apolice}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--rz-ink)' }}>
                            {(apolice.tomador as any)?.razao_social}
                          </span>
                        </div>
                      </td>
                      {/* Modalidade */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 999, fontWeight: 500,
                          background: 'var(--rz-lime-soft)', color: 'var(--rz-deep)',
                        }}>
                          {(apolice.modalidade as any)?.nome}
                        </span>
                      </td>
                      {/* Seguradora */}
                      <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--rz-ink)' }}>
                        {(apolice.seguradora as any)?.nome}
                      </td>
                      {/* Vigência */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 11, color: 'var(--rz-ink)' }}>{formatDateBR(apolice.vigencia_inicio)}</span>
                          <span style={{ fontSize: 10, color: 'var(--rz-text-3)' }}>
                            até {formatDateBR(apolice.vigencia_fim)}
                            {' '}·{' '}
                            <span style={{ color: daysTone, fontWeight: 600 }}>
                              {apolice.status === 'vencida' ? `há ${Math.abs(days)}d` : `${days}d`}
                            </span>
                          </span>
                        </div>
                      </td>
                      {/* IS */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <span style={{
                          color: 'var(--rz-text-2)', fontVariantNumeric: 'tabular-nums',
                          fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
                        }}>
                          {fmtBRLk(apolice.importancia_segurada ?? 0)}
                        </span>
                      </td>
                      {/* Prêmio */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <span style={{
                          fontWeight: 600, color: 'var(--rz-ink)',
                          fontVariantNumeric: 'tabular-nums',
                          fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
                        }}>
                          {fmtBRLk(apolice.premio ?? 0)}
                        </span>
                      </td>
                      {/* Status */}
                      <td style={{ padding: '12px 14px' }}>
                        <StatusChip status={apolice.status} days={days} />
                      </td>
                      {/* Chevron */}
                      <td style={{ padding: '12px 14px' }}>
                        <ChevronRight size={14} style={{ color: 'var(--rz-text-3)' }} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div style={{
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--rz-fog)', borderTop: '1px solid var(--rz-line)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--rz-text-2)' }}>
            {totalCount === 0 ? 'Nenhuma apólice' : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalCount)} de ${totalCount} apólices`}
          </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                style={{
                  height: 36, padding: '0 14px', fontSize: 12, fontWeight: 500,
                  background: 'transparent', color: page === 0 ? 'var(--rz-text-3)' : 'var(--rz-ink)',
                  border: '1px solid var(--rz-line)', borderRadius: 6,
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                }}>Anterior</button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                style={{
                  height: 36, padding: '0 14px', fontSize: 12, fontWeight: 500,
                  background: page >= totalPages - 1 ? 'var(--rz-fog)' : 'var(--rz-white)',
                  color: page >= totalPages - 1 ? 'var(--rz-text-3)' : 'var(--rz-ink)',
                  border: '1px solid var(--rz-line)', borderRadius: 6,
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                }}>Próximo</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
