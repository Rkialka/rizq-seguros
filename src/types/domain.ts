// Domain types for the application
// These are derived from the database schema but enriched for UI use

export interface Corretora {
  id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj: string
  susep: string | null
  email: string | null
  telefone: string | null
  logo_url: string | null
  ativo: boolean
  created_at: string
}

export interface Usuario {
  id: string
  corretora_id: string
  nome: string
  email: string
  telefone: string | null
  role: 'admin' | 'corretor' | 'operacional'
  avatar_url: string | null
  ativo: boolean
  created_at: string
}

export interface Seguradora {
  id: string
  nome: string
  codigo: string | null
  logo_url: string | null
  modalidades_aceitas: string[]
  ativo: boolean
}

export interface Modalidade {
  id: string
  nome: string
  slug: string
  categoria: string | null
  descricao: string | null
  ativo: boolean
}

export interface Tomador {
  id: string
  corretora_id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj: string
  email: string | null
  telefone: string | null
  contato_principal: {
    nome?: string
    email?: string
    telefone?: string
    cargo?: string
  } | null
  dados_credito: Record<string, unknown>
  observacoes: string | null
  ativo: boolean
  created_at: string
}

export interface Proposta {
  id: string
  corretora_id: string
  numero_proposta: string
  tomador_id: string
  seguradora_id: string | null
  modalidade_id: string
  responsavel_id: string | null
  importancia_segurada: number
  premio: number | null
  taxa: number | null
  comissao_percentual: number | null
  comissao_valor: number | null
  vigencia_inicio: string | null
  vigencia_fim: string | null
  prazo_dias: number | null
  status: PropostaStatus
  prioridade: Prioridade
  sla_dias: number
  sla_inicio: string
  sla_alerta_enviado: boolean
  objeto: string | null
  numero_licitacao: string | null
  numero_contrato: string | null
  orgao_publico: string | null
  observacoes: string | null
  ccg_necessario: boolean
  ccg_status: string | null
  created_at: string
  updated_at: string
}

export interface PropostaWithRelations extends Proposta {
  tomador: Tomador
  seguradora: Seguradora | null
  modalidade: Modalidade
  responsavel: Usuario | null
}

export interface Apolice {
  id: string
  corretora_id: string
  proposta_id: string | null
  tomador_id: string
  seguradora_id: string
  modalidade_id: string
  numero_apolice: string
  numero_endosso: string | null
  importancia_segurada: number
  premio: number
  taxa: number | null
  comissao_percentual: number | null
  comissao_valor: number | null
  vigencia_inicio: string
  vigencia_fim: string
  data_emissao: string | null
  status: ApoliceStatus
  objeto: string | null
  favorecido: string | null
  numero_licitacao: string | null
  numero_contrato: string | null
  orgao_publico: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface ApoliceWithRelations extends Apolice {
  tomador: Tomador
  seguradora: Seguradora
  modalidade: Modalidade
  proposta: Proposta | null
}

export interface Documento {
  id: string
  corretora_id: string
  proposta_id: string | null
  apolice_id: string | null
  tomador_id: string | null
  nome: string
  tipo: string
  arquivo_url: string
  arquivo_tamanho: number | null
  mime_type: string | null
  uploaded_by: string | null
  created_at: string
}

export interface Atividade {
  id: string
  corretora_id: string
  usuario_id: string | null
  tipo: string
  proposta_id: string | null
  apolice_id: string | null
  tomador_id: string | null
  descricao: string
  dados: Record<string, unknown>
  created_at: string
  usuario?: Usuario
}

export interface Notificacao {
  id: string
  corretora_id: string
  usuario_id: string
  tipo: string
  titulo: string
  mensagem: string | null
  lida: boolean
  link: string | null
  created_at: string
}

export interface DashboardKPIs {
  premio_emitido_mes: number
  propostas_criadas_mes: number
  cotacoes_pendentes: number
  emissoes_mes: number
  pipeline_value: number
  apolices_vencendo_30d: number
  sla_em_risco: number
}

export type PropostaStatus =
  | 'cotacao_pendente'
  | 'em_analise'
  | 'em_analise_credito'
  | 'subscricao'
  | 'em_emissao'
  | 'aprovada'
  | 'emitida'
  | 'rejeitada'
  | 'erro_emissao'

export type Prioridade = 'urgente' | 'alta' | 'media' | 'baixa'

export type ApoliceStatus = 'vigente' | 'vencida' | 'cancelada' | 'encerrada'
