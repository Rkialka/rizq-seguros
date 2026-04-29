'use client'

import { use, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useProposta, useUpdatePropostaStatus, usePropostaAtividades, useAddComentario, useUpdateProposta } from '@/hooks/use-propostas'
import { PROPOSTA_STAGES, PRIORIDADES, STAGE_TONES, PRIO_COLORS, formatBRL, formatDateBR, getSLADaysRemaining } from '@/lib/constants'
import { ArrowLeft, Calendar, DollarSign, FileText, Shield, Building2, User, ChevronDown, Pencil, Check, X, MessageSquare, Send } from 'lucide-react'
import Link from 'next/link'
import type { PropostaStatus } from '@/types/domain'

const TIPO_LABELS: Record<string, string> = {
  comentario:     'Comentário',
  status_change:  'Status alterado',
  criacao:        'Criada',
  documento:      'Documento',
  emissao:        'Emitida',
}

function InfoCard({ title, icon: Icon, children, action }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="rz-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={14} style={{ color: 'var(--rz-text-2)' }} />
          <span className="rz-eyebrow">{title}</span>
        </div>
        {action}
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

function InlineInput({
  label, value, onChange, type = 'text', placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '4px 0', borderBottom: '1px solid var(--rz-line-2)' }}>
      <span style={{ fontSize: 12, color: 'var(--rz-text-2)', flexShrink: 0 }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          border: '1px solid var(--rz-deep)', borderRadius: 4, padding: '3px 8px',
          fontSize: 12, fontWeight: 500, color: 'var(--rz-ink)', fontFamily: 'inherit',
          background: 'var(--rz-white)', textAlign: 'right', width: 140, outline: 'none',
        }}
      />
    </div>
  )
}

function ActivityItem({ item }: { item: any }) {
  const isComment = item.tipo === 'comentario'
  const time = new Date(item.created_at).toLocaleString('pt-BR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--rz-line-2)' }}>
      <div style={{
        width: 28, height: 28, borderRadius: 999, flexShrink: 0, marginTop: 2,
        background: isComment ? 'var(--rz-lime-soft)' : 'var(--rz-fog)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid var(--rz-line)',
      }}>
        {isComment
          ? <MessageSquare size={12} style={{ color: 'var(--rz-deep)' }} />
          : <div style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--rz-text-3)' }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--rz-ink)' }}>
            {item.usuario?.nome ?? 'Sistema'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--rz-text-3)' }}>·</span>
          <span style={{ fontSize: 10, color: 'var(--rz-text-3)' }}>{time}</span>
          {!isComment && (
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 999,
              background: 'var(--rz-fog)', color: 'var(--rz-text-2)',
              border: '1px solid var(--rz-line-2)',
            }}>
              {TIPO_LABELS[item.tipo] ?? item.tipo}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--rz-text-2)', margin: 0, lineHeight: 1.55 }}>
          {item.descricao}
        </p>
      </div>
    </div>
  )
}

export default function PropostaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: proposta, isLoading, error, refetch } = useProposta(id)
  const updateStatus = useUpdatePropostaStatus()
  const updateProposta = useUpdateProposta()
  const addComentario = useAddComentario()
  const { data: atividades } = usePropostaAtividades(id)

  const [statusOpen, setStatusOpen] = useState(false)
  const [editingValues, setEditingValues] = useState(false)
  const [draftValues, setDraftValues] = useState({ premio: '', taxa: '', vigencia_inicio: '', vigencia_fim: '' })
  const [comentario, setComentario] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rz-ink)' }}>Erro ao carregar proposta</div>
        <div style={{ fontSize: 13, color: 'var(--rz-text-2)' }}>Verifique sua conexão e tente novamente.</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={() => refetch()} style={{ height: 34, padding: '0 16px', borderRadius: 6, border: 'none', background: 'var(--rz-deep)', color: 'var(--rz-paper)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Tentar novamente</button>
          <button onClick={() => router.back()} style={{ height: 34, padding: '0 16px', borderRadius: 6, border: '1px solid var(--rz-line)', background: 'var(--rz-white)', fontSize: 13, color: 'var(--rz-ink)', cursor: 'pointer', fontFamily: 'inherit' }}>Voltar</button>
        </div>
      </div>
    )
  }

  if (!proposta) {
    return (
      <div style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 32 }}>🔍</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rz-ink)' }}>Proposta não encontrada</div>
        <div style={{ fontSize: 13, color: 'var(--rz-text-2)' }}>O registro pode ter sido removido.</div>
        <button onClick={() => router.back()} style={{ height: 34, padding: '0 16px', borderRadius: 6, border: '1px solid var(--rz-line)', background: 'var(--rz-white)', fontSize: 13, color: 'var(--rz-ink)', cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>Voltar</button>
      </div>
    )
  }

  const stageConfig = PROPOSTA_STAGES.find(s => s.id === proposta.status)
  const prioConfig = PRIORIDADES.find(p => p.id === proposta.prioridade)
  const slaRemaining = getSLADaysRemaining(proposta.sla_inicio, proposta.sla_dias)
  const stageTone = STAGE_TONES[proposta.status] ?? { bg: 'var(--rz-fog)', color: 'var(--rz-text-2)' }
  const prioColor = PRIO_COLORS[proposta.prioridade] ?? 'var(--rz-text-3)'
  const isTerminal = ['emitida', 'rejeitada', 'erro_emissao'].includes(proposta.status)

  const handleStatusChange = (newStatus: PropostaStatus) => {
    setStatusOpen(false)
    if (newStatus !== proposta.status) {
      updateStatus.mutate({ id: proposta.id, status: newStatus })
    }
  }

  const startEdit = () => {
    setDraftValues({
      premio: proposta.premio != null ? String(proposta.premio) : '',
      taxa: proposta.taxa != null ? String((proposta.taxa * 100).toFixed(4)) : '',
      vigencia_inicio: proposta.vigencia_inicio ?? '',
      vigencia_fim: proposta.vigencia_fim ?? '',
    })
    setEditingValues(true)
  }

  const cancelEdit = () => setEditingValues(false)

  const saveEdit = () => {
    const updates: Record<string, unknown> = {}
    if (draftValues.premio !== '') updates.premio = parseFloat(draftValues.premio.replace(/[^0-9.,]/g, '').replace(',', '.'))
    if (draftValues.taxa !== '') updates.taxa = parseFloat(draftValues.taxa.replace(',', '.')) / 100
    if (draftValues.vigencia_inicio) updates.vigencia_inicio = draftValues.vigencia_inicio
    if (draftValues.vigencia_fim) updates.vigencia_fim = draftValues.vigencia_fim
    updateProposta.mutate({ id: proposta.id, ...updates })
    setEditingValues(false)
  }

  const handleSubmitComentario = () => {
    const text = comentario.trim()
    if (!text) return
    addComentario.mutate({ propostaId: proposta.id, texto: text })
    setComentario('')
  }

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{
              fontFamily: 'var(--font-mono, monospace)', fontSize: 11,
              color: 'var(--rz-text-3)', letterSpacing: '0.06em',
            }}>
              {proposta.numero_proposta}
            </span>

            {/* Status selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => !isTerminal && setStatusOpen(p => !p)}
                disabled={updateStatus.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, padding: '3px 10px', borderRadius: 999, fontWeight: 500,
                  background: stageTone.bg, color: stageTone.color,
                  border: 'none', cursor: isTerminal ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: updateStatus.isPending ? 0.6 : 1,
                }}
              >
                {updateStatus.isPending ? 'Salvando…' : stageConfig?.label}
                {!isTerminal && <ChevronDown size={11} />}
              </button>

              {statusOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                    onClick={() => setStatusOpen(false)}
                  />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 20,
                    background: 'var(--rz-white)', border: '1px solid var(--rz-line)',
                    borderRadius: 8, boxShadow: '0 4px 16px rgba(3,26,19,0.12)',
                    minWidth: 200, overflow: 'hidden',
                  }}>
                    {PROPOSTA_STAGES.map(stage => {
                      const tone = STAGE_TONES[stage.id] ?? { bg: 'transparent', color: 'var(--rz-text-2)' }
                      const isCurrent = stage.id === proposta.status
                      return (
                        <button
                          key={stage.id}
                          onClick={() => handleStatusChange(stage.id as PropostaStatus)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 14px', border: 'none', textAlign: 'left',
                            background: isCurrent ? 'var(--rz-fog)' : 'transparent',
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          <span style={{
                            width: 8, height: 8, borderRadius: 999,
                            background: tone.color, flexShrink: 0,
                          }} />
                          <span style={{
                            fontSize: 12, fontWeight: isCurrent ? 600 : 400,
                            color: isCurrent ? 'var(--rz-ink)' : 'var(--rz-text-2)',
                          }}>
                            {stage.label}
                          </span>
                          {isCurrent && (
                            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--rz-text-3)' }}>atual</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            <span style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, padding: '3px 10px', borderRadius: 999,
              background: 'var(--rz-fog)', border: '1px solid var(--rz-line)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: prioColor }} />
              {prioConfig?.label}
            </span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)', fontSize: 26, margin: 0,
            color: 'var(--rz-ink)', fontWeight: 400, lineHeight: 1.15,
          }}>
            {(proposta as any).tomador?.razao_social ?? '—'}
          </h1>
          {proposta.objeto && (
            <p style={{ fontSize: 13, color: 'var(--rz-text-2)', margin: '6px 0 0' }}>
              {proposta.objeto}
            </p>
          )}
        </div>

        {/* SLA badge */}
        <div style={{
          textAlign: 'right', flexShrink: 0,
          padding: '10px 16px', borderRadius: 6,
          background: slaRemaining < 0 ? 'var(--rz-danger-soft)' : slaRemaining <= 2 ? 'var(--rz-amber-soft)' : 'var(--rz-fog)',
          border: '1px solid var(--rz-line)',
        }}>
          <div style={{
            fontFamily: 'var(--font-serif)', fontSize: 28, lineHeight: 1,
            color: slaRemaining < 0 ? 'var(--rz-danger)' : slaRemaining <= 2 ? 'var(--rz-amber)' : 'var(--rz-ink)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {slaRemaining < 0 ? 'Atrasada' : `${slaRemaining}d`}
          </div>
          <div style={{ fontSize: 10, color: 'var(--rz-text-3)', marginTop: 3 }}>SLA restante</div>
        </div>
      </div>

      {/* Gerar Apólice banner */}
      {proposta.status === 'emitida' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', borderRadius: 6, marginBottom: 16,
          background: '#dff0e8', border: '1px solid var(--rz-moss)',
        }}>
          <Shield size={16} style={{ color: 'var(--rz-moss)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--rz-deep)' }}>Proposta emitida — pronto para gerar apólice</div>
            <div style={{ fontSize: 11, color: 'var(--rz-moss)' }}>Todos os dados serão pré-preenchidos automaticamente.</div>
          </div>
          <Link
            href={`/apolices/nova?proposta=${proposta.id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 32, padding: '0 14px', borderRadius: 6,
              background: 'var(--rz-deep)', color: 'var(--rz-paper)',
              fontSize: 12, fontWeight: 600, textDecoration: 'none',
            }}
          >
            <Shield size={12} />
            Gerar Apólice
          </Link>
        </div>
      )}

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <InfoCard title="Tomador" icon={Building2}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-ink)', marginBottom: 4 }}>
            {(proposta as any).tomador?.razao_social}
          </div>
          <div style={{ fontSize: 12, color: 'var(--rz-text-2)', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.04em' }}>
            {(proposta as any).tomador?.cnpj}
          </div>
        </InfoCard>

        <InfoCard title="Seguro" icon={Shield}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rz-ink)', marginBottom: 6 }}>
            {(proposta as any).modalidade?.nome ?? '—'}
          </div>
          {(proposta as any).seguradora && (
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 999,
              background: 'var(--rz-fog)', border: '1px solid var(--rz-line)',
              color: 'var(--rz-text-2)',
            }}>
              {(proposta as any).seguradora.nome}
            </span>
          )}
        </InfoCard>

        {/* Valores — editable */}
        <InfoCard
          title="Valores"
          icon={DollarSign}
          action={
            !isTerminal && (
              editingValues ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={saveEdit}
                    disabled={updateProposta.isPending}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      height: 24, padding: '0 8px', borderRadius: 4, border: 'none',
                      background: 'var(--rz-deep)', color: 'var(--rz-paper)',
                      fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                      opacity: updateProposta.isPending ? 0.6 : 1,
                    }}
                  >
                    <Check size={11} />
                    Salvar
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      display: 'flex', alignItems: 'center',
                      height: 24, width: 24, borderRadius: 4,
                      border: '1px solid var(--rz-line)', background: 'transparent',
                      color: 'var(--rz-text-2)', cursor: 'pointer', justifyContent: 'center',
                    }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startEdit}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    height: 24, padding: '0 8px', borderRadius: 4,
                    border: '1px solid var(--rz-line)', background: 'transparent',
                    color: 'var(--rz-text-2)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <Pencil size={10} />
                  Editar
                </button>
              )
            )
          }
        >
          {editingValues ? (
            <>
              <InlineInput label="Importância Segurada" value={String(proposta.importancia_segurada)} onChange={() => {}} placeholder="Somente leitura" />
              <InlineInput label="Prêmio" value={draftValues.premio} onChange={(v) => setDraftValues(d => ({ ...d, premio: v }))} placeholder="0,00" />
              <InlineInput label="Taxa (%)" value={draftValues.taxa} onChange={(v) => setDraftValues(d => ({ ...d, taxa: v }))} placeholder="0,00" />
              <InlineInput label="Vigência início" value={draftValues.vigencia_inicio} onChange={(v) => setDraftValues(d => ({ ...d, vigencia_inicio: v }))} type="date" />
              <InlineInput label="Vigência fim" value={draftValues.vigencia_fim} onChange={(v) => setDraftValues(d => ({ ...d, vigencia_fim: v }))} type="date" />
            </>
          ) : (
            <>
              <DataRow label="Importância Segurada" value={formatBRL(proposta.importancia_segurada)} />
              {proposta.premio != null && <DataRow label="Prêmio" value={formatBRL(proposta.premio)} />}
              {proposta.taxa != null && <DataRow label="Taxa" value={`${(proposta.taxa * 100).toFixed(2)}%`} />}
              {proposta.comissao_percentual != null && <DataRow label="Comissão" value={`${proposta.comissao_percentual}%`} />}
            </>
          )}
        </InfoCard>

        <InfoCard title="Datas & Responsável" icon={Calendar}>
          <DataRow label="SLA início" value={formatDateBR(proposta.sla_inicio)} />
          <DataRow label="SLA total" value={`${proposta.sla_dias} dias`} />
          {proposta.vigencia_inicio && <DataRow label="Vigência início" value={formatDateBR(proposta.vigencia_inicio)} />}
          {proposta.vigencia_fim && <DataRow label="Vigência fim" value={formatDateBR(proposta.vigencia_fim)} />}
          {(proposta as any).responsavel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', marginTop: 4 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 999, background: 'var(--rz-fog)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <User size={12} style={{ color: 'var(--rz-text-2)' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--rz-ink)' }}>
                  {(proposta as any).responsavel.nome}
                </div>
                <div style={{ fontSize: 10, color: 'var(--rz-text-3)' }}>Responsável</div>
              </div>
            </div>
          )}
        </InfoCard>
      </div>

      {/* Additional info */}
      {(proposta.numero_licitacao || proposta.numero_contrato || proposta.orgao_publico || proposta.observacoes) && (
        <div style={{ marginBottom: 14 }}>
          <InfoCard title="Informações adicionais" icon={FileText}>
            <DataRow label="Licitação" value={proposta.numero_licitacao} />
            <DataRow label="Contrato" value={proposta.numero_contrato} />
            <DataRow label="Órgão público" value={proposta.orgao_publico} />
            {proposta.observacoes && (
              <p style={{ fontSize: 12, color: 'var(--rz-text-2)', marginTop: 10, lineHeight: 1.6 }}>
                {proposta.observacoes}
              </p>
            )}
          </InfoCard>
        </div>
      )}

      {/* Activity & Comments */}
      <div className="rz-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <MessageSquare size={14} style={{ color: 'var(--rz-text-2)' }} />
          <span className="rz-eyebrow">Comentários & Histórico</span>
        </div>

        {/* Add comment */}
        <div style={{ marginBottom: 16 }}>
          <textarea
            ref={textareaRef}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitComentario()
            }}
            placeholder="Adicionar comentário ou nota… (⌘↵ para enviar)"
            rows={2}
            style={{
              width: '100%', resize: 'vertical', minHeight: 64,
              border: '1px solid var(--rz-line)', borderRadius: 6,
              padding: '8px 12px', fontSize: 13, color: 'var(--rz-ink)',
              fontFamily: 'inherit', background: 'var(--rz-white)',
              outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 120ms ease',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--rz-deep)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--rz-line)')}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button
              onClick={handleSubmitComentario}
              disabled={!comentario.trim() || addComentario.isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 30, padding: '0 12px', borderRadius: 5, border: 'none',
                background: comentario.trim() ? 'var(--rz-deep)' : 'var(--rz-fog)',
                color: comentario.trim() ? 'var(--rz-paper)' : 'var(--rz-text-3)',
                fontSize: 12, fontWeight: 500, cursor: comentario.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', transition: 'all 120ms ease',
              }}
            >
              <Send size={11} />
              {addComentario.isPending ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </div>

        {/* Activity list */}
        <div>
          {!atividades && (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--rz-line-2)' }}>
                <div className="rz-skeleton" style={{ width: 28, height: 28, borderRadius: 999, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="rz-skeleton" style={{ height: 10, width: 140, borderRadius: 4 }} />
                  <div className="rz-skeleton" style={{ height: 10, width: 220, borderRadius: 4 }} />
                </div>
              </div>
            ))
          )}
          {atividades?.length === 0 && (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--rz-text-3)', fontSize: 13 }}>
              Nenhuma atividade ainda.
            </div>
          )}
          {atividades?.map((item) => (
            <ActivityItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
