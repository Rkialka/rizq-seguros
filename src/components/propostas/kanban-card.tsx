'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatBRL, getSLADaysRemaining, getSLAColor, PRIORIDADES } from '@/lib/constants'
import type { PropostaWithRelations } from '@/types/domain'

interface KanbanCardProps {
  proposta: PropostaWithRelations
  onClick?: () => void
}

export function KanbanCard({ proposta, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: proposta.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const slaRemaining = getSLADaysRemaining(proposta.sla_inicio, proposta.sla_dias)
  const slaColor = getSLAColor(slaRemaining)
  const prioConfig = PRIORIDADES.find((p) => p.id === proposta.prioridade)

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab active:cursor-grabbing touch-manipulation',
        isDragging && 'opacity-50 shadow-lg'
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header: ID + Priority */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">
            {proposta.numero_proposta}
          </span>
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: prioConfig?.color }}
              title={prioConfig?.label}
            />
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: slaColor }}
            >
              {slaRemaining > 0 ? `${slaRemaining}d` : 'SLA!'}
            </span>
          </div>
        </div>

        {/* Tomador */}
        <p className="text-sm font-medium leading-tight truncate">
          {proposta.tomador?.razao_social}
        </p>

        {/* Modalidade */}
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {proposta.modalidade?.nome}
        </Badge>

        {/* Values */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>IS: {formatBRL(proposta.importancia_segurada)}</span>
          {proposta.premio && <span className="font-medium text-foreground">{formatBRL(proposta.premio)}</span>}
        </div>

        {/* Seguradora */}
        {proposta.seguradora && (
          <p className="text-[10px] text-muted-foreground">{proposta.seguradora.nome}</p>
        )}
      </CardContent>
    </Card>
  )
}
