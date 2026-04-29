'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validators'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordFormData) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })

    if (error) {
      toast.error('Erro ao solicitar recuperação. Tente novamente.')
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--rz-fog)', padding: 24 }}>
    <div style={{ width: '100%', maxWidth: 420 }}>
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Shield className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
        <CardDescription>
          Enviaremos um link para você redefinir sua senha
        </CardDescription>
      </CardHeader>

      {submitted ? (
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Se o e-mail estiver cadastrado, você receberá um link de recuperação em alguns minutos.
          </p>
          <Button variant="outline" className="w-full mt-4" onClick={() => router.push('/login')}>
            Voltar para o Login
          </Button>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => router.push('/login')}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
    </div>
    </div>
  )
}
