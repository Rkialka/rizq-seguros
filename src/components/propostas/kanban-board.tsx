'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { usePropostas, useUpdatePropostaStatus } from '@/hooks/use-propostas'
import { KANBAN_ACTIVE_STAGES } from '@/lib/constants'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { PropostaWithRelations, PropostaStatus } from '@/types/domain'

export function KanbanBoard() {
  const router = useRouter()
  const { data: propostas, isLoading } = usePropostas()
  const updateStatus = useUpdatePropostaStatus()
  const [activeCard, setActiveCard] = useState<PropostaWithRelations | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const card = propostas?.find((p) => p.id === event.active.id)
      if (card) setActiveCard(card)
    },
    [propostas]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCard(null)
      const { active, over } = event
      if (!over) return

      const propostaId = active.id as string
      const newStatus = over.id as PropostaStatus

      const proposta = propostas?.find((p) => p.id === propostaId)
      if (!proposta || proposta.status === newStatus) return

      updateStatus.mutate({ id: propostaId, status: newStatus })
    },
    [propostas, updateStatus]
  )

  const handleCardClick = useCallback(
    (proposta: PropostaWithRelations) => {
      router.push(`/propostas/${proposta.id}`)
    },
    [router]
  )

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-72 shrink-0 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory lg:snap-none">
        {KANBAN_ACTIVE_STAGES.map((stage) => {
          const stagePropostas = propostas?.filter((p) => p.status === stage.id) ?? []
          return (
            <div key={stage.id} className="snap-center">
              <KanbanColumn
                id={stage.id}
                label={stage.label}
                color={stage.color}
                propostas={stagePropostas}
                onCardClick={handleCardClick}
              />
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeCard && <KanbanCard proposta={activeCard} />}
      </DragOverlay>
    </DndContext>
  )
}
