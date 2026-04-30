'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ApoliceWithRelations } from '@/types/domain'
import { toast } from 'sonner'

const APOLICE_SELECT = `
  *,
  tomador:tomadores(id, razao_social, cnpj),
  seguradora:seguradoras(id, nome),
  modalidade:modalidades(id, nome, slug),
  proposta:propostas(id, numero_proposta)
`

export function useRenovacoes(horizonteDias = 60) {
  return useQuery<ApoliceWithRelations[]>({
    queryKey: ['renovacoes', horizonteDias],
    queryFn: async () => {
      const supabase = createClient()
      const limite = new Date()
      limite.setDate(limite.getDate() + horizonteDias)
      const { data, error } = await supabase
        .from('apolices')
        .select(APOLICE_SELECT)
        .eq('status', 'vigente')
        .lte('vigencia_fim', limite.toISOString().split('T')[0])
        .order('vigencia_fim', { ascending: true })
      if (error) throw error
      return data as ApoliceWithRelations[]
    },
    staleTime: 60_000,
  })
}

export function useRenovacoesCount() {
  return useQuery<number>({
    queryKey: ['renovacoes-count'],
    queryFn: async () => {
      const supabase = createClient()
      const limite = new Date()
      limite.setDate(limite.getDate() + 60)
      const { count, error } = await supabase
        .from('apolices')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'vigente')
        .lte('vigencia_fim', limite.toISOString().split('T')[0])
      if (error) throw error
      return count ?? 0
    },
    staleTime: 120_000,
  })
}

export function useCreateRenovacao() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (apolice: ApoliceWithRelations) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const hoje = new Date().toISOString().split('T')[0]

      const { data: proposta, error } = await supabase
        .from('propostas')
        .insert({
          corretora_id: user.app_metadata?.corretora_id,
          responsavel_id: user.id,
          tomador_id: apolice.tomador_id,
          seguradora_id: apolice.seguradora_id,
          modalidade_id: apolice.modalidade_id,
          importancia_segurada: apolice.importancia_segurada,
          objeto: apolice.objeto,
          numero_contrato: apolice.numero_contrato,
          numero_licitacao: apolice.numero_licitacao,
          orgao_publico: apolice.orgao_publico,
          status: 'cotacao_pendente',
          prioridade: 'alta',
          sla_dias: 5,
          sla_inicio: hoje,
          sla_alerta_enviado: false,
          observacoes: `Renovação da apólice ${apolice.numero_apolice} (venc. ${apolice.vigencia_fim})`,
        })
        .select('id, numero_proposta')
        .single()
      if (error) throw error
      return proposta as { id: string; numero_proposta: string }
    },
    onSuccess: (proposta) => {
      toast.success(`Proposta ${proposta.numero_proposta} criada!`)
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
      router.push(`/propostas/${proposta.id}`)
    },
    onError: () => toast.error('Erro ao criar proposta de renovação'),
  })
}
