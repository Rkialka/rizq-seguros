'use client'

import { useState } from 'react'
import { KanbanBoard } from '@/components/propostas/kanban-board'
import { PropostasList } from '@/components/propostas/propostas-list'
import { Plus, LayoutGrid, List } from 'lucide-react'
import Link from 'next/link'

type View = 'kanban' | 'list'

export default function PropostasPage() {
  const [view, setView] = useState<View>('kanban')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px 12px', flexShrink: 0, gap: 12,
        borderBottom: '1px solid var(--rz-line)',
        background: 'var(--rz-paper)',
      }}>
        {/* View toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          background: 'var(--rz-fog)', border: '1px solid var(--rz-line)',
          borderRadius: 6, padding: 2,
        }}>
          {[
            { id: 'kanban' as View, icon: LayoutGrid, label: 'Kanban' },
            { id: 'list' as View,   icon: List,       label: 'Lista' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              title={label}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                height: 28, padding: '0 10px', borderRadius: 4, border: 'none',
                background: view === id ? 'var(--rz-white)' : 'transparent',
                color: view === id ? 'var(--rz-ink)' : 'var(--rz-text-2)',
                fontSize: 12, fontWeight: view === id ? 600 : 400,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: view === id ? '0 1px 3px rgba(3,26,19,0.08)' : 'none',
                transition: 'all 120ms ease',
              }}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Nova Proposta */}
        <Link href="/propostas/nova" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 34, padding: '0 14px', borderRadius: 6, border: 'none',
            background: 'var(--rz-deep)', color: 'var(--rz-paper)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'opacity 120ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Plus size={15} />
            Nova Proposta
          </button>
        </Link>
      </div>

      {/* Content */}
      {view === 'kanban' ? (
        <div style={{ flex: 1, overflow: 'hidden', padding: '16px 24px' }}>
          <KanbanBoard />
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <PropostasList />
        </div>
      )}
    </div>
  )
}
