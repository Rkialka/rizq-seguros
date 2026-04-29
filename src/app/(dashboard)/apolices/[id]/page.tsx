'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useApolice } from '@/hooks/use-apolices'
import { APOLICE_STATUS, formatBRL, formatDateBR } from '@/lib/constants'
import { ArrowLeft, Calendar, DollarSign, Shield, Building2, FileText, Link2, RefreshCw, FilePlus, XCircle } from 'lucide-react'
import Link from 'next/link'

const STATUS_TONES: Record<string, { bg: string; color: string }> = {
  vigente:   { bg: '#dff0e8', color: 'var(--rz-moss)' },
  vencida:   { bg: 'var(--rz-danger-soft)', color: 'var(--rz-danger)' },
  cancelada: { bg: 'var(--rz-fog)', color: 'var(--rz-text-2)' },
  encerrada: { bg: 'var(--rz-fog)', color: 'var(--rz-text-3)' },
}

function InfoCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rz-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Icon size={14} style={{ color: 'var(--rz-text-2)' }} />
        <span className="rz-eyebrow">{title}</span>
      </div>
      {children}
    </div>
  )
}

function DataRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--rz-line-2)' }}>
      <span style={{ fontSize: 12, color: 'var(--rz-text-2)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--rz-ink)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export default function ApoliceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: apolice, isLoading, error, refetch } = useApolice(id)

  if (isLoading) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[280, 480, 200].map(w => (
          <div key={w} className="rz-skeleton" style={{ height: 44, width: w, borderRadius: 6 }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rz-ink)' }}>Erro ao carregar apólice</div>
        <div style={{ fontSize: 13, color: 'var(--rz-text-2)' }}>Verifique sua conexão e tente novamente.</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={() => refetch()} style={{ height: 34, padding: '0 16px', borderRadius: 6, border: 'none', background: 'var(--rz-deep)', color: 'var(--rz-paper)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Tentar novamente</button>
          <button onClick={() => router.back()} style={{ height: 34, padding: '0 16px', borderRadius: 6, border: '1px solid var(--rz-line)', background: 'var(--rz-white)', fontSize: 13, color: 'var(--rz-ink)', cursor: 'pointer', fontFamily: 'inherit' }}>Voltar</button>
        </div>
      </div>
    )
  }

  if (!apolice) {
    return (
      <div style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 32 }}>🔍</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rz-ink)' }}>Apólice não encontrada</div>
        <div style={{ fontSize: 13, color: 'var(--rz-text-2)' }}>O registro pode ter sido removido.</div>
        <button onClick={() => router.back()} style={{ height: 34, padding: '0 16px', borderRadius: 6, border: '1px solid var(--rz-line)', background: 'var(--rz-white)', fontSize: 13, color: 'var(--rz-ink)', cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>Voltar</button>
      </div>
    )
  }

  const statusConfig = APOLICE_STATUS.find(s => s.id === apolice.status)
  const statusTone = STATUS_TONES[apolice.status] ?? { bg: 'var(--rz-fog)', color: 'var(--rz-text-2)' }
  const daysToExpiry = Math.ceil((new Date(apolice.vigencia_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const expiryUrgent = apolice.status === 'vigente' && daysToExpiry <= 30
  const expiryWarn = apolice.status === 'vigente' && daysToExpiry > 30 && daysToExpiry <= 60

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 28 }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6, border: '1px solid var(--rz-line)', background: 'var(--rz-white)',
            color: 'var(--rz-ink)', cursor: 'pointer', flexShrink: 0, marginTop: 4,
          }}
        >
          <ArrowLeft size={15} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{
              fontFamily: 'var(--font-mono, monospace)', fontSize: 11,
              color: 'var(--rz-text-3)', letterSpacing: '0.06em',
            }}>
              {apolice.numero_apolice}
            </span>
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 999, fontWeight: 500,
              background: statusTone.bg, color: statusTone.color,
            }}>
              {statusConfig?.label}
            </span>
            {(expiryUrgent || expiryWarn) && (
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 999, fontWeight: 500,
                background: expiryUrgent ? 'var(--rz-danger-soft)' : 'var(--rz-amber-soft)',
                color: expiryUrgent ? 'var(--rz-danger)' : 'var(--rz-amber)',
              }}>
                Vence em {daysToExpiry}d
              </span>
            )}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)', fontSize: 26, margin: 0,
            color: 'var(--rz-ink)', fontWeight: 400, lineHeight: 1.15,
          }}>
            {(apolice as any).tomador?.razao_social ?? '—'}
          </h1>
          {apolice.objeto && (
            <p style={{ fontSize: 13, color: 'var(--rz-text-2)', margin: '6px 0 0' }}>
              {apolice.objeto}
            </p>
          )}
        </div>
      </div>

      {/* Linked proposta */}
      {apolice.proposta && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
          padding: '10px 16px', borderRadius: 6,
          border: '1px dashed var(--rz-line)', background: 'var(--rz-fog)',
        }}>
          <Link2 size={13} style={{ color: 'var(--rz-text-3)' }} />
          <span style={{ fontSize: 12, color: 'var(--rz-text-2)' }}>Originada da proposta:</span>
          <Link
            href={`/propostas/${apolice.proposta.id}`}
            style={{ fontSize: 12, color: 'var(--rz-pine)', textDecoration: 'none', fontWeight: 500 }}
          >
            {(apolice.proposta as any)?.numero_proposta}
          </Link>
        </div>
      )}

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <InfoCard title="Tomador" icon={Building2}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-ink)', marginBottom: 4 }}>
            {(apolice as any).tomador?.razao_social}
          </div>
          <div style={{ fontSize: 12, color: 'var(--rz-text-2)', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.04em' }}>
            {(apolice as any).tomador?.cnpj}
          </div>
        </InfoCard>

        <InfoCard title="Seguro" icon={Shield}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-ink)', marginBottom: 6 }}>
            {(apolice as any).modalidade?.nome ?? '—'}
          </div>
          {(apolice as any).seguradora && (
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 999,
              background: 'var(--rz-fog)', border: '1px solid var(--rz-line)',
              color: 'var(--rz-text-2)',
            }}>
              {(apolice as any).seguradora.nome}
            </span>
          )}
        </InfoCard>

        <InfoCard title="Valores" icon={DollarSign}>
          <DataRow label="Importância Segurada" value={formatBRL(apolice.importancia_segurada)} />
          <DataRow label="Prêmio" value={formatBRL(apolice.premio)} />
          {apolice.taxa != null && <DataRow label="Taxa" value={`${(apolice.taxa * 100).toFixed(2)}%`} />}
          {apolice.comissao_percentual != null && <DataRow label="Comissão" value={`${apolice.comissao_percentual}%`} />}
          {apolice.comissao_valor != null && <DataRow label="Valor comissão" value={formatBRL(apolice.comissao_valor)} />}
        </InfoCard>

        <InfoCard title="Vigência" icon={Calendar}>
          <DataRow label="Início" value={formatDateBR(apolice.vigencia_inicio)} />
          <DataRow label="Fim" value={formatDateBR(apolice.vigencia_fim)} />
          {apolice.data_emissao && <DataRow label="Emissão" value={formatDateBR(apolice.data_emissao)} />}
          {apolice.status === 'vigente' && (
            <DataRow
              label="Dias restantes"
              value={daysToExpiry > 0 ? `${daysToExpiry} dias` : 'Vencida'}
            />
          )}
        </InfoCard>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {/* Renovar apólice — active when vigente */}
        {apolice.status === 'vigente' ? (
          <button
            onClick={() => router.push(`/propostas/nova?renew=${apolice.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              height: 36, padding: '0 16px', borderRadius: 6,
              fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
              background: 'var(--rz-white)', color: 'var(--rz-ink)',
              border: '1px solid var(--rz-line)',
              cursor: 'pointer', transition: 'opacity 120ms ease',
            }}
          >
            <RefreshCw size={13} />
            Renovar apólice
          </button>
        ) : (
          <button
            disabled
            title="Em breve"
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              height: 36, padding: '0 16px', borderRadius: 6,
              fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
              background: 'var(--rz-fog)', color: 'var(--rz-text-3)',
              border: '1px solid var(--rz-line-2)',
              cursor: 'not-allowed',
            }}
          >
            <RefreshCw size={13} />
            Renovar apólice
            <span style={{ fontSize: 9, color: 'var(--rz-text-3)', marginLeft: 2 }}>em breve</span>
          </button>
        )}
        {[
          { icon: FilePlus,   label: 'Emitir endosso',    active: apolice.status === 'vigente' },
          { icon: XCircle,    label: 'Cancelar apólice',  active: false, danger: true },
        ].map(({ icon: Icon, label, active, danger }) => (
          <button
            key={label}
            disabled={!active}
            title={!active ? 'Em breve' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              height: 36, padding: '0 16px', borderRadius: 6,
              fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
              background: active ? ((danger as boolean | undefined) ? 'var(--rz-danger-soft)' : 'var(--rz-white)') : 'var(--rz-fog)',
              color: active ? ((danger as boolean | undefined) ? 'var(--rz-danger)' : 'var(--rz-ink)') : 'var(--rz-text-3)',
              border: `1px solid ${active ? ((danger as boolean | undefined) ? 'var(--rz-danger)' : 'var(--rz-line)') : 'var(--rz-line-2)'}`,
              cursor: active ? 'pointer' : 'not-allowed',
              transition: 'opacity 120ms ease',
            }}
          >
            <Icon size={13} />
            {label}
            {!active && <span style={{ fontSize: 9, color: 'var(--rz-text-3)', marginLeft: 2 }}>em breve</span>}
          </button>
        ))}
      </div>

      {/* Additional info */}
      {(apolice.favorecido || apolice.numero_licitacao || apolice.numero_contrato || apolice.orgao_publico || apolice.numero_endosso || apolice.observacoes) && (
        <InfoCard title="Informações adicionais" icon={FileText}>
          <DataRow label="Favorecido" value={apolice.favorecido} />
          <DataRow label="N° Endosso" value={apolice.numero_endosso} />
          <DataRow label="Licitação" value={apolice.numero_licitacao} />
          <DataRow label="Contrato" value={apolice.numero_contrato} />
          <DataRow label="Órgão público" value={apolice.orgao_publico} />
          {apolice.observacoes && (
            <p style={{ fontSize: 12, color: 'var(--rz-text-2)', marginTop: 10, lineHeight: 1.6 }}>
              {apolice.observacoes}
            </p>
          )}
        </InfoCard>
      )}
    </div>
  )
}
