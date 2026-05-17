import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlightDelay — Prédiction de retards',
  description: 'Système ML de prédiction de retards de vols',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="scanline" />
        <nav style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--panel)',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>✈</span>
            <span className="display" style={{ fontSize: '1.4rem', color: 'var(--amber)', letterSpacing: '2px' }}>
              FLIGHTDELAY
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }} className="mono">
            {[
              { href: '/', label: 'TABLEAU' },
              { href: '/predict', label: 'PRÉDICTION' },
              { href: '/live', label: 'LIVE' },
              { href: '/data', label: 'DONNÉES' }
            ].map(link => (
              <a key={link.href} href={link.href} style={{
                color: 'var(--text)',
                fontSize: '0.8rem',
                textDecoration: 'none',
                padding: '0.25rem 0',
                letterSpacing: '1px'
              }}>
                {link.label}
              </a>
            ))}
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}