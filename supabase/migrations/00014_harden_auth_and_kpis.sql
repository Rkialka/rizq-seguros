BEGIN;

-- Remove the client-controlled tenant parameter from the KPI RPC.
DROP FUNCTION IF EXISTS public.get_dashboard_kpis(UUID);

CREATE OR REPLACE FUNCTION public.get_dashboard_kpis()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_corretora_id UUID := public.get_my_corretora_id();
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
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_kpis() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis() TO authenticated, service_role;

-- Disable self-service updates on tenant users until a server-side profile flow exists.
DROP POLICY IF EXISTS "usuarios_update" ON public.usuarios;

-- Harden SECURITY DEFINER functions against search_path hijacking.
CREATE OR REPLACE FUNCTION public.get_my_corretora_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'corretora_id')::UUID;
$$;

CREATE OR REPLACE FUNCTION public.log_proposta_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('corretora_id', v_corretora_id)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
