'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useTomador, useTomadorPropostas, useTomadorApolices } from '@/hooks/use-propostas'
import { PROPOSTA_STAGES, STAGE_TONES, formatBRL, formatDateBR } from '@/lib/constants'
import { ArrowLeft, Building2, ChevronRight } from 'lucide-react'

function fmtBRLk(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
  return formatBRL(v)
}

const APOLICE_STATUS_TONES: Record<string, { bg: string; color: string }> = {
  vigente:   { bg: '#dff0e8', color: 'var(--rz-moss)' },
  vencida:   { bg: 'var(--rz-danger-soft)', color: 'var(--rz-danger)' },
  cancelada: { bg: 'var(--rz-fog)', color: 'var(--rz-text-2)' },
  encerrada: { bg: 'var(--rz-fog)', color: 'var(--rz-text-3)' },
}

const APOLICE_STATUS_LABELS: Record<string, string> = {
  vigente: 'Vigente', vencida: 'Vencida', cancelada: 'Cancelada', encerrada: 'Encerrada',
}

export default function TomadorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: tomador, isLoading } = useTomador(id)
  const { data: propostas, isLoading: loadingP } = useTomadorPropostas(id)
  const { data: apolices, isLoading: loadingA } = useTomadorApolices(id)

  if (isLoading) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[280, 480, 200].map(w => (
          <div key={w} className="rz-skeleton" style={{ height: 44, width: w, borderRadius: 6 }} />
        ))}
      </div>
    )
  }

  if (!tomador) {
    return (
      <div style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 32 }}>🔍</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rz-ink)' }}>Tomador não encontrado</div>
        <button onClick={() => router.back()} style={{ height: 34, padding: '0 16px', borderRadius: 6, border: '1px solid var(--rz-line)', background: 'var(--rz-white)', fontSize: 13, color: 'var(--rz-ink)', cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>Voltar</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}>
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
        <div>
          <div className="rz-eyebrow" style={{ marginBottom: 4 }}>Tomadores</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, margin: 0, color: 'var(--rz-ink)', fontWeight: 400, lineHeight: 1.15 }}>
            {tomador.razao_social}
          </h1>
        </div>
      </div>

      {/* Info card */}
      <div className="rz-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Building2 size={14} style={{ color: 'var(--rz-text-2)' }} />
          <span className="rz-eyebrow">Informações</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { label: 'CNPJ', value: tomador.cnpj },
            { label: 'Email', value: tomador.email },
            { label: 'Telefone', value: tomador.telefone },
            { label: 'Cadastrado em', value: formatDateBR(tomador.created_at) },
          ].filter(r => r.value).map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: 'var(--rz-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{label}</div>
              <div style={{
                fontSize: 13, fontWeight: 500, color: 'var(--rz-ink)',
                fontFamily: label === 'CNPJ' ? 'var(--font-mono, monospace)' : 'inherit',
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>
        {tomador.observacoes && (
          <p style={{ fontSize: 12, color: 'var(--rz-text-2)', marginTop: 14, lineHeight: 1.6 }}>
            {tomador.observacoes}
          </p>
        )}
      </div>

      {/* Propostas */}
      <div className="rz-card" style={{ overflow: 'hidden', padding: 0, marginBottom: 16 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--rz-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="rz-eyebrow">Propostas</span>
          {propostas && (
            <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 999, background: 'var(--rz-fog)', color: 'var(--rz-text-2)', border: '1px solid var(--rz-line-2)' }}>
              {propostas.length}
            </span>
          )}
        </div>
        {loadingP ? (
          <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rz-skeleton" style={{ height: 32, borderRadius: 4 }} />
            ))}
          </div>
        ) : !propostas || propostas.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--rz-text-2)', fontSize: 13 }}>
            Nenhuma proposta encontrada
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--rz-fog)', borderBottom: '1px solid var(--rz-line-2)' }}>
                {['Número', 'Modalidade', 'IS', 'Status', 'Data', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '8px 14px', textAlign: i === 2 ? 'right' : 'left',
                    fontSize: 10, fontWeight: 600, color: 'var(--rz-text-2)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {propostas.map((p) => {
                const stageTone = STAGE_TONES[p.status] ?? { bg: 'var(--rz-fog)', color: 'var(--rz-text-2)' }
                const stageConfig = PROPOSTA_STAGES.find((s) => s.id === p.status)
                return (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/propostas/${p.id}`)}
                    style={{ borderBottom: '1px solid var(--rz-line-2)', cursor: 'pointer', transition: 'background 120ms ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--rz-fog)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--rz-text-2)' }}>
                      {p.numero_proposta}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--rz-ink)' }}>
                      {p.modalidade?.nome ?? '—'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'var(--rz-ink)', fontWeight: 600 }}>
                      {fmtBRLk(p.importancia_segurada ?? 0)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: stageTone.bg, color: stageTone.color }}>
                        {stageConfig?.label ?? p.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--rz-text-3)' }}>
                      {formatDateBR(p.created_at)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <ChevronRight size={13} style={{ color: 'var(--rz-text-3)' }} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Apólices */}
      <div className="rz-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--rz-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="rz-eyebrow">Apólices</span>
          {apolices && (
            <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 999, background: 'var(--rz-fog)', color: 'var(--rz-text-2)', border: '1px solid var(--rz-line-2)' }}>
              {apolices.length}
            </span>
          )}
        </div>
        {loadingA ? (
          <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rz-skeleton" style={{ height: 32, borderRadius: 4 }} />
            ))}
          </div>
        ) : !apolices || apolices.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--rz-text-2)', fontSize: 13 }}>
            Nenhuma apólice encontrada
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--rz-fog)', borderBottom: '1px solid var(--rz-line-2)' }}>
                {['Número', 'Modalidade', 'IS', 'Status', 'Vigência Fim', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '8px 14px', textAlign: i === 2 ? 'right' : 'left',
                    fontSize: 10, fontWeight: 600, color: 'var(--rz-text-2)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apolices.map((a) => {
                const tone = APOLICE_STATUS_TONES[a.status] ?? { bg: 'var(--rz-fog)', color: 'var(--rz-text-2)' }
                return (
                  <tr
                    key={a.id}
                    onClick={() => router.push(`/apolices/${a.id}`)}
                    style={{ borderBottom: '1px solid var(--rz-line-2)', cursor: 'pointer', transition: 'background 120ms ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--rz-fog)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--rz-text-2)' }}>
                      {a.numero_apolice}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--rz-ink)' }}>
                      {a.modalidade?.nome ?? '—'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'var(--rz-ink)', fontWeight: 600 }}>
                      {fmtBRLk(a.importancia_segurada ?? 0)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: tone.bg, color: tone.color }}>
                        {APOLICE_STATUS_LABELS[a.status] ?? a.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--rz-text-3)' }}>
                      {formatDateBR(a.vigencia_fim)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <ChevronRight size={13} style={{ color: 'var(--rz-text-3)' }} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
