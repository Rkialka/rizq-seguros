-- Helper function to get current user's corretora
CREATE OR REPLACE FUNCTION public.get_my_corretora_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'corretora_id')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

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
CREATE POLICY "usuarios_update" ON usuarios FOR UPDATE USING (id = auth.uid());

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
