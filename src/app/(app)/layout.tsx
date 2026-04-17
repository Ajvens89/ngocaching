import BottomNav from '@/components/ui/BottomNav'
import InstallBanner from '@/components/ui/InstallBanner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <main className="flex-1 pb-[72px]">
        {children}
      </main>
      <BottomNav />
      <InstallBanner />
    </div>
  )
}
