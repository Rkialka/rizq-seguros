'use client'

import { useState, useEffect } from 'react'
import { useCurrentUser, useCurrentCorretora, useUpdatePerfil, useUpdateCorretora, useSendPasswordReset } from '@/hooks/use-perfil'
import { formatCNPJ } from '@/lib/constants'
import { Mail, Phone, Building2, Shield, Bell, Lock, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

type Tab = 'perfil' | 'corretora' | 'notificacoes'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  corretor: 'Corretor',
  operacional: 'Operacional',
}

const NOTIF_ITEMS = [
  { id: 'sla_risco',    label: 'Alertas de SLA em risco',       sub: 'Quando uma proposta está perto do prazo limite' },
  { id: 'apolice_venc', label: 'Vencimento de apólices',         sub: 'Aviso 30 e 7 dias antes do vencimento' },
  { id: 'nova_proposta',label: 'Nova proposta criada',           sub: 'Cada vez que uma proposta é criada na corretora' },
  { id: 'comentario',   label: 'Comentários em propostas',       sub: 'Quando alguém menciona ou responde você' },
  { id: 'status_alter', label: 'Mudança de status',              sub: 'Quando uma proposta avança de etapa' },
]

function FieldRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--rz-line-2)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--rz-ink)' }}>{label}</div>
        {value && <div style={{ fontSize: 11, color: 'var(--rz-text-3)', marginTop: 2 }}>{value}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function RZInput({ value, onChange, placeholder, disabled, type = 'text' }: {
  value: string; onChange?: (v: string) => void; placeholder?: string; disabled?: boolean; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%', height: 40, padding: '0 12px', fontSize: 13,
        background: disabled ? 'var(--rz-fog)' : 'var(--rz-white)',
        border: '1px solid var(--rz-line)', borderRadius: 6,
        color: disabled ? 'var(--rz-text-2)' : 'var(--rz-ink)',
        fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
        cursor: disabled ? 'not-allowed' : 'text',
      }}
    />
  )
}

function SaveButton({ onClick, loading, disabled }: { onClick: () => void; loading?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        height: 38, padding: '0 20px', fontSize: 13, fontWeight: 500,
        background: loading || disabled ? 'var(--rz-pine)' : 'var(--rz-deep)',
        color: 'var(--rz-paper)', border: 'none', borderRadius: 6,
        fontFamily: 'inherit', cursor: loading || disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? 'Salvando…' : 'Salvar alterações'}
    </button>
  )
}

function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: 999,
      background: 'var(--rz-lime)', color: 'var(--rz-deep)',
      fontSize: Math.round(size * 0.36), fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </span>
  )
}

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<Tab>('perfil')
  const { data: usuario, isLoading: loadU } = useCurrentUser()
  const { data: corretora, isLoading: loadC } = useCurrentCorretora()
  const updatePerfil = useUpdatePerfil()
  const updateCorretora = useUpdateCorretora()
  const sendReset = useSendPasswordReset()

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [emailCorretora, setEmailCorretora] = useState('')
  const [telefoneCorretora, setTelefoneCorretora] = useState('')
  const [susep, setSusep] = useState('')
  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    sla_risco: true, apolice_venc: true, nova_proposta: false,
    comentario: true, status_alter: false,
  })

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome ?? '')
      setTelefone(usuario.telefone ?? '')
    }
  }, [usuario])

  useEffect(() => {
    if (corretora) {
      setNomeFantasia(corretora.nome_fantasia ?? '')
      setEmailCorretora(corretora.email ?? '')
      setTelefoneCorretora(corretora.telefone ?? '')
      setSusep(corretora.susep ?? '')
    }
  }, [corretora])

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'perfil',        label: 'Meu Perfil',    icon: Shield },
    { id: 'corretora',     label: 'Corretora',     icon: Building2 },
    { id: 'notificacoes',  label: 'Notificações',  icon: Bell },
  ]

  return (
    <div style={{ padding: '28px 32px', maxWidth: 820, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div className="rz-eyebrow" style={{ marginBottom: 6 }}>Conta</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 30, margin: 0, color: 'var(--rz-ink)', fontWeight: 400, lineHeight: 1.1 }}>
          Configurações
        </h1>
      </div>

      {/* Tab strip */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--rz-line)', paddingBottom: 0 }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', background: 'none', border: 'none',
                borderBottom: active ? '2px solid var(--rz-deep)' : '2px solid transparent',
                marginBottom: -1,
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? 'var(--rz-ink)' : 'var(--rz-text-2)',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'color 120ms ease',
              }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── PERFIL TAB ── */}
      {tab === 'perfil' && (
        <div className="rz-card" style={{ padding: 28 }}>
          {loadU ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[200, 140, 120].map(w => (
                <div key={w} className="rz-skeleton" style={{ height: 40, width: w, borderRadius: 6 }} />
              ))}
            </div>
          ) : (
            <>
              {/* Avatar + name hero */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28 }}>
                <Avatar name={nome || usuario?.nome || 'U'} size={60} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--rz-ink)' }}>{usuario?.nome}</div>
                  <div style={{ fontSize: 12, color: 'var(--rz-text-2)', marginTop: 3 }}>
                    {ROLE_LABELS[usuario?.role ?? ''] ?? usuario?.role}
                    {corretora && <span> · {corretora.razao_social}</span>}
                  </div>
                </div>
              </div>

              <FieldRow label="Nome completo">
                <RZInput value={nome} onChange={setNome} placeholder="Seu nome completo" />
              </FieldRow>

              <FieldRow label="Email" value="Usado para login, não pode ser alterado aqui">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={14} style={{ color: 'var(--rz-text-3)', flexShrink: 0 }} />
                  <RZInput value={usuario?.email ?? ''} disabled />
                </div>
              </FieldRow>

              <FieldRow label="Telefone">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={14} style={{ color: 'var(--rz-text-3)', flexShrink: 0 }} />
                  <RZInput value={telefone} onChange={setTelefone} placeholder="(11) 99999-0000" />
                </div>
              </FieldRow>

              <FieldRow label="Função na corretora">
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  height: 28, padding: '0 12px', borderRadius: 999,
                  background: 'var(--rz-fog)', border: '1px solid var(--rz-line)',
                  fontSize: 12, fontWeight: 500, color: 'var(--rz-text-2)',
                }}>
                  {ROLE_LABELS[usuario?.role ?? ''] ?? '—'}
                </span>
              </FieldRow>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => usuario?.email && sendReset.mutate(usuario.email)}
                  disabled={sendReset.isPending}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12, color: 'var(--rz-pine)', background: 'none',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                  }}
                >
                  <Lock size={13} />
                  {sendReset.isPending ? 'Enviando…' : 'Alterar senha por email →'}
                </button>
                <SaveButton
                  onClick={() => usuario && updatePerfil.mutate({ id: usuario.id, nome, telefone })}
                  loading={updatePerfil.isPending}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── CORRETORA TAB ── */}
      {tab === 'corretora' && (
        <div className="rz-card" style={{ padding: 28 }}>
          {loadC ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[240, 160, 200, 140].map(w => (
                <div key={w} className="rz-skeleton" style={{ height: 40, width: w, borderRadius: 6 }} />
              ))}
            </div>
          ) : (
            <>
              <FieldRow label="Razão Social" value="Não editável — altere via suporte">
                <RZInput value={corretora?.razao_social ?? ''} disabled />
              </FieldRow>

              <FieldRow label="CNPJ" value="Não editável">
                <RZInput value={corretora?.cnpj ? formatCNPJ(corretora.cnpj) : ''} disabled />
              </FieldRow>

              <FieldRow label="Nome Fantasia">
                <RZInput value={nomeFantasia} onChange={setNomeFantasia} placeholder="Nome comercial (opcional)" />
              </FieldRow>

              <FieldRow label="SUSEP" value="Número de registro na SUSEP">
                <RZInput value={susep} onChange={setSusep} placeholder="Ex: 10.207639" />
              </FieldRow>

              <FieldRow label="Email corporativo">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={14} style={{ color: 'var(--rz-text-3)', flexShrink: 0 }} />
                  <RZInput value={emailCorretora} onChange={setEmailCorretora} type="email" placeholder="contato@corretora.com.br" />
                </div>
              </FieldRow>

              <FieldRow label="Telefone">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={14} style={{ color: 'var(--rz-text-3)', flexShrink: 0 }} />
                  <RZInput value={telefoneCorretora} onChange={setTelefoneCorretora} placeholder="(11) 3000-0000" />
                </div>
              </FieldRow>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <SaveButton
                  onClick={() => corretora && updateCorretora.mutate({
                    id: corretora.id,
                    updates: { nome_fantasia: nomeFantasia, email: emailCorretora, telefone: telefoneCorretora, susep },
                  })}
                  loading={updateCorretora.isPending}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── NOTIFICAÇÕES TAB ── */}
      {tab === 'notificacoes' && (
        <div className="rz-card" style={{ padding: 28 }}>
          <div style={{ marginBottom: 20 }}>
            <div className="rz-eyebrow" style={{ marginBottom: 4 }}>Preferências de alerta</div>
            <p style={{ fontSize: 13, color: 'var(--rz-text-2)', margin: 0 }}>
              Escolha quais eventos geram notificações por email e no sistema.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {NOTIF_ITEMS.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 0',
                  borderBottom: i < NOTIF_ITEMS.length - 1 ? '1px solid var(--rz-line-2)' : 'none',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--rz-ink)' }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--rz-text-3)', marginTop: 2 }}>{item.sub}</div>
                </div>
                <button
                  onClick={() => setNotifs(p => ({ ...p, [item.id]: !p[item.id] }))}
                  style={{
                    width: 44, height: 24, borderRadius: 999, border: 'none',
                    background: notifs[item.id] ? 'var(--rz-moss)' : 'var(--rz-line)',
                    cursor: 'pointer', position: 'relative', flexShrink: 0,
                    transition: 'background 180ms ease',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 3,
                    left: notifs[item.id] ? 'calc(100% - 21px)' : 3,
                    width: 18, height: 18, borderRadius: 999,
                    background: 'white',
                    transition: 'left 180ms ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => toast.success('Preferências salvas!')}
              style={{
                height: 38, padding: '0 20px', fontSize: 13, fontWeight: 500,
                background: 'var(--rz-deep)', color: 'var(--rz-paper)',
                border: 'none', borderRadius: 6, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              Salvar preferências
            </button>
          </div>
        </div>
      )}

      {/* Documentos quick link */}
      <a
        href="/configuracoes/documentos"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 16, padding: '14px 20px',
          background: 'var(--rz-white)', border: '1px solid var(--rz-line)',
          borderRadius: 6, textDecoration: 'none', color: 'var(--rz-ink)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 6, background: 'var(--rz-fog)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={16} style={{ color: 'var(--rz-text-2)' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Ficha de Cadastro</div>
            <div style={{ fontSize: 11, color: 'var(--rz-text-3)', marginTop: 1 }}>
              Documentos de homologação da corretora na RIZQ
            </div>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--rz-text-3)' }} />
      </a>
    </div>
  )
}
