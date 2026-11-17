// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Cómplices — Admin',
  description: 'Panel de administración',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="app-root-body" style={{ minHeight: '100vh', backgroundColor: '#190407' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', minHeight: '100vh', minWidth: 0 }}>
          {children}
        </main>
      </body>
    </html>
  )
}
