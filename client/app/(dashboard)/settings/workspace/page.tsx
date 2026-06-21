'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Save,
  Users,
  Briefcase,
  Layers,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText
} from 'lucide-react';

import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

interface WorkspaceStats {
  users: number;
  leads: number;
  deals: number;
  properties: number;
}

interface WorkspaceDetail {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stats?: WorkspaceStats;
}

export default function WorkspaceSettingsPage() {
  const { user, workspace: storeWorkspace, setWorkspace: setStoreWorkspace } = useAuthStore();

  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch Workspace Details
  useEffect(() => {
    if (!user?.workspace_id) return;

    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/workspaces/${user.workspace_id}`);
        if (res.data?.success && res.data?.data) {
          const ws = res.data.data;
          setWorkspace(ws);
          setName(ws.name);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Failed to load workspace configuration.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [user?.workspace_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.workspace_id || !name.trim()) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const res = await api.put(`/workspaces/${user.workspace_id}`, {
        name: name.trim(),
      });

      if (res.data?.success && res.data?.data) {
        const updated = res.data.data;
        setWorkspace(updated);
        setName(updated.name);
        // Sync with global authStore to update navbar etc.
        setStoreWorkspace(updated);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to update workspace name.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="h-4 w-96 bg-gray-100 rounded mt-1" />

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-100 rounded" />
          <div className="h-8 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const stats = workspace?.stats ?? { users: 0, leads: 0, deals: 0, properties: 0 };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">Workspace Settings</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          Manage your organization name, view general directory analytics, and review system configuration.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700 flex items-start gap-2 max-w-2xl">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-[13px] text-green-700 flex items-start gap-2 max-w-2xl">
          <CheckCircle size={16} className="shrink-0 mt-0.5" />
          <span>Workspace profile saved successfully.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Workspace Info Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                <Building2 size={16} className="text-gray-400" />
                Workspace Information
              </h2>
              <p className="text-[12px] text-gray-500 mt-0.5">Edit organizational profile details.</p>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Paramount Real Estate"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              {/* Read-only Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Workspace Reference ID
                  </span>
                  <span className="text-[12.5px] font-mono text-gray-500 mt-1 block">
                    {workspace?.id ?? '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Created On
                  </span>
                  <span className="text-[12.5px] text-gray-500 mt-1 block flex items-center gap-1">
                    <Calendar size={13} className="text-gray-400" />
                    {workspace?.created_at
                      ? new Date(workspace.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-start pt-2">
                <button
                  type="submit"
                  disabled={saving || !name.trim() || name.trim() === workspace?.name}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-lg text-[13px] font-semibold transition-colors duration-150 shadow-sm disabled:cursor-not-allowed"
                >
                  <Save size={14} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Statistics */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-[15px] font-semibold text-gray-900">
                Workspace Stats
              </h2>
              <p className="text-[12px] text-gray-500 mt-0.5">Directory analytics aggregate</p>
            </div>

            <div className="p-6 divide-y divide-gray-100">
              {/* Total Users */}
              <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users size={15} />
                  </div>
                  <div>
                    <span className="text-[13px] font-medium text-gray-700 block">Total Users</span>
                    <span className="text-[11px] text-gray-400 font-medium">Workspace members</span>
                  </div>
                </div>
                <span className="text-[15px] font-bold text-gray-900">{stats.users}</span>
              </div>

              {/* Total Leads */}
              <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileText size={15} />
                  </div>
                  <div>
                    <span className="text-[13px] font-medium text-gray-700 block">Total Leads</span>
                    <span className="text-[11px] text-gray-400 font-medium">Active contact pipeline</span>
                  </div>
                </div>
                <span className="text-[15px] font-bold text-gray-900">{stats.leads}</span>
              </div>

              {/* Total Deals */}
              <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Briefcase size={15} />
                  </div>
                  <div>
                    <span className="text-[13px] font-medium text-gray-700 block">Total Deals</span>
                    <span className="text-[11px] text-gray-400 font-medium">Transaction values</span>
                  </div>
                </div>
                <span className="text-[15px] font-bold text-gray-900">{stats.deals}</span>
              </div>

              {/* Total Properties */}
              <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Layers size={15} />
                  </div>
                  <div>
                    <span className="text-[13px] font-medium text-gray-700 block">Total Properties</span>
                    <span className="text-[11px] text-gray-400 font-medium">Inventory items</span>
                  </div>
                </div>
                <span className="text-[15px] font-bold text-gray-900">{stats.properties}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
