'use client'

import { usePropostasByStatus } from '@/hooks/use-dashboard'
import { PROPOSTA_STAGES } from '@/lib/constants'

const STAGE_SHORT_LABELS: Record<string, string> = {
  cotacao_pendente:   'Cotações',
  em_analise:         'Em Análise',
  em_analise_credito: 'Análise Crédito',
  subscricao:         'Subscrição',
  em_emissao:         'Em Emissão',
  aprovada:           'Aprovada',
  emitida:            'Emitida',
}

const STAGE_COLORS: Record<string, string> = {
  cotacao_pendente:     '#dde3df',
  em_analise:           '#0a6b4d',
  em_analise_credito:   '#c3d600',
  subscricao:           '#d99a2b',
  em_emissao:           '#1f8a64',
  aprovada:             '#004b36',
  emitida:              '#004b36',
}

const ACTIVE_STAGES = PROPOSTA_STAGES.filter((s) => !['rejeitada', 'erro_emissao'].includes(s.id))

const MOCK_VALUES: Record<string, { count: number; value: number }> = {
  cotacao_pendente:    { count: 8,  value: 820_000 },
  em_analise:          { count: 6,  value: 1_640_000 },
  em_analise_credito:  { count: 4,  value: 980_000 },
  subscricao:          { count: 5,  value: 2_340_000 },
  em_emissao:          { count: 3,  value: 1_520_000 },
  aprovada:            { count: 4,  value: 1_890_000 },
  emitida:             { count: 7,  value: 2_340_000 },
}

function fmtBRLk(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
  return `R$ ${(v / 1_000).toFixed(0)}k`
}

export function PropostasChart() {
  const { data: statusData, isLoading } = usePropostasByStatus()

  const chartData = ACTIVE_STAGES.map((stage) => ({
    id: stage.id,
    name: STAGE_SHORT_LABELS[stage.id] ?? stage.label,
    count: (statusData as any)?.[stage.id]?.count ?? MOCK_VALUES[stage.id]?.count ?? 0,
    value: (statusData as any)?.[stage.id]?.value ?? MOCK_VALUES[stage.id]?.value ?? 0,
    color: STAGE_COLORS[stage.id] ?? '#004b36',
  }))

  const maxValue = Math.max(...chartData.map((d) => d.value), 1)

  return (
    <div className="rz-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="rz-eyebrow" style={{ marginBottom: 4 }}>Pipeline · 12 meses</div>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 26,
            color: 'var(--rz-ink)',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>R$ 9,64M</div>
        </div>
        <span style={{
          fontSize: 11,
          padding: '3px 8px',
          borderRadius: 999,
          background: '#dff0e8',
          color: 'var(--rz-moss)',
          fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--rz-moss)', display: 'inline-block' }} />
          +6.8% MoM
        </span>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="rz-skeleton" style={{ width: 90, height: 11, borderRadius: 4 }} />
              <div className="rz-skeleton" style={{ height: 20, borderRadius: 4, flex: 1 }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {chartData.map((row) => {
            const pct = (row.value / maxValue) * 100
            return (
              <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontSize: 11,
                  color: 'var(--rz-text-2)',
                  width: 100,
                  flexShrink: 0,
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {row.name}
                </span>
                <div style={{ flex: 1, height: 22, background: 'var(--rz-fog)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: row.color,
                    borderRadius: 4,
                    minWidth: row.count > 0 ? 4 : 0,
                    display: 'flex', alignItems: 'center',
                    paddingLeft: 8,
                    transition: 'width 400ms ease',
                  }}>
                    {pct > 20 && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: row.color === '#dde3df' ? 'var(--rz-ink)' : row.color === '#c3d600' ? 'var(--rz-deep)' : 'white',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {row.count}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{
                  fontSize: 11,
                  color: 'var(--rz-text-2)',
                  width: 60,
                  flexShrink: 0,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  fontFamily: 'var(--font-mono, monospace)',
                }}>
                  {fmtBRLk(row.value)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
