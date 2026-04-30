'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type Periodo = {
  inicio: string
  fim: string
  label: string
}

export function getPeriodos(): Periodo[] {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const first = (year: number, month: number) => new Date(year, month, 1)
  const last = (year: number, month: number) => new Date(year, month + 1, 0)

  const quarterStart = new Date(y, Math.floor(m / 3) * 3, 1)

  return [
    {
      label: 'Este mês',
      inicio: fmt(first(y, m)),
      fim: fmt(now),
    },
    {
      label: 'Mês anterior',
      inicio: fmt(first(y, m - 1)),
      fim: fmt(last(y, m - 1)),
    },
    {
      label: 'Trimestre',
      inicio: fmt(quarterStart),
      fim: fmt(now),
    },
    {
      label: 'Este ano',
      inicio: fmt(new Date(y, 0, 1)),
      fim: fmt(now),
    },
  ]
}

export interface RelatorioData {
  premioTotal: number
  isTotal: number
  apolicesCount: number
  porSeguradora: { nome: string; premio: number; is: number; count: number }[]
  porModalidade: { nome: string; premio: number; is: number; count: number }[]
  conversao: {
    propostas_criadas: number
    propostas_emitidas: number
    apolices_emitidas: number
    taxa_conversao: number
  }
}

export function useRelatorios(periodo: Periodo) {
  return useQuery<RelatorioData>({
    queryKey: ['relatorios', periodo.inicio, periodo.fim],
    queryFn: async () => {
      const supabase = createClient()

      const [apolicesRes, propostasRes] = await Promise.all([
        supabase
          .from('apolices')
          .select(`
            premio,
            importancia_segurada,
            vigencia_inicio,
            seguradora:seguradoras(id, nome),
            modalidade:modalidades(id, nome)
          `)
          .gte('vigencia_inicio', periodo.inicio)
          .lte('vigencia_inicio', periodo.fim),
        supabase
          .from('propostas')
          .select('status, created_at')
          .gte('created_at', `${periodo.inicio}T00:00:00`)
          .lte('created_at', `${periodo.fim}T23:59:59`),
      ])

      if (apolicesRes.error) throw apolicesRes.error
      if (propostasRes.error) throw propostasRes.error

      const apolices = apolicesRes.data ?? []
      const propostas = propostasRes.data ?? []

      const premioTotal = apolices.reduce((s, a) => s + (Number(a.premio) || 0), 0)
      const isTotal = apolices.reduce((s, a) => s + (Number(a.importancia_segurada) || 0), 0)

      // Group by seguradora
      const segMap: Record<string, { nome: string; premio: number; is: number; count: number }> = {}
      for (const a of apolices) {
        const seg = (a.seguradora as any)
        const nome = seg?.nome ?? 'Sem seguradora'
        const id = seg?.id ?? 'none'
        if (!segMap[id]) segMap[id] = { nome, premio: 0, is: 0, count: 0 }
        segMap[id].premio += Number(a.premio) || 0
        segMap[id].is += Number(a.importancia_segurada) || 0
        segMap[id].count++
      }

      // Group by modalidade
      const modMap: Record<string, { nome: string; premio: number; is: number; count: number }> = {}
      for (const a of apolices) {
        const mod = (a.modalidade as any)
        const nome = mod?.nome ?? 'Sem modalidade'
        const id = mod?.id ?? 'none'
        if (!modMap[id]) modMap[id] = { nome, premio: 0, is: 0, count: 0 }
        modMap[id].premio += Number(a.premio) || 0
        modMap[id].is += Number(a.importancia_segurada) || 0
        modMap[id].count++
      }

      const propostas_criadas = propostas.length
      const propostas_emitidas = propostas.filter((p) => p.status === 'emitida').length
      const taxa_conversao = propostas_criadas > 0
        ? Math.round((propostas_emitidas / propostas_criadas) * 100)
        : 0

      return {
        premioTotal,
        isTotal,
        apolicesCount: apolices.length,
        porSeguradora: Object.values(segMap).sort((a, b) => b.premio - a.premio),
        porModalidade: Object.values(modMap).sort((a, b) => b.premio - a.premio),
        conversao: {
          propostas_criadas,
          propostas_emitidas,
          apolices_emitidas: apolices.length,
          taxa_conversao,
        },
      }
    },
    staleTime: 60_000,
  })
}
