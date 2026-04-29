'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { NAV_ITEMS, NAV_ITEMS_PHASE2 } from '@/lib/constants'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, Shield, Settings, Building2,
  AlertTriangle, Receipt, FileEdit, RefreshCw, Zap, BarChart3,
  type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, FileText, Shield, Settings, Building2: Settings,
  AlertTriangle, Receipt, FileEdit, RefreshCw, Zap, BarChart3,
}

const MOBILE_NAV = [
  { href: '/dashboard',       label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/propostas',       label: 'Propostas',     icon: FileText },
  { href: '/apolices',        label: 'Apólices',      icon: Shield },
  { href: '/tomadores',       label: 'Tomadores',     icon: Building2 },
  { href: '/configuracoes',   label: 'Configurações', icon: Settings },
]

const MOBILE_PHASE2 = [
  { href: '/sinistros',  label: 'Sinistros',   icon: AlertTriangle },
  { href: '/boletos',    label: 'Boletos',     icon: Receipt },
  { href: '/renovacoes', label: 'Renovações',  icon: RefreshCw },
  { href: '/automacoes', label: 'Automações',  icon: Zap },
  { href: '/relatorios', label: 'Relatórios',  icon: BarChart3 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" style={{ width: 240, padding: 0, background: 'var(--rz-deep)', border: 'none' }}>
          {/* Header */}
          <div style={{
            height: 60, padding: '0 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            borderBottom: '1px solid #002218',
          }}>
            <Image
              src="/rizq-lockup-onDark.png"
              alt="RIZQ"
              width={80}
              height={28}
              style={{ height: 28, width: 'auto', objectFit: 'contain' }}
            />
          </div>

          {/* Nav */}
          <nav style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {MOBILE_NAV.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 6,
                    fontSize: 13, fontWeight: 500, textDecoration: 'none',
                    color: isActive ? 'var(--rz-deep)' : 'rgba(255,255,255,0.78)',
                    background: isActive ? 'var(--rz-lime)' : 'transparent',
                  }}
                >
                  <Icon size={16} style={{ color: isActive ? 'var(--rz-deep)' : 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
                  {item.label}
                </Link>
              )
            })}

            <div style={{
              margin: '12px 4px 4px',
              fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.28)', fontWeight: 600,
            }}>
              Em breve
            </div>

            {MOBILE_PHASE2.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 6,
                  fontSize: 13, color: 'rgba(255,255,255,0.28)', cursor: 'not-allowed',
                }}>
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  {item.label}
                </div>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
