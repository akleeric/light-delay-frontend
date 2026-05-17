'use client'
import { useState } from 'react'

const API = 'https://flight-delay-prediction-production-74cf.up.railway.app'

export default function LivePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [output, setOutput] = useState('')
  const [processed, setProcessed] = useState<Record<string, unknown>[]>([])

  const runPipeline = async (endpoint: string) => {
    setStatus('loading')
    setOutput('')
    try {
      const r = await fetch(`${API}/run/${endpoint}`, { method: 'POST' })
      const d = await r.json()
      setOutput(d.output || d.message || 'OK')
      setStatus('done')
      if (endpoint === 'live_prediction') {
        const p = await fetch(`${API}/flights/processed`)
        const pd = await p.json()
        setProcessed(Array.isArray(pd) ? pd : [])
      }
    } catch {
      setStatus('error')
      setOutput('Erreur de connexion')
    }
  }

  return (
    <div className="page-pad" style={{ minHeight: '100vh', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 className="display" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', color: 'var(--amber)', letterSpacing: '3px', marginBottom: '0.25rem' }}>
        PIPELINE LIVE
      </h1>
      <p className="mono" style={{ color: 'var(--muted)', fontSize: '0.7rem', marginBottom: '2rem' }}>
        COLLECTE TEMPS RÉEL · ENTRAÎNEMENT · PRÉDICTION AUTOMATIQUE
      </p>

      <div className="grid-3col" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'COLLECTE', sub: 'Vols + météo temps réel', endpoint: 'collector', icon: '📡' },
          { label: 'ENTRAÎNEMENT', sub: 'Réentraîner le modèle ML', endpoint: 'training', icon: '🧠' },
          { label: 'PRÉDICTION LIVE', sub: 'Pipeline complet automatique', endpoint: 'live_prediction', icon: '🔮' }
        ].map((item, i) => (
          <button key={i} onClick={() => runPipeline(item.endpoint)}
            disabled={status === 'loading'}
            className="panel mono"
            style={{
              padding: '1.5rem', border: '1px solid var(--border)',
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              textAlign: 'left', background: 'var(--panel)', width: '100%'
            }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{item.icon}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--amber)', letterSpacing: '2px' }}>{item.label}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{item.sub}</div>
          </button>
        ))}
      </div>

      {status !== 'idle' && (
        <div className="panel mono" style={{ padding: '1.5rem', borderRadius: '4px', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--amber-dim)', letterSpacing: '2px', marginBottom: '0.75rem' }}>
            SORTIE SYSTÈME
          </div>
          {status === 'loading' && <span className="blink" style={{ color: 'var(--amber)' }}>TRAITEMENT EN COURS...</span>}
          {status === 'done' && <pre style={{ color: 'var(--green)', fontSize: '0.8rem', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{output}</pre>}
          {status === 'error' && <span style={{ color: 'var(--red)' }}>{output}</span>}
        </div>
      )}

      {processed.length > 0 && (
        <div className="panel table-scroll" style={{ borderRadius: '4px' }}>
          <div className="mono" style={{ padding: '1rem 1.5rem', fontSize: '0.65rem', color: 'var(--amber-dim)', letterSpacing: '2px', borderBottom: '1px solid var(--border)' }}>
            DONNÉES PROCESSED ({processed.length} vols)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
            <thead>
              <tr className="mono" style={{ background: 'rgba(245,166,35,0.06)', fontSize: '0.6rem', color: 'var(--amber-dim)' }}>
                {['COMPAGNIE', 'DEP', 'ARR', 'HEURE', 'RETARD DEP', 'TEMP DEP'].map(h => (
                  <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', letterSpacing: '1px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processed.map((row, i) => (
                <tr key={i} className="fids-row mono" style={{ fontSize: '0.8rem' }}>
                  <td style={{ padding: '0.7rem 1rem', color: 'var(--amber)' }}>{String(row.airline_iata || '—')}</td>
                  <td style={{ padding: '0.7rem 1rem' }}>{String(row.departure_iata || '—')}</td>
                  <td style={{ padding: '0.7rem 1rem' }}>{String(row.arrival_iata || '—')}</td>
                  <td style={{ padding: '0.7rem 1rem', color: 'var(--muted)' }}>{String(row.scheduled_hour || '—')}h</td>
                  <td style={{ padding: '0.7rem 1rem', color: Number(row.departure_delay_actual) > 15 ? 'var(--red)' : 'var(--green)' }}>
                    {String(row.departure_delay_actual || 0)} min
                  </td>
                  <td style={{ padding: '0.7rem 1rem', color: 'var(--muted)' }}>{String(row.dep_temperature || '—')}°C</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}