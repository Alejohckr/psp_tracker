import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const ESTADOS = ['No ejecutado', 'Pasa', 'Falla']

const EMPTY = {
  modulo: '',
  entrada_accion: '',
  resultado_esperado: '',
  resultado_obtenido: '',
  estado: 'No ejecutado',
}

const inputCls = 'w-full px-2 py-1 border border-[#e9e7e4] rounded-[4px] bg-white focus:border-[#2f2f2f] text-sm text-[#37352f]'

function estadoBadge(e) {
  const m = { 'No ejecutado': 'bg-gray-100 text-gray-500', 'Pasa': 'bg-green-50 text-green-700', 'Falla': 'bg-red-50 text-red-700' }
  return m[e] || 'bg-gray-100 text-gray-500'
}

export default function PlanPruebas() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('all')

  useEffect(() => { if (user) fetchData() }, [user])

  async function fetchData() {
    setLoading(true)
    const { data } = await supabase.from('plan_pruebas').select('*').order('id', { ascending: true })
    setRows(data || [])
    setLoading(false)
  }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function setEdit(k, v) { setEditForm(f => ({ ...f, [k]: v })) }

  async function handleAdd() {
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase.from('plan_pruebas').insert({ ...form, user_id: user.id }).select().single()
    if (err) { setError(err.message) } else {
      setRows([...rows, data])
      setForm(EMPTY)
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const { id, user_id, ...fields } = editForm
    const { data, error: err } = await supabase.from('plan_pruebas').update(fields).eq('id', editingId).select().single()
    if (err) { setError(err.message) } else {
      setRows(rows.map(r => r.id === editingId ? data : r))
      setEditingId(null)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    await supabase.from('plan_pruebas').delete().eq('id', id)
    setRows(rows.filter(r => r.id !== id))
  }

  async function quickStatus(id, estado) {
    const { data } = await supabase.from('plan_pruebas').update({ estado }).eq('id', id).select().single()
    if (data) setRows(rows.map(r => r.id === id ? data : r))
  }

  const filtered = filtroEstado === 'all' ? rows : rows.filter(r => r.estado === filtroEstado)

  const counts = {
    total: rows.length,
    pasa: rows.filter(r => r.estado === 'Pasa').length,
    falla: rows.filter(r => r.estado === 'Falla').length,
    noEjecutado: rows.filter(r => r.estado === 'No ejecutado').length,
  }
  const pct = counts.total > 0 ? Math.round((counts.pasa / counts.total) * 100) : 0

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#37352f]">Plan de Pruebas</h1>
          <p className="text-sm text-[#9b9a97] mt-1">Casos de prueba y resultados</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="px-3 py-1.5 bg-[#2f2f2f] text-white text-sm rounded-[4px] hover:bg-[#1a1a1a] transition-colors flex items-center gap-1.5">
          <span>+</span> Agregar caso
        </button>
      </div>

      {/* Progress bar */}
      {counts.total > 0 && (
        <div className="mb-4 bg-white border border-[#e9e7e4] rounded-[6px] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#37352f]">Progreso: <span className="font-medium">{counts.pasa}/{counts.total}</span> casos pasados</span>
            <span className="text-sm font-semibold text-[#37352f]">{pct}%</span>
          </div>
          <div className="h-2 bg-[#f7f6f3] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#16a34a' : pct > 50 ? '#2563eb' : '#dc2626' }}
            />
          </div>
          <div className="flex gap-4 mt-3">
            {[
              { label: 'Pasa', count: counts.pasa, cls: 'text-green-700' },
              { label: 'Falla', count: counts.falla, cls: 'text-red-600' },
              { label: 'No ejecutado', count: counts.noEjecutado, cls: 'text-gray-500' },
            ].map(({ label, count, cls }) => (
              <span key={label} className={`text-xs ${cls}`}>{label}: <span className="font-medium">{count}</span></span>
            ))}
          </div>
        </div>
      )}

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
          <h3 className="text-sm font-medium text-[#37352f] mb-4">Nuevo caso de prueba</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="block text-xs text-[#9b9a97] mb-1">Módulo</label><input value={form.modulo} onChange={e => setField('modulo', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Estado</label><select value={form.estado} onChange={e => setField('estado', e.target.value)} className={inputCls}>{ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="col-span-2"><label className="block text-xs text-[#9b9a97] mb-1">Entrada / Acción</label><textarea value={form.entrada_accion} onChange={e => setField('entrada_accion', e.target.value)} rows={2} className={`${inputCls} resize-none`} /></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Resultado esperado</label><textarea value={form.resultado_esperado} onChange={e => setField('resultado_esperado', e.target.value)} rows={2} className={`${inputCls} resize-none`} /></div>
            <div><label className="block text-xs text-[#9b9a97] mb-1">Resultado obtenido</label><textarea value={form.resultado_obtenido} onChange={e => setField('resultado_obtenido', e.target.value)} rows={2} className={`${inputCls} resize-none`} /></div>
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e9e7e4] bg-[#f7f6f3]">
                {['#', 'Módulo', 'Entrada / Acción', 'Resultado esperado', 'Resultado obtenido', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left text-xs text-[#9b9a97] font-medium px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#9b9a97]">Sin casos de prueba.</td></tr>}
              {filtered.map((row, idx) => {
                const isEditing = editingId === row.id
                if (isEditing) {
                  return (
                    <tr key={row.id} className="border-b border-[#e9e7e4] bg-[#fffdf5]">
                      <td className="px-4 py-2 text-sm text-[#9b9a97]">{idx + 1}</td>
                      <td className="px-3 py-2"><input value={editForm.modulo || ''} onChange={e => setEdit('modulo', e.target.value)} className={`${inputCls} w-28`} /></td>
                      <td className="px-3 py-2"><textarea value={editForm.entrada_accion || ''} onChange={e => setEdit('entrada_accion', e.target.value)} rows={2} className={`${inputCls} resize-none w-40`} /></td>
                      <td className="px-3 py-2"><textarea value={editForm.resultado_esperado || ''} onChange={e => setEdit('resultado_esperado', e.target.value)} rows={2} className={`${inputCls} resize-none w-40`} /></td>
                      <td className="px-3 py-2"><textarea value={editForm.resultado_obtenido || ''} onChange={e => setEdit('resultado_obtenido', e.target.value)} rows={2} className={`${inputCls} resize-none w-40`} /></td>
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
                    <td className="px-4 py-3 text-sm text-[#9b9a97]">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm text-[#37352f] font-medium">{row.modulo || '—'}</td>
                    <td className="px-4 py-3 text-sm text-[#37352f] max-w-[200px]"><div className="line-clamp-2">{row.entrada_accion || '—'}</div></td>
                    <td className="px-4 py-3 text-sm text-[#37352f] max-w-[200px]"><div className="line-clamp-2">{row.resultado_esperado || '—'}</div></td>
                    <td className="px-4 py-3 text-sm text-[#37352f] max-w-[200px]"><div className="line-clamp-2">{row.resultado_obtenido || '—'}</div></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-[4px] font-medium w-fit ${estadoBadge(row.estado)}`}>{row.estado}</span>
                        <div className="flex gap-1">
                          {ESTADOS.filter(s => s !== row.estado).map(s => (
                            <button key={s} onClick={() => quickStatus(row.id, s)}
                              className={`text-[10px] px-1.5 py-0.5 rounded-[3px] border transition-colors
                                ${s === 'Pasa' ? 'border-green-200 text-green-700 hover:bg-green-50' : s === 'Falla' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
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
