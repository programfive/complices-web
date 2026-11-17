// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Cómplices — Admin',
  description: 'Panel de administración',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#190407' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', minHeight: '100vh' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
