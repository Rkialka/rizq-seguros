'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { updatePasswordSchema, type UpdatePasswordFormData } from '@/lib/validators'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, KeyRound } from 'lucide-react'
import { toast } from 'sonner'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
  })

  async function onSubmit(data: UpdatePasswordFormData) {
    setLoading(true)
    const supabase = createClient()
    
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (error) {
      toast.error('Erro ao redefinir senha. O link pode ter expirado.')
      setLoading(false)
      return
    }

    toast.success('Senha atualizada com sucesso!')
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--rz-fog)', padding: 24 }}>
    <div style={{ width: '100%', maxWidth: 420 }}>
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
        <CardDescription>
          Digite sua nova senha abaixo
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repita a senha"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Atualizar Senha e Entrar'}
          </Button>
        </CardFooter>
      </form>
    </Card>
    </div>
    </div>
  )
}
