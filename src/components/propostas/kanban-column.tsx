'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './kanban-card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { PropostaWithRelations } from '@/types/domain'

interface KanbanColumnProps {
  id: string
  label: string
  color: string
  propostas: PropostaWithRelations[]
  onCardClick: (proposta: PropostaWithRelations) => void
}

export function KanbanColumn({ id, label, color, propostas, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex flex-col w-72 shrink-0 lg:min-w-0 lg:flex-1">
      {/* Column header */}
      <div className="flex items-center gap-2 px-2 py-2 mb-2">
        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-semibold truncate">{label}</h3>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">
          {propostas.length}
        </Badge>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-lg border border-dashed p-2 transition-colors min-h-[200px] ${
          isOver ? 'border-primary bg-primary/5' : 'border-transparent'
        }`}
      >
        <ScrollArea className="h-full">
          <SortableContext items={propostas.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {propostas.map((proposta) => (
                <KanbanCard
                  key={proposta.id}
                  proposta={proposta}
                  onClick={() => onCardClick(proposta)}
                />
              ))}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>
    </div>
  )
}
