'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Map, Search, Compass, QrCode, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/map',     icon: Map,     label: 'Mapa'   },
  { href: '/explore', icon: Search,  label: 'Odkryj' },
  { href: '/quests',  icon: Compass, label: 'Questy' },
  { href: '/scan',    icon: QrCode,  label: 'Skanuj' },
  { href: '/profile', icon: User,    label: 'Profil' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        const isScan = href === '/scan'

        if (isScan) {
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-3">
              <div
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-2xl -mt-5 transition-all duration-200 shadow-md',
                  isActive ? 'shadow-green-500/30' : 'shadow-black/30'
                )}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                    : 'linear-gradient(135deg, #22263a, #2d3148)',
                  border: isActive ? '1.5px solid #4ade8050' : '1.5px solid #2d3148',
                }}
              >
                <Icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-slate-400')} />
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold tracking-wide',
                  isActive ? 'text-brand-400' : 'text-slate-500'
                )}
              >
                {label}
              </span>
            </Link>
          )
        }

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 relative"
          >
            {/* Active indicator dot */}
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-400"
              />
            )}
            <div
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200',
                isActive ? 'bg-brand-500/15' : 'bg-transparent'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-all duration-200',
                  isActive ? 'text-brand-400' : 'text-slate-500'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
            </div>
            <span
              className={cn(
                'text-[10px] font-semibold tracking-wide transition-colors duration-200',
                isActive ? 'text-brand-400' : 'text-slate-500'
              )}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
