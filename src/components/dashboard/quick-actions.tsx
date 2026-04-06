'use client'

import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/propostas/nova"
          className={cn(buttonVariants({ variant: 'default' }), 'h-auto py-4 flex-col gap-2')}
        >
          <Plus className="h-5 w-5" />
          <span className="text-sm">Nova Proposta</span>
        </Link>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" disabled>
          <FileText className="h-5 w-5" />
          <span className="text-sm">Novo Cliente</span>
        </Button>
        <Link
          href="/apolices"
          className={cn(buttonVariants({ variant: 'outline' }), 'h-auto py-4 flex-col gap-2')}
        >
          <Upload className="h-5 w-5" />
          <span className="text-sm">Importar Apólices</span>
        </Link>
      </CardContent>
    </Card>
  )
}
