'use client'

import { useRecentActivities } from '@/hooks/use-dashboard'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_LABELS: Record<string, string> = {
  cotacao_pendente:   'Cotação Pendente',
  em_analise_credito: 'Em Análise (Crédito)',
  em_analise:         'Em Análise',
  subscricao:         'Subscrição',
  em_emissao:         'Em Emissão',
  aprovada:           'Aprovada',
  emitida:            'Emitida',
  rejeitada:          'Rejeitada',
  erro_emissao:       'Erro na Emissão',
}

function humanizeDescricao(text: string): string {
  return text.replace(
    /\b(cotacao_pendente|em_analise_credito|em_analise|subscricao|em_emissao|aprovada|emitida|rejeitada|erro_emissao)\b/g,
    (m) => STATUS_LABELS[m] ?? m
  )
}

const TONE_COLORS: Record<string, string> = {
  proposta_criada:    'var(--rz-lime)',
  proposta_atualizada: 'var(--rz-deep)',
  status_alterado:    'var(--rz-deep)',
  documento_anexado:  'var(--rz-moss)',
  apolice_emitida:    'var(--rz-moss)',
  comentario:         'var(--rz-text-3)',
  alerta_sla:         'var(--rz-danger)',
  importacao:         'var(--rz-pine)',
}

export function ActivityFeed() {
  const { data: activities, isLoading } = useRecentActivities()
  const items = activities ?? []

  return (
    <div className="rz-card" style={{ padding: 0 }}>
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--rz-line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div className="rz-eyebrow">Atividade recente</div>
        <a href="#" style={{ fontSize: 11, color: 'var(--rz-pine)', textDecoration: 'none' }}>Ver tudo</a>
      </div>

      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 18px', borderBottom: '1px solid var(--rz-line-2)' }}>
              <div className="rz-skeleton" style={{ width: 6, height: 6, borderRadius: 999, flexShrink: 0, marginTop: 6 }} />
              <div style={{ flex: 1 }}>
                <div className="rz-skeleton" style={{ height: 12, borderRadius: 4, marginBottom: 6, width: '80%' }} />
                <div className="rz-skeleton" style={{ height: 10, borderRadius: 4, width: 60 }} />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🕐</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--rz-ink)', marginBottom: 4 }}>Sem atividade recente</div>
            <div style={{ fontSize: 12, color: 'var(--rz-text-3)' }}>As ações da equipe aparecerão aqui.</div>
          </div>
        ) : (
          items.map((activity: any, i: number) => {
            const dotColor = TONE_COLORS[activity.tipo] ?? 'var(--rz-text-3)'
            const isLast = i === items.length - 1
            return (
              <div key={activity.id} style={{
                display: 'flex', gap: 10, padding: '12px 18px',
                borderBottom: isLast ? 'none' : '1px solid var(--rz-line-2)',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: 999,
                  background: dotColor,
                  marginTop: 6, flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--rz-ink)', lineHeight: 1.4 }}>
                    {humanizeDescricao(activity.descricao)}
                  </div>
                  {activity.extra && (
                    <div style={{ fontSize: 10, color: 'var(--rz-text-3)', marginTop: 2 }}>{activity.extra}</div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--rz-text-3)', marginTop: 4 }}>
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}
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
