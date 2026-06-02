import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const FASES = ['Planeación', 'Diseño de alto nivel', 'Diseño', 'Codificación', 'Compilación', 'Pruebas', 'Postmortem']
const TIPOS = ['10 - Documentación', '20 - Sintaxis', '30 - Build/Package', '40 - Asignación', '50 - Interface', '60 - Verificación', '70 - Data', '80 - Función', '90 - Sistema', '100 - Ambiente']
const ESTADOS = ['Abierto', 'En progreso', 'Cerrado']

const EMPTY = {
  fecha: new Date().toISOString().split('T')[0],
  archivo: '',
  descripcion: '',
  tipo_defecto: '80 - Función',
  fase_inyeccion: 'Codificación',
  fase_remocion: 'Pruebas',
  tiempo_correccion_min: '',
  causa_probable: '',
  estado: 'Abierto',
}

const inputCls = 'w-full px-2 py-1 border border-[#e9e7e4] rounded-[4px] bg-white focus:border-[#2f2f2f] text-sm text-[#37352f]'

function estadoBadge(e) {
  const m = { 'Abierto': 'bg-red-50 text-red-700', 'En progreso': 'bg-blue-50 text-blue-700', 'Cerrado': 'bg-green-50 text-green-700' }
  return m[e] || 'bg-gray-100 text-gray-600'
}

export default function Defectos() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('all')
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
    const { data } = await supabase.from('defectos').select('*').order('fecha', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function setEdit(k, v) { setEditForm(f => ({ ...f, [k]: v })) }

  async function handleAdd() {
    setSaving(true)
    setError('')
    const payload = { ...form, tiempo_correccion_min: Number(form.tiempo_correccion_min) || 0 }
    const { data, error: err } = await supabase.from('defectos').insert(payload).select().single()
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
    fields.tiempo_correccion_min = Number(fields.tiempo_correccion_min) || 0
    const { data, error: err } = await supabase.from('defectos').update(fields).eq('id', editingId).select().single()
    if (err) { setError(err.message) } else {
      setRows(rows.map(r => r.id === editingId ? data : r))
      setEditingId(null)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    await supabase.from('defectos').delete().eq('id', id)
    setRows(rows.filter(r => r.id !== id))
  }

  const filtered = filtroEstado === 'all' ? rows : rows.filter(r => r.estado === filtroEstado)

  const counts = {
    Abierto: rows.filter(r => r.estado === 'Abierto').length,
    'En progreso': rows.filter(r => r.estado === 'En progreso').length,
    Cerrado: rows.filter(r => r.estado === 'Cerrado').length,
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#37352f]">Defectos</h1>
          <p className="text-sm text-[#9b9a97] mt-1">Registro y seguimiento de defectos</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="px-3 py-1.5 bg-[#2f2f2f] text-white text-sm rounded-[4px] hover:bg-[#1a1a1a] transition-colors flex items-center gap-1.5">
          <span>+</span> Registrar defecto
        </button>
      </div>

      {/* Summary */}
      <div className="flex gap-3 mb-4">
        {[
          { label: 'Abiertos', count: counts.Abierto, cls: 'bg-red-50 border-red-100 text-red-700' },
          { label: 'En progreso', count: counts['En progreso'], cls: 'bg-blue-50 border-blue-100 text-blue-700' },
          { label: 'Cerrados', count: counts.Cerrado, cls: 'bg-green-50 border-green-100 text-green-700' },
        ].map(({ label, count, cls }) => (
          <div key={label} className={`flex items-center gap-2 px-4 py-2 border rounded-[6px] ${cls}`}>
            <span className="text-lg font-semibold">{count}</span>
            <span className="text-sm">{label}</span>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1.5 mb-4">
        {['all', ...ESTADOS].map(s => (
          <button key={s} onClick={() => setFiltroEstado(s)}
            className={`px-3 py-1 rounded-[4px] text-sm transition-colors ${filtroEstado === s ? 'bg-[#2f2f2f] text-white' : 'bg-[#f7f6f3] text-[#6b6968] hover:bg-[#e9e7e4]'}`}>
            {s === 'all' ? 'Todos' : s}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-[4px] px-3 py-2">{error}</div>}

      {showForm && (
        <div className="mb-6 bg-[#f7f6f3] border border-[#e9e7e4] rounded-[6px] p-5">
          <h3 className="text-sm font-medium text-[#37352f] mb-4">Nuevo defecto</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div><label className="block text-xs text-[#9b9a97] mb-1">Fecha</label><input type="date" value={form.fecha} onChange={e => setField('fecha', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Archivo</label><input value={form.archivo} onChange={e => setField('archivo', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Tipo de defecto</label><select value={form.tipo_defecto} onChange={e => setField('tipo_defecto', e.target.value)} className={inputCls}>{TIPOS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Fase inyección</label><select value={form.fase_inyeccion} onChange={e => setField('fase_inyeccion', e.target.value)} className={inputCls}>{FASES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Fase remoción</label><select value={form.fase_remocion} onChange={e => setField('fase_remocion', e.target.value)} className={inputCls}>{FASES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Tiempo corrección (min)</label><input type="number" min="0" value={form.tiempo_correccion_min} onChange={e => setField('tiempo_correccion_min', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Estado</label><select value={form.estado} onChange={e => setField('estado', e.target.value)} className={inputCls}>{ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="col-span-2"><label className="block text-xs text-[#9b9a97] mb-1">Descripción</label><input value={form.descripcion} onChange={e => setField('descripcion', e.target.value)} className={inputCls} /></div>
            <div className="col-span-3"><label className="block text-xs text-[#9b9a97] mb-1">Causa probable</label><input value={form.causa_probable} onChange={e => setField('causa_probable', e.target.value)} className={inputCls} /></div>
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
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-[#e9e7e4] bg-[#f7f6f3]">
                {['Fecha', 'Archivo', 'Descripción', 'Tipo', 'Inyección', 'Remoción', 'T. corrección', 'Causa', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left text-xs text-[#9b9a97] font-medium px-4 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-[#9b9a97]">Sin defectos registrados.</td></tr>}
              {filtered.map(row => {
                const isEditing = editingId === row.id
                if (isEditing) {
                  return (
                    <tr key={row.id} className="border-b border-[#e9e7e4] bg-[#fffdf5]">
                      <td className="px-3 py-2"><input type="date" value={editForm.fecha || ''} onChange={e => setEdit('fecha', e.target.value)} className={`${inputCls} w-32`} /></td>
                      <td className="px-3 py-2"><input value={editForm.archivo || ''} onChange={e => setEdit('archivo', e.target.value)} className={`${inputCls} w-24`} /></td>
                      <td className="px-3 py-2"><input value={editForm.descripcion || ''} onChange={e => setEdit('descripcion', e.target.value)} className={`${inputCls} w-40`} /></td>
                      <td className="px-3 py-2"><select value={editForm.tipo_defecto || ''} onChange={e => setEdit('tipo_defecto', e.target.value)} className={`${inputCls} w-32`}>{TIPOS.map(t => <option key={t} value={t}>{t}</option>)}</select></td>
                      <td className="px-3 py-2"><select value={editForm.fase_inyeccion || ''} onChange={e => setEdit('fase_inyeccion', e.target.value)} className={`${inputCls} w-28`}>{FASES.map(f => <option key={f} value={f}>{f}</option>)}</select></td>
                      <td className="px-3 py-2"><select value={editForm.fase_remocion || ''} onChange={e => setEdit('fase_remocion', e.target.value)} className={`${inputCls} w-28`}>{FASES.map(f => <option key={f} value={f}>{f}</option>)}</select></td>
                      <td className="px-3 py-2"><input type="number" value={editForm.tiempo_correccion_min || ''} onChange={e => setEdit('tiempo_correccion_min', e.target.value)} className={`${inputCls} w-20`} /></td>
                      <td className="px-3 py-2"><input value={editForm.causa_probable || ''} onChange={e => setEdit('causa_probable', e.target.value)} className={`${inputCls} w-36`} /></td>
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
                    <td className="px-4 py-2.5 text-sm text-[#37352f]">{row.archivo || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-[#37352f] max-w-[180px] truncate">{row.descripcion || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-[#6b6968]">{row.tipo_defecto}</td>
                    <td className="px-4 py-2.5 text-sm text-[#37352f]">{row.fase_inyeccion}</td>
                    <td className="px-4 py-2.5 text-sm text-[#37352f]">{row.fase_remocion}</td>
                    <td className="px-4 py-2.5 text-sm text-[#37352f]">{row.tiempo_correccion_min || 0} min</td>
                    <td className="px-4 py-2.5 text-sm text-[#37352f] max-w-[160px] truncate">{row.causa_probable || '—'}</td>
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
