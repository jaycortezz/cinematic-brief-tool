import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cinematic Brief Tool',
  description: 'AI-powered cinematic content briefs for cannabis creators',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="grain-overlay" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  )
}
