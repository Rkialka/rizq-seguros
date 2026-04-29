'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginFormData } from '@/lib/validators'
import { toast } from 'sonner'
import { Zap, ArrowRight, Plus } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [emailValue, setEmailValue] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const currentEmail = watch('email', '')

  async function onSubmit(data: LoginFormData) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast.error('Email ou senha inválidos')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleGoogleLogin() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error('Erro ao iniciar login com Google')
      setLoading(false)
    }
    // On success, browser redirects — no need to setLoading(false)
  }

  async function handleMagicLink() {
    if (!currentEmail) {
      toast.error('Digite seu email primeiro')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: currentEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      toast.error('Erro ao enviar link de acesso')
    } else {
      toast.success('Link de acesso enviado para seu email!')
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', minHeight: '100vh', background: 'var(--rz-paper)' }}>
      {/* Left panel — editorial */}
      <div style={{
        background: 'var(--rz-deep)',
        color: 'var(--rz-paper)',
        padding: 48,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Concentric circles decoration */}
        <svg width="440" height="440" viewBox="0 0 440 440" style={{ position: 'absolute', right: -130, bottom: -130, opacity: 0.07, pointerEvents: 'none' }}>
          {[200, 160, 120, 80, 40].map((r) => (
            <circle key={r} cx="220" cy="220" r={r} stroke="#c3d600" strokeWidth="0.5" fill="none" />
          ))}
        </svg>

        {/* Logo */}
        <div style={{ flexShrink: 0 }}>
          <Image
            src="/rizq-lockup-onDark.png"
            alt="RIZQ"
            width={120}
            height={44}
            style={{ height: 44, width: 'auto', objectFit: 'contain' }}
            priority
          />
        </div>

        {/* Hero copy */}
        <div>
          <div className="rz-eyebrow" style={{ color: 'var(--rz-lime)', marginBottom: 14 }}>
            Plataforma RIZQ · 2026
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 52,
            lineHeight: 1.06,
            margin: 0,
            color: 'var(--rz-paper)',
            fontWeight: 400,
            letterSpacing: '-0.015em',
            maxWidth: 480,
          }}>
            Garantias com a{' '}
            <em style={{ color: 'var(--rz-lime)', fontStyle: 'italic' }}>frieza</em>
            {' '}de uma seguradora, o calor de quem está com você.
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 24, maxWidth: 420, lineHeight: 1.6 }}>
            Backoffice técnico, operação automatizada e IA para corretores que querem vender ramos elementares mais rentáveis.
          </p>
        </div>

        {/* Social proof pills */}
        <div style={{ display: 'flex', gap: 28 }}>
          {[
            { num: 'R$ 1,2bi', label: 'em IS sob gestão' },
            { num: '247', label: 'corretoras ativas' },
            { num: '14', label: 'seguradoras integradas' },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--rz-lime)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {item.num}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
          <div className="rz-eyebrow" style={{ marginBottom: 8 }}>Acesso à plataforma</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, margin: 0, color: 'var(--rz-ink)', lineHeight: 1.1 }}>
            Bem-vindo de volta.
          </h2>
          <p style={{ fontSize: 13, color: 'var(--rz-text-2)', marginTop: 6, marginBottom: 32 }}>
            Entre com sua conta corporativa.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email field */}
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--rz-ink)', marginBottom: 6, letterSpacing: '0.01em' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="seu@corretora.com.br"
                {...register('email')}
                style={{
                  width: '100%',
                  height: 44,
                  padding: '0 14px',
                  fontSize: 14,
                  background: 'var(--rz-white)',
                  border: errors.email ? '1px solid var(--rz-danger)' : '1px solid var(--rz-line)',
                  borderRadius: 6,
                  color: 'var(--rz-ink)',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {errors.email && (
                <p style={{ fontSize: 11, color: 'var(--rz-danger)', marginTop: 4 }}>{errors.email.message}</p>
              )}
            </div>

            {/* Password field */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                <label htmlFor="password" style={{ fontSize: 12, fontWeight: 500, color: 'var(--rz-ink)', letterSpacing: '0.01em' }}>
                  Senha
                </label>
                <Link href="/forgot-password" style={{ fontSize: 11, color: 'var(--rz-pine)', textDecoration: 'none' }}>
                  Esqueci minha senha
                </Link>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••••"
                {...register('password')}
                style={{
                  width: '100%',
                  height: 44,
                  padding: '0 14px',
                  fontSize: 14,
                  background: 'var(--rz-white)',
                  border: errors.password ? '1px solid var(--rz-danger)' : '1px solid var(--rz-line)',
                  borderRadius: 6,
                  color: 'var(--rz-ink)',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {errors.password && (
                <p style={{ fontSize: 11, color: 'var(--rz-danger)', marginTop: 4 }}>{errors.password.message}</p>
              )}
            </div>

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 44,
                background: loading ? 'var(--rz-pine)' : 'var(--rz-deep)',
                color: 'var(--rz-paper)',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 200ms ease',
              }}
            >
              {loading ? 'Entrando…' : <>Entrar <ArrowRight size={16} /></>}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
              <span style={{ flex: 1, height: 1, background: 'var(--rz-line)' }} />
              <span style={{ fontSize: 10, color: 'var(--rz-text-3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>ou</span>
              <span style={{ flex: 1, height: 1, background: 'var(--rz-line)' }} />
            </div>

            {/* Google SSO */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              style={{
                width: '100%',
                height: 44,
                background: 'var(--rz-white)',
                color: 'var(--rz-ink)',
                border: '1px solid var(--rz-line)',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Entrar com Google
            </button>

            {/* Divider 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0' }}>
              <span style={{ flex: 1, height: 1, background: 'var(--rz-line)' }} />
              <span style={{ fontSize: 10, color: 'var(--rz-text-3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>ou</span>
              <span style={{ flex: 1, height: 1, background: 'var(--rz-line)' }} />
            </div>

            {/* Magic link */}
            <button
              type="button"
              disabled={loading}
              onClick={handleMagicLink}
              style={{
                width: '100%',
                height: 44,
                background: 'transparent',
                color: 'var(--rz-ink)',
                border: '1px solid var(--rz-line)',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'border-color 200ms ease',
              }}
            >
              <Zap size={16} style={{ color: 'var(--rz-lime)' }} />
              Receber link mágico por email
            </button>
          </form>

          {/* Signup card */}
          <div style={{
            marginTop: 32,
            padding: 16,
            background: 'var(--rz-fog)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--rz-text-2)',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}>
            <span style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'var(--rz-lime)',
              color: 'var(--rz-deep)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Plus size={14} strokeWidth={2.5} />
            </span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--rz-ink)', fontSize: 13, marginBottom: 2 }}>
                Sua corretora ainda não usa a RIZQ?
              </div>
              <Link href="/signup" style={{ color: 'var(--rz-pine)', textDecoration: 'none', fontSize: 12 }}>
                Cadastre-se em 2 minutos →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
