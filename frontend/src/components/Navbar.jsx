// frontend/src/components/Navbar.jsx
// Barre de navigation supérieure avec logo et user menu

import { useAuth, UserButton } from '@clerk/clerk-react';

export function Navbar({ onMenuToggle }) {
  const { user, isSignedIn } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Logo + Menu toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Toggle menu"
          >
            <i className="ti ti-menu-2 text-xl"></i>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <p className="font-bold text-gray-900">SMI</p>
              <p className="text-xs text-gray-500">Gestion Financière</p>
            </div>
          </div>
        </div>

        {/* Centre - Date actuelle */}
        <div className="hidden md:block text-center">
          <p className="text-sm text-gray-600">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Droite - Notifications + User Menu */}
        <div className="flex items-center gap-4">
          {/* Notifications badge */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
            <i className="ti ti-bell text-xl text-gray-600"></i>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200"></div>

          {/* User button Clerk */}
          {isSignedIn && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName || user?.emailAddresses?.[0]?.emailAddress}
                </p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-10 h-10 rounded-full'
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
