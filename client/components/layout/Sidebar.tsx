'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Contact,
  Handshake,
  Building2,
  UserCog,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

// ─── Nav item types ────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const mainNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Leads', href: '/leads', icon: <Users size={18} /> },
  { label: 'Contacts', href: '/contacts', icon: <Contact size={18} /> },
  { label: 'Deals', href: '/deals', icon: <Handshake size={18} /> },
  { label: 'Properties', href: '/properties', icon: <Building2 size={18} /> },
];

const settingsNav: NavItem[] = [
  { label: 'Users', href: '/settings/users', icon: <UserCog size={18} /> },
  { label: 'Workspace', href: '/settings/workspace', icon: <Settings size={18} /> },
  { label: 'Roles', href: '/settings/roles', icon: <Shield size={18} /> },
];

// ─── Helper: initials from name ────────────────────────────────────────────────

function getInitials(name: string | undefined | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ─── Sidebar Component ─────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname?.startsWith(href + '/'));

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={`
          hidden md:flex flex-col h-screen
          transition-all duration-200
          border-r border-[#1e293b]
          ${collapsed ? 'w-[64px]' : 'w-[240px]'}
        `}
        style={{ backgroundColor: '#0f172a', flexShrink: 0 }}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-[#1e293b]">
          <div className={`flex items-center gap-2.5 overflow-hidden ${collapsed ? 'w-0 opacity-0' : 'flex-1'} transition-all duration-200`}>
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#2563eb] flex items-center justify-center">
              <Building2 size={15} className="text-white" />
            </div>
            <span className="text-white font-semibold text-[15px] whitespace-nowrap">
              EstateFlow CRM
            </span>
          </div>
          {collapsed && (
            <div className="w-7 h-7 rounded-lg bg-[#2563eb] flex items-center justify-center mx-auto flex-shrink-0">
              <Building2 size={15} className="text-white" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex-shrink-0 ml-1 p-1 rounded text-[#475569] hover:text-[#94a3b8] hover:bg-[#1e293b] transition-colors duration-150"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {/* MAIN section */}
          <div>
            {!collapsed && (
              <span className="block px-2 mb-2 text-[11px] font-medium uppercase tracking-widest text-[#475569]">
                Main
              </span>
            )}
            <ul className="space-y-0.5">
              {mainNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`
                        flex items-center gap-3 px-2 py-2 rounded-md text-[13.5px] font-medium
                        transition-all duration-150 relative group
                        ${active
                          ? 'bg-[#1e293b] text-white'
                          : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#e2e8f0]'
                        }
                      `}
                    >
                      {/* Active left border indicator */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[#2563eb]" />
                      )}
                      <span className={`flex-shrink-0 ${active ? 'text-white' : ''}`}>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}

                      {/* Tooltip when collapsed */}
                      {collapsed && (
                        <span className="absolute left-full ml-2 px-2 py-1 rounded bg-[#1e293b] text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* SETTINGS section */}
          <div>
            {!collapsed && (
              <span className="block px-2 mb-2 text-[11px] font-medium uppercase tracking-widest text-[#475569]">
                Settings
              </span>
            )}
            <ul className="space-y-0.5">
              {settingsNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`
                        flex items-center gap-3 px-2 py-2 rounded-md text-[13.5px] font-medium
                        transition-all duration-150 relative group
                        ${active
                          ? 'bg-[#1e293b] text-white'
                          : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#e2e8f0]'
                        }
                      `}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[#2563eb]" />
                      )}
                      <span className={`flex-shrink-0 ${active ? 'text-white' : ''}`}>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}

                      {collapsed && (
                        <span className="absolute left-full ml-2 px-2 py-1 rounded bg-[#1e293b] text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* User footer */}
        <div className="border-t border-[#1e293b] p-3">
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            {/* Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {getInitials(user?.name)}
              </span>
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-medium truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-[#94a3b8] text-[11px] truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            )}

            {!collapsed && (
              <button
                onClick={logout}
                className="flex-shrink-0 p-1.5 rounded text-[#475569] hover:text-red-400 hover:bg-red-900/20 transition-colors duration-150"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>

          {collapsed && (
            <button
              onClick={logout}
              className="mt-2 w-full flex justify-center p-1.5 rounded text-[#475569] hover:text-red-400 hover:bg-red-900/20 transition-colors duration-150"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile: no sidebar (hamburger in Navbar handles it) ── */}
    </>
  );
}

export default Sidebar;
