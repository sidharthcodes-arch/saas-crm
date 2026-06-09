'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Menu,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import api from '@/lib/axios';

// ─── Helper: initials ──────────────────────────────────────────────────────────

function getInitials(name: string | undefined | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ─── Navbar ────────────────────────────────────────────────────────────────────

export function Navbar() {
  const router = useRouter();
  const { user, logout, workspace, setWorkspace } = useAuthStore();
  const { toggleSidebar } = useUiStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch workspace details if not present in authStore
  useEffect(() => {
    if (user?.workspace_id && (!workspace || workspace.id !== user.workspace_id)) {
      api
        .get(`/workspaces/${user.workspace_id}`)
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setWorkspace(res.data.data);
          }
        })
        .catch((err) => {
          console.error('Error fetching workspace:', err);
        });
    }
  }, [user?.workspace_id, workspace, setWorkspace]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <header
      className="flex items-center justify-between px-6 border-b border-[#e5e7eb] bg-white"
      style={{ height: '64px', flexShrink: 0 }}
    >
      {/* ── Left side ── */}
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors duration-150 md:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        {/* Workspace pill */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-[13px] font-medium text-[#6b7280]">
            Workspace:
          </span>
          <span className="px-3 py-1 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] text-[13px] font-semibold text-[#0f172a]">
            {workspace?.name || (user?.workspace_id ? `WS-${user.workspace_id}` : 'EstateFlow')}
          </span>
        </div>
      </div>

      {/* ── Right side ── */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors duration-150"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {/* Unread dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2563eb] ring-2 ring-white" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-[#e5e7eb] bg-white shadow-lg z-50">
              <div className="px-4 py-3 border-b border-[#f3f4f6]">
                <p className="text-[13px] font-semibold text-[#111827]">Notifications</p>
              </div>
              <div className="px-4 py-8 text-center">
                <Bell size={28} className="mx-auto text-[#d1d5db] mb-2" />
                <p className="text-[13px] text-[#6b7280]">No new notifications</p>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-[#e5e7eb]" />

        {/* User avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-lg hover:bg-[#f3f4f6] transition-colors duration-150"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">
                {getInitials(user?.name)}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-medium text-[#111827] leading-none">
                {user?.name || 'User'}
              </p>
              <p className="text-[11px] text-[#6b7280] mt-0.5 leading-none">
                {user?.email || 'user@example.com'}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`text-[#6b7280] transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[#e5e7eb] bg-white shadow-lg z-50 py-1">
              <div className="px-4 py-2.5 border-b border-[#f3f4f6]">
                <p className="text-[13px] font-semibold text-[#111827] truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-[11px] text-[#6b7280] truncate mt-0.5">
                  {user?.email || 'user@example.com'}
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { setDropdownOpen(false); router.push('/settings/profile'); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#374151] hover:bg-[#f9fafb] transition-colors duration-150"
                >
                  <User size={14} className="text-[#6b7280]" />
                  Profile
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); router.push('/settings/workspace'); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#374151] hover:bg-[#f9fafb] transition-colors duration-150"
                >
                  <Settings size={14} className="text-[#6b7280]" />
                  Settings
                </button>
              </div>

              <div className="border-t border-[#f3f4f6] py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors duration-150"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
