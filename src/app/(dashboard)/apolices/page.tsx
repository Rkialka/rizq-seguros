'use client'

import { ApolicesTable } from '@/components/apolices/apolices-table'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

export default function ApolicesPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Apólices</h1>
          <p className="text-sm text-muted-foreground">Gestão de apólices vigentes</p>
        </div>
        <Button variant="outline" disabled>
          <Upload className="mr-2 h-4 w-4" />
          Importar CSV
        </Button>
      </div>
      <ApolicesTable />
    </div>
  )
}
