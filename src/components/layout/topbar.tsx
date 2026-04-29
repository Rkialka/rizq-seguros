'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, LogOut, Menu, Settings, User, Search, AlertTriangle, Shield } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-perfil'
import { usePropostasStats, useNotificacoes } from '@/hooks/use-propostas'
import { useApolicesStats } from '@/hooks/use-apolices'
import { CmdSearch, openCmdSearch } from '@/components/search/cmd-search'

function fmtBRLk(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
  return `R$ ${v}`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia.'
  if (h < 18) return 'Boa tarde.'
  return 'Boa noite.'
}

const STATIC_TITLES: Record<string, string> = {
  '/dashboard':                'greeting',
  '/propostas':                'Propostas',
  '/apolices':                 'Apólices',
  '/configuracoes/documentos': 'Ficha de Cadastro',
  '/configuracoes':            'Configurações',
  '/propostas/nova':           'Nova Proposta',
}

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: 999,
      background: 'var(--rz-lime)', color: 'var(--rz-deep)',
      fontSize: Math.max(10, Math.round(size * 0.38)), fontWeight: 700, flexShrink: 0,
      fontFamily: 'inherit',
    }}>
      {initials}
    </span>
  )
}

interface TopbarProps {
  onMobileMenuToggle: () => void
  userName?: string
}

export function Topbar({ onMobileMenuToggle, userName: userNameProp }: TopbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: usuario } = useCurrentUser()
  const { data: propostasStats } = usePropostasStats()
  const { data: apolicesStats } = useApolicesStats()
  const { data: notifs } = useNotificacoes()
  const [bellOpen, setBellOpen] = useState(false)

  const urgentCount = notifs?.filter(n => n.urgente).length ?? 0
  const bellBadge = urgentCount > 0 ? urgentCount : (notifs?.length ?? 0)

  const userName = usuario?.nome ?? userNameProp ?? 'Corretor'

  // Resolve title
  const titleKey = Object.keys(STATIC_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname === k || pathname.startsWith(k + '/'))
  const rawTitle = titleKey ? STATIC_TITLES[titleKey] : 'RIZQ'
  const title = rawTitle === 'greeting' ? getGreeting() : rawTitle

  // Resolve subtitle dynamically
  let subtitle: string | undefined
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    subtitle = 'Visão geral da sua operação'
  } else if (pathname === '/propostas' && propostasStats) {
    subtitle = `${propostasStats.count} ativas · ${fmtBRLk(propostasStats.pipeline)} em IS`
  } else if (pathname.startsWith('/apolices') && apolicesStats) {
    subtitle = `${apolicesStats.vigentes} vigentes · ${fmtBRLk(apolicesStats.totalIS)} em IS`
  } else if (pathname === '/configuracoes/documentos') {
    subtitle = 'Documentos de homologação'
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header style={{
      height: 60,
      background: 'var(--rz-paper)',
      borderBottom: '1px solid var(--rz-line)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 10,
      flexShrink: 0,
    }}>
      {/* Mobile menu toggle */}
      <button
        className="lg:hidden"
        onClick={onMobileMenuToggle}
        style={{
          width: 44, height: 44, borderRadius: 8,
          border: '1px solid var(--rz-line)',
          background: 'var(--rz-white)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--rz-ink)', flexShrink: 0,
        }}
      >
        <Menu size={18} />
      </button>

      {/* Page title */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 10, overflow: 'hidden' }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 20,
          margin: 0,
          color: 'var(--rz-ink)',
          lineHeight: 1.1,
          fontWeight: 400,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {title}
        </h1>
        {subtitle && (
          <span className="hidden md:inline" style={{
            fontSize: 12, color: 'var(--rz-text-2)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {subtitle}
          </span>
        )}
      </div>

      {/* Command-K search trigger */}
      <button
        className="hidden md:flex"
        onClick={openCmdSearch}
        style={{
          alignItems: 'center',
          gap: 8,
          height: 34,
          padding: '0 12px',
          background: 'var(--rz-fog)',
          border: '1px solid var(--rz-line)',
          borderRadius: 6,
          width: 260,
          cursor: 'pointer',
          flexShrink: 0,
          fontFamily: 'inherit',
        }}
      >
        <Search size={13} style={{ color: 'var(--rz-text-2)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--rz-text-3)', flex: 1, whiteSpace: 'nowrap', textAlign: 'left' }}>
          Buscar tomador, apólice…
        </span>
        <span style={{
          fontSize: 10,
          color: 'var(--rz-text-2)',
          background: 'var(--rz-white)',
          padding: '2px 5px',
          borderRadius: 4,
          border: '1px solid var(--rz-line)',
          fontFamily: 'var(--font-mono, monospace)',
          flexShrink: 0,
        }}>⌘K</span>
      </button>
      <CmdSearch />

      {/* Mobile search button */}
      <button
        className="flex md:hidden"
        onClick={openCmdSearch}
        style={{
          width: 44, height: 44, borderRadius: 8,
          border: '1px solid var(--rz-line)',
          background: 'var(--rz-white)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--rz-ink)', flexShrink: 0,
        }}
      >
        <Search size={18} />
      </button>

      {/* Notification bell */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setBellOpen(p => !p)}
          style={{
            width: 44, height: 44, borderRadius: 8,
            border: '1px solid var(--rz-line)',
            background: bellOpen ? 'var(--rz-fog)' : 'var(--rz-white)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', cursor: 'pointer', color: 'var(--rz-ink)',
            flexShrink: 0,
          }}
        >
          <Bell size={15} />
          {bellBadge > 0 && (
            <span style={{
              position: 'absolute', top: -3, right: -3,
              minWidth: 16, height: 16, borderRadius: 999,
              background: urgentCount > 0 ? 'var(--rz-danger)' : 'var(--rz-pine)', color: 'white',
              fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px',
              border: '2px solid var(--rz-paper)',
            }}>{bellBadge}</span>
          )}
        </button>

        {bellOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              onClick={() => setBellOpen(false)}
            />
            <div style={{
              position: 'fixed', top: 68, right: 16, zIndex: 50,
              width: 'min(340px, calc(100vw - 32px))', maxHeight: '60vh', overflowY: 'auto',
              background: 'var(--rz-white)', border: '1px solid var(--rz-line)',
              borderRadius: 8, boxShadow: '0 8px 24px rgba(3,26,19,0.14)',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderBottom: '1px solid var(--rz-line)',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--rz-ink)' }}>Notificações</span>
                <button
                  onClick={() => setBellOpen(false)}
                  style={{ fontSize: 11, color: 'var(--rz-text-2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Fechar
                </button>
              </div>

              {/* Items */}
              {!notifs || notifs.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--rz-text-2)', fontSize: 13 }}>
                  Nenhuma notificação ativa
                </div>
              ) : (
                notifs.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { router.push(n.href); setBellOpen(false) }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      width: '100%', padding: '10px 16px', border: 'none', textAlign: 'left',
                      background: n.urgente ? 'rgba(220, 38, 38, 0.04)' : 'transparent',
                      cursor: 'pointer', fontFamily: 'inherit',
                      borderBottom: '1px solid var(--rz-line-2)',
                      transition: 'background 100ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = n.urgente ? 'rgba(220, 38, 38, 0.08)' : 'var(--rz-fog)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = n.urgente ? 'rgba(220, 38, 38, 0.04)' : 'transparent')}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                      background: n.urgente ? 'var(--rz-danger-soft)' : 'var(--rz-fog)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {n.tipo === 'sla'
                        ? <AlertTriangle size={13} style={{ color: n.urgente ? 'var(--rz-danger)' : 'var(--rz-amber)' }} />
                        : <Shield size={13} style={{ color: n.urgente ? 'var(--rz-danger)' : 'var(--rz-moss)' }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: n.urgente ? 'var(--rz-danger)' : 'var(--rz-ink)', marginBottom: 2 }}>
                        {n.titulo}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--rz-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.desc}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 8px', borderRadius: 6,
          border: 'none', background: 'transparent',
          cursor: 'pointer', flexShrink: 0,
        }}>
          <Avatar name={userName} size={28} />
          <span className="hidden sm:inline" style={{ fontSize: 13, color: 'var(--rz-ink)', fontWeight: 500 }}>
            {userName.split(' ')[0]}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push('/configuracoes')}>
            <User className="mr-2 h-4 w-4" />
            Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/configuracoes')}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
