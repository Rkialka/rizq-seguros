# Prompt para Claude Chrome Extension — Setup Supabase RIZQ Seguros

Cole o texto abaixo no Claude Chrome Extension estando no painel do Supabase (supabase.com/dashboard/project/srlanbyqwibyoyykhqkv):

---

Preciso que configure o banco de dados deste projeto Supabase para o RIZQ Seguros. Siga os passos na ordem exata. A cada bloco SQL, vá em **SQL Editor → New Query**, cole o SQL, clique em **Run** e confirme que não houve erros antes de continuar.

---

## BLOCO 1 — Enums

```sql
CREATE TYPE user_role AS ENUM ('admin', 'corretor', 'operacional');
CREATE TYPE proposta_status AS ENUM ('cotacao_pendente','em_analise','em_analise_credito','subscricao','em_emissao','aprovada','emitida','rejeitada','erro_emissao');
CREATE TYPE proposta_prioridade AS ENUM ('urgente', 'alta', 'media', 'baixa');
CREATE TYPE apolice_status AS ENUM ('vigente', 'vencida', 'cancelada', 'encerrada');
CREATE TYPE documento_tipo AS ENUM ('proposta','apolice','endosso','ccg','balanco','contrato_social','procuracao','outros');
CREATE TYPE atividade_tipo AS ENUM ('proposta_criada','proposta_atualizada','status_alterado','documento_anexado','apolice_emitida','comentario','alerta_sla','importacao');
CREATE TYPE notificacao_tipo AS ENUM ('vencimento_apolice','sla_risco','proposta_pendente','boleto_vencendo','nova_proposta','sistema');
```

---

## BLOCO 2 — Tabelas

```sql
CREATE TABLE corretoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL, nome_fantasia TEXT,
  cnpj VARCHAR(18) UNIQUE NOT NULL, susep VARCHAR(20),
  email TEXT, telefone VARCHAR(20), endereco JSONB,
  logo_url TEXT, configuracoes JSONB DEFAULT '{}', ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, email TEXT NOT NULL, telefone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'corretor',
  avatar_url TEXT, ativo BOOLEAN DEFAULT true, preferences JSONB DEFAULT '{}',
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
  razao_social TEXT NOT NULL, nome_fantasia TEXT,
  cnpj VARCHAR(18) NOT NULL, inscricao_estadual VARCHAR(20),
  email TEXT, telefone VARCHAR(20), endereco JSONB,
  contato_principal JSONB, dados_credito JSONB DEFAULT '{}',
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
  importancia_segurada NUMERIC(15,2) NOT NULL,
  premio NUMERIC(15,2), taxa NUMERIC(8,6),
  comissao_percentual NUMERIC(5,2), comissao_valor NUMERIC(15,2),
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
CREATE TABLE apolices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  proposta_id UUID REFERENCES propostas(id),
  tomador_id UUID NOT NULL REFERENCES tomadores(id),
  seguradora_id UUID NOT NULL REFERENCES seguradoras(id),
  modalidade_id UUID NOT NULL REFERENCES modalidades(id),
  numero_apolice VARCHAR(50) NOT NULL, numero_endosso VARCHAR(50),
  importancia_segurada NUMERIC(15,2) NOT NULL,
  premio NUMERIC(15,2) NOT NULL, taxa NUMERIC(8,6),
  comissao_percentual NUMERIC(5,2), comissao_valor NUMERIC(15,2),
  vigencia_inicio DATE NOT NULL, vigencia_fim DATE NOT NULL,
  data_emissao DATE, status apolice_status NOT NULL DEFAULT 'vigente',
  objeto TEXT, favorecido TEXT,
  numero_licitacao VARCHAR(50), numero_contrato VARCHAR(50), orgao_publico TEXT,
  observacoes TEXT, dados_extras JSONB DEFAULT '{}',
  renovacao_alerta_30 BOOLEAN DEFAULT false,
  renovacao_alerta_60 BOOLEAN DEFAULT false,
  renovacao_alerta_90 BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(corretora_id, numero_apolice)
);
CREATE INDEX idx_apolices_corretora ON apolices(corretora_id);
CREATE INDEX idx_apolices_vigencia ON apolices(vigencia_fim);
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  proposta_id UUID REFERENCES propostas(id) ON DELETE CASCADE,
  apolice_id UUID REFERENCES apolices(id) ON DELETE CASCADE,
  tomador_id UUID REFERENCES tomadores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, tipo documento_tipo NOT NULL DEFAULT 'outros',
  arquivo_url TEXT NOT NULL, arquivo_tamanho INTEGER, mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
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
CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  tipo notificacao_tipo NOT NULL, titulo TEXT NOT NULL,
  mensagem TEXT, lida BOOLEAN DEFAULT false, link TEXT, dados JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id, lida, created_at DESC);
```

---

## BLOCO 3 — RLS (Row Level Security)

```sql
CREATE OR REPLACE FUNCTION public.get_my_corretora_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'corretora_id')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

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
CREATE POLICY "corretoras_insert" ON corretoras FOR INSERT WITH CHECK (true);
CREATE POLICY "corretoras_update" ON corretoras FOR UPDATE USING (id = get_my_corretora_id());

CREATE POLICY "usuarios_select" ON usuarios FOR SELECT USING (corretora_id = get_my_corretora_id());
CREATE POLICY "usuarios_insert" ON usuarios FOR INSERT WITH CHECK (true);

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

---

## BLOCO 4 — Funções e Triggers

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_propostas_status_log AFTER UPDATE ON propostas
  FOR EACH ROW EXECUTE FUNCTION log_proposta_status_change();

CREATE OR REPLACE FUNCTION get_dashboard_kpis()
RETURNS JSONB AS $$
DECLARE v_corretora_id UUID := get_my_corretora_id(); result JSONB;
BEGIN
  IF auth.uid() IS NULL OR v_corretora_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  SELECT jsonb_build_object(
    'premio_emitido_mes', COALESCE((SELECT SUM(premio) FROM apolices WHERE corretora_id = v_corretora_id AND status = 'vigente' AND data_emissao >= date_trunc('month', CURRENT_DATE)), 0),
    'propostas_criadas_mes', (SELECT COUNT(*) FROM propostas WHERE corretora_id = v_corretora_id AND created_at >= date_trunc('month', CURRENT_DATE)),
    'cotacoes_pendentes', (SELECT COUNT(*) FROM propostas WHERE corretora_id = v_corretora_id AND status IN ('cotacao_pendente', 'em_analise')),
    'emissoes_mes', (SELECT COUNT(*) FROM propostas WHERE corretora_id = v_corretora_id AND status = 'emitida' AND updated_at >= date_trunc('month', CURRENT_DATE)),
    'pipeline_value', COALESCE((SELECT SUM(premio) FROM propostas WHERE corretora_id = v_corretora_id AND status NOT IN ('emitida', 'rejeitada', 'erro_emissao')), 0),
    'apolices_vencendo_30d', (SELECT COUNT(*) FROM apolices WHERE corretora_id = v_corretora_id AND status = 'vigente' AND vigencia_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + 30),
    'sla_em_risco', (SELECT COUNT(*) FROM propostas WHERE corretora_id = v_corretora_id AND status NOT IN ('emitida', 'rejeitada', 'erro_emissao') AND (EXTRACT(EPOCH FROM (now() - sla_inicio)) / 86400) > sla_dias)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_dashboard_kpis() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis() TO authenticated, service_role;

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
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('corretora_id', v_corretora_id)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## BLOCO 5 — Seed (dados de demonstração)

```sql
INSERT INTO seguradoras (id, nome, codigo) VALUES
  ('a1000000-0000-0000-0000-000000000001','Avla','AVLA'),
  ('a1000000-0000-0000-0000-000000000002','Essor','ESSOR'),
  ('a1000000-0000-0000-0000-000000000003','Excelsior','EXCEL'),
  ('a1000000-0000-0000-0000-000000000004','JNS','JNS'),
  ('a1000000-0000-0000-0000-000000000005','Junto','JUNTO'),
  ('a1000000-0000-0000-0000-000000000006','Liberty','LIBER'),
  ('a1000000-0000-0000-0000-000000000007','Mitsui','MITSU'),
  ('a1000000-0000-0000-0000-000000000008','Porto Seguro','PORTO'),
  ('a1000000-0000-0000-0000-000000000009','Sompo','SOMPO'),
  ('a1000000-0000-0000-0000-000000000010','Tokio Marine','TOKIO'),
  ('a1000000-0000-0000-0000-000000000011','Zurich','ZURIC');

INSERT INTO modalidades (id, nome, slug, categoria) VALUES
  ('b1000000-0000-0000-0000-000000000001','Garantia Judicial','garantia-judicial','judicial'),
  ('b1000000-0000-0000-0000-000000000002','Judicial Execução Trabalhista','judicial-trabalhista','judicial'),
  ('b1000000-0000-0000-0000-000000000003','Garantia Contratual','garantia-contratual','contratual'),
  ('b1000000-0000-0000-0000-000000000004','Garantia Licitante','garantia-licitante','contratual'),
  ('b1000000-0000-0000-0000-000000000005','Garantia Performance','garantia-performance','contratual'),
  ('b1000000-0000-0000-0000-000000000006','Performance - Construção','performance-construcao','contratual'),
  ('b1000000-0000-0000-0000-000000000007','Execução de Obra','execucao-obra','contratual'),
  ('b1000000-0000-0000-0000-000000000008','Garantia Financeira','garantia-financeira','financeira'),
  ('b1000000-0000-0000-0000-000000000009','Depósito Recursal','deposito-recursal','judicial'),
  ('b1000000-0000-0000-0000-000000000010','Adiantamento','adiantamento','contratual'),
  ('b1000000-0000-0000-0000-000000000011','Retenção','retencao','contratual'),
  ('b1000000-0000-0000-0000-000000000012','Energia - Compra e Venda','energia-compra-venda','financeira');
```

---

## PASSO 6 — Configurar Auth

Vá em **Authentication → URL Configuration** e defina:

- **Site URL:** `https://rizq-seguros.netlify.app`
- **Redirect URLs** (adicionar as duas):
  - `https://rizq-seguros.netlify.app/auth/callback`
  - `http://localhost:3000/auth/callback`

---

## PASSO 7 — Habilitar Realtime

Vá em **Database → Replication** e ative a tabela **propostas**.

---

Após concluir, confirme que as tabelas aparecem em Table Editor, as policies em Authentication → Policies, e a função handle_new_user em Database → Functions.
