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
import { useCurrentUser } from '@/hooks/use-perfil'
import { KANBAN_ACTIVE_STAGES } from '@/lib/constants'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { User } from 'lucide-react'
import type { PropostaWithRelations, PropostaStatus } from '@/types/domain'

export function KanbanBoard() {
  const router = useRouter()
  const { data: propostas, isLoading } = usePropostas()
  const updateStatus = useUpdatePropostaStatus()
  const { data: currentUser } = useCurrentUser()
  const [activeCard, setActiveCard] = useState<PropostaWithRelations | null>(null)
  const [onlyMine, setOnlyMine] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const card = propostas?.find((p) => p.id === event.active.id)
    if (card) setActiveCard(card)
  }, [propostas])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveCard(null)
    const { active, over } = event
    if (!over) return
    const propostaId = active.id as string
    const newStatus = over.id as PropostaStatus
    const proposta = propostas?.find((p) => p.id === propostaId)
    if (!proposta || proposta.status === newStatus) return
    updateStatus.mutate({ id: propostaId, status: newStatus })
  }, [propostas, updateStatus])

  const handleCardClick = useCallback((proposta: PropostaWithRelations) => {
    router.push(`/propostas/${proposta.id}`)
  }, [router])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '4px 0 16px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Column header skeleton */}
            <div className="rz-skeleton" style={{ height: 40, borderRadius: 6 }} />
            {/* Card skeletons */}
            {Array.from({ length: i % 2 === 0 ? 3 : 2 }).map((_, j) => (
              <div key={j} className="rz-skeleton" style={{ height: 110, borderRadius: 6 }} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (!propostas || propostas.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '64px 32px', gap: 12,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12,
          background: 'var(--rz-fog)', border: '1px solid var(--rz-line)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>📋</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rz-ink)' }}>Nenhuma proposta ainda</div>
        <div style={{ fontSize: 13, color: 'var(--rz-text-2)', textAlign: 'center', maxWidth: 320 }}>
          Crie a primeira proposta para começar a acompanhar o pipeline.
        </div>
        <a href="/propostas/nova" style={{
          marginTop: 8, height: 38, padding: '0 20px',
          background: 'var(--rz-deep)', color: 'var(--rz-paper)',
          borderRadius: 6, fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none',
        }}>
          + Nova Proposta
        </a>
      </div>
    )
  }

  const filtered = onlyMine && currentUser
    ? (propostas ?? []).filter(p => p.responsavel_id === currentUser.id)
    : (propostas ?? [])

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setOnlyMine(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 28, padding: '0 12px', borderRadius: 6, border: '1px solid var(--rz-line)',
            background: onlyMine ? 'var(--rz-deep)' : 'var(--rz-white)',
            color: onlyMine ? 'var(--rz-paper)' : 'var(--rz-ink)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 120ms ease',
          }}
        >
          <User size={12} />
          {onlyMine ? 'Só minhas' : 'Todas'}
        </button>
      </div>

    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}
        className="snap-x snap-mandatory lg:snap-none"
      >
        {KANBAN_ACTIVE_STAGES.map((stage) => {
          const stagePropostas = filtered.filter((p) => p.status === stage.id) ?? []
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
    </>
  )
}
