import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { cnpj, razao_social, nome_fantasia, telefone, email_corretora, nome, email, password } =
    await req.json()

  const supabase = createAdminClient()

  // 1. Create corretora (admin bypasses RLS)
  const { data: corretora, error: corrError } = await supabase
    .from('corretoras')
    .insert({ razao_social, nome_fantasia: nome_fantasia || null, cnpj, email: email_corretora || null, telefone: telefone || null })
    .select('id')
    .single()

  if (corrError) {
    const msg = corrError.message.includes('unique') ? 'CNPJ já cadastrado' : corrError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // 2. Create auth user (admin API)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { nome, corretora_id: corretora.id, role: 'admin' },
  })

  if (authError) {
    // Rollback corretora if user creation fails
    await supabase.from('corretoras').delete().eq('id', corretora.id)
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
