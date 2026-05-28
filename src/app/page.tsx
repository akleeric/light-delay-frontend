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

interface Processed {
  flight_iata: string
  airline_iata: string
  departure_iata: string
  arrival_iata: string
  scheduled_hour: number
  day_of_week: number
  month: number
  is_weekend: number
  departure_delay_actual: number
  departure_delay_estimated: number
  arrival_delay_estimated: number
  flight_duration_scheduled: number
  dep_temperature: number
  dep_wind_speed: number
  dep_visibility: number
  dep_precipitation: number
  dep_weather_bad: number
  arr_temperature: number
  arr_wind_speed: number
  arr_visibility: number
  arr_precipitation: number
  arr_weather_bad: number
  prediction?: number
}

function formatTime(iso: string) {
  if (!iso) return '--:--'
  return iso.slice(11, 16)
}

function riskColor(delay: number | null, prediction: number | undefined) {
  if (prediction !== undefined) {
    if (prediction > 60) return 'var(--red)'
    if (prediction > 15) return 'var(--amber)'
    return 'var(--green)'
  }
  if (delay && delay > 30) return 'var(--red)'
  if (delay && delay > 0) return 'var(--amber)'
  return 'var(--green)'
}

function statusLabel(status: string, delay: number | null) {
  if (delay && delay > 0) return `+${delay}min`
  if (status === 'active') return 'EN VOL'
  if (status === 'landed') return 'ATTERRI'
  return status.toUpperCase()
}

export default function Home() {
  const [flights, setFlights] = useState<Flight[]>([])
  const [processed, setProcessed] = useState<Processed[]>([])
  const [loading, setLoading] = useState(true)
  const [predicting, setPredicting] = useState(false)
  const [time, setTime] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('fr-FR'))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    Promise.all([
      fetch(`${API}/flights/raw`).then(r => r.json()),
      fetch(`${API}/flights/processed`).then(r => r.json())
    ]).then(([raw, proc]) => {
      setFlights(Array.isArray(raw) ? raw : [])
      setProcessed(Array.isArray(proc) ? proc : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const runPredictions = async () => {
    if (processed.length === 0) return
    setPredicting(true)
    try {
      const res = await fetch(`${API}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flights: processed })
      })
      const data = await res.json()
      const preds: number[] = data.predictions || []
      setProcessed(prev => prev.map((p, i) => ({ ...p, prediction: preds[i] ?? undefined })))
    } catch (e) { console.error(e) }
    setPredicting(false)
  }

  // Merge flights + processed by airline+dep+arr
  const enriched = flights.map(f => {
    const proc = processed.find(p =>
      p.flight_iata === f.flight?.iata &&
      p.departure_iata === f.departure?.iata &&
      p.arrival_iata === f.arrival?.iata
    )
    return { flight: f, proc }
  })

  return (
    <div className="page-pad" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
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

      {/* Bouton prédiction batch */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={runPredictions} disabled={predicting || processed.length === 0}
          className="mono"
          style={{
            padding: '0.5rem 1.5rem',
            background: predicting ? 'var(--border)' : 'var(--amber)',
            color: predicting ? 'var(--muted)' : 'var(--navy)',
            border: 'none', fontSize: '0.75rem', letterSpacing: '2px',
            cursor: predicting ? 'not-allowed' : 'pointer', fontWeight: 'bold'
          }}>
          {predicting ? 'ANALYSE...' : '⚡ PRÉDIRE TOUS LES VOLS'}
        </button>
        {processed.some(p => p.prediction !== undefined) && (
          <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--green)' }}>
            {processed.filter(p => p.prediction !== undefined).length} prédictions actives
          </span>
        )}
      </div>

      {loading && (
        <div className="mono panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', borderRadius: '4px', marginBottom: '1rem' }}>
          <span className="blink">CHARGEMENT...</span>
        </div>
      )}

      {/* Desktop table */}
      <div className="panel table-scroll" style={{ borderRadius: '4px', display: isMobile ? 'none' : 'block' }}>
        <div className="mono" style={{
          display: 'grid',
          gridTemplateColumns: '90px 1fr 60px 60px 65px 70px 70px 110px 110px',
          minWidth: '800px',
          padding: '0.6rem 1rem',
          background: 'rgba(245,166,35,0.08)',
          borderBottom: '1px solid var(--border)',
          fontSize: '0.58rem', color: 'var(--amber-dim)', letterSpacing: '2px'
        }}>
          <span>VOL</span><span>COMPAGNIE</span><span>DEP</span><span>ARR</span>
          <span>PRÉVU</span><span>TEMP°C</span><span>RETARD</span><span>STATUT</span><span>PRÉDICTION ML</span>
        </div>
        {enriched.map(({ flight: f, proc }, i) => (
          <div key={i} className="fids-row mono" style={{
            display: 'grid',
            gridTemplateColumns: '90px 1fr 60px 60px 65px 70px 70px 110px 110px',
            minWidth: '800px',
            padding: '0.75rem 1rem',
            fontSize: '0.78rem', alignItems: 'center'
          }}>
            <a href={`/predict?flight=${f.flight?.iata}&dep=${f.departure?.iata}&arr=${f.arrival?.iata}&airline=${f.airline?.iata}`}
              style={{ color: 'var(--amber)', fontWeight: 'bold', textDecoration: 'none' }}>
              {f.flight?.iata || '—'}
            </a>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.airline?.name || '—'}</span>
            <span>{f.departure?.iata}</span>
            <span>{f.arrival?.iata}</span>
            <span style={{ color: 'var(--muted)' }}>{formatTime(f.departure?.scheduled)}</span>
            <span style={{ color: proc?.dep_temperature ? 'var(--text)' : 'var(--muted)' }}>
              {proc?.dep_temperature ? `${proc.dep_temperature.toFixed(0)}°` : '—'}
            </span>
            <span style={{ color: f.departure?.delay ? 'var(--amber)' : 'var(--muted)' }}>
              {f.departure?.delay ? `+${f.departure.delay}m` : '—'}
            </span>
            <span style={{ color: f.flight_status === 'active' ? 'var(--green)' : 'var(--muted)', fontSize: '0.72rem' }}>
              {statusLabel(f.flight_status, f.departure?.delay)}
            </span>
            <span>
              {proc?.prediction !== undefined ? (
                <span style={{
                  display: 'inline-block', padding: '0.15rem 0.6rem',
                  background: riskColor(f.departure?.delay, proc.prediction) + '22',
                  border: `1px solid ${riskColor(f.departure?.delay, proc.prediction)}`,
                  color: riskColor(f.departure?.delay, proc.prediction),
                  fontSize: '0.7rem', borderRadius: '2px'
                }}>
                  {proc.prediction.toFixed(0)} min
                </span>
              ) : (
                <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>—</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div style={{ display: isMobile ? 'block' : 'none' }}>
        {enriched.map(({ flight: f, proc }, i) => (
          <div key={i} className="panel" style={{ borderRadius: '4px', marginBottom: '0.75rem', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span className="mono display" style={{ fontSize: '1.2rem', color: 'var(--amber)' }}>{f.flight?.iata || '—'}</span>
              {proc?.prediction !== undefined ? (
                <span className="mono" style={{
                  fontSize: '0.75rem', padding: '0.15rem 0.6rem',
                  background: riskColor(f.departure?.delay, proc.prediction) + '22',
                  border: `1px solid ${riskColor(f.departure?.delay, proc.prediction)}`,
                  color: riskColor(f.departure?.delay, proc.prediction)
                }}>
                  {proc.prediction.toFixed(0)} min ML
                </span>
              ) : (
                <span className="mono" style={{ fontSize: '0.75rem', color: f.flight_status === 'active' ? 'var(--green)' : 'var(--muted)' }}>
                  {statusLabel(f.flight_status, f.departure?.delay)}
                </span>
              )}
            </div>
            <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: '0.5rem' }}>{f.airline?.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="mono" style={{ fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--amber)' }}>{f.departure?.iata}</span>
                <span style={{ color: 'var(--muted)', margin: '0 0.4rem' }}>→</span>
                <span style={{ color: 'var(--amber)' }}>{f.arrival?.iata}</span>
                <span style={{ color: 'var(--muted)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>{formatTime(f.departure?.scheduled)}</span>
                {proc?.dep_temperature && (
                  <span style={{ color: 'var(--muted)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                    {proc.dep_temperature.toFixed(0)}°C
                  </span>
                )}
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