'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Plus, Loader2, X, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { novaPropostaSchema, type NovaPropostaFormData, novoTomadorSchema, type NovoTomadorFormData } from '@/lib/validators'
import { useTomadores, useSeguradoras, useModalidades, useCreateProposta, useCreateTomador } from '@/hooks/use-propostas'
import { useApolice } from '@/hooks/use-apolices'

function RZInput({ id, type = 'text', placeholder, disabled, step, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      step={step}
      {...rest}
      style={{
        width: '100%', height: 42, padding: '0 12px', fontSize: 13,
        background: disabled ? 'var(--rz-fog)' : 'var(--rz-white)',
        border: '1px solid var(--rz-line)', borderRadius: 6,
        color: 'var(--rz-ink)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
      }}
    />
  )
}

function RZSelect({ id, children, onChange, value, disabled }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      id={id}
      onChange={onChange}
      value={value}
      disabled={disabled}
      style={{
        width: '100%', height: 42, padding: '0 12px', fontSize: 13,
        background: 'var(--rz-white)', border: '1px solid var(--rz-line)', borderRadius: 6,
        color: 'var(--rz-ink)', fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a9690' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
      }}
    >
      {children}
    </select>
  )
}

function FieldGroup({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--rz-ink)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ fontSize: 11, color: 'var(--rz-danger)', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

function NovaPropostaInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const renewId = searchParams.get('renew') ?? ''

  const { data: tomadores, isLoading: loadingT } = useTomadores()
  const { data: seguradoras, isLoading: loadingS } = useSeguradoras()
  const { data: modalidades, isLoading: loadingM } = useModalidades()
  const { data: renewApolice } = useApolice(renewId)
  const createProposta = useCreateProposta()
  const createTomador = useCreateTomador()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(novaPropostaSchema),
    defaultValues: { prioridade: 'media', sla_dias: 5 },
  })

  // Pre-fill from apolice when renewing
  useEffect(() => {
    if (!renewApolice) return
    if ((renewApolice as any).tomador_id) setValue('tomador_id', (renewApolice as any).tomador_id)
    if ((renewApolice as any).seguradora_id) setValue('seguradora_id', (renewApolice as any).seguradora_id)
    if ((renewApolice as any).modalidade_id) setValue('modalidade_id', (renewApolice as any).modalidade_id)
    if (renewApolice.importancia_segurada) setValue('importancia_segurada', renewApolice.importancia_segurada)
    if (renewApolice.objeto) setValue('objeto', renewApolice.objeto)
  }, [renewApolice, setValue])

  const { register: regT, handleSubmit: handleT, reset: resetT, formState: { errors: errT, isSubmitting: subT } } = useForm<NovoTomadorFormData>({
    resolver: zodResolver(novoTomadorSchema),
  })

  const onSubmitTomador = async (data: NovoTomadorFormData) => {
    try {
      const novo = await createTomador.mutateAsync(data)
      setValue('tomador_id', novo.id, { shouldValidate: true })
      setDialogOpen(false)
      resetT()
    } catch {}
  }

  const onSubmit = async (data: NovaPropostaFormData) => {
    try {
      await createProposta.mutateAsync(data)
      router.push('/propostas')
    } catch {}
  }

  const tomadorId = watch('tomador_id')

  return (
    <div style={{ padding: '28px 32px', maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6, border: '1px solid var(--rz-line)', background: 'var(--rz-white)',
            color: 'var(--rz-ink)', cursor: 'pointer',
          }}
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <div className="rz-eyebrow" style={{ marginBottom: 2 }}>Propostas</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, margin: 0, color: 'var(--rz-ink)', fontWeight: 400, lineHeight: 1.1 }}>
            Nova Proposta
          </h1>
        </div>
      </div>

      {/* Renewal banner */}
      {renewId && renewApolice && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
          borderRadius: 6, marginBottom: 20,
          background: 'var(--rz-fog)', border: '1px dashed var(--rz-line)',
        }}>
          <RefreshCw size={13} style={{ color: 'var(--rz-text-3)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--rz-text-2)' }}>
            Renovação de{' '}
            <strong style={{ color: 'var(--rz-ink)', fontFamily: 'var(--font-mono, monospace)' }}>
              {renewApolice.numero_apolice}
            </strong>
            {' '}— dados pré-preenchidos automaticamente.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Dados principais */}
        <div className="rz-card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="rz-eyebrow" style={{ marginBottom: 18 }}>Dados principais</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Tomador */}
            <FieldGroup label="Tomador (Cliente)" error={errors.tomador_id?.message as string}>
              <div style={{ display: 'flex', gap: 8 }}>
                <RZSelect
                  id="tomador_id"
                  value={tomadorId ?? ''}
                  onChange={e => setValue('tomador_id', e.target.value, { shouldValidate: true })}
                  disabled={loadingT}
                >
                  <option value="">{loadingT ? 'Carregando…' : 'Selecione um cliente…'}</option>
                  {tomadores?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.razao_social}</option>
                  ))}
                </RZSelect>
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  style={{
                    height: 42, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6,
                    border: '1px solid var(--rz-line)', borderRadius: 6,
                    background: 'var(--rz-white)', color: 'var(--rz-ink)',
                    fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <Plus size={13} /> Novo
                </button>
              </div>
            </FieldGroup>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FieldGroup label="Modalidade" error={errors.modalidade_id?.message as string}>
                <RZSelect
                  id="modalidade_id"
                  value={watch('modalidade_id') ?? ''}
                  onChange={e => setValue('modalidade_id', e.target.value, { shouldValidate: true })}
                  disabled={loadingM}
                >
                  <option value="">{loadingM ? 'Carregando…' : 'Selecione…'}</option>
                  {modalidades?.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </RZSelect>
              </FieldGroup>

              <FieldGroup label="Seguradora (opcional)">
                <RZSelect
                  id="seguradora_id"
                  value={watch('seguradora_id') ?? ''}
                  onChange={e => setValue('seguradora_id', e.target.value)}
                  disabled={loadingS}
                >
                  <option value="">{loadingS ? 'Carregando…' : 'Qualquer'}</option>
                  {seguradoras?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </RZSelect>
              </FieldGroup>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FieldGroup label="Importância Segurada (IS)" error={errors.importancia_segurada?.message as string}>
                <RZInput
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...register('importancia_segurada', { valueAsNumber: true })}
                />
              </FieldGroup>
              <FieldGroup label="Objeto da Garantia">
                <RZInput placeholder="Ex: Processo Trabalhista nº…" {...register('objeto')} />
              </FieldGroup>
            </div>
          </div>
        </div>

        {/* Configurações */}
        <div className="rz-card" style={{ padding: 24, marginBottom: 24 }}>
          <div className="rz-eyebrow" style={{ marginBottom: 18 }}>Configurações da proposta</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FieldGroup label="Prioridade">
              <RZSelect
                id="prioridade"
                value={watch('prioridade') ?? 'media'}
                onChange={e => setValue('prioridade', e.target.value)}
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </RZSelect>
            </FieldGroup>
            <FieldGroup label="SLA (dias úteis)">
              <RZInput type="number" min={1} max={30} {...register('sla_dias', { valueAsNumber: true })} />
            </FieldGroup>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              height: 42, padding: '0 20px', fontSize: 13, fontWeight: 500,
              background: 'var(--rz-white)', color: 'var(--rz-ink)',
              border: '1px solid var(--rz-line)', borderRadius: 6,
              fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              height: 42, padding: '0 24px', fontSize: 13, fontWeight: 500,
              background: isSubmitting ? 'var(--rz-pine)' : 'var(--rz-deep)',
              color: 'var(--rz-paper)', border: 'none', borderRadius: 6,
              fontFamily: 'inherit', cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isSubmitting ? 'Salvando…' : 'Criar Proposta'}
          </button>
        </div>
      </form>

      {/* Modal — Novo Tomador */}
      {dialogOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(3,26,19,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div className="rz-card" style={{ width: 440, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rz-ink)' }}>Novo Tomador</div>
                <div style={{ fontSize: 12, color: 'var(--rz-text-2)', marginTop: 2 }}>Cadastre rapidamente para vincular à proposta</div>
              </div>
              <button
                onClick={() => setDialogOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rz-text-3)', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FieldGroup label="CNPJ" error={errT.cnpj?.message}>
                <RZInput placeholder="00.000.000/0000-00" {...regT('cnpj')} />
              </FieldGroup>
              <FieldGroup label="Razão Social" error={errT.razao_social?.message}>
                <RZInput {...regT('razao_social')} />
              </FieldGroup>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                style={{
                  height: 38, padding: '0 16px', fontSize: 13, fontWeight: 500,
                  background: 'var(--rz-white)', color: 'var(--rz-ink)',
                  border: '1px solid var(--rz-line)', borderRadius: 6,
                  fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleT(onSubmitTomador)}
                disabled={subT}
                style={{
                  height: 38, padding: '0 18px', fontSize: 13, fontWeight: 500,
                  background: subT ? 'var(--rz-pine)' : 'var(--rz-deep)',
                  color: 'var(--rz-paper)', border: 'none', borderRadius: 6,
                  fontFamily: 'inherit', cursor: subT ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {subT && <Loader2 size={13} className="animate-spin" />}
                {subT ? 'Salvando…' : 'Salvar Tomador'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NovaPropostaPage() {
  return (
    <Suspense>
      <NovaPropostaInner />
    </Suspense>
  )
}
