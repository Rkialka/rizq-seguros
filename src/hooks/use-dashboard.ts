'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { DashboardKPIs, Atividade, Apolice, Proposta } from '@/types/domain'

export function useDashboardKPIs() {
  return useQuery<DashboardKPIs>({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const corretora_id = user.app_metadata?.corretora_id
      const { data, error } = await supabase.rpc('get_dashboard_kpis', {
        p_corretora_id: corretora_id,
      })
      if (error) throw error
      return data as DashboardKPIs
    },
    staleTime: 30_000,
  })
}

export function useRecentActivities(limit = 15) {
  return useQuery<Atividade[]>({
    queryKey: ['recent-activities', limit],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('atividades')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data
    },
    staleTime: 30_000,
  })
}

export function useExpiringPolicies(days = 30) {
  return useQuery<Apolice[]>({
    queryKey: ['expiring-policies', days],
    queryFn: async () => {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const { data, error } = await supabase
        .from('apolices')
        .select('*, tomador:tomadores(razao_social), seguradora:seguradoras(nome)')
        .eq('status', 'vigente')
        .gte('vigencia_fim', today)
        .lte('vigencia_fim', futureDate)
        .order('vigencia_fim', { ascending: true })
      if (error) throw error
      return data
    },
    staleTime: 60_000,
  })
}

export function usePropostasByStatus() {
  return useQuery({
    queryKey: ['propostas-by-status'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('propostas')
        .select('status, premio')
      if (error) throw error

      const grouped: Record<string, { count: number; value: number }> = {}
      for (const p of data) {
        if (!grouped[p.status]) grouped[p.status] = { count: 0, value: 0 }
        grouped[p.status].count++
        grouped[p.status].value += Number(p.premio) || 0
      }
      return grouped
    },
    staleTime: 30_000,
  })
}
