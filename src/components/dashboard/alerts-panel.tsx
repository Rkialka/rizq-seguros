'use client'

import { useExpiringPolicies } from '@/hooks/use-dashboard'
import { formatDateBR, formatBRL } from '@/lib/constants'

export function AlertsPanel() {
  const { data: expiring, isLoading } = useExpiringPolicies(90)

  return (
    <div className="rz-card" style={{ padding: 0 }}>
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--rz-line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div className="rz-eyebrow">Apólices vencendo</div>
          <div style={{ fontSize: 11, color: 'var(--rz-text-2)', marginTop: 2 }}>próximos 90 dias</div>
        </div>
        <span style={{
          fontSize: 11,
          padding: '3px 8px',
          borderRadius: 999,
          background: 'var(--rz-amber-soft)',
          color: '#6e4d10',
          fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--rz-amber)', display: 'inline-block' }} />
          {expiring?.length ?? 0} itens
        </span>
      </div>

      <div>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 18px', borderBottom: '1px solid var(--rz-line-2)',
            }}>
              <div className="rz-skeleton" style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="rz-skeleton" style={{ height: 12, borderRadius: 4, marginBottom: 6, width: '70%' }} />
                <div className="rz-skeleton" style={{ height: 10, borderRadius: 4, width: '50%' }} />
              </div>
            </div>
          ))
        ) : expiring?.length === 0 ? (
          <p style={{ padding: '20px 18px', fontSize: 13, color: 'var(--rz-text-2)', textAlign: 'center' }}>
            Nenhuma apólice vencendo nos próximos 90 dias
          </p>
        ) : (
          expiring?.map((apolice: any, i: number) => {
            const days = Math.ceil(
              (new Date(apolice.vigencia_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
            const tone = days <= 15 ? 'danger' : days <= 30 ? 'amber' : 'neutral'
            const isLast = i === (expiring?.length ?? 0) - 1
            return (
              <div key={apolice.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 18px',
                borderBottom: isLast ? 'none' : '1px solid var(--rz-line-2)',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 6,
                  background: tone === 'danger' ? 'var(--rz-danger-soft)' : tone === 'amber' ? 'var(--rz-amber-soft)' : 'var(--rz-fog)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                  color: tone === 'danger' ? 'var(--rz-danger)' : tone === 'amber' ? '#6e4d10' : 'var(--rz-text-2)',
                  flexShrink: 0,
                  fontFamily: 'var(--font-mono, monospace)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{days}</span>
                  <span style={{ fontSize: 9, marginTop: 1 }}>dias</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--rz-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {apolice.numero_apolice}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--rz-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {apolice.tomador?.razao_social}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--rz-text-3)', marginTop: 1 }}>
                    Vence {formatDateBR(apolice.vigencia_fim)} · {formatBRL(apolice.premio)}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
