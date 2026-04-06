'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { signupSchema, type SignupFormData } from '@/lib/validators'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface BrasilAPIResponse {
  razao_social: string
  nome_fantasia: string
  email: string
  ddd_telefone_1: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  municipio: string
  uf: string
  cep: string
  descricao_situacao_cadastral: string
}

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cnpjLoading, setCnpjLoading] = useState(false)
  const [cnpjOk, setCnpjOk] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  async function buscarCNPJ() {
    const cnpj = getValues('cnpj')
    const digits = cnpj.replace(/\D/g, '')
    if (digits.length !== 14) return

    setCnpjLoading(true)
    setCnpjOk(false)

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
      if (!res.ok) {
        toast.error('CNPJ não encontrado na Receita Federal')
        return
      }
      const data: BrasilAPIResponse = await res.json()

      if (data.descricao_situacao_cadastral !== 'ATIVA') {
        toast.warning(`Situação cadastral: ${data.descricao_situacao_cadastral}`)
      }

      setValue('razao_social', data.razao_social, { shouldValidate: true })

      const endereco = [
        data.logradouro,
        data.numero,
        data.complemento,
        data.bairro,
        `${data.municipio}/${data.uf}`,
        data.cep,
      ]
        .filter(Boolean)
        .join(', ')

      setCnpjOk(true)
      toast.success(`${data.razao_social} encontrada na Receita Federal`)
    } catch {
      toast.error('Erro ao consultar Receita Federal')
    } finally {
      setCnpjLoading(false)
    }
  }

  async function onSubmit(data: SignupFormData) {
    setLoading(true)
    const supabase = createClient()

    const { data: corretora, error: corrError } = await supabase
      .from('corretoras')
      .insert({
        razao_social: data.razao_social,
        cnpj: data.cnpj,
      })
      .select('id')
      .single()

    if (corrError) {
      toast.error(corrError.message.includes('unique')
        ? 'CNPJ já cadastrado'
        : 'Erro ao criar corretora')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nome: data.nome,
          corretora_id: corretora.id,
          role: 'admin',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      toast.error('Erro ao criar conta: ' + authError.message)
      setLoading(false)
      return
    }

    toast.success('Conta criada! Verifique seu email para confirmar.')
    router.push('/login')
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Shield className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Cadastrar Corretora</CardTitle>
        <CardDescription>Crie sua conta na plataforma RIZQ</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <div className="flex gap-2">
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                className="flex-1"
                {...register('cnpj')}
                onBlur={buscarCNPJ}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={buscarCNPJ}
                disabled={cnpjLoading}
                title="Consultar Receita Federal"
              >
                {cnpjLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : cnpjOk ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <span className="text-xs font-medium">RF</span>
                )}
              </Button>
            </div>
            {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="razao_social">Razão Social</Label>
            <Input
              id="razao_social"
              placeholder="Preenchido automaticamente pelo CNPJ"
              {...register('razao_social')}
            />
            {errors.razao_social && <p className="text-sm text-destructive">{errors.razao_social.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Seu Nome</Label>
            <Input id="nome" placeholder="Nome completo" {...register('nome')} />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="Mínimo 6 caracteres" {...register('password')} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando...' : 'Criar Conta'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary underline">
              Entrar
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
