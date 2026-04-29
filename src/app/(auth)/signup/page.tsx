'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupFormData } from '@/lib/validators'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Shield, Loader2, ArrowRight, Building2, User, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

type Step = 'cnpj' | 'details'

interface ReceitaData {
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

function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('cnpj')
  const [cnpjLoading, setCnpjLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [situacao, setSituacao] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const cnpjValue = watch('cnpj') ?? ''

  async function consultarCNPJ() {
    const cnpj = getValues('cnpj')
    const digits = cnpj?.replace(/\D/g, '') ?? ''
    if (digits.length !== 14) {
      toast.error('Digite um CNPJ completo')
      return
    }

    setCnpjLoading(true)
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
      if (!res.ok) {
        toast.error('CNPJ não encontrado na Receita Federal')
        return
      }
      const data: ReceitaData = await res.json()

      setSituacao(data.descricao_situacao_cadastral)
      setValue('razao_social', data.razao_social, { shouldValidate: true })
      setValue('nome_fantasia', data.nome_fantasia || '')
      setValue('telefone', data.ddd_telefone_1 || '')
      setValue('email_corretora', data.email?.toLowerCase() || '')

      setStep('details')
    } catch {
      toast.error('Erro ao consultar Receita Federal. Tente novamente.')
    } finally {
      setCnpjLoading(false)
    }
  }

  async function onSubmit(data: SignupFormData) {
    setSubmitLoading(true)

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const contentType = res.headers.get('content-type') ?? ''
      const json = contentType.includes('application/json')
        ? ((await res.json()) as { error?: string })
        : null

      if (!res.ok) {
        toast.error(json?.error ?? 'Erro ao criar conta')
        setSubmitLoading(false)
        return
      }

      toast.success('Conta criada! Verifique seu email para confirmar.')
      router.push('/login')
    } catch {
      toast.error('Erro ao criar conta')
      setSubmitLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--rz-fog)', padding: 24 }}>
    <div style={{ width: '100%', maxWidth: 460 }}>
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Shield className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Cadastrar Corretora</CardTitle>
        <CardDescription>
          {step === 'cnpj'
            ? 'Digite o CNPJ da sua corretora para começar'
            : 'Confirme os dados e crie sua conta'}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5">

          {/* Step 1 — CNPJ */}
          {step === 'cnpj' && (
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ da Corretora</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                autoFocus
                value={cnpjValue}
                {...register('cnpj')}
                onChange={(e) => setValue('cnpj', formatCNPJ(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), consultarCNPJ())}
              />
              {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj.message}</p>}
            </div>
          )}

          {/* Step 2 — Dados da corretora + usuário */}
          {step === 'details' && (
            <>
              {/* Situação cadastral */}
              {situacao && situacao !== 'ATIVA' && (
                <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Situação cadastral: <strong>{situacao}</strong>
                </div>
              )}
              {situacao === 'ATIVA' && (
                <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Empresa ativa na Receita Federal
                </div>
              )}

              {/* CNPJ readonly */}
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">CNPJ</Label>
                <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  <span>{getValues('cnpj')}</span>
                  <button
                    type="button"
                    onClick={() => setStep('cnpj')}
                    className="text-xs text-primary underline"
                  >
                    alterar
                  </button>
                </div>
              </div>

              {/* Dados da corretora */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" /> Dados da Corretora
                </div>
                <Separator />
              </div>

              <div className="space-y-2">
                <Label htmlFor="razao_social">Razão Social</Label>
                <Input id="razao_social" {...register('razao_social')} />
                {errors.razao_social && <p className="text-sm text-destructive">{errors.razao_social.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome_fantasia">Nome Fantasia <span className="text-muted-foreground">(opcional)</span></Label>
                <Input id="nome_fantasia" {...register('nome_fantasia')} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" placeholder="(11) 99999-0000" {...register('telefone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_corretora">Email da empresa</Label>
                  <Input id="email_corretora" type="email" {...register('email_corretora')} />
                </div>
              </div>

              {/* Dados do usuário */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <User className="h-3.5 w-3.5" /> Seu Acesso
                </div>
                <Separator />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Seu Nome</Label>
                <Input id="nome" placeholder="Nome completo" autoFocus {...register('nome')} />
                {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Seu Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="Mínimo 6 caracteres" {...register('password')} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {step === 'cnpj' ? (
            <Button
              type="button"
              className="w-full"
              onClick={consultarCNPJ}
              disabled={cnpjLoading}
            >
              {cnpjLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Consultando Receita Federal...</>
              ) : (
                <><ArrowRight className="mr-2 h-4 w-4" /> Continuar</>
              )}
            </Button>
          ) : (
            <Button type="submit" className="w-full" disabled={submitLoading}>
              {submitLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando conta...</>
              ) : (
                'Criar Conta'
              )}
            </Button>
          )}

          <p className="text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary underline">
              Entrar
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
    </div>
    </div>
  )
}
