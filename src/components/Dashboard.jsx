import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function MetricCard({ title, value, sub, icon, color }) {
  return (
    <div className="bg-white border border-[#e9e7e4] rounded-[6px] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#9b9a97] uppercase tracking-wide font-medium">{title}</p>
          <p className={`text-2xl font-semibold mt-1 ${color || 'text-[#37352f]'}`}>{value}</p>
          {sub && <p className="text-xs text-[#9b9a97] mt-0.5">{sub}</p>}
        </div>
        <span className="text-[#9b9a97] mt-0.5">{icon}</span>
      </div>
    </div>
  )
}

function fmtTime(mins) {
  if (!mins || mins === 0) return '0 min'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

export default function Dashboard({ onNavigate }) {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState({ desfase: 0, loc: 0, defectosAbiertos: 0, tiempoTotal: 0 })
  const [recentRegistros, setRecentRegistros] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchMetrics() {
      setLoading(true)
      const [regResult, ejercResult, defResult] = await Promise.all([
        supabase.from('psp_registro').select('tiempo_planeado_min, tiempo_real_min, desfase, fase, fecha').order('fecha', { ascending: false }),
        supabase.from('ejercicios').select('loc_reales'),
        supabase.from('defectos').select('estado'),
      ])

      const registros = regResult.data || []
      const ejercicios = ejercResult.data || []
      const defectos = defResult.data || []

      const desfase = registros.reduce((acc, r) => acc + (r.desfase || 0), 0)
      const tiempoTotal = registros.reduce((acc, r) => acc + (r.tiempo_real_min || 0), 0)
      const loc = ejercicios.reduce((acc, e) => acc + (e.loc_reales || 0), 0)
      const defectosAbiertos = defectos.filter(d => d.estado === 'Abierto').length

      setMetrics({ desfase, loc, defectosAbiertos, tiempoTotal })
      setRecentRegistros(registros.slice(0, 5))
      setLoading(false)
    }

    fetchMetrics()
  }, [user])

  const ClockIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
  const CodeIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  )
  const BugIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
    </svg>
  )
  const TimeIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8"/>
    </svg>
  )

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#37352f]">Dashboard</h1>
        <p className="text-sm text-[#9b9a97] mt-1">Resumen de tu proceso de software personal</p>
      </div>

      {loading ? (
        <div className="text-sm text-[#9b9a97]">Cargando métricas...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <MetricCard
              title="Desfase acumulado"
              value={fmtTime(Math.abs(metrics.desfase))}
              sub={metrics.desfase > 0 ? 'sobre el plan' : metrics.desfase < 0 ? 'adelantado' : 'en tiempo'}
              icon={ClockIcon}
              color={metrics.desfase > 60 ? 'text-red-600' : metrics.desfase < -30 ? 'text-green-700' : 'text-[#37352f]'}
            />
            <MetricCard
              title="LOC totales"
              value={metrics.loc}
              sub="líneas de código reales"
              icon={CodeIcon}
            />
            <MetricCard
              title="Defectos abiertos"
              value={metrics.defectosAbiertos}
              sub="pendientes de cierre"
              icon={BugIcon}
              color={metrics.defectosAbiertos > 0 ? 'text-amber-600' : 'text-green-700'}
            />
            <MetricCard
              title="Tiempo total"
              value={fmtTime(metrics.tiempoTotal)}
              sub="tiempo real invertido"
              icon={TimeIcon}
            />
          </div>

          <div className="bg-white border border-[#e9e7e4] rounded-[6px]">
            <div className="px-5 py-4 border-b border-[#e9e7e4] flex items-center justify-between">
              <h2 className="text-sm font-medium text-[#37352f]">Registros recientes</h2>
              <button
                onClick={() => onNavigate('registro-psp')}
                className="text-xs text-[#9b9a97] hover:text-[#37352f] transition-colors"
              >
                Ver todos →
              </button>
            </div>
            {recentRegistros.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[#9b9a97]">
                No hay registros todavía.{' '}
                <button onClick={() => onNavigate('registro-psp')} className="text-[#37352f] underline">
                  Agregar registro
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e9e7e4]">
                    {['Fecha', 'Fase', 'Actividad', 'Planeado', 'Real', 'Desfase'].map(h => (
                      <th key={h} className="text-left text-xs text-[#9b9a97] font-medium px-5 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentRegistros.map((r, i) => (
                    <tr key={i} className="border-b border-[#e9e7e4] last:border-0 hover:bg-[#f7f6f3] transition-colors">
                      <td className="px-5 py-2.5 text-sm text-[#37352f]">{r.fecha}</td>
                      <td className="px-5 py-2.5 text-sm text-[#37352f]">{r.fase}</td>
                      <td className="px-5 py-2.5 text-sm text-[#37352f] max-w-[200px] truncate">{r.actividad || '—'}</td>
                      <td className="px-5 py-2.5 text-sm text-[#37352f]">{r.tiempo_planeado_min} min</td>
                      <td className="px-5 py-2.5 text-sm text-[#37352f]">{r.tiempo_real_min} min</td>
                      <td className="px-5 py-2.5 text-sm">
                        <span className={`font-medium ${(r.desfase || 0) > 0 ? 'text-red-600' : (r.desfase || 0) < 0 ? 'text-green-700' : 'text-[#9b9a97]'}`}>
                          {(r.desfase || 0) > 0 ? '+' : ''}{r.desfase || 0} min
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
