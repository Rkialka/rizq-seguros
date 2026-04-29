'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Shield, Plus, Settings } from 'lucide-react'

const mobileItems = [
  { href: '/dashboard',     label: 'Dashboard', icon: LayoutDashboard },
  { href: '/propostas',     label: 'Propostas', icon: FileText },
  { href: '/propostas/nova', label: 'Nova',     icon: Plus, isAction: true },
  { href: '/apolices',      label: 'Apólices',  icon: Shield },
  { href: '/configuracoes', label: 'Config',    icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      display: 'flex', alignItems: 'stretch',
      background: 'var(--rz-white)',
      borderTop: '1px solid var(--rz-line)',
      height: 'calc(56px + env(safe-area-inset-bottom))',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}
    className="lg:hidden"
    >
      {mobileItems.map((item) => {
        const isActive = item.href !== '/propostas/nova' &&
          (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))

        if (item.isAction) {
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 0,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 999,
                background: 'var(--rz-deep)', color: 'var(--rz-lime)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: -18,
                boxShadow: '0 2px 8px rgba(0,75,54,0.35)',
              }}>
                <Plus size={20} strokeWidth={2.5} />
              </div>
            </Link>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              color: isActive ? 'var(--rz-deep)' : 'var(--rz-text-3)',
              textDecoration: 'none',
              borderTop: isActive ? '2px solid var(--rz-lime)' : '2px solid transparent',
              transition: 'color 120ms ease',
            }}
          >
            <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
            <span style={{ fontSize: 9, fontWeight: isActive ? 600 : 400, letterSpacing: '0.02em' }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
