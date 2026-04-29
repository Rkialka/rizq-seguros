CREATE TYPE user_role AS ENUM ('admin', 'corretor', 'operacional');

CREATE TYPE proposta_status AS ENUM (
  'cotacao_pendente',
  'em_analise',
  'em_analise_credito',
  'subscricao',
  'em_emissao',
  'aprovada',
  'emitida',
  'rejeitada',
  'erro_emissao'
);

CREATE TYPE proposta_prioridade AS ENUM ('urgente', 'alta', 'media', 'baixa');

CREATE TYPE apolice_status AS ENUM ('vigente', 'vencida', 'cancelada', 'encerrada');

CREATE TYPE documento_tipo AS ENUM (
  'proposta', 'apolice', 'endosso', 'ccg', 'balanco',
  'contrato_social', 'procuracao', 'outros'
);

CREATE TYPE atividade_tipo AS ENUM (
  'proposta_criada', 'proposta_atualizada', 'status_alterado',
  'documento_anexado', 'apolice_emitida', 'comentario',
  'alerta_sla', 'importacao'
);

CREATE TYPE notificacao_tipo AS ENUM (
  'vencimento_apolice', 'sla_risco', 'proposta_pendente',
  'boleto_vencendo', 'nova_proposta', 'sistema'
);
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
CREATE TABLE modalidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  categoria TEXT,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
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
CREATE TABLE propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  numero_proposta VARCHAR(30),
  tomador_id UUID NOT NULL REFERENCES tomadores(id),
  seguradora_id UUID REFERENCES seguradoras(id),
  modalidade_id UUID NOT NULL REFERENCES modalidades(id),
  responsavel_id UUID REFERENCES usuarios(id),
  importancia_segurada NUMERIC(15,2) NOT NULL,
  premio NUMERIC(15,2),
  taxa NUMERIC(8,6),
  comissao_percentual NUMERIC(5,2),
  comissao_valor NUMERIC(15,2),
  vigencia_inicio DATE,
  vigencia_fim DATE,
  prazo_dias INTEGER,
  status proposta_status NOT NULL DEFAULT 'cotacao_pendente',
  prioridade proposta_prioridade NOT NULL DEFAULT 'media',
  sla_dias INTEGER DEFAULT 5,
  sla_inicio TIMESTAMPTZ DEFAULT now(),
  sla_alerta_enviado BOOLEAN DEFAULT false,
  objeto TEXT,
  numero_licitacao VARCHAR(50),
  numero_contrato VARCHAR(50),
  orgao_publico TEXT,
  observacoes TEXT,
  dados_extras JSONB DEFAULT '{}',
  ccg_necessario BOOLEAN DEFAULT false,
  ccg_status VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
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
CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id UUID NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  tipo notificacao_tipo NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  lida BOOLEAN DEFAULT false,
  link TEXT,
  dados JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id, lida, created_at DESC);
-- Helper function to get current user's corretora
CREATE OR REPLACE FUNCTION public.get_my_corretora_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'corretora_id')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Enable RLS on all tenant tables
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

-- Corretoras: users can only see their own
CREATE POLICY "corretoras_select" ON corretoras FOR SELECT USING (id = get_my_corretora_id());

-- Usuarios: users can see others in same corretora
CREATE POLICY "usuarios_select" ON usuarios FOR SELECT USING (corretora_id = get_my_corretora_id());

-- Tomadores
CREATE POLICY "tomadores_select" ON tomadores FOR SELECT USING (corretora_id = get_my_corretora_id());
CREATE POLICY "tomadores_insert" ON tomadores FOR INSERT WITH CHECK (corretora_id = get_my_corretora_id());
CREATE POLICY "tomadores_update" ON tomadores FOR UPDATE USING (corretora_id = get_my_corretora_id());
CREATE POLICY "tomadores_delete" ON tomadores FOR DELETE USING (corretora_id = get_my_corretora_id());

-- Propostas
CREATE POLICY "propostas_select" ON propostas FOR SELECT USING (corretora_id = get_my_corretora_id());
CREATE POLICY "propostas_insert" ON propostas FOR INSERT WITH CHECK (corretora_id = get_my_corretora_id());
CREATE POLICY "propostas_update" ON propostas FOR UPDATE USING (corretora_id = get_my_corretora_id());
CREATE POLICY "propostas_delete" ON propostas FOR DELETE USING (corretora_id = get_my_corretora_id());

-- Apolices
CREATE POLICY "apolices_select" ON apolices FOR SELECT USING (corretora_id = get_my_corretora_id());
CREATE POLICY "apolices_insert" ON apolices FOR INSERT WITH CHECK (corretora_id = get_my_corretora_id());
CREATE POLICY "apolices_update" ON apolices FOR UPDATE USING (corretora_id = get_my_corretora_id());
CREATE POLICY "apolices_delete" ON apolices FOR DELETE USING (corretora_id = get_my_corretora_id());

-- Documentos
CREATE POLICY "documentos_select" ON documentos FOR SELECT USING (corretora_id = get_my_corretora_id());
CREATE POLICY "documentos_insert" ON documentos FOR INSERT WITH CHECK (corretora_id = get_my_corretora_id());
CREATE POLICY "documentos_delete" ON documentos FOR DELETE USING (corretora_id = get_my_corretora_id());

-- Atividades
CREATE POLICY "atividades_select" ON atividades FOR SELECT USING (corretora_id = get_my_corretora_id());
CREATE POLICY "atividades_insert" ON atividades FOR INSERT WITH CHECK (corretora_id = get_my_corretora_id());

-- Notificacoes: user sees only their own
CREATE POLICY "notificacoes_select" ON notificacoes FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "notificacoes_update" ON notificacoes FOR UPDATE USING (usuario_id = auth.uid());

-- Global reference tables (read-only for all authenticated)
CREATE POLICY "seguradoras_read" ON seguradoras FOR SELECT USING (true);
CREATE POLICY "modalidades_read" ON modalidades FOR SELECT USING (true);
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_corretoras_updated BEFORE UPDATE ON corretoras FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_usuarios_updated BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tomadores_updated BEFORE UPDATE ON tomadores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_propostas_updated BEFORE UPDATE ON propostas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_apolices_updated BEFORE UPDATE ON apolices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate numero_proposta (PROP-YYYY-NNNN)
CREATE OR REPLACE FUNCTION generate_numero_proposta()
RETURNS TRIGGER AS $$
DECLARE
  seq INTEGER;
  year_str TEXT;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero_proposta, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO seq
  FROM propostas
  WHERE corretora_id = NEW.corretora_id
    AND numero_proposta LIKE 'PROP-' || year_str || '-%';

  NEW.numero_proposta := 'PROP-' || year_str || '-' || LPAD(seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_propostas_numero
  BEFORE INSERT ON propostas
  FOR EACH ROW
  WHEN (NEW.numero_proposta IS NULL)
  EXECUTE FUNCTION generate_numero_proposta();

-- Log proposta status changes automatically
CREATE OR REPLACE FUNCTION log_proposta_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO atividades (corretora_id, tipo, proposta_id, descricao, dados)
    VALUES (
      NEW.corretora_id,
      'status_alterado',
      NEW.id,
      'Status alterado de ' || OLD.status || ' para ' || NEW.status,
      jsonb_build_object('status_anterior', OLD.status, 'status_novo', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_propostas_status_log
  AFTER UPDATE ON propostas
  FOR EACH ROW EXECUTE FUNCTION log_proposta_status_change();

-- Dashboard KPI function (single query instead of 7)
CREATE OR REPLACE FUNCTION get_dashboard_kpis()
RETURNS JSONB AS $$
DECLARE
  v_corretora_id UUID := get_my_corretora_id();
  result JSONB;
BEGIN
  IF auth.uid() IS NULL OR v_corretora_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'premio_emitido_mes', COALESCE((
      SELECT SUM(premio) FROM apolices
      WHERE corretora_id = v_corretora_id
        AND status = 'vigente'
        AND data_emissao >= date_trunc('month', CURRENT_DATE)
    ), 0),
    'propostas_criadas_mes', (
      SELECT COUNT(*) FROM propostas
      WHERE corretora_id = v_corretora_id
        AND created_at >= date_trunc('month', CURRENT_DATE)
    ),
    'cotacoes_pendentes', (
      SELECT COUNT(*) FROM propostas
      WHERE corretora_id = v_corretora_id
        AND status IN ('cotacao_pendente', 'em_analise')
    ),
    'emissoes_mes', (
      SELECT COUNT(*) FROM propostas
      WHERE corretora_id = v_corretora_id
        AND status = 'emitida'
        AND updated_at >= date_trunc('month', CURRENT_DATE)
    ),
    'pipeline_value', COALESCE((
      SELECT SUM(premio) FROM propostas
      WHERE corretora_id = v_corretora_id
        AND status NOT IN ('emitida', 'rejeitada', 'erro_emissao')
    ), 0),
    'apolices_vencendo_30d', (
      SELECT COUNT(*) FROM apolices
      WHERE corretora_id = v_corretora_id
        AND status = 'vigente'
        AND vigencia_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
    ),
    'sla_em_risco', (
      SELECT COUNT(*) FROM propostas
      WHERE corretora_id = v_corretora_id
        AND status NOT IN ('emitida', 'rejeitada', 'erro_emissao')
        AND (EXTRACT(EPOCH FROM (now() - sla_inicio)) / 86400) > sla_dias
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_dashboard_kpis() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis() TO authenticated, service_role;

-- Handle new user signup: create usuario row and set corretora_id in app_metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_corretora_id UUID;
  v_nome TEXT;
  v_role user_role;
BEGIN
  v_corretora_id := (NEW.raw_user_meta_data ->> 'corretora_id')::UUID;
  v_nome := COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email);
  v_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'corretor');

  IF v_corretora_id IS NOT NULL THEN
    INSERT INTO public.usuarios (id, corretora_id, nome, email, role)
    VALUES (NEW.id, v_corretora_id, v_nome, NEW.email, v_role);

    -- Set corretora_id in app_metadata for RLS
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
-- RIZQ Seguros - Seed Data
-- This creates a demo environment with realistic data

-- 1. Seguradoras (global reference data)
INSERT INTO seguradoras (id, nome, codigo) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Avla', 'AVLA'),
  ('a1000000-0000-0000-0000-000000000002', 'Essor', 'ESSOR'),
  ('a1000000-0000-0000-0000-000000000003', 'Excelsior', 'EXCEL'),
  ('a1000000-0000-0000-0000-000000000004', 'JNS', 'JNS'),
  ('a1000000-0000-0000-0000-000000000005', 'Junto', 'JUNTO'),
  ('a1000000-0000-0000-0000-000000000006', 'Liberty', 'LIBER'),
  ('a1000000-0000-0000-0000-000000000007', 'Mitsui', 'MITSU'),
  ('a1000000-0000-0000-0000-000000000008', 'Porto Seguro', 'PORTO'),
  ('a1000000-0000-0000-0000-000000000009', 'Sompo', 'SOMPO'),
  ('a1000000-0000-0000-0000-000000000010', 'Tokio Marine', 'TOKIO'),
  ('a1000000-0000-0000-0000-000000000011', 'Zurich', 'ZURIC');

-- 2. Modalidades (global reference data)
INSERT INTO modalidades (id, nome, slug, categoria) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Garantia Judicial', 'garantia-judicial', 'judicial'),
  ('b1000000-0000-0000-0000-000000000002', 'Judicial Execução Trabalhista', 'judicial-trabalhista', 'judicial'),
  ('b1000000-0000-0000-0000-000000000003', 'Garantia Contratual', 'garantia-contratual', 'contratual'),
  ('b1000000-0000-0000-0000-000000000004', 'Garantia Licitante', 'garantia-licitante', 'contratual'),
  ('b1000000-0000-0000-0000-000000000005', 'Garantia Performance', 'garantia-performance', 'contratual'),
  ('b1000000-0000-0000-0000-000000000006', 'Performance - Construção', 'performance-construcao', 'contratual'),
  ('b1000000-0000-0000-0000-000000000007', 'Execução de Obra', 'execucao-obra', 'contratual'),
  ('b1000000-0000-0000-0000-000000000008', 'Garantia Financeira', 'garantia-financeira', 'financeira'),
  ('b1000000-0000-0000-0000-000000000009', 'Depósito Recursal', 'deposito-recursal', 'judicial'),
  ('b1000000-0000-0000-0000-000000000010', 'Adiantamento', 'adiantamento', 'contratual'),
  ('b1000000-0000-0000-0000-000000000011', 'Retenção', 'retencao', 'contratual'),
  ('b1000000-0000-0000-0000-000000000012', 'Energia - Compra e Venda', 'energia-compra-venda', 'financeira');

-- 3. Corretora demo
INSERT INTO corretoras (id, razao_social, nome_fantasia, cnpj, susep, email, telefone, endereco) VALUES
  ('c1000000-0000-0000-0000-000000000001',
   'RIZQ Corretora de Seguros Ltda',
   'RIZQ Seguros',
   '12.345.678/0001-90',
   'SUSEP-2025-001',
   'contato@rizq.com.br',
   '(11) 99999-0001',
   '{"rua": "Av. Faria Lima", "numero": "2500", "bairro": "Itaim Bibi", "cidade": "São Paulo", "estado": "SP", "cep": "01452-000"}'
  );

-- 4. Tomadores (10 empresas demo)
INSERT INTO tomadores (id, corretora_id, razao_social, nome_fantasia, cnpj, email, telefone, contato_principal) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
   'Construtora Brasil S.A.', 'Construtora Brasil', '08.174.089/0001-14',
   'contato@construtorabrasil.com.br', '(11) 3333-0001',
   '{"nome": "Carlos Silva", "email": "carlos@construtorabrasil.com.br", "telefone": "(11) 99999-1001", "cargo": "Diretor"}'),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001',
   'Tech Innovations Ltda', 'Tech Innovations', '11.657.758/0001-13',
   'contato@techinnovations.com.br', '(11) 3333-0002',
   '{"nome": "Ana Paula Costa", "email": "ana@techinnovations.com.br", "telefone": "(11) 99999-1002", "cargo": "CEO"}'),
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001',
   'Transportadora Rápida Ltda', 'Rápida Trans', '23.456.789/0001-01',
   'financeiro@rapidatrans.com.br', '(31) 3333-0003',
   '{"nome": "Roberto Santos", "email": "roberto@rapidatrans.com.br", "telefone": "(31) 99999-1003", "cargo": "Gerente Financeiro"}'),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001',
   'N.A.S. Comércio de Alimentos Ltda', 'NAS Alimentos', '34.567.890/0001-12',
   'contato@nasalimentos.com.br', '(11) 3333-0004',
   '{"nome": "Maria Oliveira", "email": "maria.oliveira@nasalimentos.com.br", "telefone": "(11) 99999-1004", "cargo": "Diretora Administrativa"}'),
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001',
   'Indústria Beta Ltda', 'Beta Industrial', '45.678.901/0001-23',
   'roberto@industriabeta.com', '(19) 3333-0005',
   '{"nome": "João Ferreira", "email": "joao@industriabeta.com", "telefone": "(19) 99999-1005", "cargo": "Sócio"}'),
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001',
   'Engenharia Moderna S.A.', 'Eng Moderna', '56.789.012/0001-34',
   'contato@engmoderna.com.br', '(21) 3333-0006',
   '{"nome": "Pedro Oliveira", "email": "pedro@engmoderna.com.br", "telefone": "(21) 99999-1006", "cargo": "Diretor de Obras"}'),
  ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000001',
   'Logística Express Ltda', 'Log Express', '67.890.123/0001-45',
   'financeiro@logexpress.com.br', '(11) 3333-0007',
   '{"nome": "Maria Costa", "email": "maria.costa@logexpress.com.br", "telefone": "(11) 99999-1007", "cargo": "CFO"}'),
  ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000001',
   'Energia Solar Brasil S.A.', 'Solar Brasil', '78.901.234/0001-56',
   'contato@solarbrasil.com.br', '(11) 3333-0008',
   '{"nome": "Ana Santos", "email": "ana.santos@solarbrasil.com.br", "telefone": "(11) 99999-1008", "cargo": "Diretora Comercial"}'),
  ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000001',
   'Mineração Norte Ltda', 'Mineração Norte', '89.012.345/0001-67',
   'contato@mineracaonorte.com.br', '(91) 3333-0009',
   '{"nome": "Carlos Mendes", "email": "carlos.mendes@mineracaonorte.com.br", "telefone": "(91) 99999-1009", "cargo": "Gerente Geral"}'),
  ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001',
   'Agro Forte S.A.', 'Agro Forte', '90.123.456/0001-78',
   'contato@agroforte.com.br', '(62) 3333-0010',
   '{"nome": "José Silva", "email": "jose@agroforte.com.br", "telefone": "(62) 99999-1010", "cargo": "Presidente"}');

-- 5. Propostas (20 across all stages)
INSERT INTO propostas (id, corretora_id, numero_proposta, tomador_id, seguradora_id, modalidade_id, importancia_segurada, premio, taxa, status, prioridade, sla_dias, sla_inicio, objeto) VALUES
  -- Cotação Pendente (3)
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0001',
   'd1000000-0000-0000-0000-000000000001', NULL, 'b1000000-0000-0000-0000-000000000005',
   5000000, NULL, NULL, 'cotacao_pendente', 'alta', 5, now() - interval '2 days',
   'Garantia de performance para obra pública - Rodovia SP-300'),
  ('e1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0002',
   'd1000000-0000-0000-0000-000000000004', NULL, 'b1000000-0000-0000-0000-000000000001',
   850000, NULL, NULL, 'cotacao_pendente', 'media', 5, now() - interval '1 day',
   'Garantia judicial - Reclamação trabalhista ex-funcionário'),
  ('e1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0003',
   'd1000000-0000-0000-0000-000000000008', NULL, 'b1000000-0000-0000-0000-000000000012',
   2000000, NULL, NULL, 'cotacao_pendente', 'baixa', 8, now(),
   'Energia - Compra e venda para usina solar'),

  -- Em Análise (3)
  ('e1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0004',
   'd1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000003',
   1500000, 12500, 0.0083, 'em_analise', 'media', 5, now() - interval '3 days',
   'Garantia contratual - Fornecimento de equipamentos TI'),
  ('e1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0005',
   'd1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000007',
   8000000, 64000, 0.008, 'em_analise', 'urgente', 3, now() - interval '2 days',
   'Execução de obra - Edifício comercial centro RJ'),
  ('e1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0006',
   'd1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004',
   200000, 1600, 0.008, 'em_analise', 'baixa', 8, now() - interval '1 day',
   'Garantia licitante - Pregão eletrônico transporte'),

  -- Em Análise Crédito (2)
  ('e1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0007',
   'd1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000001',
   500000, 4000, 0.008, 'em_analise_credito', 'alta', 5, now() - interval '4 days',
   'Garantia judicial cível - Ação de cobrança'),
  ('e1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0008',
   'd1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000008',
   3000000, 25000, 0.0083, 'em_analise_credito', 'media', 8, now() - interval '3 days',
   'Garantia financeira - Contrato de fornecimento mineral'),

  -- Subscrição (3)
  ('e1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0009',
   'd1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006',
   10000000, 85000, 0.0085, 'subscricao', 'urgente', 5, now() - interval '6 days',
   'Performance construção - Complexo industrial Campinas'),
  ('e1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0010',
   'd1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
   750000, 6000, 0.008, 'subscricao', 'media', 5, now() - interval '2 days',
   'Garantia contratual - Serviços logísticos'),
  ('e1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0011',
   'd1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000002',
   1200000, 10000, 0.0083, 'subscricao', 'alta', 5, now() - interval '3 days',
   'Judicial trabalhista - Reclamação coletiva'),

  -- Em Emissão (2)
  ('e1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0012',
   'd1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000005',
   2500000, 20000, 0.008, 'em_emissao', 'media', 5, now() - interval '4 days',
   'Garantia performance - Contrato SaaS governo'),
  ('e1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0013',
   'd1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000009',
   400000, 3200, 0.008, 'em_emissao', 'baixa', 8, now() - interval '5 days',
   'Depósito recursal - Processo trabalhista'),

  -- Aprovada (2)
  ('e1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0014',
   'd1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000007',
   6000000, 48000, 0.008, 'aprovada', 'alta', 5, now() - interval '7 days',
   'Execução de obra - Ponte rodoviária MG'),
  ('e1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0015',
   'd1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004',
   300000, 2400, 0.008, 'aprovada', 'media', 5, now() - interval '3 days',
   'Garantia licitante - Concorrência pública transporte'),

  -- Emitida (3)
  ('e1000000-0000-0000-0000-000000000016', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0016',
   'd1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000003',
   4000000, 32000, 0.008, 'emitida', 'media', 5, now() - interval '15 days',
   'Garantia contratual - Construção galpão logístico'),
  ('e1000000-0000-0000-0000-000000000017', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0017',
   'd1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001',
   250000, 2000, 0.008, 'emitida', 'baixa', 5, now() - interval '10 days',
   'Garantia judicial - Execução fiscal'),
  ('e1000000-0000-0000-0000-000000000018', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0018',
   'd1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000012',
   1800000, 15000, 0.0083, 'emitida', 'alta', 5, now() - interval '8 days',
   'Energia compra e venda - PPA solar'),

  -- Rejeitada (1)
  ('e1000000-0000-0000-0000-000000000019', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0019',
   'd1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005',
   15000000, NULL, NULL, 'rejeitada', 'urgente', 3, now() - interval '12 days',
   'Performance - Mineração grande porte (crédito reprovado)'),

  -- Erro Emissão (1)
  ('e1000000-0000-0000-0000-000000000020', 'c1000000-0000-0000-0000-000000000001', 'PROP-2026-0020',
   'd1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000010',
   500000, 4000, 0.008, 'erro_emissao', 'media', 5, now() - interval '6 days',
   'Adiantamento - Contrato logístico (erro dados cadastrais)');

-- 6. Apólices (15 policies)
INSERT INTO apolices (id, corretora_id, proposta_id, tomador_id, seguradora_id, modalidade_id, numero_apolice, importancia_segurada, premio, taxa, vigencia_inicio, vigencia_fim, data_emissao, status, objeto) VALUES
  -- Vigentes (10)
  ('f1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000016',
   'd1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000003',
   'APO-2026-001', 4000000, 32000, 0.008, '2026-01-15', '2027-01-15', '2026-01-10', 'vigente',
   'Garantia contratual - Construção galpão logístico'),
  ('f1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000017',
   'd1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001',
   'APO-2026-002', 250000, 2000, 0.008, '2026-02-01', '2027-02-01', '2026-01-28', 'vigente',
   'Garantia judicial - Execução fiscal'),
  ('f1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000018',
   'd1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000012',
   'APO-2026-003', 1800000, 15000, 0.0083, '2026-03-01', '2027-03-01', '2026-02-25', 'vigente',
   'Energia compra e venda - PPA solar'),
  ('f1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', NULL,
   'd1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000005',
   'APO-2025-045', 3500000, 28000, 0.008, '2025-06-01', '2026-06-01', '2025-05-28', 'vigente',
   'Garantia performance - Projeto infraestrutura'),
  ('f1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', NULL,
   'd1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004',
   'APO-2025-067', 180000, 1440, 0.008, '2025-09-15', '2026-04-15', '2025-09-10', 'vigente',
   'Garantia licitante - Pregão transporte'),
  -- Vencendo em breve (vence em 15 dias)
  ('f1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001', NULL,
   'd1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000001',
   'APO-2025-089', 950000, 7600, 0.008, '2025-04-20', '2026-04-20', '2025-04-15', 'vigente',
   'Garantia judicial - Reclamação trabalhista'),
  -- Vencendo em 45 dias
  ('f1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000001', NULL,
   'd1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000007',
   'APO-2025-102', 7500000, 60000, 0.008, '2025-05-20', '2026-05-20', '2025-05-15', 'vigente',
   'Execução de obra - Viaduto urbano'),
  -- Vencendo em 80 dias
  ('f1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000001', NULL,
   'd1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
   'APO-2025-115', 600000, 4800, 0.008, '2025-06-25', '2026-06-25', '2025-06-20', 'vigente',
   'Garantia contratual - Serviços logísticos'),
  ('f1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000001', NULL,
   'd1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000008',
   'APO-2025-130', 2200000, 18000, 0.0082, '2025-08-01', '2026-08-01', '2025-07-28', 'vigente',
   'Garantia financeira - Contrato agrícola'),
  ('f1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001', NULL,
   'd1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005',
   'APO-2025-145', 12000000, 96000, 0.008, '2025-10-01', '2026-10-01', '2025-09-25', 'vigente',
   'Garantia performance - Mineração'),

  -- Vencida (3)
  ('f1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000001', NULL,
   'd1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000006',
   'APO-2024-200', 5000000, 40000, 0.008, '2024-03-01', '2025-03-01', '2024-02-25', 'vencida',
   'Performance construção - Edifício residencial'),
  ('f1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000001', NULL,
   'd1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002',
   'APO-2024-215', 350000, 2800, 0.008, '2024-06-01', '2025-06-01', '2024-05-28', 'vencida',
   'Judicial trabalhista - Reclamação individual'),

  -- Cancelada (1)
  ('f1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000001', NULL,
   'd1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000003',
   'APO-2025-050', 900000, 7200, 0.008, '2025-04-01', '2026-04-01', '2025-03-28', 'cancelada',
   'Garantia contratual cancelada - Rescisão contrato'),

  -- Encerrada (1)
  ('f1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000001', NULL,
   'd1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000009',
   'APO-2024-180', 300000, 2400, 0.008, '2024-01-15', '2024-07-15', '2024-01-10', 'encerrada',
   'Depósito recursal - Processo encerrado');

-- 7. Atividades (últimos 30 dias)
INSERT INTO atividades (corretora_id, tipo, proposta_id, descricao, created_at) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'proposta_criada', 'e1000000-0000-0000-0000-000000000001', 'Proposta PROP-2026-0001 criada para Construtora Brasil S.A.', now() - interval '2 days'),
  ('c1000000-0000-0000-0000-000000000001', 'proposta_criada', 'e1000000-0000-0000-0000-000000000002', 'Proposta PROP-2026-0002 criada para N.A.S. Comércio de Alimentos', now() - interval '1 day'),
  ('c1000000-0000-0000-0000-000000000001', 'status_alterado', 'e1000000-0000-0000-0000-000000000004', 'Status alterado de cotacao_pendente para em_analise', now() - interval '3 days'),
  ('c1000000-0000-0000-0000-000000000001', 'status_alterado', 'e1000000-0000-0000-0000-000000000009', 'Status alterado de em_analise_credito para subscricao', now() - interval '6 days'),
  ('c1000000-0000-0000-0000-000000000001', 'status_alterado', 'e1000000-0000-0000-0000-000000000012', 'Status alterado de aprovada para em_emissao', now() - interval '4 days'),
  ('c1000000-0000-0000-0000-000000000001', 'apolice_emitida', 'e1000000-0000-0000-0000-000000000016', 'Apólice APO-2026-001 emitida pela Tokio Marine', now() - interval '15 days'),
  ('c1000000-0000-0000-0000-000000000001', 'apolice_emitida', 'e1000000-0000-0000-0000-000000000017', 'Apólice APO-2026-002 emitida pela Essor', now() - interval '10 days'),
  ('c1000000-0000-0000-0000-000000000001', 'apolice_emitida', 'e1000000-0000-0000-0000-000000000018', 'Apólice APO-2026-003 emitida pela Zurich', now() - interval '8 days'),
  ('c1000000-0000-0000-0000-000000000001', 'alerta_sla', 'e1000000-0000-0000-0000-000000000009', 'SLA em risco: PROP-2026-0009 com 6 dias (limite: 5)', now() - interval '1 day'),
  ('c1000000-0000-0000-0000-000000000001', 'status_alterado', 'e1000000-0000-0000-0000-000000000019', 'Status alterado de em_analise_credito para rejeitada', now() - interval '12 days'),
  ('c1000000-0000-0000-0000-000000000001', 'proposta_criada', 'e1000000-0000-0000-0000-000000000003', 'Proposta PROP-2026-0003 criada para Energia Solar Brasil', now()),
  ('c1000000-0000-0000-0000-000000000001', 'documento_anexado', 'e1000000-0000-0000-0000-000000000007', 'Balanço Patrimonial 2024 anexado à PROP-2026-0007', now() - interval '4 days'),
  ('c1000000-0000-0000-0000-000000000001', 'comentario', 'e1000000-0000-0000-0000-000000000005', 'Engenharia Moderna solicitou urgência na emissão', now() - interval '1 day'),
  ('c1000000-0000-0000-0000-000000000001', 'status_alterado', 'e1000000-0000-0000-0000-000000000014', 'Status alterado de em_emissao para aprovada', now() - interval '7 days'),
  ('c1000000-0000-0000-0000-000000000001', 'importacao', NULL, 'Importação de 5 apólices vigentes concluída', now() - interval '20 days');
