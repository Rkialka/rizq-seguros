'use client'

import { RelatoriosView } from '@/components/relatorios/relatorios-view'

export default function RelatoriosPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Prêmios, carteira e conversão por período</p>
      </div>
      <RelatoriosView />
    </div>
  )
}
