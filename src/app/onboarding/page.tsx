'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ArrowRight, Building2, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface OnboardingForm {
  razao_social: string
  cnpj: string
  telefone?: string
}

function formatCNPJ(v: string) {
  return v
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18)
}

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cnpjDisplay, setCnpjDisplay] = useState('')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<OnboardingForm>()

  const onSubmit = async (data: OnboardingForm) => {
    setLoading(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao salvar')
        setLoading(false)
        return
      }
      // Refresh session so middleware picks up new app_metadata
      const supabase = createClient()
      await supabase.auth.refreshSession()
      toast.success('Corretora cadastrada!')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Erro de conexão')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--rz-paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <Image
            src="/rizq-lockup-onLight.png"
            alt="RIZQ"
            width={100}
            height={36}
            style={{ height: 36, width: 'auto', objectFit: 'contain' }}
            priority
          />
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div className="rz-eyebrow" style={{ marginBottom: 8, textAlign: 'center' }}>Último passo</div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 34,
            fontWeight: 400,
            color: 'var(--rz-ink)',
            margin: 0,
            lineHeight: 1.1,
            textAlign: 'center',
          }}>
            Dados da sua corretora
          </h1>
          <p style={{ fontSize: 13, color: 'var(--rz-text-2)', marginTop: 10, textAlign: 'center', lineHeight: 1.6 }}>
            Precisamos de algumas informações para configurar seu espaço na plataforma.
          </p>
        </div>

        {/* Form card */}
        <div className="rz-card" style={{ padding: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--rz-deep)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
          }}>
            <Building2 size={18} style={{ color: 'var(--rz-lime)' }} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Razão Social */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--rz-ink)', marginBottom: 6 }}>
                Razão Social *
              </label>
              <input
                placeholder="Ex: Corretora Silva Ltda"
                {...register('razao_social', { required: 'Obrigatório' })}
                style={{
                  width: '100%', height: 44, padding: '0 14px', fontSize: 14,
                  background: 'var(--rz-white)',
                  border: errors.razao_social ? '1px solid var(--rz-danger)' : '1px solid var(--rz-line)',
                  borderRadius: 6, color: 'var(--rz-ink)', fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              {errors.razao_social && (
                <p style={{ fontSize: 11, color: 'var(--rz-danger)', marginTop: 4 }}>{errors.razao_social.message}</p>
              )}
            </div>

            {/* CNPJ */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--rz-ink)', marginBottom: 6 }}>
                CNPJ *
              </label>
              <input
                placeholder="00.000.000/0000-00"
                value={cnpjDisplay}
                onChange={(e) => {
                  const formatted = formatCNPJ(e.target.value)
                  setCnpjDisplay(formatted)
                  setValue('cnpj', formatted, { shouldValidate: true })
                }}
                style={{
                  width: '100%', height: 44, padding: '0 14px', fontSize: 14,
                  background: 'var(--rz-white)',
                  border: errors.cnpj ? '1px solid var(--rz-danger)' : '1px solid var(--rz-line)',
                  borderRadius: 6, color: 'var(--rz-ink)', fontFamily: 'var(--font-mono, monospace)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <input type="hidden" {...register('cnpj', { required: 'Obrigatório', minLength: { value: 14, message: 'CNPJ inválido' } })} />
              {errors.cnpj && (
                <p style={{ fontSize: 11, color: 'var(--rz-danger)', marginTop: 4 }}>{errors.cnpj.message}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--rz-ink)', marginBottom: 6 }}>
                Telefone <span style={{ color: 'var(--rz-text-3)', fontWeight: 400 }}>(opcional)</span>
              </label>
              <input
                placeholder="(11) 99999-9999"
                {...register('telefone')}
                style={{
                  width: '100%', height: 44, padding: '0 14px', fontSize: 14,
                  background: 'var(--rz-white)', border: '1px solid var(--rz-line)',
                  borderRadius: 6, color: 'var(--rz-ink)', fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: 46, marginTop: 4,
                background: loading ? 'var(--rz-pine)' : 'var(--rz-deep)',
                color: 'var(--rz-paper)', border: 'none', borderRadius: 6,
                fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Salvando…</>
                : <>Acessar plataforma <ArrowRight size={15} /></>
              }
            </button>
          </form>
        </div>

        <p style={{ fontSize: 11, color: 'var(--rz-text-3)', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
          Esses dados são usados exclusivamente para configurar seu espaço na RIZQ.<br />
          Você pode atualizá-los depois em Configurações.
        </p>
      </div>
    </div>
  )
}
