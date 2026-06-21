'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  UserPlus,
  Mail,
  Shield,
  Trash2,
  AlertCircle,
  Copy,
  Check,
  X,
  RefreshCw,
  Power,
  UserCheck
} from 'lucide-react';

import api from '@/lib/axios';
import { User, Workspace } from '@/lib/types';
import { useAuthStore } from '@/store/authStore';

// ─── Constants & Styles ───────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#dc2626',
  '#0891b2', '#c026d3', '#059669', '#ea580c', '#4f46e5',
];

function getAvatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm">
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-[12px] text-gray-500 font-medium">{label}</span>
      <span className="text-[13px] font-bold text-gray-900">{value}</span>
    </div>
  );
}

interface RoleType {
  id: number;
  name: string;
}

interface WorkspaceUser {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role_name: string;
  is_active: boolean;
  is_super_admin: boolean;
  created_at: string;
}

export default function UsersSettingsPage() {
  const currentUser = useAuthStore((state) => state.user);

  // Core States
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invitation Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  // Successful invitation details to show temp password
  const [invitedCredentials, setInvitedCredentials] = useState<{
    email: string;
    tempPass: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Inline role update state tracking (prevent multiple fires)
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  // ─── Fetch Data ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Users
      const usersRes = await api.get('/users');
      setUsers(usersRes.data.data ?? []);

      // Fetch Roles
      const rolesRes = await api.get('/roles');
      setRoles(rolesRes.data.data ?? []);

    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = totalCount - activeCount;

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteRoleId) {
      setInviteError('Please provide an email and select a role.');
      return;
    }

    try {
      setInviteError(null);
      setInviteSubmitting(true);

      const res = await api.post('/users/create', {
        name: inviteName.trim() || inviteEmail.trim().split('@')[0],
        email: inviteEmail.trim().toLowerCase(),
        role_id: Number(inviteRoleId),
      });

      // Retrieve credentials
      const createdUser = res.data.data.user;
      const tempPass = res.data.data.tempPassword;

      setInvitedCredentials({
        email: createdUser.email,
        tempPass: tempPass,
      });

      // Clear input fields
      setInviteName('');
      setInviteEmail('');
      setInviteRoleId('');
      
      // Reload users list
      const usersRes = await api.get('/users');
      setUsers(usersRes.data.data ?? []);

    } catch (err: any) {
      setInviteError(err?.response?.data?.message ?? 'Failed to invite team member.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (!invitedCredentials) return;
    navigator.clipboard.writeText(invitedCredentials.tempPass);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleChange = async (userId: number, roleId: number) => {
    try {
      setUpdatingUserId(userId);
      await api.put(`/users/${userId}`, { role_id: roleId });

      // Update state locally
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            const roleName = roles.find((r) => r.id === roleId)?.name ?? u.role_name;
            return { ...u, role_id: roleId, role_name: roleName };
          }
          return u;
        })
      );
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to update user role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleActive = async (user: WorkspaceUser) => {
    const isSelf = currentUser && currentUser.id === user.id;
    if (isSelf) {
      alert('You cannot deactivate or activate your own account.');
      return;
    }

    const nextActive = !user.is_active;
    const actionLabel = nextActive ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${actionLabel} "${user.name}"?`)) {
      return;
    }

    try {
      setUpdatingUserId(user.id);
      await api.put(`/users/${user.id}`, { is_active: nextActive });

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: nextActive } : u))
      );
    } catch (err: any) {
      alert(err?.response?.data?.message ?? `Failed to ${actionLabel} user.`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRemoveUser = async (user: WorkspaceUser) => {
    const isSelf = currentUser && currentUser.id === user.id;
    if (isSelf) {
      alert('You cannot remove yourself from the workspace.');
      return;
    }

    if (!confirm(`Are you sure you want to remove "${user.name}" from this workspace? this will permanently disable their access.`)) {
      return;
    }

    try {
      setUpdatingUserId(user.id);
      // Calls soft-delete/deactivate endpoint
      await api.delete(`/users/${user.id}`);
      
      // Reload list
      const usersRes = await api.get('/users');
      setUsers(usersRes.data.data ?? []);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to remove team member.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ─── Skeleton View ───────────────────────────────────────────────────────────

  const SkeletonRows = () => (
    <>
      {Array.from({ length: 4 }).map((_, idx) => (
        <tr key={idx} className="border-b border-gray-100 animate-pulse">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="space-y-1">
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="h-3 w-36 bg-gray-100 rounded" />
              </div>
            </div>
          </td>
          <td className="px-6 py-4"><div className="h-7 w-28 bg-gray-100 rounded-md" /></td>
          <td className="px-6 py-4"><div className="h-5 w-16 bg-gray-150 rounded-full" /></td>
          <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
          <td className="px-6 py-4 text-right"><div className="h-8 w-20 bg-gray-100 rounded ml-auto" /></td>
        </tr>
      ))}
    </>
  );

  // ─── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">Team Members</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Manage who has access to your workspace, adjust operational roles, and revoke logins.
          </p>
        </div>
        <button
          onClick={() => {
            setInvitedCredentials(null);
            setIsInviteOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold transition-colors duration-150 shadow-sm self-start md:self-auto"
        >
          <UserPlus size={15} />
          Invite User
        </button>
      </div>

      {/* Stats Summary Row */}
      <div className="flex flex-wrap gap-3">
        <StatPill label="Total Members" value={totalCount} color="#2563eb" />
        <StatPill label="Active Logins" value={activeCount} color="#16a34a" />
        <StatPill label="Inactive / Revoked" value={inactiveCount} color="#dc2626" />
      </div>

      {/* error block */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700 flex items-start gap-2 max-w-2xl">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Members Grid Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Name & Account</th>
                <th className="px-6 py-3.5">Workspace Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Joined Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
              {loading ? (
                <SkeletonRows />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No team members found in workspace.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentUser && currentUser.id === u.id;
                  const initials = getInitials(u.name);
                  const color = getAvatarColor(u.name);

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      
                      {/* User Identity Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[12.5px] font-bold"
                            style={{ backgroundColor: color }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-900">{u.name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded bg-blue-50 text-[9px] font-bold text-blue-600 border border-blue-100">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[12px] text-gray-500 font-medium block mt-0.5">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Workspace Role Dropdown Selector */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 max-w-[160px]">
                          {isSelf ? (
                            <span className="px-2.5 py-0.5 rounded bg-gray-100 text-gray-800 border text-[11px] font-semibold">
                              {u.role_name}
                            </span>
                          ) : (
                            <select
                              value={u.role_id}
                              onChange={(e) => handleRoleChange(u.id, Number(e.target.value))}
                              disabled={updatingUserId === u.id}
                              className="w-full px-2 py-1 rounded border border-gray-250 bg-white text-[12px] font-semibold text-gray-800 focus:outline-none focus:border-blue-600 transition-colors disabled:opacity-50"
                            >
                              {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          )}
                          {updatingUserId === u.id && (
                            <RefreshCw size={12} className="animate-spin text-gray-400 shrink-0" />
                          )}
                        </div>
                      </td>

                      {/* Active Status Badge */}
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          u.is_active
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 font-medium text-gray-500">
                        {new Date(u.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>

                      {/* Action Triggers */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle Active status */}
                          <button
                            onClick={() => handleToggleActive(u)}
                            disabled={isSelf || updatingUserId === u.id}
                            className={`p-1.5 rounded-lg border transition-all duration-150 ${
                              isSelf
                                ? 'border-gray-100 text-gray-200 cursor-not-allowed'
                                : u.is_active
                                ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                                : 'border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                            title={isSelf ? 'Cannot deactivate yourself' : u.is_active ? 'Deactivate Member' : 'Activate Member'}
                          >
                            <Power size={14} />
                          </button>

                          {/* Revoke/Remove user */}
                          <div className="relative group/btn">
                            <button
                              onClick={() => handleRemoveUser(u)}
                              disabled={isSelf || updatingUserId === u.id}
                              className={`p-1.5 rounded-lg border transition-all duration-150 ${
                                isSelf
                                  ? 'border-gray-100 text-gray-200 cursor-not-allowed'
                                  : 'border-red-200 text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <Trash2 size={14} />
                            </button>
                            {isSelf && (
                              <div className="absolute z-10 bottom-full right-0 mb-2 w-44 hidden group-hover/btn:block bg-gray-900 text-white text-[10px] p-1.5 rounded shadow-lg text-center leading-normal">
                                You cannot remove yourself.
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── INVITE USER MODAL ────────────────────────────────────────────────── */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setIsInviteOpen(false);
              setInviteError(null);
              setInvitedCredentials(null);
            }}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-[16px] font-semibold text-gray-900">Invite New Team Member</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">Provide workspace access credentials</p>
              </div>
              <button
                onClick={() => {
                  setIsInviteOpen(false);
                  setInviteError(null);
                  setInvitedCredentials(null);
                }}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {invitedCredentials ? (
              /* Success credentials reveal block */
              <div className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center mx-auto mb-2 animate-bounce">
                  <UserCheck size={24} />
                </div>
                <div className="text-center">
                  <h3 className="text-[15px] font-bold text-gray-900">Invitation Registered!</h3>
                  <p className="text-[12.5px] text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    No active email service is configured. Please copy the temporary password below to share with your new member:
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Login Email</span>
                    <p className="text-[13px] font-semibold text-gray-900 mt-0.5">{invitedCredentials.email}</p>
                  </div>

                  <div className="pt-2.5 border-t border-gray-200">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Temporary Password</span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <input
                        type="text"
                        readOnly
                        value={invitedCredentials.tempPass}
                        className="flex-1 bg-white px-3 py-1.5 border border-gray-250 rounded font-mono text-[13px] text-gray-800 focus:outline-none"
                      />
                      <button
                        onClick={handleCopyPassword}
                        className="p-2 border border-gray-250 bg-white hover:bg-gray-50 rounded text-gray-700 hover:text-gray-900 transition-all"
                        title="Copy Password"
                      >
                        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    onClick={() => {
                      setIsInviteOpen(false);
                      setInvitedCredentials(null);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold shadow-sm transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Invitation Form */
              <form onSubmit={handleInviteSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 py-5 overflow-y-auto space-y-4">
                  {inviteError && (
                    <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700 flex items-start gap-2">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{inviteError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. john@youragency.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 mb-1.5">
                      Workspace Role *
                    </label>
                    <select
                      value={inviteRoleId}
                      onChange={(e) => setInviteRoleId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    >
                      <option value="">— Select Role —</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsInviteOpen(false);
                      setInviteError(null);
                    }}
                    className="px-4 py-2 border border-gray-250 hover:bg-gray-100 text-gray-700 rounded-lg text-[13px] font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {inviteSubmitting ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
