'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

export function useApolices(filters?: {
  search?: string
  status?: string
  seguradora_id?: string
  modalidade_id?: string
}) {
  return useQuery<ApoliceWithRelations[]>({
    queryKey: ['apolices', filters],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('apolices')
        .select(APOLICE_SELECT)
        .order('vigencia_fim', { ascending: true })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.seguradora_id) {
        query = query.eq('seguradora_id', filters.seguradora_id)
      }
      if (filters?.modalidade_id) {
        query = query.eq('modalidade_id', filters.modalidade_id)
      }
      if (filters?.search) {
        query = query.or(
          `numero_apolice.ilike.%${filters.search}%,tomadores.razao_social.ilike.%${filters.search}%`
        )
      }

      const { data, error } = await query
      if (error) throw error
      return data as ApoliceWithRelations[]
    },
    staleTime: 30_000,
  })
}

export function useApolice(id: string) {
  return useQuery<ApoliceWithRelations>({
    queryKey: ['apolice', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('apolices')
        .select(APOLICE_SELECT)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as ApoliceWithRelations
    },
    enabled: !!id,
  })
}

export function useImportApolices() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (rows: Record<string, unknown>[]) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const corretora_id = user.app_metadata?.corretora_id
      const withCorretora = rows.map((r) => ({ ...r, corretora_id }))

      const { error } = await supabase.from('apolices').insert(withCorretora)
      if (error) throw error
      return rows.length
    },
    onSuccess: (count) => {
      toast.success(`${count} apólice(s) importada(s)!`)
      queryClient.invalidateQueries({ queryKey: ['apolices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
    },
    onError: (err) => {
      toast.error('Erro na importação: ' + (err as Error).message)
    },
  })
}
