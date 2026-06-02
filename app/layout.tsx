import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { AppProvider } from '@/lib/store'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'A2IE — Expense Analyzer',
  description:
    'Aplicação simples e privada para registar receitas, despesas, orçamentos e metas. Os seus dados ficam apenas no seu navegador.',
  applicationName: 'A2IE Expense Analyzer',
  authors: [{ name: 'A2IE' }],
  keywords: [
    'expense tracker',
    'despesas',
    'orçamento',
    'finanças pessoais',
    'budget',
  ],
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
}

// Inline script to avoid theme flicker on first paint.
const themeInit = `
(function () {
  try {
    var s = localStorage.getItem('a2ie:settings');
    var t = s ? (JSON.parse(s).theme || 'system') : 'system';
    var resolved = t === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t;
    if (resolved === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground font-sans antialiased`}
      >
        <AppProvider>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </AppProvider>
      </body>
    </html>
  )
}
