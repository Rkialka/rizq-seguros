'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export const CHECKLIST_DOCUMENTOS = [
  { id: 'susep', label: 'Cópia da SUSEP empresarial', tipo: 'outros' },
  { id: 'cnpj', label: 'Cópia do CNPJ', tipo: 'outros' },
  { id: 'contrato_social', label: 'Cópia do contrato social e alteração', tipo: 'contrato_social' },
  { id: 'inscricao_municipal', label: 'Cópia Inscrição municipal', tipo: 'outros' },
  { id: 'comprovante_endereco', label: 'Cópia do comprovante de endereço', tipo: 'outros' },
  { id: 'dados_bancarios', label: 'Comprovante bancário para comissões', tipo: 'outros' },
]

export function useDocumentosCorretora() {
  return useQuery({
    queryKey: ['documentos-corretora'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const corretora_id = user.app_metadata?.corretora_id
      if (!corretora_id) return []

      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('corretora_id', corretora_id)
        .is('proposta_id', null)
        .is('apolice_id', null)

      if (error) throw error
      return data
    },
  })
}

export function useUploadDocumento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, idName, tipo }: { file: File, idName: string, tipo: string }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const corretora_id = user.app_metadata?.corretora_id
      if (!corretora_id) throw new Error('Sem corretora vinculada')

      // 1. Upload to Storage Bucket 'documentos'
      const fileExt = file.name.split('.').pop()
      const filePath = `${corretora_id}/${idName}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath)

      // 2. Save metadata to 'documentos' table
      const { data: docRecord, error: dbError } = await supabase
        .from('documentos')
        .insert({
          corretora_id,
          nome: idName,
          tipo,
          arquivo_url: publicUrl,
          arquivo_tamanho: file.size,
          mime_type: file.type,
          uploaded_by: user.id
        })
        .select()
        .single()

      if (dbError) throw dbError
      return docRecord
    },
    onSuccess: () => {
      toast.success('Documento enviado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['documentos-corretora'] })
    },
    onError: (err: any) => {
      toast.error('Erro ao enviar documento: ' + err.message)
    }
  })
}

export function useDeleteDocumento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      
      // Get the document to find the storage path (optional if you want to delete from storage too)
      // For simplicity, we just delete the DB record. A full implementation would delete the storage file.
      const { error } = await supabase.from('documentos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Documento removido!')
      queryClient.invalidateQueries({ queryKey: ['documentos-corretora'] })
    },
    onError: () => {
      toast.error('Erro ao remover documento')
    }
  })
}
