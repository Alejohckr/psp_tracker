import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const FASES = ['Planeación', 'Diseño', 'Codificación', 'Compilación', 'Pruebas', 'Postmortem']
const ESTADOS = ['Pendiente', 'En progreso', 'Completado']
const LENGUAJES = ['Python', 'Java', 'C', 'C++', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'SQL', 'Otro']

const EMPTY = {
  fecha: new Date().toISOString().split('T')[0],
  archivo: '',
  lenguaje: 'Python',
  nombre_ejercicio: '',
  fase: 'Codificación',
  caracteristicas: '',
  loc_planeadas: '',
  loc_reales: '',
  tiempo_plan_min: '',
  tiempo_real_min: '',
  defectos: '',
  estado: 'Pendiente',
}

function LocComparison({ planeadas, reales }) {
  if (!planeadas && !reales) return <span className="text-[#9b9a97] text-sm">—</span>
  const diff = (reales || 0) - (planeadas || 0)
  const pct = planeadas > 0 ? Math.round((diff / planeadas) * 100) : 0
  return (
    <div className="text-sm">
      <span className="text-[#37352f]">{reales || 0}</span>
      <span className="text-[#9b9a97] mx-1">/</span>
      <span className="text-[#9b9a97]">{planeadas || 0}</span>
      {diff !== 0 && (
        <span className={`ml-1.5 text-xs ${diff > 0 ? 'text-amber-600' : 'text-green-700'}`}>
          ({diff > 0 ? '+' : ''}{pct}%)
        </span>
      )}
    </div>
  )
}

const inputCls = 'w-full px-2 py-1 border border-[#e9e7e4] rounded-[4px] bg-white focus:border-[#2f2f2f] text-sm text-[#37352f]'

function estadoBadge(e) {
  const m = { 'Pendiente': 'bg-gray-100 text-gray-600', 'En progreso': 'bg-blue-50 text-blue-700', 'Completado': 'bg-green-50 text-green-700' }
  return m[e] || 'bg-gray-100 text-gray-600'
}

export default function Ejercicios() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (user) fetchData() }, [user])

  async function fetchData() {
    setLoading(true)
    const { data } = await supabase.from('ejercicios').select('*').order('fecha', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function setEdit(k, v) { setEditForm(f => ({ ...f, [k]: v })) }

  const numFields = ['loc_planeadas', 'loc_reales', 'tiempo_plan_min', 'tiempo_real_min', 'defectos']

  async function handleAdd() {
    setSaving(true)
    setError('')
    const payload = { ...form, user_id: user.id }
    numFields.forEach(k => { payload[k] = Number(payload[k]) || 0 })
    const { data, error: err } = await supabase.from('ejercicios').insert(payload).select().single()
    if (err) { setError(err.message) } else {
      setRows([data, ...rows])
      setForm(EMPTY)
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const { id, user_id, ...fields } = editForm
    numFields.forEach(k => { fields[k] = Number(fields[k]) || 0 })
    const { data, error: err } = await supabase.from('ejercicios').update(fields).eq('id', editingId).select().single()
    if (err) { setError(err.message) } else {
      setRows(rows.map(r => r.id === editingId ? data : r))
      setEditingId(null)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    await supabase.from('ejercicios').delete().eq('id', id)
    setRows(rows.filter(r => r.id !== id))
  }

  const totals = {
    locPlan: rows.reduce((a, r) => a + (r.loc_planeadas || 0), 0),
    locReal: rows.reduce((a, r) => a + (r.loc_reales || 0), 0),
    timePlan: rows.reduce((a, r) => a + (r.tiempo_plan_min || 0), 0),
    timeReal: rows.reduce((a, r) => a + (r.tiempo_real_min || 0), 0),
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#37352f]">Ejercicios</h1>
          <p className="text-sm text-[#9b9a97] mt-1">Registro de ejercicios de programación</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="px-3 py-1.5 bg-[#2f2f2f] text-white text-sm rounded-[4px] hover:bg-[#1a1a1a] transition-colors flex items-center gap-1.5">
          <span>+</span> Agregar
        </button>
      </div>

      {/* Totals bar */}
      {rows.length > 0 && (
        <div className="mb-4 grid grid-cols-4 gap-3">
          {[
            { label: 'LOC planeadas', value: totals.locPlan },
            { label: 'LOC reales', value: totals.locReal },
            { label: 'Tiempo plan.', value: `${totals.timePlan} min` },
            { label: 'Tiempo real', value: `${totals.timeReal} min` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#f7f6f3] border border-[#e9e7e4] rounded-[6px] px-4 py-3">
              <p className="text-xs text-[#9b9a97]">{label}</p>
              <p className="text-base font-semibold text-[#37352f] mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      )}

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-[4px] px-3 py-2">{error}</div>}

      {showForm && (
        <div className="mb-6 bg-[#f7f6f3] border border-[#e9e7e4] rounded-[6px] p-5">
          <h3 className="text-sm font-medium text-[#37352f] mb-4">Nuevo ejercicio</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div><label className="block text-xs text-[#9b9a97] mb-1">Fecha</label><input type="date" value={form.fecha} onChange={e => setField('fecha', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Nombre ejercicio</label><input value={form.nombre_ejercicio} onChange={e => setField('nombre_ejercicio', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Archivo</label><input value={form.archivo} onChange={e => setField('archivo', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Lenguaje</label><select value={form.lenguaje} onChange={e => setField('lenguaje', e.target.value)} className={inputCls}>{LENGUAJES.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Fase</label><select value={form.fase} onChange={e => setField('fase', e.target.value)} className={inputCls}>{FASES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Estado</label><select value={form.estado} onChange={e => setField('estado', e.target.value)} className={inputCls}>{ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">LOC planeadas</label><input type="number" min="0" value={form.loc_planeadas} onChange={e => setField('loc_planeadas', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">LOC reales</label><input type="number" min="0" value={form.loc_reales} onChange={e => setField('loc_reales', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Tiempo plan. (min)</label><input type="number" min="0" value={form.tiempo_plan_min} onChange={e => setField('tiempo_plan_min', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Tiempo real (min)</label><input type="number" min="0" value={form.tiempo_real_min} onChange={e => setField('tiempo_real_min', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Defectos</label><input type="number" min="0" value={form.defectos} onChange={e => setField('defectos', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Características</label><input value={form.caracteristicas} onChange={e => setField('caracteristicas', e.target.value)} className={inputCls} /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="px-3 py-1.5 bg-[#2f2f2f] text-white text-sm rounded-[4px] hover:bg-[#1a1a1a] disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY) }} className="px-3 py-1.5 border border-[#e9e7e4] text-sm rounded-[4px] text-[#6b6968] hover:bg-[#e9e7e4]">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-[#9b9a97]">Cargando...</div>
      ) : (
        <div className="bg-white border border-[#e9e7e4] rounded-[6px] overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-[#e9e7e4] bg-[#f7f6f3]">
                {['Fecha', 'Ejercicio', 'Archivo', 'Lenguaje', 'Fase', 'LOC real/plan', 'T. real/plan', 'Defectos', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left text-xs text-[#9b9a97] font-medium px-4 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-[#9b9a97]">Sin ejercicios registrados.</td></tr>}
              {rows.map(row => {
                const isEditing = editingId === row.id
                if (isEditing) {
                  return (
                    <tr key={row.id} className="border-b border-[#e9e7e4] bg-[#fffdf5]">
                      <td className="px-3 py-2"><input type="date" value={editForm.fecha || ''} onChange={e => setEdit('fecha', e.target.value)} className={`${inputCls} w-32`} /></td>
                      <td className="px-3 py-2"><input value={editForm.nombre_ejercicio || ''} onChange={e => setEdit('nombre_ejercicio', e.target.value)} className={`${inputCls} w-28`} /></td>
                      <td className="px-3 py-2"><input value={editForm.archivo || ''} onChange={e => setEdit('archivo', e.target.value)} className={`${inputCls} w-28`} /></td>
                      <td className="px-3 py-2"><select value={editForm.lenguaje || ''} onChange={e => setEdit('lenguaje', e.target.value)} className={`${inputCls} w-24`}>{LENGUAJES.map(l => <option key={l} value={l}>{l}</option>)}</select></td>
                      <td className="px-3 py-2"><select value={editForm.fase || ''} onChange={e => setEdit('fase', e.target.value)} className={`${inputCls} w-28`}>{FASES.map(f => <option key={f} value={f}>{f}</option>)}</select></td>
                      <td className="px-3 py-2">
                        <input type="number" value={editForm.loc_reales || ''} onChange={e => setEdit('loc_reales', e.target.value)} className={`${inputCls} w-16 mb-1`} placeholder="Real" />
                        <input type="number" value={editForm.loc_planeadas || ''} onChange={e => setEdit('loc_planeadas', e.target.value)} className={`${inputCls} w-16`} placeholder="Plan" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={editForm.tiempo_real_min || ''} onChange={e => setEdit('tiempo_real_min', e.target.value)} className={`${inputCls} w-16 mb-1`} placeholder="Real" />
                        <input type="number" value={editForm.tiempo_plan_min || ''} onChange={e => setEdit('tiempo_plan_min', e.target.value)} className={`${inputCls} w-16`} placeholder="Plan" />
                      </td>
                      <td className="px-3 py-2"><input type="number" value={editForm.defectos || ''} onChange={e => setEdit('defectos', e.target.value)} className={`${inputCls} w-16`} /></td>
                      <td className="px-3 py-2"><select value={editForm.estado || ''} onChange={e => setEdit('estado', e.target.value)} className={`${inputCls} w-28`}>{ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}</select></td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button onClick={handleSave} disabled={saving} className="text-xs px-2 py-1 bg-[#2f2f2f] text-white rounded-[4px] disabled:opacity-50">{saving ? '...' : 'Guardar'}</button>
                          <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 border border-[#e9e7e4] rounded-[4px] text-[#6b6968]">Cancelar</button>
                        </div>
                      </td>
                    </tr>
                  )
                }
                return (
                  <tr key={row.id} className="border-b border-[#e9e7e4] last:border-0 hover:bg-[#f7f6f3] transition-colors">
                    <td className="px-4 py-2.5 text-sm text-[#37352f] whitespace-nowrap">{row.fecha}</td>
                    <td className="px-4 py-2.5 text-sm text-[#37352f] max-w-[140px] truncate">{row.nombre_ejercicio || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-[#37352f] max-w-[120px] truncate">{row.archivo || '—'}</td>
                    <td className="px-4 py-2.5"><span className="text-xs px-2 py-0.5 bg-[#f7f6f3] border border-[#e9e7e4] rounded-[4px] text-[#6b6968]">{row.lenguaje}</span></td>
                    <td className="px-4 py-2.5 text-sm text-[#37352f]">{row.fase}</td>
                    <td className="px-4 py-2.5"><LocComparison planeadas={row.loc_planeadas} reales={row.loc_reales} /></td>
                    <td className="px-4 py-2.5 text-sm text-[#37352f]">{row.tiempo_real_min || 0}/{row.tiempo_plan_min || 0} min</td>
                    <td className="px-4 py-2.5 text-sm text-[#37352f]">{row.defectos || 0}</td>
                    <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-[4px] font-medium ${estadoBadge(row.estado)}`}>{row.estado}</span></td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1.5">
                        <button onClick={() => { setEditingId(row.id); setEditForm({ ...row }) }} className="text-xs px-2 py-1 border border-[#e9e7e4] rounded-[4px] text-[#6b6968] hover:bg-[#e9e7e4]">Editar</button>
                        <button onClick={() => handleDelete(row.id)} className="text-xs px-2 py-1 border border-red-100 rounded-[4px] text-red-500 hover:bg-red-50">×</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
