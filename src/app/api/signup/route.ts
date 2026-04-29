import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@supabase/supabase-js'
import { signupSchema } from '@/lib/validators'

export async function POST(req: NextRequest) {
  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const parsed = signupSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Dados inválidos',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const { cnpj, razao_social, nome_fantasia, telefone, email_corretora, nome, email, password } =
    parsed.data

  const supabase = createAdminClient()

  try {
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

    // 2. Create auth user using the regular client (to trigger Supabase's confirmation email)
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { nome, corretora_id: corretora.id, role: 'admin', telefone },
      }
    })

    if (authError) {
      // Rollback corretora if user creation fails
      await supabase.from('corretoras').delete().eq('id', corretora.id)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 3. Update app_metadata securely using admin client
    if (authData.user) {
      await supabase.auth.admin.updateUserById(authData.user.id, {
        app_metadata: { corretora_id: corretora.id }
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Supabase fetch error:', err)
    if (err.message?.includes('fetch failed')) {
      return NextResponse.json({ error: 'Falha de conexão com o banco de dados. O projeto Supabase pode estar pausado ou offline.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Erro interno no servidor ao cadastrar.' }, { status: 500 })
  }
}
