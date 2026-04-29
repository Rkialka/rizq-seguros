'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Usuario, Corretora } from '@/types/domain'

export function useCurrentUser() {
  return useQuery<Usuario | null>({
    queryKey: ['current-user'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single()
      if (error) throw error
      return data
    },
    staleTime: 60_000,
  })
}

export function useCurrentCorretora() {
  return useQuery<Corretora | null>({
    queryKey: ['current-corretora'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const corretora_id = user.app_metadata?.corretora_id
      if (!corretora_id) return null
      const { data, error } = await supabase
        .from('corretoras')
        .select('*')
        .eq('id', corretora_id)
        .single()
      if (error) throw error
      return data
    },
    staleTime: 60_000,
  })
}

export function useUpdatePerfil() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, nome, telefone }: { id: string; nome: string; telefone?: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('usuarios')
        .update({ nome, telefone: telefone || null })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Perfil atualizado!')
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    },
    onError: (err: any) => toast.error('Erro ao atualizar: ' + err.message),
  })
}

export function useUpdateCorretora() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Pick<Corretora, 'nome_fantasia' | 'email' | 'telefone' | 'susep'>>
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('corretoras')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Dados da corretora atualizados!')
      queryClient.invalidateQueries({ queryKey: ['current-corretora'] })
    },
    onError: (err: any) => toast.error('Erro: ' + err.message),
  })
}

export function useSendPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      if (error) throw error
    },
    onSuccess: () => toast.success('Link de redefinição enviado para seu email.'),
    onError: () => toast.error('Erro ao enviar link.'),
  })
}
