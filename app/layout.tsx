// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Cómplices — Panel de Monitoreo',
  description: 'Panel web de administración y monitoreo en tiempo real',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex flex-col md:flex-row min-h-screen bg-[#190407] text-[#F7EFE4] antialiased selection:bg-[#D4AF5A]/30">
        <Sidebar />
        <main className="flex-1 w-full min-w-0 overflow-y-auto min-h-[calc(100vh-60px)] md:min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
