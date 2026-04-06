'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, NAV_ITEMS_PHASE2 } from '@/lib/constants'
import {
  LayoutDashboard,
  FileText,
  Shield,
  Building2,
  AlertTriangle,
  Receipt,
  FileEdit,
  RefreshCw,
  Zap,
  BarChart3,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileText,
  Shield,
  Building2,
  AlertTriangle,
  Receipt,
  FileEdit,
  RefreshCw,
  Zap,
  BarChart3,
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
          R
        </div>
        {!collapsed && <span className="font-bold text-lg">RIZQ</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && item.label}
            </Link>
          )
        })}

        <Separator className="my-2" />

        {/* Phase 2 items - disabled */}
        {NAV_ITEMS_PHASE2.map((item) => {
          const Icon = iconMap[item.icon]
          return (
            <div
              key={item.href}
              title={collapsed ? `${item.label} (em breve)` : undefined}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/30 cursor-not-allowed"
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && item.label}
            </div>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t p-2">
        <Button variant="ghost" size="sm" className="w-full justify-center" onClick={onToggle}>
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>
    </aside>
  )
}
