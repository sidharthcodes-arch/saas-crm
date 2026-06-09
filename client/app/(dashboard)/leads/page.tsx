'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

import api from '@/lib/axios';
import { Lead } from '@/lib/types';
import { useLeads } from '@/hooks/useLeads';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import LeadForm from '@/components/leads/LeadForm';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = [
  { id: '1', name: 'New' },
  { id: '2', name: 'Contacted' },
  { id: '3', name: 'Follow Up' },
  { id: '4', name: 'Qualified' },
  { id: '5', name: 'Converted' },
  { id: '6', name: 'Lost' },
];

const PAGE_SIZE = 20;

type BadgeVariant = 'primary' | 'warning' | 'danger' | 'success' | 'info' | 'secondary';

function getStatusBadgeVariant(statusName: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    New: 'primary',
    Contacted: 'warning',
    'Follow Up': 'secondary',
    Qualified: 'success',
    Converted: 'info',
    Lost: 'danger',
  };
  return map[statusName] ?? 'secondary';
}

// ─── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: 8 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const router = useRouter();
  const { leads, isLoading, error, fetchLeads, createLead, deleteLead } = useLeads();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Debounce search input by 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Re-fetch whenever filters change; reset to page 1
  useEffect(() => {
    setPage(1);
    fetchLeads({ search: debouncedSearch, status_id: statusFilter });
  }, [debouncedSearch, statusFilter, fetchLeads]);

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
  };

  const hasFilters = search !== '' || statusFilter !== '';

  // ── Pagination slice ──
  const totalPages = Math.ceil(leads.length / PAGE_SIZE);
  const paginated = leads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  // ── Create ──
  const handleCreate = async (data: Parameters<typeof createLead>[0]) => {
    setFormLoading(true);
    setFormError(null);
    try {
      await createLead(data);
      setIsModalOpen(false);
      fetchLeads({ search: debouncedSearch, status_id: statusFilter });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create lead';
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageHeader
        title="Leads"
        subtitle="Manage and track incoming business opportunities"
        actions={
          <Button onClick={() => { setFormError(null); setIsModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        }
      />

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or email…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Phone', 'Email', 'Source', 'Status', 'Assigned To', 'Created At', 'Actions'].map(
                (col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <SkeletonRows />
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <Users className="w-12 h-12" />
                    <p className="text-sm font-medium text-gray-500">No leads found</p>
                    {hasFilters && (
                      <p className="text-xs text-gray-400">
                        Try clearing your filters or add a new lead.
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  {/* Name */}
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {lead.name}
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {lead.phone || '—'}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {lead.email || '—'}
                  </td>

                  {/* Source */}
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {lead.source || '—'}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant={getStatusBadgeVariant(lead.status_name)}>
                      {lead.status_name}
                    </Badge>
                  </td>

                  {/* Assigned To */}
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {lead.assigned_user_name || '—'}
                  </td>

                  {/* Created At */}
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/leads/${lead.id}`)}
                        className="p-1.5 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lead)}
                        className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, leads.length)} of{' '}
            {leads.length} leads
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded border border-gray-300 font-medium">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Lead"
      >
        {formError && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {formError}
          </div>
        )}
        <LeadForm
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
          isLoading={formLoading}
        />
      </Modal>
    </div>
  );
}
