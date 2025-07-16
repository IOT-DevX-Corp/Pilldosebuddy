import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-jakarta'
})

export const metadata: Metadata = {
  title: 'DoseBuddy - Smart Medication Management',
  description: 'Revolutionary AI-powered smart pill dispenser for automated medication management with real-time monitoring and personalized healthcare insights.',
  keywords: ['medication management', 'smart pill dispenser', 'healthcare', 'AI', 'automation', 'health monitoring'],
  authors: [{ name: 'DoseBuddy Team' }],
  creator: 'DoseBuddy',
  publisher: 'DoseBuddy',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'DoseBuddy - Smart Medication Management',
    description: 'Revolutionary AI-powered smart pill dispenser for automated medication management',
    url: '/',
    siteName: 'DoseBuddy',
    images: [
      {
        url: '/images/dosebuddy-hero.png',
        width: 1200,
        height: 630,
        alt: 'DoseBuddy Smart Pill Dispenser',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DoseBuddy - Smart Medication Management',
    description: 'Revolutionary AI-powered smart pill dispenser for automated medication management',
    images: ['/images/dosebuddy-hero.png'],
    creator: '@dosebuddy',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
