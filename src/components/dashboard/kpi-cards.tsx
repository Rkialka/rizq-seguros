'use client'

import { useDashboardKPIs } from '@/hooks/use-dashboard'
import { formatBRL } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  CalendarClock,
} from 'lucide-react'

const kpiConfig = [
  {
    key: 'premio_emitido_mes' as const,
    label: 'Prêmio Emitido',
    icon: DollarSign,
    format: formatBRL,
    color: 'text-green-600',
  },
  {
    key: 'propostas_criadas_mes' as const,
    label: 'Propostas Criadas',
    icon: FileText,
    format: (v: number) => String(v),
    color: 'text-blue-600',
  },
  {
    key: 'cotacoes_pendentes' as const,
    label: 'Cotações Pendentes',
    icon: Clock,
    format: (v: number) => String(v),
    color: 'text-orange-600',
  },
  {
    key: 'emissoes_mes' as const,
    label: 'Emissões do Mês',
    icon: CheckCircle,
    format: (v: number) => String(v),
    color: 'text-emerald-600',
  },
  {
    key: 'pipeline_value' as const,
    label: 'Pipeline',
    icon: TrendingUp,
    format: formatBRL,
    color: 'text-purple-600',
  },
  {
    key: 'apolices_vencendo_30d' as const,
    label: 'Vencendo em 30d',
    icon: CalendarClock,
    format: (v: number) => String(v),
    color: 'text-yellow-600',
  },
  {
    key: 'sla_em_risco' as const,
    label: 'SLA em Risco',
    icon: AlertTriangle,
    format: (v: number) => String(v),
    color: 'text-red-600',
  },
]

export function KPICards() {
  const { data: kpis, isLoading } = useDashboardKPIs()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {kpiConfig.map((config) => {
        const Icon = config.icon
        const value = kpis?.[config.key] ?? 0
        return (
          <Card key={config.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {config.label}
              </CardTitle>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{config.format(value)}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
