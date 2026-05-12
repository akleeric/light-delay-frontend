import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlightDelay.AI — Prédiction de retards',
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
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>✈</span>
            <span className="display" style={{ fontSize: '1.4rem', color: 'var(--amber)', letterSpacing: '2px' }}>
              FLIGHTDELAY
            </span>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }} className="mono">
            <a href="/" style={{ color: 'var(--text)', fontSize: '0.8rem', textDecoration: 'none' }}>TABLEAU</a>
            <a href="/predict" style={{ color: 'var(--text)', fontSize: '0.8rem', textDecoration: 'none' }}>PRÉDICTION</a>
            <a href="/live" style={{ color: 'var(--text)', fontSize: '0.8rem', textDecoration: 'none' }}>LIVE</a>
            <a href="/data" style={{ color: 'var(--text)', fontSize: '0.8rem', textDecoration: 'none' }}>DONNÉES</a>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
