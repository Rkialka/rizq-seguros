'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Loader2, Link2 } from 'lucide-react'
import { useTomadores, useSeguradoras, useModalidades } from '@/hooks/use-propostas'
import { useProposta } from '@/hooks/use-propostas'
import { useCreateApolice } from '@/hooks/use-apolices'

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

function NovaApoliceInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const propostaId = searchParams.get('proposta') ?? ''

  const { data: tomadores, isLoading: loadingT } = useTomadores()
  const { data: seguradoras, isLoading: loadingS } = useSeguradoras()
  const { data: modalidades, isLoading: loadingM } = useModalidades()
  const { data: proposta } = useProposta(propostaId)
  const createApolice = useCreateApolice()

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<any>({
    defaultValues: {},
  })

  // Pre-fill from proposta when loaded
  useEffect(() => {
    if (!proposta) return
    if ((proposta as any).tomador_id) setValue('tomador_id', (proposta as any).tomador_id)
    if ((proposta as any).seguradora_id) setValue('seguradora_id', (proposta as any).seguradora_id)
    if ((proposta as any).modalidade_id) setValue('modalidade_id', (proposta as any).modalidade_id)
    if (proposta.importancia_segurada) setValue('importancia_segurada', proposta.importancia_segurada)
    if (proposta.objeto) setValue('objeto', proposta.objeto)
    if (proposta.vigencia_inicio) setValue('vigencia_inicio', proposta.vigencia_inicio)
    if (proposta.vigencia_fim) setValue('vigencia_fim', proposta.vigencia_fim)
    if (proposta.premio) setValue('premio', proposta.premio)
    if (proposta.taxa) setValue('taxa', (proposta.taxa * 100).toFixed(4))
    // Link proposta
    setValue('proposta_id', propostaId)
  }, [proposta, propostaId, setValue])

  const onSubmit = async (data: any) => {
    try {
      const payload: Record<string, unknown> = {
        tomador_id: data.tomador_id || undefined,
        seguradora_id: data.seguradora_id || undefined,
        modalidade_id: data.modalidade_id || undefined,
        numero_apolice: data.numero_apolice,
        importancia_segurada: data.importancia_segurada ? Number(data.importancia_segurada) : undefined,
        premio: data.premio ? Number(data.premio) : undefined,
        taxa: data.taxa ? Number(data.taxa) / 100 : undefined,
        vigencia_inicio: data.vigencia_inicio || undefined,
        vigencia_fim: data.vigencia_fim || undefined,
        objeto: data.objeto || undefined,
        proposta_id: propostaId || undefined,
        status: 'vigente',
      }
      const result = await createApolice.mutateAsync(payload)
      router.push(`/apolices/${result.id}`)
    } catch {}
  }

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
          <div className="rz-eyebrow" style={{ marginBottom: 2 }}>Apólices</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, margin: 0, color: 'var(--rz-ink)', fontWeight: 400, lineHeight: 1.1 }}>
            Nova Apólice
          </h1>
        </div>
      </div>

      {/* Pre-fill banner */}
      {propostaId && proposta && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
          borderRadius: 6, marginBottom: 20,
          background: 'var(--rz-fog)', border: '1px dashed var(--rz-line)',
        }}>
          <Link2 size={13} style={{ color: 'var(--rz-text-3)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--rz-text-2)' }}>
            Originada da proposta{' '}
            <strong style={{ color: 'var(--rz-ink)', fontFamily: 'var(--font-mono, monospace)' }}>
              {(proposta as any).numero_proposta}
            </strong>
            {' '}— dados pré-preenchidos automaticamente.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Partes */}
        <div className="rz-card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="rz-eyebrow" style={{ marginBottom: 18 }}>Partes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FieldGroup label="Tomador (Cliente)">
              <RZSelect
                id="tomador_id"
                value={watch('tomador_id') ?? ''}
                onChange={e => setValue('tomador_id', e.target.value)}
                disabled={loadingT}
              >
                <option value="">{loadingT ? 'Carregando…' : 'Selecione um cliente…'}</option>
                {tomadores?.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.razao_social}</option>
                ))}
              </RZSelect>
            </FieldGroup>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FieldGroup label="Seguradora *" error={errors.seguradora_id?.message as string}>
                <RZSelect
                  id="seguradora_id"
                  value={watch('seguradora_id') ?? ''}
                  onChange={e => setValue('seguradora_id', e.target.value, { shouldValidate: true })}
                  disabled={loadingS}
                >
                  <option value="">{loadingS ? 'Carregando…' : 'Selecione…'}</option>
                  {seguradoras?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </RZSelect>
              </FieldGroup>

              <FieldGroup label="Modalidade *" error={errors.modalidade_id?.message as string}>
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
            </div>
          </div>
        </div>

        {/* Dados da apólice */}
        <div className="rz-card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="rz-eyebrow" style={{ marginBottom: 18 }}>Dados da apólice</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FieldGroup label="Número da apólice *" error={errors.numero_apolice?.message as string}>
              <RZInput
                placeholder="Ex: APL-1007500004459"
                {...register('numero_apolice', { required: 'Número obrigatório' })}
              />
            </FieldGroup>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <FieldGroup label="Importância Segurada (IS)">
                <RZInput
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...register('importancia_segurada', { valueAsNumber: true })}
                />
              </FieldGroup>
              <FieldGroup label="Prêmio">
                <RZInput
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...register('premio', { valueAsNumber: true })}
                />
              </FieldGroup>
              <FieldGroup label="Taxa (%)">
                <RZInput
                  type="number"
                  step="0.0001"
                  placeholder="0,00"
                  {...register('taxa')}
                />
              </FieldGroup>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FieldGroup label="Vigência início">
                <RZInput type="date" {...register('vigencia_inicio')} />
              </FieldGroup>
              <FieldGroup label="Vigência fim">
                <RZInput type="date" {...register('vigencia_fim')} />
              </FieldGroup>
            </div>

            <FieldGroup label="Objeto da garantia">
              <RZInput placeholder="Ex: Processo Trabalhista nº…" {...register('objeto')} />
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
            {isSubmitting ? 'Salvando…' : 'Criar Apólice'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NovaApoliciPage() {
  return (
    <Suspense>
      <NovaApoliceInner />
    </Suspense>
  )
}
