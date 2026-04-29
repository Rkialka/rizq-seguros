import type { Metadata, Viewport } from 'next'
import { Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/components/providers/query-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'RIZQ — Plataforma para Corretores de Ramos Elementares',
  description:
    'Backoffice técnico, operação automatizada e IA para corretores que querem vender ramos elementares mais rentáveis.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RIZQ',
  },
}

export const viewport: Viewport = {
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
    <html lang="pt-BR" className={`${instrumentSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <TooltipProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
