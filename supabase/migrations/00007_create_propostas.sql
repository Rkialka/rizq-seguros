CREATE TABLE propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  numero_proposta VARCHAR(30),
  tomador_id UUID NOT NULL REFERENCES tomadores(id),
  seguradora_id UUID REFERENCES seguradoras(id),
  modalidade_id UUID NOT NULL REFERENCES modalidades(id),
  responsavel_id UUID REFERENCES usuarios(id),
  importancia_segurada NUMERIC(15,2) NOT NULL,
  premio NUMERIC(15,2),
  taxa NUMERIC(8,6),
  comissao_percentual NUMERIC(5,2),
  comissao_valor NUMERIC(15,2),
  vigencia_inicio DATE,
  vigencia_fim DATE,
  prazo_dias INTEGER,
  status proposta_status NOT NULL DEFAULT 'cotacao_pendente',
  prioridade proposta_prioridade NOT NULL DEFAULT 'media',
  sla_dias INTEGER DEFAULT 5,
  sla_inicio TIMESTAMPTZ DEFAULT now(),
  sla_alerta_enviado BOOLEAN DEFAULT false,
  objeto TEXT,
  numero_licitacao VARCHAR(50),
  numero_contrato VARCHAR(50),
  orgao_publico TEXT,
  observacoes TEXT,
  dados_extras JSONB DEFAULT '{}',
  ccg_necessario BOOLEAN DEFAULT false,
  ccg_status VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_propostas_corretora ON propostas(corretora_id);
CREATE INDEX idx_propostas_status ON propostas(corretora_id, status);
CREATE INDEX idx_propostas_tomador ON propostas(tomador_id);
CREATE INDEX idx_propostas_responsavel ON propostas(responsavel_id);
