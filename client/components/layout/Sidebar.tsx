import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen } = useUiStore();
  const { logout } = useAuthStore();

  if (!isSidebarOpen) return null;

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Leads', href: '/leads' },
    { label: 'Contacts', href: '/contacts' },
    { label: 'Deals', href: '/deals' },
    { label: 'Properties', href: '/properties' },
  ];

  const settingsItems = [
    { label: 'Users', href: '/settings/users' },
    { label: 'Workspace', href: '/settings/workspace' },
    { label: 'Roles & Permissions', href: '/settings/roles' },
  ];

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <aside className="w-64 bg-gray-900 text-gray-100 flex flex-col min-h-screen border-r border-gray-800">
      <div className="p-6 border-b border-gray-800">
        <span className="text-xl font-bold tracking-wider text-white">SaaS CRM</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-8">
        <div>
          <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Main</span>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Settings</span>
          <ul className="space-y-1">
            {settingsItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
export default Sidebar;
