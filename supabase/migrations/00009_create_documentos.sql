CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  proposta_id UUID REFERENCES propostas(id) ON DELETE CASCADE,
  apolice_id UUID REFERENCES apolices(id) ON DELETE CASCADE,
  tomador_id UUID REFERENCES tomadores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo documento_tipo NOT NULL DEFAULT 'outros',
  arquivo_url TEXT NOT NULL,
  arquivo_tamanho INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (
    (proposta_id IS NOT NULL)::int +
    (apolice_id IS NOT NULL)::int +
    (tomador_id IS NOT NULL)::int >= 1
  )
);

CREATE INDEX idx_documentos_proposta ON documentos(proposta_id);
CREATE INDEX idx_documentos_apolice ON documentos(apolice_id);
CREATE INDEX idx_documentos_tomador ON documentos(tomador_id);
