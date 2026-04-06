'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { PropostaWithRelations, PropostaStatus } from '@/types/domain'
import { toast } from 'sonner'

const PROPOSTA_SELECT = `
  *,
  tomador:tomadores(id, razao_social, cnpj),
  seguradora:seguradoras(id, nome),
  modalidade:modalidades(id, nome, slug),
  responsavel:usuarios(id, nome, email)
`

export function usePropostas() {
  return useQuery<PropostaWithRelations[]>({
    queryKey: ['propostas'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('propostas')
        .select(PROPOSTA_SELECT)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as PropostaWithRelations[]
    },
    staleTime: 30_000,
  })
}

export function useProposta(id: string) {
  return useQuery<PropostaWithRelations>({
    queryKey: ['proposta', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('propostas')
        .select(PROPOSTA_SELECT)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as PropostaWithRelations
    },
    enabled: !!id,
  })
}

export function useUpdatePropostaStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PropostaStatus }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('propostas')
        .update({ status })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, status }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['propostas'] })
      const previous = queryClient.getQueryData<PropostaWithRelations[]>(['propostas'])
      queryClient.setQueryData<PropostaWithRelations[]>(['propostas'], (old) =>
        old?.map((p) => (p.id === id ? { ...p, status } : p))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['propostas'], context?.previous)
      toast.error('Erro ao atualizar status')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
    },
  })
}

export function useCreateProposta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: proposta, error } = await supabase
        .from('propostas')
        .insert({
          ...data,
          corretora_id: user.app_metadata?.corretora_id,
          responsavel_id: user.id,
        })
        .select(PROPOSTA_SELECT)
        .single()
      if (error) throw error
      return proposta
    },
    onSuccess: () => {
      toast.success('Proposta criada!')
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
    },
    onError: () => {
      toast.error('Erro ao criar proposta')
    },
  })
}

export function useTomadores() {
  return useQuery({
    queryKey: ['tomadores'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tomadores')
        .select('id, razao_social, cnpj')
        .eq('ativo', true)
        .order('razao_social')
      if (error) throw error
      return data
    },
    staleTime: 60_000,
  })
}

export function useSeguradoras() {
  return useQuery({
    queryKey: ['seguradoras'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('seguradoras')
        .select('id, nome, codigo')
        .eq('ativo', true)
        .order('nome')
      if (error) throw error
      return data
    },
    staleTime: 300_000,
  })
}

export function useModalidades() {
  return useQuery({
    queryKey: ['modalidades'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('modalidades')
        .select('id, nome, slug, categoria')
        .eq('ativo', true)
        .order('nome')
      if (error) throw error
      return data
    },
    staleTime: 300_000,
  })
}
