'use client'

import { useExpiringPolicies } from '@/hooks/use-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarClock } from 'lucide-react'
import { formatDateBR, formatBRL } from '@/lib/constants'

export function AlertsPanel() {
  const { data: expiring, isLoading } = useExpiringPolicies(60)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Apólices Vencendo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : expiring?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma apólice vencendo nos próximos 60 dias
          </p>
        ) : (
          <div className="space-y-3">
            {expiring?.map((apolice: any) => {
              const daysToExpiry = Math.ceil(
                (new Date(apolice.vigencia_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              )
              const urgency =
                daysToExpiry <= 15 ? 'destructive' : daysToExpiry <= 30 ? 'secondary' : 'outline'

              return (
                <div
                  key={apolice.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{apolice.numero_apolice}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {apolice.tomador?.razao_social}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vence: {formatDateBR(apolice.vigencia_fim)} &middot;{' '}
                      {formatBRL(apolice.premio)}
                    </p>
                  </div>
                  <Badge variant={urgency as any} className="ml-2 shrink-0">
                    {daysToExpiry}d
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
