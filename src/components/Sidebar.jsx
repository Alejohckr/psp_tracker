import { useAuth } from '../contexts/AuthContext'

const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: 'plan-semanal',
    label: 'Plan Semanal',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'registro-psp',
    label: 'Registro PSP',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    id: 'ejercicios',
    label: 'Ejercicios',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
  {
    id: 'defectos',
    label: 'Defectos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  {
    id: 'plan-pruebas',
    label: 'Plan de Pruebas',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    id: 'metricas',
    label: 'Métricas',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
  },
]

export default function Sidebar({ active, onNavigate }) {
  const { user, signOut } = useAuth()

  return (
    <div
      className="flex flex-col h-full border-r border-[#e9e7e4]"
      style={{ width: 240, minWidth: 240, backgroundColor: '#f7f6f3' }}
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#e9e7e4]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#2f2f2f] rounded-[4px] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[9px] font-semibold">PSP</span>
          </div>
          <span className="text-sm font-medium text-[#37352f] truncate">PSP Tracker</span>
        </div>
        <p className="text-[11px] text-[#9b9a97] mt-1 truncate">{user?.email}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] text-sm text-left
              transition-colors duration-100
              ${active === item.id
                ? 'bg-[#e9e7e4] text-[#37352f] font-medium'
                : 'text-[#6b6968] hover:bg-[#ebebea] hover:text-[#37352f]'
              }
            `}
          >
            <span className={active === item.id ? 'text-[#37352f]' : 'text-[#9b9a97]'}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-2 py-3 border-t border-[#e9e7e4]">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] text-sm text-[#9b9a97] hover:bg-[#ebebea] hover:text-[#37352f] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
