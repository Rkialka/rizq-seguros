'use client'

import { useState } from 'react'
import { useRelatorios, getPeriodos, type Periodo } from '@/hooks/use-relatorios'
import { formatBRL } from '@/lib/constants'
import { Download } from 'lucide-react'

function fmtBRLk(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
  return formatBRL(v)
}

function BarChart({
  rows,
  isLoading,
  emptyMsg,
}: {
  rows: { nome: string; premio: number; is: number; count: number }[]
  isLoading: boolean
  emptyMsg: string
}) {
  const max = Math.max(...rows.map((r) => r.premio), 1)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="rz-skeleton" style={{ width: 110, height: 11, borderRadius: 4, flexShrink: 0 }} />
            <div className="rz-skeleton" style={{ height: 22, borderRadius: 4, flex: 1 }} />
            <div className="rz-skeleton" style={{ width: 60, height: 11, borderRadius: 4, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return <div style={{ color: 'var(--rz-text-2)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>{emptyMsg}</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map((row, i) => {
        const pct = (row.premio / max) * 100
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 12, color: 'var(--rz-text-2)', width: 130,
              flexShrink: 0, textAlign: 'right', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }} title={row.nome}>{row.nome}</span>
            <div style={{ flex: 1, height: 24, background: 'var(--rz-fog)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.max(pct, row.count > 0 ? 2 : 0)}%`,
                background: 'var(--rz-deep)', borderRadius: 4,
                display: 'flex', alignItems: 'center', paddingLeft: 8,
                transition: 'width 500ms ease',
                minWidth: row.count > 0 ? 4 : 0,
              }}>
                {pct > 18 && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--rz-lime)', fontVariantNumeric: 'tabular-nums' }}>
                    {row.count}
                  </span>
                )}
              </div>
            </div>
            <span style={{
              fontSize: 12, color: 'var(--rz-ink)', width: 72,
              flexShrink: 0, textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
              fontFamily: 'var(--font-mono, monospace)',
            }}>{fmtBRLk(row.premio)}</span>
          </div>
        )
      })}
    </div>
  )
}

function ConversaoFunnel({ data, isLoading }: {
  data: { propostas_criadas: number; propostas_emitidas: number; apolices_emitidas: number; taxa_conversao: number }
  isLoading: boolean
}) {
  const steps = [
    { label: 'Propostas criadas', value: data.propostas_criadas, color: 'var(--rz-fog)', text: 'var(--rz-ink)' },
    { label: 'Propostas emitidas', value: data.propostas_emitidas, color: '#dff0e8', text: 'var(--rz-moss)' },
    { label: 'Apólices emitidas', value: data.apolices_emitidas, color: 'var(--rz-deep)', text: 'var(--rz-lime)' },
  ]
  const max = Math.max(data.propostas_criadas, data.apolices_emitidas, 1)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rz-skeleton" style={{ height: 52, borderRadius: 6 }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {steps.map((step, i) => {
        const pct = Math.round((step.value / max) * 100)
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 6,
            background: step.color,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: step.text, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {step.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, color: step.text, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                {step.value}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: step.text, fontVariantNumeric: 'tabular-nums' }}>
                {pct}%
              </div>
              <div style={{ fontSize: 10, color: step.text, opacity: 0.6 }}>do total</div>
            </div>
          </div>
        )
      })}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--rz-lime-soft)', borderRadius: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--rz-deep)', fontWeight: 500 }}>Taxa de conversão</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--rz-deep)', fontVariantNumeric: 'tabular-nums', marginLeft: 'auto' }}>
          {data.taxa_conversao}%
        </span>
      </div>
    </div>
  )
}

function exportCSV(periodo: Periodo, data: NonNullable<ReturnType<typeof useRelatorios>['data']>) {
  const rows: string[][] = []

  rows.push(['Relatório RIZQ', periodo.label, `${periodo.inicio} a ${periodo.fim}`])
  rows.push([])
  rows.push(['RESUMO'])
  rows.push(['Prêmio Total', String(data.premioTotal)])
  rows.push(['IS Total', String(data.isTotal)])
  rows.push(['Apólices', String(data.apolicesCount)])
  rows.push([])
  rows.push(['POR SEGURADORA', 'Prêmio', 'IS', 'Qtd'])
  for (const s of data.porSeguradora) {
    rows.push([s.nome, String(s.premio), String(s.is), String(s.count)])
  }
  rows.push([])
  rows.push(['POR MODALIDADE', 'Prêmio', 'IS', 'Qtd'])
  for (const m of data.porModalidade) {
    rows.push([m.nome, String(m.premio), String(m.is), String(m.count)])
  }
  rows.push([])
  rows.push(['CONVERSÃO'])
  rows.push(['Propostas criadas', String(data.conversao.propostas_criadas)])
  rows.push(['Propostas emitidas', String(data.conversao.propostas_emitidas)])
  rows.push(['Apólices emitidas', String(data.conversao.apolices_emitidas)])
  rows.push(['Taxa de conversão', `${data.conversao.taxa_conversao}%`])

  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-rizq-${periodo.inicio}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function RelatoriosView() {
  const periodos = getPeriodos()
  const [periodoIdx, setPeriodoIdx] = useState(0)
  const periodo = periodos[periodoIdx]
  const { data, isLoading } = useRelatorios(periodo)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Period selector + export */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--rz-fog)', padding: 4, borderRadius: 8 }}>
          {periodos.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setPeriodoIdx(i)}
              style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
                background: periodoIdx === i ? 'var(--rz-white)' : 'transparent',
                color: periodoIdx === i ? 'var(--rz-ink)' : 'var(--rz-text-2)',
                boxShadow: periodoIdx === i ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 120ms ease',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--rz-text-2)', marginLeft: 4 }}>
          {periodo.inicio} → {periodo.fim}
        </span>
        <button
          onClick={() => data && exportCSV(periodo, data)}
          disabled={!data}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 14px', borderRadius: 6,
            border: '1px solid var(--rz-line)', background: 'var(--rz-white)',
            color: 'var(--rz-ink)', fontSize: 12, fontWeight: 500,
            fontFamily: 'inherit', cursor: data ? 'pointer' : 'not-allowed',
            opacity: data ? 1 : 0.5,
          }}
        >
          <Download size={13} />
          Exportar CSV
        </button>
      </div>

      {/* KPI strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 1, background: 'var(--rz-line)',
        border: '1px solid var(--rz-line)', borderRadius: 6, overflow: 'hidden',
      }}>
        {[
          {
            l: 'Prêmio emitido',
            v: isLoading ? '—' : fmtBRLk(data?.premioTotal ?? 0),
            sub: 'no período',
          },
          {
            l: 'IS total',
            v: isLoading ? '—' : fmtBRLk(data?.isTotal ?? 0),
            sub: 'importância segurada',
          },
          {
            l: 'Apólices emitidas',
            v: isLoading ? '—' : String(data?.apolicesCount ?? 0),
            sub: 'com vigência no período',
          },
          {
            l: 'Tx. conversão',
            v: isLoading ? '—' : `${data?.conversao.taxa_conversao ?? 0}%`,
            sub: 'propostas → emitidas',
          },
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--rz-white)', padding: 16 }}>
            <div className="rz-eyebrow" style={{ marginBottom: 8 }}>{k.l}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--rz-ink)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{k.v}</div>
            <div style={{ fontSize: 11, color: 'var(--rz-text-2)', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Por Seguradora */}
        <div className="rz-card" style={{ padding: 20 }}>
          <div className="rz-eyebrow" style={{ marginBottom: 4 }}>Prêmio por seguradora</div>
          <div style={{ fontSize: 11, color: 'var(--rz-text-2)', marginBottom: 16 }}>
            {isLoading ? '—' : `${data?.porSeguradora.length ?? 0} seguradoras · ${periodo.label.toLowerCase()}`}
          </div>
          <BarChart
            rows={data?.porSeguradora ?? []}
            isLoading={isLoading}
            emptyMsg="Nenhuma apólice no período"
          />
        </div>

        {/* Por Modalidade */}
        <div className="rz-card" style={{ padding: 20 }}>
          <div className="rz-eyebrow" style={{ marginBottom: 4 }}>Prêmio por modalidade</div>
          <div style={{ fontSize: 11, color: 'var(--rz-text-2)', marginBottom: 16 }}>
            {isLoading ? '—' : `${data?.porModalidade.length ?? 0} modalidades · ${periodo.label.toLowerCase()}`}
          </div>
          <BarChart
            rows={data?.porModalidade ?? []}
            isLoading={isLoading}
            emptyMsg="Nenhuma apólice no período"
          />
        </div>
      </div>

      {/* Conversão */}
      <div className="rz-card" style={{ padding: 20, maxWidth: 480 }}>
        <div className="rz-eyebrow" style={{ marginBottom: 4 }}>Conversão · {periodo.label}</div>
        <div style={{ fontSize: 11, color: 'var(--rz-text-2)', marginBottom: 16 }}>
          Propostas criadas → apólices emitidas no período
        </div>
        <ConversaoFunnel
          data={data?.conversao ?? { propostas_criadas: 0, propostas_emitidas: 0, apolices_emitidas: 0, taxa_conversao: 0 }}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
