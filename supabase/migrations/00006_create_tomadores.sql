CREATE TABLE tomadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj VARCHAR(18) NOT NULL,
  inscricao_estadual VARCHAR(20),
  email TEXT,
  telefone VARCHAR(20),
  endereco JSONB,
  contato_principal JSONB,
  dados_credito JSONB DEFAULT '{}',
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(corretora_id, cnpj)
);

CREATE INDEX idx_tomadores_corretora ON tomadores(corretora_id);
CREATE INDEX idx_tomadores_cnpj ON tomadores(cnpj);
