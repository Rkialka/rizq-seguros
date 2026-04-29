'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTomadores } from '@/hooks/use-propostas'
import { Search, ChevronRight, Building2 } from 'lucide-react'

export default function TomadoresPage() {
  const router = useRouter()
  const { data: tomadores, isLoading } = useTomadores()
  const [search, setSearch] = useState('')

  const filtered = (tomadores ?? []).filter((t: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.razao_social?.toLowerCase().includes(q) ||
      t.cnpj?.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
      t.email?.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div className="rz-eyebrow" style={{ marginBottom: 4 }}>Cadastro</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, margin: 0, color: 'var(--rz-ink)', fontWeight: 400 }}>
          Tomadores
        </h1>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px',
        background: 'var(--rz-white)', border: '1px solid var(--rz-line)', borderRadius: 6,
        maxWidth: 400, marginBottom: 20,
      }}>
        <Search size={13} style={{ color: 'var(--rz-text-2)', flexShrink: 0 }} />
        <input
          placeholder="Buscar por razão social, CNPJ ou email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            border: 'none', outline: 'none', flex: 1, fontSize: 13,
            fontFamily: 'inherit', background: 'transparent', color: 'var(--rz-ink)',
          }}
        />
      </div>

      {/* Table */}
      <div className="rz-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--rz-fog)', borderBottom: '1px solid var(--rz-line)' }}>
                {['Razão Social', 'CNPJ', 'Email', 'Telefone', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontSize: 10, fontWeight: 600, color: 'var(--rz-text-2)',
                    textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--rz-line-2)' }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} style={{ padding: '12px 14px' }}>
                        <div className="rz-skeleton" style={{ height: 12, borderRadius: 4, width: j === 0 ? 160 : j === 1 ? 120 : 100 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <Building2 size={28} style={{ color: 'var(--rz-text-3)' }} />
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--rz-ink)' }}>
                        {search ? 'Nenhum tomador encontrado' : 'Nenhum tomador cadastrado'}
                      </div>
                      {!search && (
                        <div style={{ fontSize: 12, color: 'var(--rz-text-2)' }}>
                          Tomadores são criados ao cadastrar uma proposta.
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((tomador: any) => (
                  <tr
                    key={tomador.id}
                    onClick={() => router.push(`/tomadores/${tomador.id}`)}
                    style={{
                      borderBottom: '1px solid var(--rz-line-2)',
                      cursor: 'pointer', transition: 'background 120ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--rz-fog)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                          background: 'var(--rz-lime-soft)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Building2 size={13} style={{ color: 'var(--rz-deep)' }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--rz-ink)' }}>
                          {tomador.razao_social}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--rz-text-2)', letterSpacing: '0.04em' }}>
                        {tomador.cnpj ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--rz-text-2)' }}>
                      {tomador.email ?? '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--rz-text-2)' }}>
                      {tomador.telefone ?? '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <ChevronRight size={14} style={{ color: 'var(--rz-text-3)' }} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{
          padding: '10px 16px',
          background: 'var(--rz-fog)', borderTop: '1px solid var(--rz-line)',
          fontSize: 11, color: 'var(--rz-text-2)',
        }}>
          {isLoading ? 'Carregando…' : `${filtered.length} tomador${filtered.length !== 1 ? 'es' : ''}`}
        </div>
      </div>
    </div>
  )
}
