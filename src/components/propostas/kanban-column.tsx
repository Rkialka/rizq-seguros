'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './kanban-card'
import { Plus, MoreHorizontal } from 'lucide-react'
import type { PropostaWithRelations } from '@/types/domain'

const STAGE_COLORS: Record<string, string> = {
  cotacao_pendente:    '#8a9690',
  em_analise:          '#0a6b4d',
  em_analise_credito:  '#c3d600',
  subscricao:          '#d99a2b',
  em_emissao:          '#1f8a64',
  aprovada:            '#1f8a64',
  emitida:             '#004b36',
}

function fmtBRLk(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
  return `R$ ${v}`
}

interface KanbanColumnProps {
  id: string
  label: string
  color: string
  propostas: PropostaWithRelations[]
  onCardClick: (proposta: PropostaWithRelations) => void
}

export function KanbanColumn({ id, label, propostas, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const dotColor = STAGE_COLORS[id] ?? '#004b36'
  const totalIS = propostas.reduce((sum, p) => sum + (p.importancia_segurada ?? 0), 0)

  return (
    <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Column header */}
      <div style={{
        padding: '10px 12px',
        background: 'var(--rz-white)',
        border: '1px solid var(--rz-line)',
        borderRadius: '6px 6px 0 0',
        borderBottom: 'none',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--rz-ink)', letterSpacing: '0.01em', flex: 1 }}>
          {label}
        </span>
        <span style={{
          fontSize: 11,
          color: 'var(--rz-text-2)',
          background: 'var(--rz-mist)',
          padding: '1px 6px',
          borderRadius: 999,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {propostas.length}
        </span>
        {totalIS > 0 && (
          <span style={{
            fontSize: 10,
            color: 'var(--rz-text-3)',
            fontVariantNumeric: 'tabular-nums',
            fontFamily: 'var(--font-mono, monospace)',
          }}>
            {fmtBRLk(totalIS)}
          </span>
        )}
        <MoreHorizontal size={14} style={{ color: 'var(--rz-text-3)', cursor: 'pointer' }} />
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          padding: 8,
          background: isOver ? 'rgba(195,214,0,0.04)' : '#f7f9f6',
          border: `1px solid ${isOver ? 'var(--rz-lime)' : 'var(--rz-line)'}`,
          borderTop: 'none',
          borderRadius: '0 0 6px 6px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 400,
          transition: 'border-color 120ms ease, background 120ms ease',
        }}
      >
        <SortableContext items={propostas.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          {propostas.map((proposta) => (
            <KanbanCard
              key={proposta.id}
              proposta={proposta}
              onClick={() => onCardClick(proposta)}
            />
          ))}
        </SortableContext>

        {propostas.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px 12px', gap: 6,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--rz-line-2)', marginBottom: 2 }} />
            <span style={{ fontSize: 11, color: 'var(--rz-text-3)', textAlign: 'center' }}>
              Nenhuma proposta
            </span>
            <span style={{ fontSize: 10, color: 'var(--rz-line)', textAlign: 'center' }}>
              Arraste aqui para mover
            </span>
          </div>
        )}

        <button style={{
          padding: 8,
          fontSize: 11,
          color: 'var(--rz-text-2)',
          background: 'transparent',
          border: '1px dashed var(--rz-line)',
          borderRadius: 6,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          marginTop: 'auto',
        }}>
          <Plus size={12} /> adicionar
        </button>
      </div>
    </div>
  )
}
