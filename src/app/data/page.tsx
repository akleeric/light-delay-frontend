'use client'
import { useEffect, useState } from 'react'

const API = 'https://flight-delay-prediction-production-74cf.up.railway.app'

interface Flight {
  flight: { iata: string }
  airline: { name: string; iata: string }
  departure: { iata: string; scheduled: string; delay: number | null }
  arrival: { iata: string }
  flight_status: string
}

interface Weather {
  city?: string
  name?: string
  main?: { temp: number; humidity: number }
  wind?: { speed: number }
  weather?: { description: string }[]
}

export default function DataPage() {
  const [flights, setFlights] = useState<Flight[]>([])
  const [weather, setWeather] = useState<Weather[]>([])
  const [tab, setTab] = useState<'flights' | 'weather'>('flights')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/flights/raw`).then(r => r.json()),
      fetch(`${API}/weather/raw`).then(r => r.json())
    ]).then(([f, w]) => {
      setFlights(Array.isArray(f) ? f : [])
      setWeather(Array.isArray(w) ? w : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const delayed = flights.filter(f => f.departure?.delay && f.departure.delay > 0)
  const active = flights.filter(f => f.flight_status === 'active')

  return (
    <div className="page-pad" style={{ minHeight: '100vh', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 className="display" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', color: 'var(--amber)', letterSpacing: '3px', marginBottom: '0.25rem' }}>
        DONNÉES
      </h1>
      <p className="mono" style={{ color: 'var(--muted)', fontSize: '0.7rem', marginBottom: '2rem' }}>
        BASE DE DONNÉES · VOLS & MÉTÉO COLLECTÉS
      </p>

      <div className="grid-4col" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'TOTAL VOLS', val: flights.length },
          { label: 'EN VOL', val: active.length },
          { label: 'RETARDÉS', val: delayed.length },
          { label: 'OBS MÉTÉO', val: weather.length }
        ].map((s, i) => (
          <div key={i} className="panel mono" style={{ padding: '1rem 1.5rem' }}>
            <div style={{ fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '2px' }}>{s.label}</div>
            <div className="display" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: 'var(--amber)', marginTop: '0.2rem' }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '0' }}>
        {[{ key: 'flights', label: 'VOLS BRUTS' }, { key: 'weather', label: 'MÉTÉO' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as 'flights' | 'weather')}
            className="mono"
            style={{
              padding: '0.6rem 1.5rem', background: 'transparent', border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--amber)' : '2px solid transparent',
              color: tab === t.key ? 'var(--amber)' : 'var(--muted)',
              fontSize: '0.7rem', letterSpacing: '2px', cursor: 'pointer'
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mono panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
          <span className="blink">CHARGEMENT...</span>
        </div>
      )}

      {!loading && tab === 'flights' && (
        <div className="panel table-scroll" style={{ marginTop: '1px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '550px' }}>
            <thead>
              <tr className="mono" style={{ background: 'rgba(245,166,35,0.06)', fontSize: '0.6rem', color: 'var(--amber-dim)' }}>
                {['VOL', 'COMPAGNIE', 'DEP', 'ARR', 'STATUT', 'PRÉVU', 'RETARD'].map(h => (
                  <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', letterSpacing: '1px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flights.map((f, i) => (
                <tr key={i} className="fids-row mono" style={{ fontSize: '0.8rem' }}>
                  <td style={{ padding: '0.7rem 1rem', color: 'var(--amber)' }}>{f.flight?.iata || '—'}</td>
                  <td style={{ padding: '0.7rem 1rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.airline?.name || '—'}</td>
                  <td style={{ padding: '0.7rem 1rem' }}>{f.departure?.iata}</td>
                  <td style={{ padding: '0.7rem 1rem' }}>{f.arrival?.iata}</td>
                  <td style={{ padding: '0.7rem 1rem', color: f.flight_status === 'active' ? 'var(--green)' : 'var(--muted)' }}>
                    {f.flight_status?.toUpperCase()}
                  </td>
                  <td style={{ padding: '0.7rem 1rem', color: 'var(--muted)' }}>{f.departure?.scheduled?.slice(11, 16)}</td>
                  <td style={{ padding: '0.7rem 1rem', color: f.departure?.delay ? 'var(--red)' : 'var(--green)' }}>
                    {f.departure?.delay ? `+${f.departure.delay} min` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'weather' && (
        <div className="panel table-scroll" style={{ marginTop: '1px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
            <thead>
              <tr className="mono" style={{ background: 'rgba(245,166,35,0.06)', fontSize: '0.6rem', color: 'var(--amber-dim)' }}>
                {['VILLE', 'TEMPÉRATURE', 'HUMIDITÉ', 'VENT', 'CONDITIONS'].map(h => (
                  <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', letterSpacing: '1px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weather.map((w, i) => (
                <tr key={i} className="fids-row mono" style={{ fontSize: '0.8rem' }}>
                  <td style={{ padding: '0.7rem 1rem', color: 'var(--amber)' }}>{w.city || w.name || '—'}</td>
                  <td style={{ padding: '0.7rem 1rem' }}>{w.main?.temp ? `${w.main.temp.toFixed(1)}°C` : '—'}</td>
                  <td style={{ padding: '0.7rem 1rem', color: 'var(--muted)' }}>{w.main?.humidity ? `${w.main.humidity}%` : '—'}</td>
                  <td style={{ padding: '0.7rem 1rem', color: 'var(--muted)' }}>{w.wind?.speed ? `${w.wind.speed} m/s` : '—'}</td>
                  <td style={{ padding: '0.7rem 1rem', color: 'var(--muted)' }}>{w.weather?.[0]?.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}