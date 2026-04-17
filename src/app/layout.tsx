import type { Metadata, Viewport } from 'next'
import { Inter, Syne } from 'next/font/google'
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
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MiejskiTrop',
  },
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
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" className={`${inter.variable} ${syne.variable}`}>
      <head>
        <link rel="icon" href="/icons/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.variable} ${syne.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
