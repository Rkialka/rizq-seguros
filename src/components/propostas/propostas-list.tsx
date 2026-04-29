'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePropostas } from '@/hooks/use-propostas'
import { useSeguradoras } from '@/hooks/use-propostas'
import { PROPOSTA_STAGES, PRIORIDADES, STAGE_TONES, PRIO_COLORS, formatBRL, formatDateBR, getSLADaysRemaining } from '@/lib/constants'
import { Search, ChevronRight, ChevronDown, Download } from 'lucide-react'

function exportCSV(rows: any[], filename: string) {
  const headers = ['Proposta', 'Tomador', 'Modalidade', 'Seguradora', 'IS', 'Status', 'Prioridade', 'SLA Início']
  const csvRows = rows.map(p => [
    p.numero_proposta,
    (p.tomador as any)?.razao_social ?? '',
    (p.modalidade as any)?.nome ?? '',
    (p.seguradora as any)?.nome ?? '',
    p.importancia_segurada ?? '',
    p.status,
    p.prioridade ?? '',
    p.sla_inicio ?? '',
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
          height: 30, padding: '0 28px 0 10px', fontSize: 12, fontWeight: 500,
          background: value ? '#e3ede9' : 'var(--rz-white)',
          color: 'var(--rz-ink)',
          border: `1px solid ${value ? 'var(--rz-deep)' : 'var(--rz-line)'}`,
          borderRadius: 6, appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <option value="">{label}: Todos</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={12} style={{
        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--rz-text-2)', pointerEvents: 'none',
      }} />
    </div>
  )
}

const PAGE_SIZE = 20

export function PropostasList() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [seguradoraFilter, setSeguradoraFilter] = useState('')
  const [page, setPage] = useState(0)

  const { data: allPropostas, isLoading } = usePropostas()
  const { data: seguradoras } = useSeguradoras()

  const propostas = (allPropostas ?? []).filter((p) => {
    const matchSearch = !search || (
      p.numero_proposta.toLowerCase().includes(search.toLowerCase()) ||
      (p.tomador as any)?.razao_social?.toLowerCase().includes(search.toLowerCase()) ||
      p.objeto?.toLowerCase().includes(search.toLowerCase())
    )
    const matchStatus = !statusFilter || p.status === statusFilter
    const matchSeg = !seguradoraFilter || p.seguradora_id === seguradoraFilter
    return matchSearch && matchStatus && matchSeg
  })

  const totalCount = propostas.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const paged = propostas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // KPI strip
  const ativas   = propostas.filter((p) => !['emitida','rejeitada','erro_emissao'].includes(p.status)).length
  const pipeline = propostas.reduce((s, p) => s + (p.importancia_segurada ?? 0), 0)
  const slaRisco = propostas.filter((p) => {
    const d = getSLADaysRemaining(p.sla_inicio, p.sla_dias)
    return d <= 0 && !['emitida','rejeitada','erro_emissao'].includes(p.status)
  }).length
  const emissao  = propostas.filter((p) => p.status === 'em_emissao' || p.status === 'aprovada').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 1, background: 'var(--rz-line)',
        border: '1px solid var(--rz-line)', borderRadius: 6, overflow: 'hidden',
      }}>
        {[
          { l: 'Em pipeline', v: String(ativas), sub: `${fmtBRLk(pipeline)} em IS` },
          { l: 'SLA em risco', v: String(slaRisco), sub: 'prazo vencido', tone: 'var(--rz-danger)' as string | undefined },
          { l: 'Prontas p/ emissão', v: String(emissao), sub: 'aprovadas/em emissão', tone: 'var(--rz-moss)' as string | undefined },
          { l: 'Total filtrado', v: String(propostas.length), sub: 'propostas encontradas' },
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--rz-white)', padding: 16 }}>
            <div className="rz-eyebrow" style={{ marginBottom: 8 }}>{k.l}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: k.tone ?? 'var(--rz-ink)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{k.v}</div>
            <div style={{ fontSize: 11, color: 'var(--rz-text-2)', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 12px', flex: 1,
          background: 'var(--rz-white)', border: '1px solid var(--rz-line)', borderRadius: 6, maxWidth: 360,
        }}>
          <Search size={13} style={{ color: 'var(--rz-text-2)', flexShrink: 0 }} />
          <input
            placeholder="Buscar por nº proposta, tomador, objeto…"
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
          options={PROPOSTA_STAGES.map((s) => ({ id: s.id, label: s.label }))}
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
          onClick={() => exportCSV(propostas, 'propostas.csv')}
          disabled={propostas.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid var(--rz-line)',
            background: 'var(--rz-white)', color: 'var(--rz-ink)',
            fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
            opacity: propostas.length === 0 ? 0.5 : 1,
            marginLeft: 'auto',
          }}
        >
          <Download size={12} />
          Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div className="rz-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--rz-fog)', borderBottom: '1px solid var(--rz-line)' }}>
                {['Proposta / Tomador', 'Modalidade', 'Seguradora', 'IS', 'Status', 'Prioridade', 'SLA', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 14px',
                    textAlign: i === 3 ? 'right' : 'left',
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
                        <div className="rz-skeleton" style={{ height: 12, borderRadius: 4, width: j === 0 ? 140 : 80 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : totalCount === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '32px 14px', textAlign: 'center', color: 'var(--rz-text-2)', fontSize: 13 }}>
                    Nenhuma proposta encontrada
                  </td>
                </tr>
              ) : (
                paged.map((proposta) => {
                  const sla = getSLADaysRemaining(proposta.sla_inicio, proposta.sla_dias)
                  const stageTone = STAGE_TONES[proposta.status] ?? { bg: 'var(--rz-fog)', color: 'var(--rz-text-2)' }
                  const stageConfig = PROPOSTA_STAGES.find((s) => s.id === proposta.status)
                  const prioColor = PRIO_COLORS[proposta.prioridade] ?? 'var(--rz-text-3)'
                  const prioConfig = PRIORIDADES.find((p) => p.id === proposta.prioridade)
                  const slaColor = sla < 0 ? 'var(--rz-danger)' : sla <= 2 ? 'var(--rz-amber)' : 'var(--rz-text-2)'

                  return (
                    <tr
                      key={proposta.id}
                      onClick={() => router.push(`/propostas/${proposta.id}`)}
                      style={{
                        borderBottom: '1px solid var(--rz-line-2)',
                        cursor: 'pointer',
                        transition: 'background 120ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--rz-fog)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      {/* Proposta + Tomador */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 11, color: 'var(--rz-text-2)', fontFamily: 'var(--font-mono, monospace)' }}>
                            {proposta.numero_proposta}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--rz-ink)' }}>
                            {(proposta.tomador as any)?.razao_social}
                          </span>
                          {proposta.objeto && (
                            <span style={{ fontSize: 11, color: 'var(--rz-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                              {proposta.objeto}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Modalidade */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 999, fontWeight: 500,
                          background: 'var(--rz-lime-soft)', color: 'var(--rz-deep)',
                        }}>
                          {(proposta.modalidade as any)?.nome}
                        </span>
                      </td>
                      {/* Seguradora */}
                      <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--rz-ink)' }}>
                        {(proposta.seguradora as any)?.nome ?? <span style={{ color: 'var(--rz-text-3)' }}>—</span>}
                      </td>
                      {/* IS */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <span style={{
                          color: 'var(--rz-ink)', fontVariantNumeric: 'tabular-nums',
                          fontFamily: 'var(--font-mono, monospace)', fontSize: 12, fontWeight: 600,
                        }}>
                          {fmtBRLk(proposta.importancia_segurada ?? 0)}
                        </span>
                      </td>
                      {/* Status */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 600,
                          background: stageTone.bg, color: stageTone.color,
                        }}>
                          {stageConfig?.label}
                        </span>
                      </td>
                      {/* Prioridade */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--rz-ink)' }}>
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: prioColor, flexShrink: 0 }} />
                          {prioConfig?.label}
                        </span>
                      </td>
                      {/* SLA */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600, color: slaColor,
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {sla < 0 ? 'Atrasada' : `${sla}d`}
                        </span>
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

        <div style={{
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--rz-fog)', borderTop: '1px solid var(--rz-line)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--rz-text-2)' }}>
            {totalCount === 0 ? 'Nenhuma proposta' : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalCount)} de ${totalCount} propostas`}
          </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                style={{
                  height: 28, padding: '0 10px', fontSize: 12, fontWeight: 500,
                  background: 'transparent', color: page === 0 ? 'var(--rz-text-3)' : 'var(--rz-ink)',
                  border: '1px solid var(--rz-line)', borderRadius: 6,
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                }}>Anterior</button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                style={{
                  height: 28, padding: '0 10px', fontSize: 12, fontWeight: 500,
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
