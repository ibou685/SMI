// frontend/src/components/Sidebar.jsx
// Barre latérale de navigation avec liens vers les pages

import { Link, useLocation } from 'react-router-dom';

const navItems = [
  {
    label: 'Tableau de bord',
    href: '/dashboard',
    icon: 'ti-home',
    badge: null
  },
  {
    label: 'Filiales',
    href: '/filiales',
    icon: 'ti-building-community',
    badge: null
  },
  {
    label: 'Recettes',
    href: '/recettes',
    icon: 'ti-cash-in',
    badge: '3'
  },
  {
    label: 'Dépenses',
    href: '/depenses',
    icon: 'ti-cash-out',
    badge: null
  },
  {
    label: 'Alertes',
    href: '/alertes',
    icon: 'ti-alert-circle',
    badge: '5'
  },
  {
    label: 'Rapports',
    href: '/rapports',
    icon: 'ti-file-text',
    badge: null
  },
  {
    label: 'Paramètres',
    href: '/parametres',
    icon: 'ti-settings',
    badge: null
  }
];

export function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  const isActive = (href) => location.pathname === href;

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 w-64 bg-gray-900 text-white
          transform transition-transform duration-300 z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full pt-6">
          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-200
                    ${
                      active
                        ? 'bg-red-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }
                  `}
                >
                  <i className={`ti ${item.icon} text-lg flex-shrink-0`}></i>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer - Version */}
          <div className="px-4 py-6 border-t border-gray-800">
            <p className="text-xs text-gray-500">SMI v1.0.0</p>
            <p className="text-xs text-gray-500">Dakar, Sénégal</p>
          </div>
        </div>
      </aside>
    </>
  );
}
