import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'

const FASES_ORDER = ['Planeación', 'Diseño de alto nivel', 'Revisión de diseño de alto nivel', 'Diseño', 'Revisión de diseño', 'Codificación', 'Revisión de código', 'Compilación', 'Pruebas', 'Postmortem']

const FASE_SHORT = {
  'Planeación': 'Plan.',
  'Diseño de alto nivel': 'DAL',
  'Revisión de diseño de alto nivel': 'RDAL',
  'Diseño': 'Diseño',
  'Revisión de diseño': 'RD',
  'Codificación': 'Cod.',
  'Revisión de código': 'RC',
  'Compilación': 'Comp.',
  'Pruebas': 'Pruebas',
  'Postmortem': 'PM',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#e9e7e4] rounded-[6px] px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-[#37352f] mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.name}: <span className="font-medium">{p.value} min</span>
        </p>
      ))}
      {payload.length === 2 && (
        <p className="text-[#9b9a97] mt-1">
          Desfase: <span className={`font-medium ${payload[1].value - payload[0].value > 0 ? 'text-red-600' : 'text-green-700'}`}>
            {payload[1].value - payload[0].value > 0 ? '+' : ''}{payload[1].value - payload[0].value} min
          </span>
        </p>
      )}
    </div>
  )
}

export default function Metricas() {
  const { user } = useAuth()
  const [registros, setRegistros] = useState([])
  const [ejercicios, setEjercicios] = useState([])
  const [defectos, setDefectos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) fetchData() }, [user])

  async function fetchData() {
    setLoading(true)
    const [r, e, d] = await Promise.all([
      supabase.from('psp_registro').select('fase, tiempo_planeado_min, tiempo_real_min'),
      supabase.from('ejercicios').select('fase, loc_planeadas, loc_reales, nombre_ejercicio, tiempo_plan_min, tiempo_real_min'),
      supabase.from('defectos').select('tipo_defecto, fase_inyeccion, fase_remocion, tiempo_correccion_min, estado'),
    ])
    setRegistros(r.data || [])
    setEjercicios(e.data || [])
    setDefectos(d.data || [])
    setLoading(false)
  }

  // Tiempo planeado vs real por fase
  const tiempoPorFase = FASES_ORDER.map(fase => {
    const items = registros.filter(r => r.fase === fase)
    return {
      name: FASE_SHORT[fase] || fase,
      fullName: fase,
      Planeado: items.reduce((a, r) => a + (r.tiempo_planeado_min || 0), 0),
      Real: items.reduce((a, r) => a + (r.tiempo_real_min || 0), 0),
    }
  }).filter(f => f.Planeado > 0 || f.Real > 0)

  // LOC por ejercicio
  const locData = ejercicios.map(e => ({
    name: e.nombre_ejercicio || 'Sin nombre',
    Planeadas: e.loc_planeadas || 0,
    Reales: e.loc_reales || 0,
  }))

  // Defectos por tipo
  const defsByTipo = {}
  defectos.forEach(d => {
    const key = d.tipo_defecto || 'Sin tipo'
    defsByTipo[key] = (defsByTipo[key] || 0) + 1
  })
  const defData = Object.entries(defsByTipo).map(([name, count]) => ({ name: name.split(' - ')[1] || name, count }))

  // Defectos por fase de inyección
  const defsByFase = {}
  defectos.forEach(d => {
    if (d.fase_inyeccion) defsByFase[d.fase_inyeccion] = (defsByFase[d.fase_inyeccion] || 0) + 1
  })
  const defFaseData = Object.entries(defsByFase).map(([fase, count]) => ({ name: FASE_SHORT[fase] || fase, count }))

  // Summary stats
  const totalPlaneado = registros.reduce((a, r) => a + (r.tiempo_planeado_min || 0), 0)
  const totalReal = registros.reduce((a, r) => a + (r.tiempo_real_min || 0), 0)
  const totalLocPlan = ejercicios.reduce((a, e) => a + (e.loc_planeadas || 0), 0)
  const totalLocReal = ejercicios.reduce((a, e) => a + (e.loc_reales || 0), 0)
  const defAbiertos = defectos.filter(d => d.estado === 'Abierto').length

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#37352f]">Métricas</h1>
        <p className="text-sm text-[#9b9a97] mt-1">Análisis visual del proceso de software</p>
      </div>

      {loading ? (
        <div className="text-sm text-[#9b9a97]">Cargando datos...</div>
      ) : (
        <div className="space-y-6">

          {/* Summary row */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Tiempo planeado total', value: `${totalPlaneado} min`, sub: `${Math.floor(totalPlaneado / 60)}h ${totalPlaneado % 60}min` },
              { label: 'Tiempo real total', value: `${totalReal} min`, sub: `${Math.floor(totalReal / 60)}h ${totalReal % 60}min`, accent: totalReal > totalPlaneado },
              { label: 'LOC real vs planeadas', value: `${totalLocReal} / ${totalLocPlan}`, sub: totalLocPlan > 0 ? `${Math.round((totalLocReal / totalLocPlan) * 100)}% del plan` : '—' },
              { label: 'Defectos abiertos', value: defAbiertos, sub: `${defectos.length} total`, accent: defAbiertos > 0 },
            ].map(({ label, value, sub, accent }) => (
              <div key={label} className="bg-white border border-[#e9e7e4] rounded-[6px] p-4">
                <p className="text-xs text-[#9b9a97] uppercase tracking-wide">{label}</p>
                <p className={`text-xl font-semibold mt-1 ${accent ? 'text-amber-600' : 'text-[#37352f]'}`}>{value}</p>
                <p className="text-xs text-[#9b9a97] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Tiempo por fase chart */}
          {tiempoPorFase.length > 0 ? (
            <div className="bg-white border border-[#e9e7e4] rounded-[6px] p-6">
              <h2 className="text-sm font-semibold text-[#37352f] mb-4">Tiempo planeado vs real por fase (min)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tiempoPorFase} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1ef" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9b9a97' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9b9a97' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                  <Bar dataKey="Planeado" fill="#d3d1cb" radius={[3, 3, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Real" fill="#2f2f2f" radius={[3, 3, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-white border border-[#e9e7e4] rounded-[6px] p-6 text-center text-sm text-[#9b9a97]">
              Sin datos de registro PSP para mostrar gráfica de tiempo.
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* LOC chart */}
            {locData.length > 0 ? (
              <div className="bg-white border border-[#e9e7e4] rounded-[6px] p-6">
                <h2 className="text-sm font-semibold text-[#37352f] mb-4">LOC planeadas vs reales por ejercicio</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={locData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f1ef" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9b9a97' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9b9a97' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                    <Bar dataKey="Planeadas" fill="#d3d1cb" radius={[3, 3, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="Reales" fill="#2f2f2f" radius={[3, 3, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-white border border-[#e9e7e4] rounded-[6px] p-6 text-center text-sm text-[#9b9a97]">
                Sin datos de ejercicios para la gráfica de LOC.
              </div>
            )}

            {/* Defectos por tipo */}
            {defData.length > 0 ? (
              <div className="bg-white border border-[#e9e7e4] rounded-[6px] p-6">
                <h2 className="text-sm font-semibold text-[#37352f] mb-4">Defectos por tipo</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={defData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f1ef" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#9b9a97' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#9b9a97' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" name="Defectos" fill="#2f2f2f" radius={[0, 3, 3, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-white border border-[#e9e7e4] rounded-[6px] p-6 text-center text-sm text-[#9b9a97]">
                Sin defectos registrados para la gráfica.
              </div>
            )}
          </div>

          {/* Defectos por fase inyección */}
          {defFaseData.length > 0 && (
            <div className="bg-white border border-[#e9e7e4] rounded-[6px] p-6">
              <h2 className="text-sm font-semibold text-[#37352f] mb-4">Defectos por fase de inyección</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={defFaseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1ef" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9b9a97' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9b9a97' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Defectos" fill="#dc2626" radius={[3, 3, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
