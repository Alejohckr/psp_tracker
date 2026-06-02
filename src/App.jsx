import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import PlanSemanal from './components/PlanSemanal'
import RegistroPSP from './components/RegistroPSP'
import Ejercicios from './components/Ejercicios'
import Defectos from './components/Defectos'
import PlanPruebas from './components/PlanPruebas'
import Metricas from './components/Metricas'

function MainApp() {
  const { user, loading } = useAuth()
  const [section, setSection] = useState('dashboard')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 bg-[#2f2f2f] rounded-[4px]" />
          <p className="text-sm text-[#9b9a97]">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Auth />

  const sections = {
    'dashboard': <Dashboard onNavigate={setSection} />,
    'plan-semanal': <PlanSemanal />,
    'registro-psp': <RegistroPSP />,
    'ejercicios': <Ejercicios />,
    'defectos': <Defectos />,
    'plan-pruebas': <PlanPruebas />,
    'metricas': <Metricas />,
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar active={section} onNavigate={setSection} />
      <main className="flex-1 overflow-y-auto">
        {sections[section] || sections['dashboard']}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}
