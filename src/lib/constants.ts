// Pipeline stages configuration
export const PROPOSTA_STAGES = [
  { id: 'cotacao_pendente', label: 'Cotações Pendentes', color: '#94a3b8', order: 0 },
  { id: 'em_analise', label: 'Em Análise', color: '#60a5fa', order: 1 },
  { id: 'em_analise_credito', label: 'Em Análise (Crédito)', color: '#a78bfa', order: 2 },
  { id: 'subscricao', label: 'Subscrição', color: '#f59e0b', order: 3 },
  { id: 'em_emissao', label: 'Em Emissão', color: '#fb923c', order: 4 },
  { id: 'aprovada', label: 'Aprovada', color: '#34d399', order: 5 },
  { id: 'emitida', label: 'Emitida', color: '#22c55e', order: 6 },
  { id: 'rejeitada', label: 'Rejeitada', color: '#ef4444', order: 7 },
  { id: 'erro_emissao', label: 'Erro na Emissão', color: '#dc2626', order: 8 },
] as const

export const KANBAN_ACTIVE_STAGES = PROPOSTA_STAGES.filter(
  (s) => !['rejeitada', 'erro_emissao'].includes(s.id)
)

export const KANBAN_TERMINAL_STAGES = PROPOSTA_STAGES.filter((s) =>
  ['rejeitada', 'erro_emissao'].includes(s.id)
)

export const PRIORIDADES = [
  { id: 'urgente', label: 'Urgente', color: '#dc2626' },
  { id: 'alta', label: 'Alta', color: '#f59e0b' },
  { id: 'media', label: 'Média', color: '#60a5fa' },
  { id: 'baixa', label: 'Baixa', color: '#94a3b8' },
] as const

export const APOLICE_STATUS = [
  { id: 'vigente', label: 'Vigente', color: '#22c55e' },
  { id: 'vencida', label: 'Vencida', color: '#ef4444' },
  { id: 'cancelada', label: 'Cancelada', color: '#94a3b8' },
  { id: 'encerrada', label: 'Encerrada', color: '#6b7280' },
] as const

export type PropostaStatus = (typeof PROPOSTA_STAGES)[number]['id']
export type Prioridade = (typeof PRIORIDADES)[number]['id']
export type ApoliceStatus = (typeof APOLICE_STATUS)[number]['id']

// Navigation items
export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/propostas', label: 'Propostas', icon: 'FileText' },
  { href: '/apolices', label: 'Apólices', icon: 'Shield' },
] as const

export const NAV_ITEMS_PHASE2 = [
  { href: '/tomadores', label: 'Tomadores', icon: 'Building2' },
  { href: '/sinistros', label: 'Sinistros', icon: 'AlertTriangle' },
  { href: '/boletos', label: 'Boletos', icon: 'Receipt' },
  { href: '/endossos', label: 'Endossos', icon: 'FileEdit' },
  { href: '/renovacoes', label: 'Renovações', icon: 'RefreshCw' },
  { href: '/automacoes', label: 'Automações', icon: 'Zap' },
  { href: '/relatorios', label: 'Relatórios', icon: 'BarChart3' },
] as const

// Currency formatter
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// CNPJ formatter
export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '')
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

// Date formatter
export function formatDateBR(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

// SLA helpers
export function getSLADaysRemaining(slaInicio: string, slaDias: number): number {
  const start = new Date(slaInicio)
  const now = new Date()
  const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return slaDias - elapsed
}

export function getSLAColor(remaining: number): string {
  if (remaining <= 0) return '#ef4444' // red - overdue
  if (remaining <= 2) return '#f59e0b' // yellow - warning
  return '#22c55e' // green - ok
}
