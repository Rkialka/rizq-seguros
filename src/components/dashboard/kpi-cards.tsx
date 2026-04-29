'use client'

import { useState } from 'react'
import { useDashboardKPIs } from '@/hooks/use-dashboard'
import { formatBRL } from '@/lib/constants'

function formatBRLk(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
  return formatBRL(v)
}

function Sparkline({ data, color = 'var(--rz-deep)' }: { data: number[]; color?: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80
  const h = 28
  const step = w / (data.length - 1)
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

const MOCK_SERIES = {
  premio: [820, 910, 860, 940, 1020, 1180, 1240, 1280, 1320, 1410, 1620, 1842],
  pipeline: [4200, 4600, 5100, 5400, 6000, 6800, 7200, 7900, 8400, 8900, 9100, 9640],
  comissao: [60, 72, 68, 80, 90, 110, 120, 135, 148, 162, 170, 184],
  taxa: [65, 68, 70, 67, 72, 71, 74, 73, 75, 72, 74, 73],
}

interface KPICardProps {
  label: string
  value: string
  delta?: number
  series?: number[]
  accent?: string
  big?: boolean
}

function KPICard({ label, value, delta, series, accent = 'var(--rz-deep)', big = false }: KPICardProps) {
  const positive = delta != null && delta >= 0
  return (
    <div className="rz-card" style={{ padding: big ? 22 : 18, position: 'relative', overflow: 'hidden' }}>
      {accent && (
        <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: accent }} />
      )}
      <div className="rz-eyebrow" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <span style={{
          fontFamily: big ? 'var(--font-serif)' : 'inherit',
          fontSize: big ? 36 : 24,
          fontWeight: big ? 400 : 600,
          letterSpacing: '-0.02em',
          color: 'var(--rz-ink)',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {value}
        </span>
        {series && <Sparkline data={series} color={accent} />}
      </div>
      {delta != null && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            padding: '2px 6px', borderRadius: 4,
            background: positive ? '#dff0e8' : 'var(--rz-danger-soft)',
            color: positive ? 'var(--rz-moss)' : 'var(--rz-danger)',
            fontWeight: 600,
          }}>
            {positive ? '↑' : '↓'} {Math.abs(delta)}%
          </span>
          <span style={{ color: 'var(--rz-text-2)' }}>vs. mês anterior</span>
        </div>
      )}
    </div>
  )
}

function KPICardSkeleton() {
  return (
    <div className="rz-card" style={{ padding: 18 }}>
      <div className="rz-skeleton" style={{ height: 11, width: 120, borderRadius: 4, marginBottom: 12 }} />
      <div className="rz-skeleton" style={{ height: 32, width: 140, borderRadius: 4 }} />
      <div className="rz-skeleton" style={{ height: 11, width: 80, borderRadius: 4, marginTop: 10 }} />
    </div>
  )
}

const PERIODS = [
  { id: 'month', label: 'Este mês' },
  { id: 'quarter', label: 'Trimestre' },
  { id: 'year', label: 'Este ano' },
] as const

export function KPICards() {
  const { data: kpis, isLoading } = useDashboardKPIs()
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month')

  const periodSelector = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span className="rz-eyebrow">Métricas</span>
      <div style={{ display: 'flex', gap: 2, background: 'var(--rz-fog)', border: '1px solid var(--rz-line)', borderRadius: 6, padding: 2 }}>
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{
            height: 24, padding: '0 10px', borderRadius: 4, border: 'none',
            background: period === p.id ? 'var(--rz-white)' : 'transparent',
            color: period === p.id ? 'var(--rz-ink)' : 'var(--rz-text-2)',
            fontSize: 11, fontWeight: period === p.id ? 600 : 400,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: period === p.id ? '0 1px 3px rgba(3,26,19,0.08)' : 'none',
          }}>{p.label}</button>
        ))}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <>
        {periodSelector}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)}
        </div>
      </>
    )
  }

  return (
    <>
      {periodSelector}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
      <KPICard
        big
        label="Prêmio emitido · mês"
        value={formatBRLk(kpis?.premio_emitido_mes ?? 1_842_500)}
        delta={14.2}
        series={MOCK_SERIES.premio}
        accent="var(--rz-deep)"
      />
      <KPICard
        label="Pipeline ativo"
        value={formatBRLk(kpis?.pipeline_value ?? 9_640_000)}
        delta={6.8}
        series={MOCK_SERIES.pipeline}
        accent="var(--rz-lime)"
      />
      <KPICard
        label="Comissão acumulada"
        value={formatBRLk(kpis?.premio_emitido_mes ? kpis.premio_emitido_mes * 0.1 : 184_300)}
        delta={9.1}
        series={MOCK_SERIES.comissao}
        accent="var(--rz-moss)"
      />
      <KPICard
        label="Taxa de emissão"
        value={`${kpis?.emissoes_mes != null && kpis?.propostas_criadas_mes > 0 ? Math.min(100, Math.round((kpis.emissoes_mes / kpis.propostas_criadas_mes) * 100)) : 73}%`}
        delta={2.4}
        series={MOCK_SERIES.taxa}
        accent="var(--rz-pine)"
      />
    </div>
    </>
  )
}
