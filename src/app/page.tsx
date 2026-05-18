'use client'
import { useEffect, useState } from 'react'

const API = 'https://flight-delay-prediction-production-74cf.up.railway.app'

interface Flight {
  flight: { iata: string }
  airline: { name: string; iata: string }
  departure: { iata: string; scheduled: string; actual: string | null; delay: number | null }
  arrival: { iata: string; scheduled: string }
  flight_status: string
}

function statusColor(status: string, delay: number | null) {
  if (delay && delay > 30) return 'var(--red)'
  if (delay && delay > 0) return 'var(--amber)'
  if (status === 'active') return 'var(--green)'
  return 'var(--muted)'
}

function statusLabel(status: string, delay: number | null) {
  if (delay && delay > 0) return `+${delay}min`
  if (status === 'active') return 'EN VOL'
  if (status === 'landed') return 'ATTERRI'
  return status.toUpperCase()
}

function formatTime(iso: string) {
  if (!iso) return '--:--'
  return iso.slice(11, 16)
}

export default function Home() {
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('fr-FR'))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    fetch(`${API}/flights/raw`)
      .then(r => r.json())
      .then(d => { setFlights(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="page-pad" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 className="display" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', color: 'var(--amber)', letterSpacing: '4px', lineHeight: 1 }}>
            DÉPARTS
          </h1>
          <p className="mono" style={{ color: 'var(--muted)', fontSize: '0.65rem', marginTop: '0.25rem' }}>
            FLIGHT INFORMATION DISPLAY SYSTEM
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="display" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: 'var(--amber)' }}>{time}</div>
          <div className="mono" style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </div>
        </div>
      </div>

      {loading && (
        <div className="mono panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', borderRadius: '4px', marginBottom: '1.5rem' }}>
          <span className="blink">CHARGEMENT...</span>
        </div>
      )}

      {/* Desktop — tableau */}
      <div className="panel table-scroll" style={{ borderRadius: '4px', display: 'none' }}
        ref={el => { if (el) el.style.display = window.innerWidth >= 768 ? 'block' : 'none' }}>
        <div className="mono" style={{
          display: 'grid',
          gridTemplateColumns: '90px 1fr 70px 70px 70px 130px 120px',
          minWidth: '700px',
          padding: '0.6rem 1rem',
          background: 'rgba(245,166,35,0.08)',
          borderBottom: '1px solid var(--border)',
          fontSize: '0.6rem', color: 'var(--amber-dim)', letterSpacing: '2px'
        }}>
          <span>VOL</span><span>COMPAGNIE</span><span>DEP</span><span>ARR</span><span>PRÉVU</span><span>STATUT</span><span>ACTION</span>
        </div>
        {flights.map((f, i) => (
          <div key={i} className="fids-row mono" style={{
            display: 'grid', gridTemplateColumns: '90px 1fr 70px 70px 70px 130px 120px',
            minWidth: '700px', padding: '0.8rem 1rem', fontSize: '0.8rem', alignItems: 'center'
          }}>
            <span style={{ color: 'var(--amber)', fontWeight: 'bold' }}>{f.flight?.iata || '—'}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.airline?.name || '—'}</span>
            <span>{f.departure?.iata}</span>
            <span>{f.arrival?.iata}</span>
            <span style={{ color: 'var(--muted)' }}>{formatTime(f.departure?.scheduled)}</span>
            <span style={{ color: statusColor(f.flight_status, f.departure?.delay) }}>
              {statusLabel(f.flight_status, f.departure?.delay)}
            </span>
            <a href={`/predict?flight=${f.flight?.iata}&dep=${f.departure?.iata}&arr=${f.arrival?.iata}&airline=${f.airline?.iata}`}
              style={{ display: 'inline-block', padding: '0.2rem 0.6rem', border: '1px solid var(--amber-dim)', color: 'var(--amber)', fontSize: '0.65rem', textDecoration: 'none' }}>
              PRÉDIRE →
            </a>
          </div>
        ))}
      </div>

      {/* Mobile — cards */}
      <div style={{ display: 'none' }}
        ref={el => { if (el) el.style.display = window.innerWidth < 768 ? 'block' : 'none' }}>
        {flights.map((f, i) => (
          <div key={i} className="panel" style={{ borderRadius: '4px', marginBottom: '0.75rem', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span className="mono display" style={{ fontSize: '1.2rem', color: 'var(--amber)' }}>{f.flight?.iata || '—'}</span>
              <span className="mono" style={{ fontSize: '0.75rem', color: statusColor(f.flight_status, f.departure?.delay) }}>
                {statusLabel(f.flight_status, f.departure?.delay)}
              </span>
            </div>
            <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: '0.5rem' }}>{f.airline?.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="mono" style={{ fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--amber)' }}>{f.departure?.iata}</span>
                <span style={{ color: 'var(--muted)', margin: '0 0.4rem' }}>→</span>
                <span style={{ color: 'var(--amber)' }}>{f.arrival?.iata}</span>
                <span style={{ color: 'var(--muted)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>{formatTime(f.departure?.scheduled)}</span>
              </div>
              <a href={`/predict?flight=${f.flight?.iata}&dep=${f.departure?.iata}&arr=${f.arrival?.iata}&airline=${f.airline?.iata}`}
                style={{ padding: '0.3rem 0.8rem', border: '1px solid var(--amber-dim)', color: 'var(--amber)', fontSize: '0.65rem', textDecoration: 'none', fontFamily: 'Share Tech Mono' }}>
                PRÉDIRE →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid-stats" style={{ marginTop: '1.5rem' }}>
        {[
          { label: 'VOLS ACTIFS', value: flights.filter(f => f.flight_status === 'active').length },
          { label: 'AVEC RETARD', value: flights.filter(f => f.departure?.delay && f.departure.delay > 0).length },
          { label: 'TOTAL', value: flights.length }
        ].map((s, i) => (
          <div key={i} className="panel mono" style={{ padding: '1rem 1.5rem', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '2px' }}>{s.label}</div>
            <div className="display" style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', color: 'var(--amber)', marginTop: '0.25rem' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}