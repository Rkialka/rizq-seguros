'use client'

import { KPICards } from '@/components/dashboard/kpi-cards'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { AlertsPanel } from '@/components/dashboard/alerts-panel'
import { PropostasChart } from '@/components/dashboard/charts/propostas-chart'
import { QuickActions } from '@/components/dashboard/quick-actions'

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral das operações do dia</p>
      </div>

      <KPICards />

      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PropostasChart />
        <AlertsPanel />
      </div>

      <ActivityFeed />
    </div>
  )
}
