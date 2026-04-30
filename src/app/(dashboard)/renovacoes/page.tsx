'use client'

import { RenovacoesTable } from '@/components/renovacoes/renovacoes-table'

export default function RenovacoesPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Renovações</h1>
        <p className="text-sm text-muted-foreground">Apólices vigentes próximas do vencimento</p>
      </div>
      <RenovacoesTable />
    </div>
  )
}
