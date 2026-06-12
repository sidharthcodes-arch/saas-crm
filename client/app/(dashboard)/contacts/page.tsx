'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  User,
  X,
  Sparkles
} from 'lucide-react';

import api from '@/lib/axios';
import { Contact } from '@/lib/types';
import { useContacts } from '@/hooks/useContacts';
import ContactForm from '@/components/contacts/ContactForm';

// ─── Constants & Styling helpers ───────────────────────────────────────────────

function getAvatarColor(name: string): string {
  const colors = [
    '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#dc2626',
    '#0891b2', '#c026d3', '#059669', '#ea580c', '#4f46e5',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

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

// ─── Main Content Component ───────────────────────────────────────────────────

function ContactsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialLeadId = searchParams.get('created_from_lead_id') || '';

  const { contacts, isLoading, error, fetchContacts, createContact, deleteContact } = useContacts();

  // Filters
  const [search, setSearch] = useState('');
  const [leadFilter, setLeadFilter] = useState(initialLeadId);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch contacts when filter change
  useEffect(() => {
    fetchContacts({
      search: debouncedSearch,
      created_from_lead_id: leadFilter || undefined,
    });
  }, [debouncedSearch, leadFilter, fetchContacts]);

  const hasFilters = search !== '' || leadFilter !== '';

  const handleClearFilters = () => {
    setSearch('');
    setLeadFilter('');
  };

  // Create Contact submit
  const handleCreateSubmit = async (data: { name: string; email: string; phone: string }) => {
    setFormLoading(true);
    setFormError(null);
    try {
      await createContact(data);
      setIsModalOpen(false);
      fetchContacts({ search: debouncedSearch, created_from_lead_id: leadFilter });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create contact';
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Contact trigger
  const handleDeleteContact = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete contact "${name}"?`)) return;
    try {
      await deleteContact(id);
      fetchContacts({ search: debouncedSearch, created_from_lead_id: leadFilter });
    } catch {
      alert('Failed to delete contact');
    }
  };

  // Stats calculation
  const totalContacts = contacts.length;
  const thisMonthContacts = contacts.filter((c) => {
    const date = new Date(c.created_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[#111827]">Contacts</h1>
          <p className="text-[14px] text-[#6b7280] mt-1">Manage and view your customer contact records</p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563eb] text-white text-[13px] font-medium hover:bg-[#1d4ed8] transition-colors duration-150 flex-shrink-0"
        >
          <Plus size={15} />
          Add Contact
        </button>
      </div>

      {/* Stats pills */}
      <div className="flex flex-wrap gap-3">
        <StatPill label="Total" value={totalContacts} color="#6b7280" />
        <StatPill label="This Month" value={thisMonthContacts} color="#2563eb" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-[13px] text-[#111827] placeholder-[#9ca3af] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors duration-150"
          />
        </div>

        {/* Lead filter */}
        <input
          type="text"
          value={leadFilter}
          onChange={(e) => setLeadFilter(e.target.value)}
          placeholder="Filter by Lead ID…"
          className="w-full sm:w-44 px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-[#111827] placeholder-[#9ca3af] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors duration-150"
        />

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

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {/* Table & Empty State */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="min-w-full">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/4 bg-gray-100 rounded" />
                    <div className="h-3 w-1/3 bg-gray-50 rounded" />
                  </div>
                  <div className="h-4 w-24 bg-gray-100 rounded" />
                  <div className="h-4 w-12 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 text-blue-500">
              <User size={32} />
            </div>
            <h3 className="text-[16px] font-semibold text-gray-900 mb-1">No contacts found</h3>
            <p className="text-[13px] text-gray-500 max-w-sm mb-6">
              {hasFilters
                ? "Your filters didn't return any matching contact records. Try resetting filters."
                : "No customer contact records have been created yet. Click below to add your first one."}
            </p>
            {!hasFilters && (
              <button
                onClick={() => {
                  setFormError(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-150"
              >
                <Plus size={14} />
                Create Contact
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-150">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Linked Deals
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50/50 transition-colors duration-100">
                    {/* Contact avatar and info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-[12px] flex-shrink-0"
                          style={{ backgroundColor: getAvatarColor(contact.name) }}
                        >
                          {getInitials(contact.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">
                            {contact.name}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">
                            {contact.email || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] text-gray-600">
                      {contact.phone || '—'}
                    </td>

                    {/* Source / Converted Lead badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.created_from_lead_id ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-green-50 text-green-700 border-green-200">
                          <Sparkles size={10} />
                          Converted Lead
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-gray-50 text-gray-600 border-gray-200">
                          Manual Entry
                        </span>
                      )}
                    </td>

                    {/* Linked Deals count */}
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-semibold text-gray-900">
                      {Number(contact.deals_count || 0)}
                    </td>

                    {/* Created At */}
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] text-gray-500">
                      {new Date(contact.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-[13px] font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/contacts/${contact.id}`)}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-150 hover:text-gray-900 transition-all duration-100"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id, contact.name)}
                          className="p-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-all duration-100"
                          title="Delete Contact"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Add Contact Modal ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Dialog Container */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-[16px] font-semibold text-gray-900">Create New Contact</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">Add a new customer contact record manually</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 overflow-y-auto">
              {formError && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700">
                  {formError}
                </div>
              )}
              <ContactForm
                onSubmit={handleCreateSubmit}
                onCancel={() => setIsModalOpen(false)}
                isLoading={formLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[40vh] flex items-center justify-center text-gray-500">
        Loading contacts page...
      </div>
    }>
      <ContactsPageContent />
    </Suspense>
  );
}
