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
      <p className="mono" style={{ color: 'var(--muted)', fontSize: '0.7rem', marginBottom: '1.5rem' }}>
        BASE DE DONNÉES · VOLS & MÉTÉO COLLECTÉS
      </p>

      <div className="grid-4col" style={{ marginBottom: '1.5rem' }}>
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

      {/* Desktop table flights */}
      {!loading && tab === 'flights' && (
        <>
          <div className="panel table-scroll" style={{ marginTop: '1px', display: 'none' }} id="data-desktop">
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
                    <td style={{ padding: '0.7rem 1rem', color: f.flight_status === 'active' ? 'var(--green)' : 'var(--muted)' }}>{f.flight_status?.toUpperCase()}</td>
                    <td style={{ padding: '0.7rem 1rem', color: 'var(--muted)' }}>{f.departure?.scheduled?.slice(11, 16)}</td>
                    <td style={{ padding: '0.7rem 1rem', color: f.departure?.delay ? 'var(--red)' : 'var(--green)' }}>
                      {f.departure?.delay ? `+${f.departure.delay} min` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards flights */}
          <div id="data-mobile" style={{ marginTop: '1px' }}>
            {flights.map((f, i) => (
              <div key={i} className="panel" style={{ borderRadius: '4px', marginBottom: '0.75rem', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span className="mono display" style={{ fontSize: '1.1rem', color: 'var(--amber)' }}>{f.flight?.iata || '—'}</span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: f.flight_status === 'active' ? 'var(--green)' : 'var(--muted)' }}>
                    {f.flight_status?.toUpperCase()}
                  </span>
                </div>
                <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: '0.4rem' }}>{f.airline?.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="mono" style={{ fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--amber)' }}>{f.departure?.iata}</span>
                    <span style={{ color: 'var(--muted)', margin: '0 0.4rem' }}>→</span>
                    <span style={{ color: 'var(--amber)' }}>{f.arrival?.iata}</span>
                    <span style={{ color: 'var(--muted)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>{f.departure?.scheduled?.slice(11, 16)}</span>
                  </div>
                  {f.departure?.delay ? (
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--red)' }}>+{f.departure.delay} min</span>
                  ) : (
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--green)' }}>À L'HEURE</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Météo */}
      {!loading && tab === 'weather' && (
        <>
          <div className="panel table-scroll" style={{ marginTop: '1px', display: 'none' }} id="weather-desktop">
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

          {/* Mobile cards météo */}
          <div id="weather-mobile" style={{ marginTop: '1px' }}>
            {weather.map((w, i) => (
              <div key={i} className="panel" style={{ borderRadius: '4px', marginBottom: '0.75rem', padding: '1rem' }}>
                <div className="mono display" style={{ fontSize: '1.1rem', color: 'var(--amber)', marginBottom: '0.5rem' }}>{w.city || w.name || '—'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { label: 'TEMP', val: w.main?.temp ? `${w.main.temp.toFixed(1)}°C` : '—' },
                    { label: 'HUMIDITÉ', val: w.main?.humidity ? `${w.main.humidity}%` : '—' },
                    { label: 'VENT', val: w.wind?.speed ? `${w.wind.speed} m/s` : '—' },
                    { label: 'CONDITIONS', val: w.weather?.[0]?.description || '—' }
                  ].map((item, j) => (
                    <div key={j}>
                      <div className="mono" style={{ fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '1px' }}>{item.label}</div>
                      <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}