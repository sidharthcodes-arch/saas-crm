'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Pencil,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import api from '@/lib/axios';
import { Lead } from '@/lib/types';
import { useLeads } from '@/hooks/useLeads';
import LeadForm, { LeadFormData } from '@/components/leads/LeadForm';

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUSES = [
  { id: '1', name: 'New' },
  { id: '2', name: 'Contacted' },
  { id: '3', name: 'Follow Up' },
  { id: '4', name: 'Qualified' },
  { id: '5', name: 'Converted' },
  { id: '6', name: 'Lost' },
];

const SOURCES = ['Website', 'Referral', 'Walk-in', 'Social Media', 'Cold Call', 'Event', 'Email Campaign', 'Other'];

const PAGE_SIZE = 20;

// ─── Status badge classes ───────────────────────────────────────────────────────

function getStatusClass(statusName: string): string {
  const map: Record<string, string> = {
    New: 'bg-blue-50 text-blue-700 border border-blue-200',
    Contacted: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    'Follow Up': 'bg-orange-50 text-orange-700 border border-orange-200',
    Qualified: 'bg-green-50 text-green-700 border border-green-200',
    Converted: 'bg-purple-50 text-purple-700 border border-purple-200',
    Lost: 'bg-red-50 text-red-700 border border-red-200',
  };
  return map[statusName] ?? 'bg-gray-50 text-gray-700 border border-gray-200';
}

// ─── Avatar color by first letter ──────────────────────────────────────────────

const AVATAR_COLORS = [
  '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#dc2626',
  '#0891b2', '#c026d3', '#059669', '#ea580c', '#4f46e5',
];

function getAvatarColor(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ─── Mini stat pill ─────────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-[12px] text-[#6b7280]">{label}</span>
      <span className="text-[13px] font-semibold text-[#111827]">{value}</span>
    </div>
  );
}

// ─── Skeleton rows ──────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-gray-50">
          <td className="px-4 py-3">
            <div className="w-4 h-4 bg-gray-100 rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="space-y-1">
                <div className="h-3.5 w-24 bg-gray-100 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            </div>
          </td>
          {[1, 2, 3, 4, 5, 6].map((j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-3.5 bg-gray-100 rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Lead Modal (shared for Add + Edit) ────────────────────────────────────────

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadFormData) => Promise<void>;
  formError: string | null;
  formLoading: boolean;
  title: string;
  subtitle: string;
  editingLead?: Lead | null;
}

function LeadModal({
  isOpen,
  onClose,
  onSubmit,
  formError,
  formLoading,
  title,
  subtitle,
  editingLead,
}: LeadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-[#111827]">{title}</h2>
            <p className="text-[12px] text-[#6b7280] mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#6b7280] hover:bg-gray-100 hover:text-[#111827] transition-colors duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto">
          {formError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700">
              {formError}
            </div>
          )}
          <LeadForm
            key={editingLead?.id ?? 'new'}
            lead={editingLead ?? undefined}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={formLoading}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Leads Page ────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const router = useRouter();
  const { leads, isLoading, error, fetchLeads, createLead, deleteLead } = useLeads();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Selected rows
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
    fetchLeads({ search: debouncedSearch, status_id: statusFilter });
  }, [debouncedSearch, statusFilter, fetchLeads]);

  const hasFilters = search !== '' || statusFilter !== '' || sourceFilter !== '';

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSourceFilter('');
  };

  // ── Pagination ──
  const filtered = sourceFilter
    ? leads.filter((l) => l.source?.toLowerCase() === sourceFilter.toLowerCase())
    : leads;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Stats ──
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status_name === 'New').length;
  const contactedLeads = leads.filter((l) => l.status_name === 'Contacted').length;
  const convertedLeads = leads.filter((l) => l.status_name === 'Converted').length;

  // ── Delete ──
  const handleDelete = useCallback(
    async (lead: Lead) => {
      if (!confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) return;
      try {
        await deleteLead(lead.id);
        fetchLeads({ search: debouncedSearch, status_id: statusFilter });
      } catch {
        alert('Failed to delete lead. Please try again.');
      }
    },
    [deleteLead, fetchLeads, debouncedSearch, statusFilter]
  );

  // ── Create / Edit submit ──
  const handleCreate = async (data: LeadFormData) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingLead) {
        await api.put(`/leads/${editingLead.id}`, data);
      } else {
        await createLead(data);
      }
      setIsModalOpen(false);
      setEditingLead(null);
      fetchLeads({ search: debouncedSearch, status_id: statusFilter });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        `Failed to ${editingLead ? 'update' : 'create'} lead`;
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingLead(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLead(null);
    setFormError(null);
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((l) => l.id)));
    }
  };
  const toggleOne = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  // ─── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[#111827]">Leads</h1>
          <p className="text-[14px] text-[#6b7280] mt-1">Manage your leads pipeline</p>
        </div>
        <button
          id="add-lead-btn"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563eb] text-white text-[13px] font-medium hover:bg-[#1d4ed8] transition-colors duration-150 flex-shrink-0"
        >
          <Plus size={15} />
          Add Lead
        </button>
      </div>

      {/* ── Stats pills ── */}
      <div className="flex flex-wrap gap-3">
        <StatPill label="Total" value={totalLeads} color="#6b7280" />
        <StatPill label="New" value={newLeads} color="#2563eb" />
        <StatPill label="Contacted" value={contactedLeads} color="#d97706" />
        <StatPill label="Converted" value={convertedLeads} color="#7c3aed" />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={14} />
          <input
            id="lead-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or email…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-[13px] text-[#111827] placeholder-[#9ca3af] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors duration-150"
          />
        </div>

        {/* Status filter */}
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-44 px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-[#111827] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors duration-150"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* Source filter */}
        <select
          id="source-filter"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="w-full sm:w-44 px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-[#111827] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors duration-150"
        >
          <option value="">All Sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 text-[13px] text-[#6b7280] hover:text-[#2563eb] transition-colors duration-150"
          >
            <X size={13} />
            Clear filters
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100" style={{ backgroundColor: '#f9fafb' }}>
                {/* Checkbox */}
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selected.size === paginated.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]"
                  />
                </th>
                {['Name', 'Phone', 'Email', 'Source', 'Status', 'Assigned To', 'Date', 'Actions'].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <SkeletonRows />
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                        <Users size={28} className="text-blue-300" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-[#374151]">No leads yet</p>
                        <p className="text-[13px] text-[#6b7280] mt-1">
                          {hasFilters
                            ? 'Try clearing your filters'
                            : 'Add your first lead to get started'}
                        </p>
                      </div>
                      {!hasFilters && (
                        <button
                          onClick={openAddModal}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563eb] text-white text-[13px] font-medium hover:bg-[#1d4ed8] transition-colors duration-150"
                        >
                          <Plus size={14} />
                          Add Lead
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((lead) => (
                  <tr
                    key={lead.id}
                    className="group hover:bg-slate-50 transition-colors duration-100 cursor-pointer"
                    onClick={() => router.push(`/leads/${lead.id}`)}
                  >
                    {/* Checkbox */}
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(lead.id)}
                        onChange={() => toggleOne(lead.id)}
                        className="rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]"
                      />
                    </td>

                    {/* Name + avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: getAvatarColor(lead.name) }}
                        >
                          <span className="text-white text-[11px] font-semibold">
                            {getInitials(lead.name)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-[#111827] truncate">{lead.name}</p>
                          <p className="text-[11px] text-[#6b7280] truncate">{lead.phone || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-[13px] text-[#6b7280] whitespace-nowrap">
                      {lead.phone || '—'}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-[13px] text-[#6b7280] whitespace-nowrap max-w-[160px] truncate">
                      {lead.email || '—'}
                    </td>

                    {/* Source tag */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {lead.source ? (
                        <span className="px-2 py-1 rounded-md bg-gray-100 text-[11px] font-medium text-[#374151]">
                          {lead.source}
                        </span>
                      ) : (
                        <span className="text-[13px] text-[#9ca3af]">—</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${getStatusClass(lead.status_name)}`}
                      >
                        {lead.status_name}
                      </span>
                    </td>

                    {/* Assigned To */}
                    <td className="px-4 py-3 text-[13px] text-[#6b7280] whitespace-nowrap">
                      {lead.assigned_to_name || '—'}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-[13px] text-[#9ca3af] whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Actions — always visible */}
                    <td
                      className="px-4 py-3 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/leads/${lead.id}`)}
                          className="p-1.5 rounded-md text-[#6b7280] hover:text-[#2563eb] hover:bg-blue-50 transition-colors duration-150"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => openEditModal(lead)}
                          className="p-1.5 rounded-md text-[#6b7280] hover:text-[#16a34a] hover:bg-green-50 transition-colors duration-150"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(lead)}
                          className="p-1.5 rounded-md text-[#6b7280] hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination footer ── */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white">
            <span className="text-[12px] text-[#6b7280]">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} leads
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-[#6b7280] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1 rounded-lg border border-gray-200 text-[12px] font-medium text-[#374151]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-[#6b7280] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Lead Modal ── */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleCreate}
        formError={formError}
        formLoading={formLoading}
        title={editingLead ? 'Edit Lead' : 'Add New Lead'}
        subtitle={
          editingLead
            ? `Editing ${editingLead.name}`
            : 'Fill in the details to add a new lead'
        }
        editingLead={editingLead}
      />
    </div>
  );
}
