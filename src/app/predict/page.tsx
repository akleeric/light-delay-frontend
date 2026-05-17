'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const API = 'https://flight-delay-prediction-production-74cf.up.railway.app'

interface FlightRaw {
  flight: { iata: string }
  airline: { name: string; iata: string }
  departure: { iata: string; scheduled: string; actual: string | null; estimated: string | null; delay: number | null }
  arrival: { iata: string; scheduled: string; estimated: string | null }
}

function toDelay(actual: string | null, scheduled: string): number {
  if (!actual || !scheduled) return 0
  return Math.max(0, (new Date(actual).getTime() - new Date(scheduled).getTime()) / 60000)
}

function toDuration(dep: string, arr: string): number {
  if (!dep || !arr) return 120
  return Math.max(0, (new Date(arr).getTime() - new Date(dep).getTime()) / 60000)
}

function PredictContent() {
  const params = useSearchParams()
  const [flights, setFlights] = useState<FlightRaw[]>([])
  const [selected, setSelected] = useState<FlightRaw | null>(null)
  const [result, setResult] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [depTemp, setDepTemp] = useState(15)
  const [arrTemp, setArrTemp] = useState(15)
  const [depWind, setDepWind] = useState(5)

  useEffect(() => {
    fetch(`${API}/flights/raw`)
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : []
        setFlights(list)
        const flightParam = params.get('flight')
        const found = flightParam ? list.find((f: FlightRaw) => f.flight?.iata === flightParam) : null
        setSelected(found || list[0] || null)
      })
  }, [params])

  const predict = async () => {
    if (!selected) return
    setLoading(true)
    setResult(null)
    const dep = selected.departure
    const arr = selected.arrival
    const sched = dep.scheduled
    const arrSched = arr.scheduled
    try {
      const res = await fetch(`${API}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flights: [{
            airline_iata: selected.airline?.iata || '',
            departure_iata: dep.iata,
            arrival_iata: arr.iata,
            scheduled_hour: new Date(sched).getUTCHours(),
            day_of_week: new Date(sched).getUTCDay() || 7,
            month: new Date(sched).getUTCMonth() + 1,
            is_weekend: [6, 7].includes(new Date(sched).getUTCDay()) ? 1 : 0,
            departure_delay_actual: toDelay(dep.actual, sched),
            departure_delay_estimated: toDelay(dep.estimated, sched),
            arrival_delay_estimated: toDelay(arr.estimated, arrSched),
            flight_duration_scheduled: toDuration(sched, arrSched),
            dep_temperature: depTemp,
            dep_wind_speed: depWind,
            dep_visibility: 10000,
            dep_precipitation: 0,
            dep_weather_bad: 0,
            arr_temperature: arrTemp,
            arr_wind_speed: 5,
            arr_visibility: 10000,
            arr_precipitation: 0,
            arr_weather_bad: 0
          }]
        })
      })
      const data = await res.json()
      setResult(data.predictions?.[0] ?? 0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const riskColor = result === null ? 'var(--muted)' : result > 60 ? 'var(--red)' : result > 15 ? 'var(--amber)' : 'var(--green)'
  const riskLabel = result === null ? '—' : result > 60 ? 'RISQUE ÉLEVÉ' : result > 15 ? 'RETARD MODÉRÉ' : 'À L\'HEURE'

  return (
    <div className="page-pad" style={{ minHeight: '100vh', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 className="display" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', color: 'var(--amber)', letterSpacing: '3px', marginBottom: '0.25rem' }}>
        PRÉDICTION
      </h1>
      <p className="mono" style={{ color: 'var(--muted)', fontSize: '0.7rem', marginBottom: '2rem' }}>
        SÉLECTIONNEZ UN VOL ET LANCEZ L'ANALYSE ML
      </p>

      <div className="grid-2col">
        {/* Formulaire */}
        <div className="panel" style={{ padding: '1.5rem', borderRadius: '4px' }}>
          <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--amber-dim)', letterSpacing: '2px', marginBottom: '1rem' }}>
            SÉLECTION DU VOL
          </div>
          <select
            className="mono"
            onChange={e => {
              const f = flights.find(fl => fl.flight?.iata === e.target.value)
              if (f) { setSelected(f); setResult(null) }
            }}
            value={selected?.flight?.iata || ''}
            style={{
              width: '100%', background: 'var(--bg)', color: 'var(--text)',
              border: '1px solid var(--border)', padding: '0.6rem',
              fontSize: '0.8rem', marginBottom: '1.5rem', outline: 'none'
            }}
          >
            {flights.map((f, i) => (
              <option key={i} value={f.flight?.iata}>
                {f.flight?.iata} | {f.airline?.name} | {f.departure?.iata} → {f.arrival?.iata}
              </option>
            ))}
          </select>

          {selected && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'VOL', val: selected.flight?.iata },
                { label: 'COMPAGNIE', val: selected.airline?.name },
                { label: 'DÉPART', val: selected.departure?.iata },
                { label: 'ARRIVÉE', val: selected.arrival?.iata },
                { label: 'HEURE PRÉVUE', val: selected.departure?.scheduled?.slice(11, 16) },
                { label: 'RETARD ACTUEL', val: `${toDelay(selected.departure?.actual, selected.departure?.scheduled).toFixed(0)} min` }
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(245,166,35,0.04)', padding: '0.6rem', borderLeft: '2px solid var(--amber-dim)' }}>
                  <div className="mono" style={{ fontSize: '0.55rem', color: 'var(--muted)', letterSpacing: '1px' }}>{item.label}</div>
                  <div className="mono" style={{ fontSize: '0.85rem', color: 'var(--text)', marginTop: '0.2rem' }}>{item.val || '—'}</div>
                </div>
              ))}
            </div>
          )}

          <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--amber-dim)', letterSpacing: '2px', marginBottom: '0.75rem' }}>
            PARAMÈTRES MÉTÉO
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'TEMP DEP °C', val: depTemp, set: setDepTemp },
              { label: 'VENT m/s', val: depWind, set: setDepWind },
              { label: 'TEMP ARR °C', val: arrTemp, set: setArrTemp }
            ].map((item, i) => (
              <div key={i}>
                <div className="mono" style={{ fontSize: '0.55rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>{item.label}</div>
                <input type="number" value={item.val} onChange={e => item.set(Number(e.target.value))}
                  className="mono"
                  style={{ width: '100%', background: 'var(--bg)', color: 'var(--amber)', border: '1px solid var(--border)', padding: '0.4rem', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
            ))}
          </div>

          <button onClick={predict} disabled={loading || !selected} className="mono"
            style={{
              width: '100%', padding: '0.9rem',
              background: loading ? 'var(--border)' : 'var(--amber)',
              color: loading ? 'var(--muted)' : '#000',
              border: 'none', fontSize: '0.85rem', letterSpacing: '3px',
              cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold'
            }}>
            {loading ? 'ANALYSE...' : 'LANCER LA PRÉDICTION →'}
          </button>
        </div>

        {/* Résultat */}
        <div className="panel" style={{ padding: '1.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--amber-dim)', letterSpacing: '2px', marginBottom: '2rem' }}>
            RÉSULTAT DE L'ANALYSE
          </div>

          {result === null ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }}>✈</div>
              <div className="mono" style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>EN ATTENTE</div>
            </div>
          ) : (
            <>
              <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '1.5rem' }}>
                <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="80" cy="80" r="65" fill="none" stroke="var(--border)" strokeWidth="10" />
                  <circle cx="80" cy="80" r="65" fill="none" stroke={riskColor} strokeWidth="10"
                    strokeDasharray={`${Math.min(result / 120 * 408, 408)} 408`}
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="display" style={{ fontSize: '2.5rem', color: riskColor, lineHeight: 1 }}>{result.toFixed(0)}</div>
                  <div className="mono" style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>MINUTES</div>
                </div>
              </div>
              <div className="display" style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', color: riskColor, letterSpacing: '3px', marginBottom: '1rem' }}>
                {riskLabel}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', width: '100%' }}>
                {[
                  { label: '< 15 MIN', color: 'var(--green)', active: result <= 15 },
                  { label: '15-60 MIN', color: 'var(--amber)', active: result > 15 && result <= 60 },
                  { label: '> 60 MIN', color: 'var(--red)', active: result > 60 }
                ].map((item, i) => (
                  <div key={i} className="mono" style={{
                    padding: '0.5rem', textAlign: 'center', fontSize: '0.6rem',
                    border: `1px solid ${item.active ? item.color : 'var(--border)'}`,
                    color: item.active ? item.color : 'var(--muted)',
                    background: item.active ? `${item.color}15` : 'transparent'
                  }}>{item.label}</div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PredictPage() {
  return <Suspense><PredictContent /></Suspense>
}