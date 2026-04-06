CREATE TYPE user_role AS ENUM ('admin', 'corretor', 'operacional');

CREATE TYPE proposta_status AS ENUM (
  'cotacao_pendente',
  'em_analise',
  'em_analise_credito',
  'subscricao',
  'em_emissao',
  'aprovada',
  'emitida',
  'rejeitada',
  'erro_emissao'
);

CREATE TYPE proposta_prioridade AS ENUM ('urgente', 'alta', 'media', 'baixa');

CREATE TYPE apolice_status AS ENUM ('vigente', 'vencida', 'cancelada', 'encerrada');

CREATE TYPE documento_tipo AS ENUM (
  'proposta', 'apolice', 'endosso', 'ccg', 'balanco',
  'contrato_social', 'procuracao', 'outros'
);

CREATE TYPE atividade_tipo AS ENUM (
  'proposta_criada', 'proposta_atualizada', 'status_alterado',
  'documento_anexado', 'apolice_emitida', 'comentario',
  'alerta_sla', 'importacao'
);

CREATE TYPE notificacao_tipo AS ENUM (
  'vencimento_apolice', 'sla_risco', 'proposta_pendente',
  'boleto_vencendo', 'nova_proposta', 'sistema'
);
