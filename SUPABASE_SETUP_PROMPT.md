# Prompt para Claude Chrome Extension — Setup Supabase RIZQ Seguros

Cole o texto abaixo no Claude Chrome Extension quando estiver no painel do Supabase:

---

Preciso que me ajude a configurar completamente este projeto Supabase para o RIZQ Seguros (plataforma para corretores de seguros). Siga estes passos na ordem:

## PASSO 1: Rodar SQL no SQL Editor

Vá em "SQL Editor" no menu lateral esquerdo do Supabase. Crie uma "New Query" e execute CADA bloco SQL abaixo, UM DE CADA VEZ, na ordem. Após cada execução, confirme que rodou sem erros antes de ir para o próximo.

### Bloco 1 — Enums
```sql
CREATE TYPE user_role AS ENUM ('admin', 'corretor', 'operacional');
CREATE TYPE proposta_status AS ENUM ('cotacao_pendente','em_analise','em_analise_credito','subscricao','em_emissao','aprovada','emitida','rejeitada','erro_emissao');
CREATE TYPE proposta_prioridade AS ENUM ('urgente', 'alta', 'media', 'baixa');
CREATE TYPE apolice_status AS ENUM ('vigente', 'vencida', 'cancelada', 'encerrada');
CREATE TYPE documento_tipo AS ENUM ('proposta', 'apolice', 'endosso', 'ccg', 'balanco', 'contrato_social', 'procuracao', 'outros');
CREATE TYPE atividade_tipo AS ENUM ('proposta_criada', 'proposta_atualizada', 'status_alterado', 'documento_anexado', 'apolice_emitida', 'comentario', 'alerta_sla', 'importacao');
CREATE TYPE notificacao_tipo AS ENUM ('vencimento_apolice', 'sla_risco', 'proposta_pendente', 'boleto_vencendo', 'nova_proposta', 'sistema');
```

### Bloco 2 — Tabelas (execute tudo junto)
```sql
CREATE TABLE corretoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL, nome_fantasia TEXT, cnpj VARCHAR(18) UNIQUE NOT NULL,
  susep VARCHAR(20), email TEXT, telefone VARCHAR(20), endereco JSONB,
  logo_url TEXT, configuracoes JSONB DEFAULT '{}', ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, email TEXT NOT NULL, telefone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'corretor', avatar_url TEXT, ativo BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_usuarios_corretora ON usuarios(corretora_id);

CREATE TABLE seguradoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE, codigo VARCHAR(10), logo_url TEXT,
  contatos JSONB DEFAULT '[]', modalidades_aceitas TEXT[] DEFAULT '{}',
  ativo BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE modalidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE, slug VARCHAR(50) NOT NULL UNIQUE,
  categoria TEXT, descricao TEXT, ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tomadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  razao_social TEXT NOT NULL, nome_fantasia TEXT, cnpj VARCHAR(18) NOT NULL,
  inscricao_estadual VARCHAR(20), email TEXT, telefone VARCHAR(20),
  endereco JSONB, contato_principal JSONB, dados_credito JSONB DEFAULT '{}',
  observacoes TEXT, ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(corretora_id, cnpj)
);
CREATE INDEX idx_tomadores_corretora ON tomadores(corretora_id);
CREATE INDEX idx_tomadores_cnpj ON tomadores(cnpj);

CREATE TABLE propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  numero_proposta VARCHAR(30),
  tomador_id UUID NOT NULL REFERENCES tomadores(id),
  seguradora_id UUID REFERENCES seguradoras(id),
  modalidade_id UUID NOT NULL REFERENCES modalidades(id),
  responsavel_id UUID REFERENCES usuarios(id),
  importancia_segurada NUMERIC(15,2) NOT NULL, premio NUMERIC(15,2),
  taxa NUMERIC(8,6), comissao_percentual NUMERIC(5,2), comissao_valor NUMERIC(15,2),
  vigencia_inicio DATE, vigencia_fim DATE, prazo_dias INTEGER,
  status proposta_status NOT NULL DEFAULT 'cotacao_pendente',
  prioridade proposta_prioridade NOT NULL DEFAULT 'media',
  sla_dias INTEGER DEFAULT 5, sla_inicio TIMESTAMPTZ DEFAULT now(),
  sla_alerta_enviado BOOLEAN DEFAULT false,
  objeto TEXT, numero_licitacao VARCHAR(50), numero_contrato VARCHAR(50),
  orgao_publico TEXT, observacoes TEXT, dados_extras JSONB DEFAULT '{}',
  ccg_necessario BOOLEAN DEFAULT false, ccg_status VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_propostas_corretora ON propostas(corretora_id);
CREATE INDEX idx_propostas_status ON propostas(corretora_id, status);
CREATE INDEX idx_propostas_tomador ON propostas(tomador_id);
CREATE INDEX idx_propostas_responsavel ON propostas(responsavel_id);

CREATE TABLE apolices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  proposta_id UUID REFERENCES propostas(id),
  tomador_id UUID NOT NULL REFERENCES tomadores(id),
  seguradora_id UUID NOT NULL REFERENCES seguradoras(id),
  modalidade_id UUID NOT NULL REFERENCES modalidades(id),
  numero_apolice VARCHAR(50) NOT NULL, numero_endosso VARCHAR(50),
  importancia_segurada NUMERIC(15,2) NOT NULL, premio NUMERIC(15,2) NOT NULL,
  taxa NUMERIC(8,6), comissao_percentual NUMERIC(5,2), comissao_valor NUMERIC(15,2),
  vigencia_inicio DATE NOT NULL, vigencia_fim DATE NOT NULL, data_emissao DATE,
  status apolice_status NOT NULL DEFAULT 'vigente',
  objeto TEXT, favorecido TEXT, numero_licitacao VARCHAR(50),
  numero_contrato VARCHAR(50), orgao_publico TEXT, observacoes TEXT,
  dados_extras JSONB DEFAULT '{}',
  renovacao_alerta_30 BOOLEAN DEFAULT false,
  renovacao_alerta_60 BOOLEAN DEFAULT false,
  renovacao_alerta_90 BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(corretora_id, numero_apolice)
);
CREATE INDEX idx_apolices_corretora ON apolices(corretora_id);
CREATE INDEX idx_apolices_status ON apolices(corretora_id, status);
CREATE INDEX idx_apolices_tomador ON apolices(tomador_id);
CREATE INDEX idx_apolices_vigencia ON apolices(vigencia_fim);
CREATE INDEX idx_apolices_numero ON apolices(numero_apolice);

CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  proposta_id UUID REFERENCES propostas(id) ON DELETE CASCADE,
  apolice_id UUID REFERENCES apolices(id) ON DELETE CASCADE,
  tomador_id UUID REFERENCES tomadores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, tipo documento_tipo NOT NULL DEFAULT 'outros',
  arquivo_url TEXT NOT NULL, arquivo_tamanho INTEGER, mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK ((proposta_id IS NOT NULL)::int + (apolice_id IS NOT NULL)::int + (tomador_id IS NOT NULL)::int >= 1)
);
CREATE INDEX idx_documentos_proposta ON documentos(proposta_id);
CREATE INDEX idx_documentos_apolice ON documentos(apolice_id);
CREATE INDEX idx_documentos_tomador ON documentos(tomador_id);

CREATE TABLE atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),
  tipo atividade_tipo NOT NULL,
  proposta_id UUID REFERENCES propostas(id) ON DELETE CASCADE,
  apolice_id UUID REFERENCES apolices(id) ON DELETE CASCADE,
  tomador_id UUID REFERENCES tomadores(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL, dados JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_atividades_corretora ON atividades(corretora_id, created_at DESC);
CREATE INDEX idx_atividades_proposta ON atividades(proposta_id);

CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  tipo notificacao_tipo NOT NULL,
  titulo TEXT NOT NULL, mensagem TEXT, lida BOOLEAN DEFAULT false,
  link TEXT, dados JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id, lida, created_at DESC);
```

### Bloco 3 — RLS Policies
```sql
CREATE OR REPLACE FUNCTION public.get_my_corretora_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'corretora_id')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE corretoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tomadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE apolices ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguradoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE modalidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "corretoras_select" ON corretoras FOR SELECT USING (id = get_my_corretora_id());
CREATE POLICY "usuarios_select" ON usuarios FOR SELECT USING (corretora_id = get_my_corretora_id());
CREATE POLICY "usuarios_update" ON usuarios FOR UPDATE USING (id = auth.uid());
CREATE POLICY "tomadores_select" ON tomadores FOR SELECT USING (corretora_id = get_my_corretora_id());
CREATE POLICY "tomadores_insert" ON tomadores FOR INSERT WITH CHECK (corretora_id = get_my_corretora_id());
CREATE POLICY "tomadores_update" ON tomadores FOR UPDATE USING (corretora_id = get_my_corretora_id());
CREATE POLICY "tomadores_delete" ON tomadores FOR DELETE USING (corretora_id = get_my_corretora_id());
CREATE POLICY "propostas_select" ON propostas FOR SELECT USING (corretora_id = get_my_corretora_id());
CREATE POLICY "propostas_insert" ON propostas FOR INSERT WITH CHECK (corretora_id = get_my_corretora_id());
CREATE POLICY "propostas_update" ON propostas FOR UPDATE USING (corretora_id = get_my_corretora_id());
CREATE POLICY "propostas_delete" ON propostas FOR DELETE USING (corretora_id = get_my_corretora_id());
CREATE POLICY "apolices_select" ON apolices FOR SELECT USING (corretora_id = get_my_corretora_id());
CREATE POLICY "apolices_insert" ON apolices FOR INSERT WITH CHECK (corretora_id = get_my_corretora_id());
CREATE POLICY "apolices_update" ON apolices FOR UPDATE USING (corretora_id = get_my_corretora_id());
CREATE POLICY "apolices_delete" ON apolices FOR DELETE USING (corretora_id = get_my_corretora_id());
CREATE POLICY "documentos_select" ON documentos FOR SELECT USING (corretora_id = get_my_corretora_id());
CREATE POLICY "documentos_insert" ON documentos FOR INSERT WITH CHECK (corretora_id = get_my_corretora_id());
CREATE POLICY "documentos_delete" ON documentos FOR DELETE USING (corretora_id = get_my_corretora_id());
CREATE POLICY "atividades_select" ON atividades FOR SELECT USING (corretora_id = get_my_corretora_id());
CREATE POLICY "atividades_insert" ON atividades FOR INSERT WITH CHECK (corretora_id = get_my_corretora_id());
CREATE POLICY "notificacoes_select" ON notificacoes FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "notificacoes_update" ON notificacoes FOR UPDATE USING (usuario_id = auth.uid());
CREATE POLICY "seguradoras_read" ON seguradoras FOR SELECT USING (true);
CREATE POLICY "modalidades_read" ON modalidades FOR SELECT USING (true);
```

### Bloco 4 — Functions & Triggers
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_corretoras_updated BEFORE UPDATE ON corretoras FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_usuarios_updated BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tomadores_updated BEFORE UPDATE ON tomadores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_propostas_updated BEFORE UPDATE ON propostas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_apolices_updated BEFORE UPDATE ON apolices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION generate_numero_proposta()
RETURNS TRIGGER AS $$
DECLARE seq INTEGER; year_str TEXT;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SPLIT_PART(numero_proposta, '-', 3) AS INTEGER)), 0) + 1
  INTO seq FROM propostas
  WHERE corretora_id = NEW.corretora_id AND numero_proposta LIKE 'PROP-' || year_str || '-%';
  NEW.numero_proposta := 'PROP-' || year_str || '-' || LPAD(seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_propostas_numero BEFORE INSERT ON propostas
  FOR EACH ROW WHEN (NEW.numero_proposta IS NULL) EXECUTE FUNCTION generate_numero_proposta();

CREATE OR REPLACE FUNCTION log_proposta_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO atividades (corretora_id, tipo, proposta_id, descricao, dados)
    VALUES (NEW.corretora_id, 'status_alterado', NEW.id,
      'Status alterado de ' || OLD.status || ' para ' || NEW.status,
      jsonb_build_object('status_anterior', OLD.status, 'status_novo', NEW.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_propostas_status_log AFTER UPDATE ON propostas
  FOR EACH ROW EXECUTE FUNCTION log_proposta_status_change();

CREATE OR REPLACE FUNCTION get_dashboard_kpis(p_corretora_id UUID)
RETURNS JSONB AS $$
DECLARE result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'premio_emitido_mes', COALESCE((SELECT SUM(premio) FROM apolices WHERE corretora_id = p_corretora_id AND status = 'vigente' AND data_emissao >= date_trunc('month', CURRENT_DATE)), 0),
    'propostas_criadas_mes', (SELECT COUNT(*) FROM propostas WHERE corretora_id = p_corretora_id AND created_at >= date_trunc('month', CURRENT_DATE)),
    'cotacoes_pendentes', (SELECT COUNT(*) FROM propostas WHERE corretora_id = p_corretora_id AND status IN ('cotacao_pendente', 'em_analise')),
    'emissoes_mes', (SELECT COUNT(*) FROM propostas WHERE corretora_id = p_corretora_id AND status = 'emitida' AND updated_at >= date_trunc('month', CURRENT_DATE)),
    'pipeline_value', COALESCE((SELECT SUM(premio) FROM propostas WHERE corretora_id = p_corretora_id AND status NOT IN ('emitida', 'rejeitada', 'erro_emissao')), 0),
    'apolices_vencendo_30d', (SELECT COUNT(*) FROM apolices WHERE corretora_id = p_corretora_id AND status = 'vigente' AND vigencia_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + 30),
    'sla_em_risco', (SELECT COUNT(*) FROM propostas WHERE corretora_id = p_corretora_id AND status NOT IN ('emitida', 'rejeitada', 'erro_emissao') AND (EXTRACT(EPOCH FROM (now() - sla_inicio)) / 86400) > sla_dias)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE v_corretora_id UUID; v_nome TEXT; v_role user_role;
BEGIN
  v_corretora_id := (NEW.raw_user_meta_data ->> 'corretora_id')::UUID;
  v_nome := COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email);
  v_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'corretor');
  IF v_corretora_id IS NOT NULL THEN
    INSERT INTO public.usuarios (id, corretora_id, nome, email, role)
    VALUES (NEW.id, v_corretora_id, v_nome, NEW.email, v_role);
    UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('corretora_id', v_corretora_id) WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Bloco 5 — Seed Data (dados demo)
O ficheiro de seed é grande. Copie o conteúdo do ficheiro `supabase/seed.sql` do projecto e execute-o no SQL Editor. Ele cria:
- 11 seguradoras
- 12 modalidades  
- 1 corretora demo
- 10 tomadores
- 20 propostas em vários estágios
- 15 apólices
- 15 atividades

## PASSO 2: Configurar Authentication

1. Vá em **Authentication** > **Providers** no menu lateral
2. Confirme que **Email** está habilitado
3. Em **Email Templates**, opcionalmente traduza para português
4. Em **URL Configuration**: defina Site URL como `http://localhost:3000`
5. Adicione em **Redirect URLs**: `http://localhost:3000/auth/callback`

## PASSO 3: Habilitar Realtime

1. Vá em **Database** > **Replication** 
2. Clique em "Source" na tabela "supabase_realtime"
3. Habilite a tabela **propostas** para Realtime (INSERT, UPDATE, DELETE)

## PASSO 4: Copiar as credenciais

1. Vá em **Project Settings** > **API** (no menu lateral)
2. Copie:
   - **Project URL** (ex: https://xxxxx.supabase.co)
   - **anon public key** (a chave longa que começa com eyJ...)
3. Estas vão no ficheiro `.env.local` do projeto Next.js:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## PASSO 5: Verificação

Após tudo configurado, vá em **Table Editor** e confirme que existem estas tabelas:
corretoras, usuarios, seguradoras, modalidades, tomadores, propostas, apolices, documentos, atividades, notificacoes

Verifique que os dados de seed foram inseridos (11 seguradoras, 12 modalidades, etc.)

Me diga quando cada passo estiver concluído para que eu possa ajudar com o próximo.
