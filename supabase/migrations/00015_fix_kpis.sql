-- Fix KPI function to use COALESCE for data_emissao and improve queries
BEGIN;

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
  -- For service_role calls (admin), use a default corretora if needed
  IF v_corretora_id IS NULL THEN
    -- Try to get first corretora for testing
    SELECT id INTO v_corretora_id FROM corretoras LIMIT 1;
  END IF;

  IF v_corretora_id IS NULL THEN
    RETURN jsonb_build_object(
      'premio_emitido_mes', 0,
      'propostas_criadas_mes', 0,
      'cotacoes_pendentes', 0,
      'emissoes_mes', 0,
      'pipeline_value', 0,
      'apolices_vencendo_30d', 0,
      'sla_em_risco', 0
    );
  END IF;

  SELECT jsonb_build_object(
    'premio_emitido_mes', COALESCE((
      SELECT SUM(premio) FROM apolices
      WHERE corretora_id = v_corretora_id
        AND status = 'vigente'
        AND COALESCE(data_emissao, created_at::date) >= date_trunc('month', CURRENT_DATE)
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
      SELECT COUNT(*) FROM apolices
      WHERE corretora_id = v_corretora_id
        AND status = 'vigente'
        AND COALESCE(data_emissao, created_at::date) >= date_trunc('month', CURRENT_DATE)
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
        AND sla_dias IS NOT NULL
        AND sla_inicio IS NOT NULL
        AND (EXTRACT(EPOCH FROM (now() - sla_inicio)) / 86400) > sla_dias
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_kpis() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis() TO authenticated, service_role;

COMMIT;
