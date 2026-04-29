const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CORRETORA_EMAIL = 'felipe.amorim@ammoras.com.br';

const TOMADORES_MOCK = [
  { razao_social: 'TechSolutions Brasil Ltda', cnpj: '12345678000100' },
  { razao_social: 'Construtora Horizonte S/A', cnpj: '23456789000111' },
  { razao_social: 'Logística Rápida S/A', cnpj: '34567890000122' },
  { razao_social: 'Agropecuária Vale Verde Ltda', cnpj: '45678901000133' },
  { razao_social: 'Indústria Metalúrgica Forte', cnpj: '56789012000144' },
  { razao_social: 'Varejo Express Comércio Ltda', cnpj: '67890123000155' },
  { razao_social: 'Consultoria Estratégica Partners', cnpj: '78901234000166' },
  { razao_social: 'Engenharia e Projetos Master', cnpj: '89012345000177' },
  { razao_social: 'Distribuidora de Alimentos Nacional', cnpj: '90123456000188' },
  { razao_social: 'Clínica Médica Saúde Plus', cnpj: '01234567000199' }
];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
  console.log("Iniciando injeção de dados MVP...");

  // 1. Encontrar a Corretora Principal
  const { data: usuario } = await supabase.from('usuarios').select('corretora_id').eq('email', CORRETORA_EMAIL).single();
  if (!usuario) {
    console.error("Corretora não encontrada.");
    process.exit(1);
  }
  const corretora_id = usuario.corretora_id;

  // 2. Obter Modalidades e Seguradoras
  const { data: modalidades } = await supabase.from('modalidades').select('id');
  const { data: seguradoras } = await supabase.from('seguradoras').select('id');

  // 3. Inserir Tomadores
  console.log("Inserindo Tomadores...");
  const tomadoresInseridos = [];
  for (const t of TOMADORES_MOCK) {
    let { data: existing } = await supabase.from('tomadores').select('id').eq('cnpj', t.cnpj).single();
    if (!existing) {
      const { data } = await supabase.from('tomadores').insert({ ...t, corretora_id }).select('id').single();
      tomadoresInseridos.push(data.id);
    } else {
      tomadoresInseridos.push(existing.id);
    }
  }

  // 4. Inserir Propostas
  console.log("Inserindo Propostas...");
  const propostasIds = [];
  const statusProposta = ['em_analise', 'aprovada', 'rejeitada', 'em_analise', 'aprovada', 'cotacao_pendente'];
  
  for (let i = 0; i < 20; i++) {
    const status = statusProposta[randomInt(0, statusProposta.length - 1)];
    const isGanha = status === 'aprovada' || status === 'emitida';
    const premio = isGanha ? randomInt(5000, 150000) : null;
    
    const { data, error } = await supabase.from('propostas').insert({
      corretora_id,
      tomador_id: tomadoresInseridos[randomInt(0, tomadoresInseridos.length - 1)],
      modalidade_id: modalidades[randomInt(0, modalidades.length - 1)].id,
      seguradora_id: randomInt(0, 1) ? seguradoras[randomInt(0, seguradoras.length - 1)].id : null,
      status,
      importancia_segurada: randomInt(50000, 5000000),
      premio,
      prioridade: ['baixa', 'media', 'alta', 'urgente'][randomInt(0, 3)],
      objeto: `Contrato de prestação de serviços nº ${randomInt(1000, 9999)}`,
      created_at: randomDate(new Date(2025, 0, 1), new Date())
    }).select('id').single();
    
    if (error) {
      console.error("Erro ao inserir proposta:", error);
    } else if (isGanha && data) {
      propostasIds.push(data.id);
    }
  }

  // 5. Inserir Apólices (Para propostas ganhas + avulsas)
  console.log("Inserindo Apólices...");
  
  const now = new Date();
  
  for (let i = 0; i < 15; i++) {
    // Definir Status e Vigência
    const type = randomInt(1, 10);
    let vigencia_inicio, vigencia_fim, status;
    
    if (type <= 6) { // 60% vigentes normais
      vigencia_inicio = randomDate(new Date(now.getFullYear() - 1, now.getMonth(), 1), now);
      vigencia_fim = new Date(new Date(vigencia_inicio).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      status = 'vigente';
    } else if (type <= 8) { // 20% a vencer (próximos 15-30 dias)
      vigencia_inicio = new Date(now.getTime() - 340 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      vigencia_fim = new Date(now.getTime() + randomInt(5, 28) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      status = 'vigente'; // It's still vigente, but UI will show "A Vencer"
    } else { // 20% vencidas
      vigencia_inicio = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      vigencia_fim = new Date(now.getTime() - randomInt(5, 60) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      status = 'vencida';
    }

    const proposta_id = propostasIds.length > 0 && randomInt(0, 1) === 1 ? propostasIds.pop() : null;

    await supabase.from('apolices').insert({
      corretora_id,
      tomador_id: tomadoresInseridos[randomInt(0, tomadoresInseridos.length - 1)],
      modalidade_id: modalidades[randomInt(0, modalidades.length - 1)].id,
      seguradora_id: seguradoras[randomInt(0, seguradoras.length - 1)].id,
      proposta_id,
      numero_apolice: `1007${randomInt(1000000, 9999999)}`,
      importancia_segurada: randomInt(100000, 10000000),
      premio: randomInt(5000, 200000),
      vigencia_inicio,
      vigencia_fim,
      status,
      created_at: vigencia_inicio
    });
  }

  console.log("População MVP finalizada com sucesso! Verifique o Dashboard.");
}

run();
