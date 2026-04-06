CREATE TABLE apolices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  proposta_id UUID REFERENCES propostas(id),
  tomador_id UUID NOT NULL REFERENCES tomadores(id),
  seguradora_id UUID NOT NULL REFERENCES seguradoras(id),
  modalidade_id UUID NOT NULL REFERENCES modalidades(id),
  numero_apolice VARCHAR(50) NOT NULL,
  numero_endosso VARCHAR(50),
  importancia_segurada NUMERIC(15,2) NOT NULL,
  premio NUMERIC(15,2) NOT NULL,
  taxa NUMERIC(8,6),
  comissao_percentual NUMERIC(5,2),
  comissao_valor NUMERIC(15,2),
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE NOT NULL,
  data_emissao DATE,
  status apolice_status NOT NULL DEFAULT 'vigente',
  objeto TEXT,
  favorecido TEXT,
  numero_licitacao VARCHAR(50),
  numero_contrato VARCHAR(50),
  orgao_publico TEXT,
  observacoes TEXT,
  dados_extras JSONB DEFAULT '{}',
  renovacao_alerta_30 BOOLEAN DEFAULT false,
  renovacao_alerta_60 BOOLEAN DEFAULT false,
  renovacao_alerta_90 BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(corretora_id, numero_apolice)
);

CREATE INDEX idx_apolices_corretora ON apolices(corretora_id);
CREATE INDEX idx_apolices_status ON apolices(corretora_id, status);
CREATE INDEX idx_apolices_tomador ON apolices(tomador_id);
CREATE INDEX idx_apolices_vigencia ON apolices(vigencia_fim);
CREATE INDEX idx_apolices_numero ON apolices(numero_apolice);
