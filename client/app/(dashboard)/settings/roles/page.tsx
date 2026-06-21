'use client';

import React, { useEffect, useState } from 'react';
import {
  Shield,
  Plus,
  Users,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';

import api from '@/lib/axios';

interface PermissionEntry {
  id: number;
  role_id: number;
  module_id: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  module_name: string;
}

interface RoleWithPermissions {
  id: number;
  name: string;
  created_at: string;
  user_count: number;
  permissions: PermissionEntry[];
}

interface SystemModule {
  id: number;
  name: string;
}

export default function RolesSettingsPage() {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tracks which role cards have their permissions matrix expanded
  const [expandedRoleIds, setExpandedRoleIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch Roles & Modules in parallel
        const [rolesRes, modulesRes] = await Promise.all([
          api.get('/roles'),
          api.get('/modules')
        ]);

        const fetchedRoles = rolesRes.data?.data ?? [];
        setRoles(fetchedRoles);
        setModules(modulesRes.data?.data ?? []);

        // Expand first role by default for premium feel
        if (fetchedRoles.length > 0) {
          setExpandedRoleIds({ [fetchedRoles[0].id]: true });
        }

      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Failed to load roles and system modules.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleExpand = (roleId: number) => {
    setExpandedRoleIds((prev) => ({
      ...prev,
      [roleId]: !prev[roleId]
    }));
  };

  // ─── Skeletons ─────────────────────────────────────────────────────────────

  const SkeletonCards = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-44 bg-gray-100 rounded" />
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">Roles & Permissions</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            View system roles and check active access credentials allowed for each membership level.
          </p>
        </div>

        {/* Disabled Create Role Trigger with Hover Tooltip */}
        <div className="relative group self-start md:self-auto">
          <button
            disabled
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-400 border border-gray-200 rounded-lg text-[13px] font-semibold cursor-not-allowed shadow-sm transition-all duration-150"
          >
            <Plus size={15} />
            Create Role
          </button>
          <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-28 hidden group-hover:block bg-gray-900 text-white text-[10px] p-1.5 rounded shadow-lg text-center leading-normal">
            Coming soon
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700 flex items-start gap-2 max-w-2xl">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <SkeletonCards />
      ) : roles.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
          No system roles configured.
        </div>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => {
            const isExpanded = !!expandedRoleIds[role.id];

            return (
              <div
                key={role.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-200"
              >
                {/* Accordion Trigger Header */}
                <div
                  onClick={() => toggleExpand(role.id)}
                  className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Shield size={18} />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-bold text-gray-900">{role.name}</h2>
                      <span className="text-[12px] text-gray-500 font-medium block mt-0.5 flex items-center gap-1">
                        <Users size={12} className="text-gray-450 shrink-0" />
                        {role.user_count} {role.user_count === 1 ? 'user' : 'users'} assigned
                      </span>
                    </div>
                  </div>

                  <div className="text-gray-400 hover:text-gray-600 transition-colors">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Expandable Permissions Section */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-1 border-t border-gray-100 bg-gray-50/30 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <table className="w-full text-left border-collapse text-[12.5px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-150 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            <th className="px-5 py-3">Module Name</th>
                            <th className="px-4 py-3 text-center">View</th>
                            <th className="px-4 py-3 text-center">Create</th>
                            <th className="px-4 py-3 text-center">Edit</th>
                            <th className="px-4 py-3 text-center">Delete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                          {modules.map((mod) => {
                            // Find permission matrix for this module
                            const perm = role.permissions.find(
                              (p) => p.module_id === mod.id || p.module_name.toLowerCase() === mod.name.toLowerCase()
                            );

                            const viewFlag = perm?.can_view ?? false;
                            const createFlag = perm?.can_create ?? false;
                            const editFlag = perm?.can_edit ?? false;
                            const deleteFlag = perm?.can_delete ?? false;

                            return (
                              <tr key={mod.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-3 font-bold text-gray-900 capitalize">
                                  {mod.name}
                                </td>
                                
                                {/* View */}
                                <td className="px-4 py-3 text-center">
                                  <div className="flex justify-center">
                                    {viewFlag ? (
                                      <Check size={16} className="text-green-600 shrink-0" />
                                    ) : (
                                      <X size={16} className="text-gray-300 shrink-0" />
                                    )}
                                  </div>
                                </td>

                                {/* Create */}
                                <td className="px-4 py-3 text-center">
                                  <div className="flex justify-center">
                                    {createFlag ? (
                                      <Check size={16} className="text-green-600 shrink-0" />
                                    ) : (
                                      <X size={16} className="text-gray-300 shrink-0" />
                                    )}
                                  </div>
                                </td>

                                {/* Edit */}
                                <td className="px-4 py-3 text-center">
                                  <div className="flex justify-center">
                                    {editFlag ? (
                                      <Check size={16} className="text-green-600 shrink-0" />
                                    ) : (
                                      <X size={16} className="text-gray-300 shrink-0" />
                                    )}
                                  </div>
                                </td>

                                {/* Delete */}
                                <td className="px-4 py-3 text-center">
                                  <div className="flex justify-center">
                                    {deleteFlag ? (
                                      <Check size={16} className="text-green-600 shrink-0" />
                                    ) : (
                                      <X size={16} className="text-gray-300 shrink-0" />
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
