'use client'

import { useRecentActivities } from '@/hooks/use-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileText,
  ArrowRightLeft,
  CheckCircle,
  AlertTriangle,
  Paperclip,
  MessageSquare,
  Upload,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const tipoIcons: Record<string, typeof FileText> = {
  proposta_criada: FileText,
  proposta_atualizada: FileText,
  status_alterado: ArrowRightLeft,
  documento_anexado: Paperclip,
  apolice_emitida: CheckCircle,
  comentario: MessageSquare,
  alerta_sla: AlertTriangle,
  importacao: Upload,
}

export function ActivityFeed() {
  const { data: activities, isLoading } = useRecentActivities()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {activities?.map((activity) => {
                const Icon = tipoIcons[activity.tipo] || FileText
                return (
                  <div key={activity.id} className="flex gap-3 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{activity.descricao}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
              {activities?.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  Nenhuma atividade recente
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
