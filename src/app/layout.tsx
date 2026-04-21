import type { Metadata, Viewport } from 'next'
import { Inter, Syne } from 'next/font/google'
import Script from 'next/script'
import '../styles/globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'MiejskiTrop — Odkryj Bielsko-Białą',
    template: '%s | MiejskiTrop',
  },
  description:
    'Odkrywaj Bielsko-Białą, poznawaj organizacje pozarządowe i zaliczaj miejskie questy. Miasto czeka na Twoje odkrycia.',
  manifest: '/manifest.json',
  applicationName: 'MiejskiTrop',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MiejskiTrop',
  },
  icons: {
    icon: [
      { url: '/icons/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/apple-touch-icon-167.png', sizes: '167x167', type: 'image/png' },
      { url: '/icons/apple-touch-icon-152.png', sizes: '152x152', type: 'image/png' },
    ],
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    url: 'https://miejskitrop.pl',
    siteName: 'MiejskiTrop',
    title: 'MiejskiTrop — Odkryj Bielsko-Białą',
    description: 'Odkrywaj miasto, poznawaj NGO, zaliczaj questy.',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f1117',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" className={`${inter.variable} ${syne.variable}`}>
      <body className={`${inter.variable} ${syne.variable} antialiased`}>
        {/* Przechwyć beforeinstallprompt zanim React się zamontuje — inaczej
            event może wypalić za szybko i banner instalacji nigdy się nie pojawi. */}
        <Script id="mt-install-capture" strategy="beforeInteractive">{`
          (function(){
            if (typeof window === 'undefined') return;
            window.__mtDeferredPrompt = window.__mtDeferredPrompt || null;
            window.addEventListener('beforeinstallprompt', function(e){
              e.preventDefault();
              window.__mtDeferredPrompt = e;
            }, { once: false });
          })();
        `}</Script>
        {children}
      </body>
    </html>
  )
}
