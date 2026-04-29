'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { PropostaWithRelations, PropostaStatus, Atividade, Usuario } from '@/types/domain'
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
        .limit(300)
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

export function usePropostasStats() {
  return useQuery({
    queryKey: ['propostas-stats'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('propostas')
        .select('status, importancia_segurada')
        .not('status', 'in', '(emitida,rejeitada,erro_emissao)')
      if (error) throw error
      const count = data.length
      const pipeline = data.reduce((s, p) => s + (Number(p.importancia_segurada) || 0), 0)
      return { count, pipeline }
    },
    staleTime: 60_000,
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

export function useCreateTomador() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: tomador, error } = await supabase
        .from('tomadores')
        .insert({
          ...data,
          corretora_id: user.app_metadata?.corretora_id,
        })
        .select('id, razao_social, cnpj')
        .single()
      if (error) throw error
      return tomador
    },
    onSuccess: () => {
      toast.success('Tomador cadastrado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['tomadores'] })
    },
    onError: (err: any) => {
      const msg = err?.message?.includes('unique') ? 'CNPJ já cadastrado' : 'Erro ao cadastrar tomador'
      toast.error(msg)
    },
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

export function usePropostaAtividades(propostaId: string) {
  return useQuery<(Atividade & { usuario: Pick<Usuario, 'id' | 'nome'> | null })[]>({
    queryKey: ['proposta-atividades', propostaId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('atividades')
        .select('*, usuario:usuarios(id, nome)')
        .eq('proposta_id', propostaId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as any
    },
    enabled: !!propostaId,
    staleTime: 30_000,
  })
}

export function useAddComentario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ propostaId, texto }: { propostaId: string; texto: string }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('atividades').insert({
        proposta_id: propostaId,
        usuario_id: user.id,
        corretora_id: user.app_metadata?.corretora_id,
        tipo: 'comentario',
        descricao: texto,
        dados: {},
      })
      if (error) throw error
    },
    onSuccess: (_data, { propostaId }) => {
      queryClient.invalidateQueries({ queryKey: ['proposta-atividades', propostaId] })
    },
    onError: () => toast.error('Erro ao adicionar comentário'),
  })
}

export function useUpdateProposta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const supabase = createClient()
      const { error } = await supabase.from('propostas').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['proposta', id] })
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      toast.success('Proposta atualizada')
    },
    onError: () => toast.error('Erro ao atualizar proposta'),
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

export function useTomador(id: string) {
  return useQuery<{ id: string; razao_social: string; cnpj: string; email: string | null; telefone: string | null; observacoes: string | null; created_at: string }>({
    queryKey: ['tomador', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('tomadores').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useTomadorPropostas(tomadorId: string) {
  return useQuery({
    queryKey: ['tomador-propostas', tomadorId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('propostas')
        .select('id, numero_proposta, status, importancia_segurada, created_at, modalidade:modalidades(nome)')
        .eq('tomador_id', tomadorId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data as unknown) as { id: string; numero_proposta: string; status: string; importancia_segurada: number; created_at: string; modalidade: { nome: string } | null }[]
    },
    enabled: !!tomadorId,
  })
}

export function useTomadorApolices(tomadorId: string) {
  return useQuery({
    queryKey: ['tomador-apolices', tomadorId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('apolices')
        .select('id, numero_apolice, status, importancia_segurada, vigencia_fim, modalidade:modalidades(nome)')
        .eq('tomador_id', tomadorId)
        .order('vigencia_fim', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data as unknown) as { id: string; numero_apolice: string; status: string; importancia_segurada: number; vigencia_fim: string; modalidade: { nome: string } | null }[]
    },
    enabled: !!tomadorId,
  })
}

export function useNotificacoes() {
  return useQuery({
    queryKey: ['notificacoes'],
    queryFn: async () => {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

      const [{ data: propostas }, { data: apolices }] = await Promise.all([
        supabase.from('propostas')
          .select('id, numero_proposta, sla_inicio, sla_dias, tomador:tomadores(razao_social)')
          .not('status', 'in', '(emitida,rejeitada,erro_emissao)'),
        supabase.from('apolices')
          .select('id, numero_apolice, vigencia_fim, tomador:tomadores(razao_social)')
          .eq('status', 'vigente')
          .lte('vigencia_fim', in30)
          .gte('vigencia_fim', today),
      ])

      const notifs: { id: string; tipo: 'sla' | 'apolice'; titulo: string; desc: string; href: string; urgente: boolean }[] = []

      for (const p of propostas ?? []) {
        const start = new Date(p.sla_inicio)
        const elapsed = Math.floor((Date.now() - start.getTime()) / 86400000)
        const days = (p.sla_dias as number) - elapsed
        if (days <= 1) {
          notifs.push({
            id: `sla-${p.id}`,
            tipo: 'sla',
            titulo: days <= 0 ? 'SLA vencido' : 'SLA vence hoje',
            desc: `${(p.tomador as any)?.razao_social} · ${p.numero_proposta}`,
            href: `/propostas/${p.id}`,
            urgente: true,
          })
        }
      }

      for (const a of apolices ?? []) {
        const days = Math.ceil((new Date(a.vigencia_fim).getTime() - Date.now()) / 86400000)
        notifs.push({
          id: `apolice-${a.id}`,
          tipo: 'apolice',
          titulo: days <= 7 ? `Apólice vence em ${days}d` : `Apólice vence em ${days}d`,
          desc: `${(a.tomador as any)?.razao_social} · ${a.numero_apolice}`,
          href: `/apolices/${a.id}`,
          urgente: days <= 7,
        })
      }

      return notifs.slice(0, 15)
    },
    staleTime: 300_000,
  })
}
