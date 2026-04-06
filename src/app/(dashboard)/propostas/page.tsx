'use client'

import { KanbanBoard } from '@/components/propostas/kanban-board'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function PropostasPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 lg:p-6 pb-0">
        <div>
          <h1 className="text-2xl font-bold">Propostas</h1>
          <p className="text-sm text-muted-foreground">Pipeline de propostas</p>
        </div>
        <Link href="/propostas/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Proposta
          </Button>
        </Link>
      </div>
      <div className="flex-1 overflow-hidden p-4 lg:p-6">
        <KanbanBoard />
      </div>
    </div>
  )
}
