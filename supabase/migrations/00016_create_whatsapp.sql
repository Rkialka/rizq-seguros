-- WhatsApp sessions: maps phone number to corretora
CREATE TABLE IF NOT EXISTS whatsapp_sessoes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone    text UNIQUE NOT NULL,         -- +5511999999999
  corretora_id uuid REFERENCES corretoras(id) ON DELETE CASCADE,
  ativo       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Conversation history per phone (last N messages for context)
CREATE TABLE IF NOT EXISTS whatsapp_historico (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone   text NOT NULL,
  role       text NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_historico_telefone_idx
  ON whatsapp_historico (telefone, created_at DESC);

-- RLS: service role only (webhook uses service role key)
ALTER TABLE whatsapp_sessoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_historico ENABLE ROW LEVEL SECURITY;

-- Admins can view/manage sessions via dashboard (future)
CREATE POLICY "admin_all_whatsapp_sessoes" ON whatsapp_sessoes
  FOR ALL TO authenticated
  USING (
    corretora_id = (SELECT get_my_corretora_id())
  );
