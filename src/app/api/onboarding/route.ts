import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const onboardingSchema = z.object({
  razao_social: z.string().min(2, 'Razão social obrigatória'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  telefone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  // Authenticate the calling user
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Already has a corretora — nothing to do
  if (user.app_metadata?.corretora_id) {
    return NextResponse.json({ corretora_id: user.app_metadata.corretora_id })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const parsed = onboardingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { razao_social, cnpj, telefone } = parsed.data
  const admin = createAdminClient()

  try {
    // 1. Create corretora
    const { data: corretora, error: corrError } = await admin
      .from('corretoras')
      .insert({
        razao_social,
        cnpj: cnpj.replace(/\D/g, ''),
        telefone: telefone || null,
        email: user.email || null,
      })
      .select('id')
      .single()

    if (corrError) {
      const msg = corrError.message.includes('unique')
        ? 'CNPJ já cadastrado — entre em contato com o suporte'
        : corrError.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // 2. Patch user app_metadata with corretora_id + nome from Google profile
    const nome = user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { corretora_id: corretora.id },
      user_metadata: { nome },
    })

    // 3. Create the usuario record in the public schema
    await admin.from('usuarios').upsert({
      id: user.id,
      email: user.email,
      nome,
      corretora_id: corretora.id,
      role: 'admin',
    })

    return NextResponse.json({ corretora_id: corretora.id })
  } catch (err: any) {
    console.error('Onboarding error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
