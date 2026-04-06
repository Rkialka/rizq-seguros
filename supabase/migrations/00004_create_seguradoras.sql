CREATE TABLE seguradoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  codigo VARCHAR(10),
  logo_url TEXT,
  contatos JSONB DEFAULT '[]',
  modalidades_aceitas TEXT[] DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
