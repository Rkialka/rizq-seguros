'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { NAV_ITEMS, NAV_ITEMS_PHASE2 } from '@/lib/constants'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, FileText, Shield, Building2, AlertTriangle,
  Receipt, FileEdit, RefreshCw, Zap, BarChart3, type LucideIcon,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, FileText, Shield, Building2, AlertTriangle,
  Receipt, FileEdit, RefreshCw, Zap, BarChart3,
}

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
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-14 items-center gap-2 border-b px-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
              R
            </div>
            <span className="font-bold text-lg">RIZQ</span>
          </div>
          <nav className="space-y-1 p-2">
            {NAV_ITEMS.map((item) => {
              const Icon = iconMap[item.icon]
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground/70 hover:bg-accent/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
            <Separator className="my-2" />
            {NAV_ITEMS_PHASE2.map((item) => {
              const Icon = iconMap[item.icon]
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground/30 cursor-not-allowed"
                >
                  <Icon className="h-5 w-5" />
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
