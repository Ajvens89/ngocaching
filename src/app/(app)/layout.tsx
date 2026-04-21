import BottomNav from '@/components/ui/BottomNav'
import InstallBanner from '@/components/ui/InstallBanner'
import LocationPermissionOverlay from '@/components/ui/LocationPermissionOverlay'
import OnboardingOverlay from '@/components/onboarding/OnboardingOverlay'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-surface">
      <OnboardingOverlay />
      <main className="flex-1 pb-[calc(72px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav />
      <LocationPermissionOverlay />
      <InstallBanner />
    </div>
  )
}
