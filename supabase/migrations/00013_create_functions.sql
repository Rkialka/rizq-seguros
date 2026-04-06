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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_propostas_status_log
  AFTER UPDATE ON propostas
  FOR EACH ROW EXECUTE FUNCTION log_proposta_status_change();

-- Dashboard KPI function (single query instead of 7)
CREATE OR REPLACE FUNCTION get_dashboard_kpis(p_corretora_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'premio_emitido_mes', COALESCE((
      SELECT SUM(premio) FROM apolices
      WHERE corretora_id = p_corretora_id
        AND status = 'vigente'
        AND data_emissao >= date_trunc('month', CURRENT_DATE)
    ), 0),
    'propostas_criadas_mes', (
      SELECT COUNT(*) FROM propostas
      WHERE corretora_id = p_corretora_id
        AND created_at >= date_trunc('month', CURRENT_DATE)
    ),
    'cotacoes_pendentes', (
      SELECT COUNT(*) FROM propostas
      WHERE corretora_id = p_corretora_id
        AND status IN ('cotacao_pendente', 'em_analise')
    ),
    'emissoes_mes', (
      SELECT COUNT(*) FROM propostas
      WHERE corretora_id = p_corretora_id
        AND status = 'emitida'
        AND updated_at >= date_trunc('month', CURRENT_DATE)
    ),
    'pipeline_value', COALESCE((
      SELECT SUM(premio) FROM propostas
      WHERE corretora_id = p_corretora_id
        AND status NOT IN ('emitida', 'rejeitada', 'erro_emissao')
    ), 0),
    'apolices_vencendo_30d', (
      SELECT COUNT(*) FROM apolices
      WHERE corretora_id = p_corretora_id
        AND status = 'vigente'
        AND vigencia_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
    ),
    'sla_em_risco', (
      SELECT COUNT(*) FROM propostas
      WHERE corretora_id = p_corretora_id
        AND status NOT IN ('emitida', 'rejeitada', 'erro_emissao')
        AND (EXTRACT(EPOCH FROM (now() - sla_inicio)) / 86400) > sla_dias
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
