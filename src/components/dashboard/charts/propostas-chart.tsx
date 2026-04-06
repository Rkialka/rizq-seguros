'use client'

import { usePropostasByStatus } from '@/hooks/use-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PROPOSTA_STAGES, formatBRL } from '@/lib/constants'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

export function PropostasChart() {
  const { data: statusData, isLoading } = usePropostasByStatus()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Propostas por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const chartData = PROPOSTA_STAGES.filter((s) => !['rejeitada', 'erro_emissao'].includes(s.id))
    .map((stage) => ({
      name: stage.label.split(' ').slice(0, 2).join(' '),
      count: statusData?.[stage.id]?.count ?? 0,
      value: statusData?.[stage.id]?.value ?? 0,
      color: stage.color,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pipeline de Propostas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value, name) => {
                const v = Number(value) || 0
                if (name === 'count') return [v, 'Propostas']
                return [formatBRL(v), 'Prêmio']
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
