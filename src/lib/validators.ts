import { z } from 'zod'

function validarCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return false
  if (/^(\d)\1+$/.test(digits)) return false // rejeita sequências iguais (00000000000000)

  const calc = (len: number) => {
    let sum = 0
    let pos = len - 7
    for (let i = len; i >= 1; i--) {
      sum += parseInt(digits[len - i]) * pos--
      if (pos < 2) pos = 9
    }
    const result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    return result === parseInt(digits[len])
  }

  return calc(12) && calc(13)
}

const cnpjSchema = z
  .string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido (formato: XX.XXX.XXX/XXXX-XX)')
  .refine(validarCNPJ, 'CNPJ inválido')

// Auth
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export const signupSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  razao_social: z.string().min(2, 'Razão social é obrigatória'),
  cnpj: cnpjSchema,
})

// Proposta
export const novaPropostaSchema = z.object({
  tomador_id: z.string().uuid('Selecione um tomador'),
  modalidade_id: z.string().uuid('Selecione uma modalidade'),
  seguradora_id: z.string().uuid().optional(),
  importancia_segurada: z.number().positive('Importância segurada deve ser positiva'),
  premio: z.number().positive('Prêmio deve ser positivo').optional(),
  taxa: z.number().min(0).max(100).optional(),
  vigencia_inicio: z.string().optional(),
  vigencia_fim: z.string().optional(),
  prazo_dias: z.number().int().positive().optional(),
  prioridade: z.enum(['urgente', 'alta', 'media', 'baixa']).default('media'),
  sla_dias: z.number().int().positive().default(5),
  objeto: z.string().optional(),
  numero_licitacao: z.string().optional(),
  numero_contrato: z.string().optional(),
  orgao_publico: z.string().optional(),
  observacoes: z.string().optional(),
})

// Apolice
export const novaApoliceSchema = z.object({
  proposta_id: z.string().uuid().optional(),
  tomador_id: z.string().uuid('Selecione um tomador'),
  seguradora_id: z.string().uuid('Selecione uma seguradora'),
  modalidade_id: z.string().uuid('Selecione uma modalidade'),
  numero_apolice: z.string().min(1, 'Número da apólice é obrigatório'),
  importancia_segurada: z.number().positive('Importância segurada deve ser positiva'),
  premio: z.number().positive('Prêmio deve ser positivo'),
  taxa: z.number().min(0).max(100).optional(),
  comissao_percentual: z.number().min(0).max(100).optional(),
  vigencia_inicio: z.string().min(1, 'Data de início é obrigatória'),
  vigencia_fim: z.string().min(1, 'Data de fim é obrigatória'),
  data_emissao: z.string().optional(),
  objeto: z.string().optional(),
  favorecido: z.string().optional(),
  observacoes: z.string().optional(),
})

// Tomador (for inline creation)
export const novoTomadorSchema = z.object({
  razao_social: z.string().min(2, 'Razão social é obrigatória'),
  cnpj: cnpjSchema,
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type NovaPropostaFormData = z.infer<typeof novaPropostaSchema>
export type NovaApoliceFormData = z.infer<typeof novaApoliceSchema>
export type NovoTomadorFormData = z.infer<typeof novoTomadorSchema>
