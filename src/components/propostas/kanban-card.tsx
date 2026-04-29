'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getSLADaysRemaining, PRIORIDADES } from '@/lib/constants'
import type { PropostaWithRelations } from '@/types/domain'

function fmtBRLk(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
  return `R$ ${v}`
}

interface KanbanCardProps {
  proposta: PropostaWithRelations
  onClick?: () => void
}

const PRIO_COLORS: Record<string, string> = {
  urgente: 'var(--rz-danger)',
  alta:    'var(--rz-amber)',
  media:   'var(--rz-deep)',
  baixa:   'var(--rz-text-3)',
}

function Avatar({ name, size = 22 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: 999,
      background: 'var(--rz-fog)', color: 'var(--rz-text-2)',
      fontSize: Math.max(8, Math.round(size * 0.38)), fontWeight: 600, flexShrink: 0,
    }}>
      {initials}
    </span>
  )
}

export function KanbanCard({ proposta, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: proposta.id })

  const slaRemaining = getSLADaysRemaining(proposta.sla_inicio, proposta.sla_dias)
  const slaTone = slaRemaining < 0 ? 'danger' : slaRemaining <= 2 ? 'amber' : 'moss'
  const slaColor = slaTone === 'danger' ? 'var(--rz-danger)' : slaTone === 'amber' ? 'var(--rz-amber)' : 'var(--rz-moss)'
  const prioConfig = PRIORIDADES.find((p) => p.id === proposta.prioridade)
  const prioColor = PRIO_COLORS[proposta.prioridade] ?? 'var(--rz-text-3)'

  const responsavel = proposta.responsavel
  const respName = responsavel?.nome ?? responsavel?.email ?? 'OP'

  const daysSinceUpdate = Math.floor((Date.now() - new Date((proposta as any).updated_at ?? proposta.created_at).getTime()) / 86400000)

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        background: 'var(--rz-white)',
        border: '1px solid var(--rz-line)',
        borderRadius: 6,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.55 : 1,
        boxShadow: isDragging ? 'var(--rz-shadow-elev)' : '0 1px 0 rgba(3,26,19,0.03)',
        touchAction: 'none',
      }}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      {/* Header row: number + priority dot + SLA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10,
          color: 'var(--rz-text-3)',
          fontFamily: 'var(--font-mono, monospace)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {proposta.numero_proposta}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: prioColor }} title={prioConfig?.label} />
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: slaColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {slaRemaining < 0 ? 'Atrasada' : `${slaRemaining}d`}
          </span>
        </div>
      </div>

      {/* Tomador */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--rz-ink)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {proposta.tomador?.razao_social}
      </div>

      {/* Modalidade chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 10,
          padding: '2px 7px',
          borderRadius: 999,
          fontWeight: 500,
          background: 'var(--rz-lime-soft)',
          color: 'var(--rz-deep)',
        }}>
          {proposta.modalidade?.nome}
        </span>
        {proposta.seguradora && (
          <span style={{ fontSize: 10, color: 'var(--rz-text-2)' }}>{proposta.seguradora.nome}</span>
        )}
      </div>

      {/* Parado há N dias */}
      {daysSinceUpdate >= 2 && (
        <div style={{ fontSize: 10, color: daysSinceUpdate >= 7 ? 'var(--rz-amber)' : 'var(--rz-text-3)' }}>
          Parado há {daysSinceUpdate}d
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--rz-line-2)' }} />

      {/* IS / Premio / Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--rz-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>IS</div>
          <div style={{
            fontSize: 12, fontWeight: 600, color: 'var(--rz-ink)',
            fontVariantNumeric: 'tabular-nums',
            fontFamily: 'var(--font-mono, monospace)',
          }}>
            {fmtBRLk(proposta.importancia_segurada)}
          </div>
        </div>
        {proposta.premio != null && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: 'var(--rz-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prêmio</div>
            <div style={{
              fontSize: 12, fontWeight: 600, color: 'var(--rz-deep)',
              fontVariantNumeric: 'tabular-nums',
              fontFamily: 'var(--font-mono, monospace)',
            }}>
              {fmtBRLk(proposta.premio)}
            </div>
          </div>
        )}
        <Avatar name={respName} size={22} />
      </div>
    </div>
  )
}
