'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FileText, Shield, Plus, MoreHorizontal } from 'lucide-react'

const mobileItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/propostas', label: 'Propostas', icon: FileText },
  { href: '/propostas/nova', label: 'Nova', icon: Plus, isAction: true },
  { href: '/apolices', label: 'Apólices', icon: Shield },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-center justify-around border-t bg-background pb-[env(safe-area-inset-bottom)] h-16">
      {mobileItems.map((item) => {
        const isActive = pathname.startsWith(item.href) && !item.isAction

        if (item.isAction) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center -mt-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                <item.icon className="h-6 w-6" />
              </div>
            </Link>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-3 py-1',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
