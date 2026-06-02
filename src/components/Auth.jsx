import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const { error: authError } = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password)

    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else if (mode === 'register') {
      setMessage('Revisa tu correo para confirmar tu cuenta.')
    }
  }

  const inputClass = `
    w-full px-3 py-2 border border-[#e9e7e4] rounded-[4px] bg-white
    focus:border-[#2f2f2f] transition-colors duration-150
    text-[#37352f] text-sm
  `

  return (
    <div className="w-full min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm px-8">
        <div className="mb-8 text-center">
          <div className="w-8 h-8 bg-[#2f2f2f] rounded-[4px] mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">PSP</span>
          </div>
          <h1 className="text-xl font-semibold text-[#37352f]">PSP Tracker</h1>
          <p className="text-[#9b9a97] text-sm mt-1">
            {mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-[#37352f] mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm text-[#37352f] mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={inputClass}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-[4px] px-3 py-2">
              {error}
            </div>
          )}

          {message && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-[4px] px-3 py-2">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-[#2f2f2f] text-white text-sm font-medium rounded-[4px] hover:bg-[#1a1a1a] transition-colors duration-150 disabled:opacity-50 mt-2"
          >
            {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage('') }}
            className="text-sm text-[#9b9a97] hover:text-[#37352f] transition-colors"
          >
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}
