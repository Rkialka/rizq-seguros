'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Shield,
  Building2,
  AlertTriangle,
  Receipt,
  RefreshCw,
  Zap,
  BarChart3,
  ChevronLeft,
  ChevronDown,
  MoreHorizontal,
  Settings,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'
import { useCurrentUser, useCurrentCorretora } from '@/hooks/use-perfil'
import { usePropostasStats } from '@/hooks/use-propostas'

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard, hint: '⌘1' },
  { href: '/propostas',     label: 'Propostas',     icon: FileText,        hint: '⌘2', countKey: 'propostas' },
  { href: '/apolices',      label: 'Apólices',      icon: Shield,          hint: '⌘3' },
  { href: '/tomadores',     label: 'Tomadores',     icon: Building2,       hint: '⌘4' },
  { href: '/chat',          label: 'Chat IA',       icon: MessageSquare,   hint: '⌘5' },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

const NAV_PHASE2 = [
  { href: '/sinistros',  label: 'Sinistros',   icon: AlertTriangle },
  { href: '/boletos',    label: 'Boletos',      icon: Receipt },
  { href: '/renovacoes', label: 'Renovações',   icon: RefreshCw, count: 9, pulse: true },
  { href: '/automacoes', label: 'Automações',   icon: Zap },
  { href: '/relatorios', label: 'Relatórios',   icon: BarChart3 },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

function Avatar({ name, size = 28, tone = 'deep' }: { name: string; size?: number; tone?: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const bg = { deep: '#004b36', lime: '#c3d600', moss: '#1f8a64', fog: '#f4f6f3' }[tone] ?? '#004b36'
  const fg = tone === 'lime' ? '#004b36' : tone === 'fog' ? '#5b6b62' : '#fbfcf9'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: 999,
      background: bg, color: fg,
      fontSize: Math.max(10, size * 0.4), fontWeight: 600, flexShrink: 0,
    }}>
      {initials}
    </span>
  )
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { data: usuario } = useCurrentUser()
  const { data: corretora } = useCurrentCorretora()
  const { data: propostasStats } = usePropostasStats()
  const userName = usuario?.nome ?? 'Usuário'
  const corretoraName = corretora?.razao_social ?? 'Minha Corretora'
  const corretoraDoc = corretora?.susep ? `SUSEP ${corretora.susep}` : (corretora?.cnpj ?? 'Corretora de Seguros')

  return (
    <aside style={{
      width: collapsed ? 64 : 232,
      background: 'var(--rz-deep)',
      color: 'var(--rz-paper)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderRight: '1px solid #002218',
      transition: 'width 200ms ease',
      flexShrink: 0,
      overflow: 'hidden',
    }}
    className="hidden lg:flex"
    >
      {/* Brand bar */}
      <div style={{
        height: 60,
        padding: collapsed ? '14px 18px' : '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: '1px solid #002218',
        justifyContent: collapsed ? 'center' : 'flex-start',
        flexShrink: 0,
      }}>
        {collapsed ? (
          <span style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'var(--rz-lime)',
            color: 'var(--rz-deep)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
            flexShrink: 0,
          }}>R</span>
        ) : (
          <Image
            src="/rizq-lockup-onDark.png"
            alt="RIZQ"
            width={96}
            height={32}
            style={{ height: 32, width: 'auto', objectFit: 'contain' }}
            priority
          />
        )}
      </div>

      {/* Org switcher */}
      {!collapsed && (
        <div style={{ padding: '10px 10px 6px' }}>
          <button style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 8px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            color: 'var(--rz-paper)',
            cursor: 'pointer',
            textAlign: 'left',
          }}>
            <Avatar name={corretoraName} size={22} tone="lime" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {corretoraName}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{corretoraDoc}</div>
            </div>
            <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
          </button>
        </div>
      )}

      {/* Main nav */}
      <nav className="rz-sidebar-scroll" style={{ flex: 1, padding: collapsed ? '6px 8px' : '6px 10px', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '9px 8px' : '7px 8px',
                margin: '2px 0',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                color: isActive ? 'var(--rz-deep)' : 'rgba(255,255,255,0.78)',
                background: isActive ? 'var(--rz-lime)' : 'transparent',
                textDecoration: 'none',
                position: 'relative',
                justifyContent: collapsed ? 'center' : 'flex-start',
                transition: 'background 120ms ease, color 120ms ease',
              }}
            >
              <Icon
                size={16}
                style={{
                  color: isActive ? 'var(--rz-deep)' : 'rgba(255,255,255,0.62)',
                  flexShrink: 0,
                }}
              />
              {!collapsed && (
                <>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {'countKey' in item && item.countKey === 'propostas' && propostasStats?.count != null && (
                    <span style={{
                      fontSize: 10,
                      padding: '1px 6px',
                      borderRadius: 999,
                      fontWeight: 600,
                      background: isActive ? 'rgba(0,75,54,0.15)' : 'rgba(255,255,255,0.1)',
                      color: isActive ? 'var(--rz-deep)' : 'rgba(255,255,255,0.85)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>{propostasStats.count}</span>
                  )}
                  {!isActive && 'hint' in item && item.hint && (
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono, monospace)' }}>
                      {item.hint}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}

        {/* Phase 2 section */}
        {!collapsed && (
          <div style={{
            margin: '14px 4px 4px',
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)',
            fontWeight: 600,
          }}>Em breve</div>
        )}

        {NAV_PHASE2.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.href}
              title={collapsed ? `${item.label} (em breve)` : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '9px 8px' : '7px 8px',
                margin: '2px 0',
                borderRadius: 6,
                fontSize: 13,
                color: 'rgba(255,255,255,0.28)',
                cursor: 'not-allowed',
                position: 'relative',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {'count' in item && item.count != null && (
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 999,
                      background: 'rgba(255,255,255,0.07)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>{item.count}</span>
                  )}
                </>
              )}
              {'pulse' in item && item.pulse && (
                <span style={{
                  position: 'absolute',
                  right: collapsed ? 6 : 4,
                  top: collapsed ? 6 : 6,
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: 'var(--rz-lime)',
                  boxShadow: '0 0 0 3px rgba(195,214,0,0.2)',
                }} />
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer: user */}
      <div style={{ borderTop: '1px solid #002218', padding: 10, flexShrink: 0 }}>
        {!collapsed ? (
          <Link href="/configuracoes" style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: 8,
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
            textDecoration: 'none',
          }}>
            <Avatar name={userName} size={28} tone="lime" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--rz-paper)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                {usuario?.role === 'admin' ? 'Admin' : usuario?.role === 'corretor' ? 'Corretor' : 'Operacional'}
              </div>
            </div>
            <Settings size={13} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
          </Link>
        ) : (
          <Link href="/configuracoes" style={{ display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
            <Avatar name={userName} size={28} tone="lime" />
          </Link>
        )}
        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          style={{
            width: '100%',
            marginTop: 6,
            height: 28,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 6,
            color: 'rgba(255,255,255,0.45)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft
            size={14}
            style={{ transition: 'transform 200ms ease', transform: collapsed ? 'rotate(180deg)' : 'none' }}
          />
        </button>
      </div>
    </aside>
  )
}
