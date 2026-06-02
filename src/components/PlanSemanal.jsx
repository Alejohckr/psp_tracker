import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const FASES = ['Planeación', 'Diseño de alto nivel', 'Revisión de diseño de alto nivel', 'Diseño', 'Revisión de diseño', 'Codificación', 'Revisión de código', 'Compilación', 'Pruebas', 'Postmortem']
const ESTADOS = ['Pendiente', 'En progreso', 'Completado']
const SEMANAS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const EMPTY = { semana: 1, fase_psp: '', actividad: '', descripcion: '', entregable: '', tiempo_planeado_min: '', tiempo_real_min: '', estado: 'Pendiente' }

function estadoBadge(estado) {
  const map = {
    'Pendiente': 'bg-gray-100 text-gray-600',
    'En progreso': 'bg-blue-50 text-blue-700',
    'Completado': 'bg-green-50 text-green-700',
  }
  return map[estado] || 'bg-gray-100 text-gray-600'
}

function Input({ value, onChange, type = 'text', className = '' }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-2 py-1 border border-[#e9e7e4] rounded-[4px] bg-white focus:border-[#2f2f2f] text-sm text-[#37352f] ${className}`}
    />
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-2 py-1 border border-[#e9e7e4] rounded-[4px] bg-white focus:border-[#2f2f2f] text-sm text-[#37352f]"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export default function PlanSemanal() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [filtroSemana, setFiltroSemana] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (user) fetchData() }, [user])

  async function fetchData() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('project_plan')
      .select('*')
      .order('semana', { ascending: true })
    if (!err) setRows(data || [])
    setLoading(false)
  }

  const filtered = filtroSemana === 'all' ? rows : rows.filter(r => r.semana == filtroSemana)

  function startEdit(row) {
    setEditingId(row.id)
    setEditForm({ ...row })
  }

  function editField(field, val) {
    setEditForm(f => ({ ...f, [field]: val }))
  }

  async function saveEdit() {
    setSaving(true)
    setError('')
    const { id, user_id, ...fields } = editForm
    const { error: err } = await supabase.from('project_plan').update(fields).eq('id', editingId)
    if (err) { setError(err.message) } else {
      setRows(rows.map(r => r.id === editingId ? editForm : r))
      setEditingId(null)
    }
    setSaving(false)
  }

  async function deleteRow(id) {
    const { error: err } = await supabase.from('project_plan').delete().eq('id', id)
    if (!err) setRows(rows.filter(r => r.id !== id))
  }

  async function addRow() {
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase.from('project_plan').insert({ ...addForm, user_id: user.id }).select().single()
    if (err) { setError(err.message) } else {
      setRows([...rows, data])
      setShowAdd(false)
      setAddForm(EMPTY)
    }
    setSaving(false)
  }

  const cols = [
    { label: 'Semana', key: 'semana', type: 'select', options: SEMANAS.map(String) },
    { label: 'Fase PSP', key: 'fase_psp', type: 'select', options: FASES },
    { label: 'Actividad', key: 'actividad', type: 'text' },
    { label: 'Descripción', key: 'descripcion', type: 'text' },
    { label: 'Entregable', key: 'entregable', type: 'text' },
    { label: 'Plan (min)', key: 'tiempo_planeado_min', type: 'number' },
    { label: 'Real (min)', key: 'tiempo_real_min', type: 'number' },
    { label: 'Estado', key: 'estado', type: 'select', options: ESTADOS },
  ]

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#37352f]">Plan Semanal</h1>
          <p className="text-sm text-[#9b9a97] mt-1">9 semanas de actividades planeadas</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-3 py-1.5 bg-[#2f2f2f] text-white text-sm rounded-[4px] hover:bg-[#1a1a1a] transition-colors flex items-center gap-1.5"
        >
          <span>+</span> Agregar
        </button>
      </div>

      {/* Filtro semana */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <button
          onClick={() => setFiltroSemana('all')}
          className={`px-3 py-1 rounded-[4px] text-sm transition-colors ${filtroSemana === 'all' ? 'bg-[#2f2f2f] text-white' : 'bg-[#f7f6f3] text-[#6b6968] hover:bg-[#e9e7e4]'}`}
        >
          Todas
        </button>
        {SEMANAS.map(s => (
          <button
            key={s}
            onClick={() => setFiltroSemana(s)}
            className={`px-3 py-1 rounded-[4px] text-sm transition-colors ${filtroSemana === s ? 'bg-[#2f2f2f] text-white' : 'bg-[#f7f6f3] text-[#6b6968] hover:bg-[#e9e7e4]'}`}
          >
            S{s}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-[4px] px-3 py-2">{error}</div>}

      {/* Add form */}
      {showAdd && (
        <div className="mb-4 bg-[#f7f6f3] border border-[#e9e7e4] rounded-[6px] p-4">
          <h3 className="text-sm font-medium text-[#37352f] mb-3">Nueva actividad</h3>
          <div className="grid grid-cols-4 gap-3 mb-3">
            {cols.map(col => (
              <div key={col.key}>
                <label className="block text-xs text-[#9b9a97] mb-1">{col.label}</label>
                {col.type === 'select'
                  ? <Select value={addForm[col.key]} onChange={v => setAddForm(f => ({ ...f, [col.key]: col.key === 'semana' ? Number(v) : v }))} options={col.options} />
                  : <Input type={col.type} value={addForm[col.key]} onChange={v => setAddForm(f => ({ ...f, [col.key]: col.type === 'number' ? Number(v) : v }))} />
                }
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addRow} disabled={saving} className="px-3 py-1.5 bg-[#2f2f2f] text-white text-sm rounded-[4px] hover:bg-[#1a1a1a] disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => { setShowAdd(false); setAddForm(EMPTY) }} className="px-3 py-1.5 border border-[#e9e7e4] text-sm rounded-[4px] text-[#6b6968] hover:bg-[#e9e7e4]">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-[#9b9a97]">Cargando...</div>
      ) : (
        <div className="bg-white border border-[#e9e7e4] rounded-[6px] overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#e9e7e4] bg-[#f7f6f3]">
                {cols.map(c => (
                  <th key={c.key} className="text-left text-xs text-[#9b9a97] font-medium px-4 py-2.5">{c.label}</th>
                ))}
                <th className="text-left text-xs text-[#9b9a97] font-medium px-4 py-2.5">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={cols.length + 1} className="px-4 py-8 text-center text-sm text-[#9b9a97]">Sin actividades</td></tr>
              )}
              {filtered.map(row => {
                const isEditing = editingId === row.id
                return (
                  <tr key={row.id} className="border-b border-[#e9e7e4] last:border-0 hover:bg-[#f7f6f3] transition-colors">
                    {cols.map(col => (
                      <td key={col.key} className="px-4 py-2">
                        {isEditing ? (
                          col.type === 'select'
                            ? <Select value={editForm[col.key]} onChange={v => editField(col.key, col.key === 'semana' ? Number(v) : v)} options={col.options} />
                            : <Input type={col.type} value={editForm[col.key]} onChange={v => editField(col.key, col.type === 'number' ? Number(v) : v)} />
                        ) : (
                          col.key === 'estado'
                            ? <span className={`text-xs px-2 py-0.5 rounded-[4px] font-medium ${estadoBadge(row.estado)}`}>{row.estado}</span>
                            : <span className="text-sm text-[#37352f]">{row[col.key] ?? '—'}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <div className="flex gap-1.5">
                          <button onClick={saveEdit} disabled={saving} className="text-xs px-2 py-1 bg-[#2f2f2f] text-white rounded-[4px] hover:bg-[#1a1a1a] disabled:opacity-50">
                            {saving ? '...' : 'Guardar'}
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 border border-[#e9e7e4] rounded-[4px] text-[#6b6968] hover:bg-[#e9e7e4]">
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <button onClick={() => startEdit(row)} className="text-xs px-2 py-1 border border-[#e9e7e4] rounded-[4px] text-[#6b6968] hover:bg-[#e9e7e4]">
                            Editar
                          </button>
                          <button onClick={() => deleteRow(row.id)} className="text-xs px-2 py-1 border border-red-100 rounded-[4px] text-red-500 hover:bg-red-50">
                            ×
                          </button>
                        </div>
                      )}
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
