CREATE TABLE atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),
  tipo atividade_tipo NOT NULL,
  proposta_id UUID REFERENCES propostas(id) ON DELETE CASCADE,
  apolice_id UUID REFERENCES apolices(id) ON DELETE CASCADE,
  tomador_id UUID REFERENCES tomadores(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  dados JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_atividades_corretora ON atividades(corretora_id, created_at DESC);
CREATE INDEX idx_atividades_proposta ON atividades(proposta_id);
