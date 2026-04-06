CREATE TABLE corretoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  susep VARCHAR(20),
  email TEXT,
  telefone VARCHAR(20),
  endereco JSONB,
  logo_url TEXT,
  configuracoes JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
