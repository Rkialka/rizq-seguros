CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'corretor',
  avatar_url TEXT,
  ativo BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_usuarios_corretora ON usuarios(corretora_id);
