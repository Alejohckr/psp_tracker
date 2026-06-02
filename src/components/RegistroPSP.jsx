import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const FASES = ['Planeación', 'Diseño de alto nivel', 'Revisión de diseño de alto nivel', 'Diseño', 'Revisión de diseño', 'Codificación', 'Revisión de código', 'Compilación', 'Pruebas', 'Postmortem']

const EMPTY = {
  fecha: new Date().toISOString().split('T')[0],
  fase: 'Codificación',
  actividad: '',
  descripcion_actividad: '',
  tiempo_planeado_min: '',
  tiempo_real_min: '',
  tiempo_interrupcion_min: '',
  descripcion_interrupcion: '',
}

function DesfaseTag({ val }) {
  if (val === null || val === undefined) return <span className="text-[#9b9a97] text-sm">—</span>
  const color = val > 0 ? 'text-red-600' : val < 0 ? 'text-green-700' : 'text-[#9b9a97]'
  return <span className={`text-sm font-medium ${color}`}>{val > 0 ? '+' : ''}{val} min</span>
}

export default function RegistroPSP() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => { if (user) fetchData() }, [user])

  async function fetchData() {
    setLoading(true)
    const { data } = await supabase
      .from('psp_registro')
      .select('*')
      .order('fecha', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function setEdit(k, v) { setEditForm(f => ({ ...f, [k]: v })) }

  async function handleAdd() {
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      user_id: user.id,
      tiempo_planeado_min: Number(form.tiempo_planeado_min) || 0,
      tiempo_real_min: Number(form.tiempo_real_min) || 0,
      tiempo_interrupcion_min: Number(form.tiempo_interrupcion_min) || 0,
    }
    const { data, error: err } = await supabase.from('psp_registro').insert(payload).select().single()
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
    const { id, user_id, created_at, desfase, ...fields } = editForm
    const numFields = ['tiempo_planeado_min', 'tiempo_real_min', 'tiempo_interrupcion_min']
    numFields.forEach(k => { fields[k] = Number(fields[k]) || 0 })
    const { data, error: err } = await supabase.from('psp_registro').update(fields).eq('id', editingId).select().single()
    if (err) { setError(err.message) } else {
      setRows(rows.map(r => r.id === editingId ? data : r))
      setEditingId(null)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    const { error: err } = await supabase.from('psp_registro').delete().eq('id', id)
    if (!err) setRows(rows.filter(r => r.id !== id))
  }

  const inputCls = 'w-full px-2 py-1 border border-[#e9e7e4] rounded-[4px] bg-white focus:border-[#2f2f2f] text-sm text-[#37352f]'

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#37352f]">Registro PSP</h1>
          <p className="text-sm text-[#9b9a97] mt-1">Registro diario de tiempo y actividades</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-3 py-1.5 bg-[#2f2f2f] text-white text-sm rounded-[4px] hover:bg-[#1a1a1a] transition-colors flex items-center gap-1.5"
        >
          <span>+</span> Agregar
        </button>
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-[4px] px-3 py-2">{error}</div>}

      {/* Add form */}
      {showForm && (
        <div className="mb-6 bg-[#f7f6f3] border border-[#e9e7e4] rounded-[6px] p-5">
          <h3 className="text-sm font-medium text-[#37352f] mb-4">Nuevo registro</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-[#9b9a97] mb-1">Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setField('fecha', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[#9b9a97] mb-1">Fase</label>
              <select value={form.fase} onChange={e => setField('fase', e.target.value)} className={inputCls}>
                {FASES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#9b9a97] mb-1">Actividad</label>
              <input value={form.actividad} onChange={e => setField('actividad', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[#9b9a97] mb-1">Descripción</label>
              <input value={form.descripcion_actividad} onChange={e => setField('descripcion_actividad', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[#9b9a97] mb-1">Tiempo planeado (min)</label>
              <input type="number" min="0" value={form.tiempo_planeado_min} onChange={e => setField('tiempo_planeado_min', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[#9b9a97] mb-1">Tiempo real (min)</label>
              <input type="number" min="0" value={form.tiempo_real_min} onChange={e => setField('tiempo_real_min', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[#9b9a97] mb-1">Tiempo interrupción (min)</label>
              <input type="number" min="0" value={form.tiempo_interrupcion_min} onChange={e => setField('tiempo_interrupcion_min', e.target.value)} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-[#9b9a97] mb-1">Descripción interrupción</label>
              <input value={form.descripcion_interrupcion} onChange={e => setField('descripcion_interrupcion', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAdd} disabled={saving} className="px-3 py-1.5 bg-[#2f2f2f] text-white text-sm rounded-[4px] hover:bg-[#1a1a1a] disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY) }} className="px-3 py-1.5 border border-[#e9e7e4] text-sm rounded-[4px] text-[#6b6968] hover:bg-[#e9e7e4]">
              Cancelar
            </button>
            <span className="text-xs text-[#9b9a97] ml-2">El desfase se calcula automáticamente</span>
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
                {['Fecha', 'Fase', 'Actividad', 'Descripción', 'Plan (min)', 'Real (min)', 'Interrup. (min)', 'Desfase', 'Acciones'].map(h => (
                  <th key={h} className="text-left text-xs text-[#9b9a97] font-medium px-4 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-[#9b9a97]">Sin registros. Agrega tu primera entrada.</td></tr>
              )}
              {rows.map(row => {
                const isEditing = editingId === row.id
                if (isEditing) {
                  return (
                    <tr key={row.id} className="border-b border-[#e9e7e4] bg-[#fffdf5]">
                      <td className="px-3 py-2"><input type="date" value={editForm.fecha || ''} onChange={e => setEdit('fecha', e.target.value)} className={`${inputCls} w-32`} /></td>
                      <td className="px-3 py-2"><select value={editForm.fase || ''} onChange={e => setEdit('fase', e.target.value)} className={`${inputCls} w-36`}>{FASES.map(f => <option key={f} value={f}>{f}</option>)}</select></td>
                      <td className="px-3 py-2"><input value={editForm.actividad || ''} onChange={e => setEdit('actividad', e.target.value)} className={inputCls} /></td>
                      <td className="px-3 py-2"><input value={editForm.descripcion_actividad || ''} onChange={e => setEdit('descripcion_actividad', e.target.value)} className={inputCls} /></td>
                      <td className="px-3 py-2"><input type="number" min="0" value={editForm.tiempo_planeado_min || ''} onChange={e => setEdit('tiempo_planeado_min', e.target.value)} className={`${inputCls} w-20`} /></td>
                      <td className="px-3 py-2"><input type="number" min="0" value={editForm.tiempo_real_min || ''} onChange={e => setEdit('tiempo_real_min', e.target.value)} className={`${inputCls} w-20`} /></td>
                      <td className="px-3 py-2"><input type="number" min="0" value={editForm.tiempo_interrupcion_min || ''} onChange={e => setEdit('tiempo_interrupcion_min', e.target.value)} className={`${inputCls} w-20`} /></td>
                      <td className="px-3 py-2"><span className="text-xs text-[#9b9a97]">auto</span></td>
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
                    <td className="px-4 py-2.5 text-sm text-[#37352f]">{row.fase}</td>
                    <td className="px-4 py-2.5 text-sm text-[#37352f] max-w-[150px] truncate">{row.actividad || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-[#37352f] max-w-[180px] truncate">{row.descripcion_actividad || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-[#37352f]">{row.tiempo_planeado_min}</td>
                    <td className="px-4 py-2.5 text-sm text-[#37352f]">{row.tiempo_real_min}</td>
                    <td className="px-4 py-2.5 text-sm text-[#37352f]">{row.tiempo_interrupcion_min || 0}</td>
                    <td className="px-4 py-2.5"><DesfaseTag val={row.desfase} /></td>
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
