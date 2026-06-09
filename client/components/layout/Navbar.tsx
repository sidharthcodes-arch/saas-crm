import React from 'react';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export function Navbar() {
  const { toggleSidebar } = useUiStore();
  const { user } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
          aria-label="Toggle Sidebar"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1 rounded-md border border-gray-200">
          Workspace ID: {user?.workspace_id || 'Platform'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user?.name || 'Loading user...'}</p>
          <p className="text-xs text-gray-500">{user?.email || 'email@example.com'}</p>
        </div>
        <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
}
export default Navbar;
