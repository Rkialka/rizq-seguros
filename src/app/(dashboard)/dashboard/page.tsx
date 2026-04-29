'use client'

import { KPICards } from '@/components/dashboard/kpi-cards'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { AlertsPanel } from '@/components/dashboard/alerts-panel'
import { PropostasChart } from '@/components/dashboard/charts/propostas-chart'
import { useDashboardKPIs } from '@/hooks/use-dashboard'
import { usePropostasByStatus } from '@/hooks/use-dashboard'

const TODAY_LABEL = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short', day: 'numeric', month: 'short',
}).format(new Date()).replace('.', '')

function fmtBRLk(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
  return `R$ ${v}`
}

export default function DashboardPage() {
  const { data: kpis } = useDashboardKPIs()
  const { data: statusData } = usePropostasByStatus()

  const aguardandoSeguradora =
    ((statusData as any)?.em_analise?.count ?? 0) +
    ((statusData as any)?.em_analise_credito?.count ?? 0)

  const FRENTES = [
    {
      tone: 'var(--rz-danger)',
      num: kpis?.sla_em_risco ?? '—',
      label: 'Prazo vencendo hoje',
      sub: 'Propostas com SLA crítico',
      cta: 'Triar agora',
      href: '/propostas',
    },
    {
      tone: 'var(--rz-amber)',
      num: kpis?.apolices_vencendo_30d ?? '—',
      label: 'Apólices vencendo 30d',
      sub: 'Oportunidade de renovação',
      cta: 'Ver renovações',
      href: '/apolices',
    },
    {
      tone: 'var(--rz-lime)',
      num: aguardandoSeguradora || '—',
      label: 'Aguardando seguradora',
      sub: 'Em análise ou crédito',
      cta: 'Ver propostas',
      href: '/propostas',
    },
    {
      tone: 'var(--rz-deep)',
      num: kpis?.cotacoes_pendentes ?? '—',
      label: 'Cotações pendentes',
      sub: 'Aguardando resposta',
      cta: 'Acompanhar',
      href: '/propostas',
    },
  ]

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 28px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI hero strip */}
      <KPICards />

      {/* Editorial "4 frentes" block */}
      <div className="rz-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div className="rz-eyebrow" style={{ marginBottom: 6 }}>Hoje, {TODAY_LABEL}</div>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 26,
              margin: 0,
              color: 'var(--rz-ink)',
              lineHeight: 1.1,
              fontWeight: 400,
            }}>
              4 frentes que precisam de você.
            </h2>
          </div>
          <a href="/propostas" style={{
            fontSize: 12, color: 'var(--rz-pine)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4, marginTop: 4,
          }}>
            Ver tudo →
          </a>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 1,
          background: 'var(--rz-line)',
          border: '1px solid var(--rz-line)',
          borderRadius: 6,
          overflow: 'hidden',
        }}>
          {FRENTES.map((c, i) => (
            <div key={i} style={{ background: 'var(--rz-white)', padding: 16, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.tone }} />
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 34,
                color: 'var(--rz-ink)',
                lineHeight: 1,
                marginBottom: 4,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {c.num}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--rz-ink)' }}>{c.label}</div>
              <div style={{ fontSize: 11, color: 'var(--rz-text-2)', marginTop: 2 }}>{c.sub}</div>
              <a href={c.href} style={{
                fontSize: 11,
                color: 'var(--rz-pine)',
                marginTop: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                textDecoration: 'none',
              }}>
                {c.cta} →
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]" style={{ gap: 16 }}>
        <PropostasChart />
        <ActivityFeed />
      </div>

      {/* Alerts */}
      <AlertsPanel />
    </div>
  )
}
