'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  ArrowLeft,
  Plus,
  Trash2,
  User,
  CheckCircle,
  X,
  AlertCircle,
  Pencil
} from 'lucide-react';

import api from '@/lib/axios';
import { Contact, Activity } from '@/lib/types';
import ContactForm from '@/components/contacts/ContactForm';

// ─── Constants & Styling Helpers ────────────────────────────────────────────────

interface DealData {
  id: number;
  total_amount: number;
  status_name: string;
  created_at: string;
}

const ACTIVITY_TYPES = [
  { value: 'call', label: 'Call', icon: <Phone size={14} /> },
  { value: 'email', label: 'Email', icon: <Mail size={14} /> },
  { value: 'meeting', label: 'Meeting', icon: <Calendar size={14} /> },
  { value: 'note', label: 'Note', icon: <FileText size={14} /> },
  { value: 'task', label: 'Task', icon: <CheckSquare size={14} /> },
];

function getDealStatusClass(statusName: string): string {
  const map: Record<string, string> = {
    New: 'bg-blue-50 text-blue-700 border border-blue-200',
    Negotiation: 'bg-orange-50 text-orange-700 border border-orange-200',
    Won: 'bg-green-50 text-green-700 border border-green-200',
    Lost: 'bg-red-50 text-red-700 border border-red-200',
    'Under Contract': 'bg-purple-50 text-purple-700 border border-purple-200',
  };
  return map[statusName] ?? 'bg-gray-50 text-gray-700 border border-gray-200';
}

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

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getActivityIcon(type: string) {
  const t = type.toLowerCase();
  switch (t) {
    case 'call':
      return {
        icon: <Phone size={14} className="text-blue-600" />,
        bg: 'bg-blue-50 border border-blue-100',
        label: 'Call'
      };
    case 'email':
      return {
        icon: <Mail size={14} className="text-purple-600" />,
        bg: 'bg-purple-50 border border-purple-100',
        label: 'Email'
      };
    case 'meeting':
      return {
        icon: <Calendar size={14} className="text-green-600" />,
        bg: 'bg-green-50 border border-green-100',
        label: 'Meeting'
      };
    case 'note':
      return {
        icon: <FileText size={14} className="text-yellow-600" />,
        bg: 'bg-yellow-50 border border-yellow-100',
        label: 'Note'
      };
    case 'task':
      return {
        icon: <CheckSquare size={14} className="text-red-600" />,
        bg: 'bg-red-50 border border-red-100',
        label: 'Task'
      };
    default:
      return {
        icon: <FileText size={14} className="text-gray-600" />,
        bg: 'bg-gray-50 border border-gray-100',
        label: 'Activity'
      };
  }
}

function formatCurrency(amount: number | string | null): string {
  if (amount === null || amount === undefined) return '$0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

// ─── Contact Detail Content Component ───────────────────────────────────────────

function ContactDetailContent() {
  const { id } = useParams();
  const router = useRouter();

  // Core data states
  const [contact, setContact] = useState<Contact | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deals, setDeals] = useState<DealData[]>([]);

  // Status & loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Activity form states
  const [activityType, setActivityType] = useState<string>('call');
  const [activityDesc, setActivityDesc] = useState('');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().substring(0, 16));
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  // Edit Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Fetch all contact details
  const fetchContactData = useCallback(async () => {
    try {
      setError(null);
      // Fetch contact details, activities, and deals in parallel
      const [contactRes, activitiesRes, dealsRes] = await Promise.all([
        api.get(`/contacts/${id}`),
        api.get(`/activities?entity_type=contact&entity_id=${id}`),
        api.get(`/deals?contact_id=${id}`)
      ]);

      setContact(contactRes.data.data);
      setActivities(activitiesRes.data.data ?? []);
      setDeals(dealsRes.data.data ?? []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Contact not found';
      setError(msg);
    }
  }, [id]);

  // Load initial details
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      await fetchContactData();
      setIsLoading(false);
    }
    loadData();
  }, [fetchContactData]);

  // Actions
  const handleAddActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityDesc.trim()) return;

    try {
      setIsSubmittingActivity(true);
      await api.post(`/contacts/${id}/activities`, {
        type: activityType,
        description: activityDesc.trim(),
        activity_at: activityDate,
      });
      setActivityDesc('');
      setActivityDate(new Date().toISOString().substring(0, 16));
      await fetchContactData();
    } catch {
      alert('Failed to log activity. Please try again.');
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!contact) return;
    if (!confirm(`Are you sure you want to delete contact "${contact.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/contacts/${contact.id}`);
      router.push('/contacts');
    } catch {
      alert('Failed to delete contact. Please try again.');
    }
  };

  const handleEditContactFormSubmit = async (data: { name: string; phone: string; email: string }) => {
    try {
      setEditLoading(true);
      setEditError(null);
      await api.put(`/contacts/${id}`, data);
      setIsEditModalOpen(false);
      await fetchContactData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to save contact details';
      setEditError(msg);
    } finally {
      setEditLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-200" />
          <div className="space-y-2">
            <div className="h-6 w-52 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Column Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Info Card Skeleton */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <div className="h-5 w-36 bg-gray-200 rounded" />
              <div className="grid grid-cols-2 gap-6 pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3.5 w-16 bg-gray-100 rounded" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
            {/* Timeline Card Skeleton */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <div className="h-5 w-24 bg-gray-200 rounded" />
              <div className="h-20 bg-gray-100 rounded-lg" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <div className="h-10 bg-gray-200 rounded-lg" />
              <div className="h-10 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-[18px] font-semibold text-gray-900 mb-1">Contact Not Found</h2>
        <p className="text-[14px] text-gray-500 max-w-sm mb-6">
          {error || "The contact you are looking for doesn't exist or has been deleted."}
        </p>
        <button
          onClick={() => router.push('/contacts')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-150"
        >
          <ArrowLeft size={14} />
          Back to Contacts
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/contacts')}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[22px] font-bold text-gray-900 truncate">{contact.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                contact.created_from_lead_id
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}>
                {contact.created_from_lead_id ? 'Converted Lead' : 'Manual Entry'}
              </span>
            </div>
            <p className="text-[13px] text-gray-500 mt-0.5">Contact detailed record</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Contact Info & Activities */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Contact Details */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-gray-900">Contact Details</h3>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150"
              >
                <Pencil size={13} />
                Edit Info
              </button>
            </div>
            
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Phone</p>
                  <p className="text-[13px] font-medium text-gray-900 mt-1">{contact.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Email</p>
                  <p className="text-[13px] font-medium text-gray-900 mt-1">{contact.email || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Created From Lead</p>
                  <p className="text-[13px] font-medium mt-1">
                    {contact.created_from_lead_id ? (
                      <Link
                        href={`/leads/${contact.created_from_lead_id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                      >
                        <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                        {contact.original_lead_name || `Lead #${contact.created_from_lead_id}`}
                      </Link>
                    ) : (
                      <span className="text-gray-505">None</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Created At</p>
                  <p className="text-[13px] font-medium text-gray-900 mt-1">
                    {new Date(contact.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Linked Deals */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-gray-900">Linked Deals</h3>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[11px] font-medium text-gray-600 border">
                  {deals.length}
                </span>
              </div>
              <button
                onClick={() => router.push(`/deals?contact_id=${contact.id}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150"
              >
                <Plus size={13} />
                Create Deal
              </button>
            </div>

            <div className="px-6 py-5">
              {deals.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[13px] text-gray-400">No deals yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deals.map((deal) => (
                    <div
                      key={deal.id}
                      onClick={() => router.push(`/deals/${deal.id}`)}
                      className="p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm cursor-pointer transition-all duration-150 space-y-3 bg-gray-50/30"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold text-gray-900">
                          Deal #{deal.id}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getDealStatusClass(deal.status_name)}`}>
                          {deal.status_name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[12px]">
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Amount</p>
                          <p className="text-[13px] font-bold text-gray-900 mt-1">
                            {formatCurrency(deal.total_amount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Created</p>
                          <p className="text-[12px] font-medium text-gray-700 mt-1">
                            {new Date(deal.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Activity Timeline */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-gray-900">Activity</h3>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[11px] font-medium text-gray-600 border">
                  {activities.length}
                </span>
              </div>
            </div>

            <div className="px-6 py-5">
              {/* Timeline list */}
              {activities.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[13px] text-gray-400">No activities yet</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-gray-100 ml-4 pl-6 space-y-6">
                  {activities.map((act) => {
                    const setup = getActivityIcon(act.type);
                    return (
                      <div key={act.id} className="relative">
                        {/* Timeline Icon Badge */}
                        <div
                          className={`absolute -left-[35px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center bg-white ${setup.bg}`}
                          title={setup.label}
                        >
                          {setup.icon}
                        </div>
                        
                        {/* Timeline Item Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[12px] font-semibold text-gray-900 capitalize bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                              {setup.label}
                            </span>
                            <span className="text-[11px] text-gray-400 flex-shrink-0">
                              {timeAgo(act.activity_at || act.created_at)}
                            </span>
                          </div>
                          {act.description && (
                            <p className="text-[13px] text-gray-650 mt-1.5 leading-relaxed break-words whitespace-pre-wrap">
                              {act.description}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-1">
                            Logged by <span className="font-semibold text-gray-600">{act.performed_by || 'System'}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Log Activity Form */}
              <div className="mt-8 pt-6 border-t border-gray-150">
                <h4 className="text-[13px] font-semibold text-gray-900 mb-3">Log a New Activity</h4>
                <form onSubmit={handleAddActivitySubmit} className="space-y-4">
                  {/* Pill button selector */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Activity Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ACTIVITY_TYPES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setActivityType(t.value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all duration-150 ${
                            activityType === t.value
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-250 hover:bg-gray-50'
                          }`}
                        >
                          {t.icon}
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description Input */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                      Description / Notes
                    </label>
                    <textarea
                      value={activityDesc}
                      onChange={(e) => setActivityDesc(e.target.value)}
                      placeholder="Enter activity notes..."
                      rows={3}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors duration-150"
                    />
                  </div>

                  {/* Date picker */}
                  <div className="w-full sm:w-72">
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                      Activity Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={activityDate}
                      onChange={(e) => setActivityDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors duration-150"
                    />
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isSubmittingActivity}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                  >
                    <Plus size={14} />
                    {isSubmittingActivity ? 'Logging...' : 'Log Activity'}
                  </button>
                </form>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Quick Actions & Source Details */}
        <div className="space-y-6">
          
          {/* Card 1: Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-3">
            <h4 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</h4>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="w-full text-center px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-[13px] font-semibold transition-colors duration-150"
            >
              Edit Contact Details
            </button>

            <button
              onClick={handleDeleteContact}
              className="w-full text-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[13px] font-semibold border border-red-200 transition-colors duration-150"
            >
              Delete Contact
            </button>
          </div>

          {/* Card 2: Contact Source Details */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Source</h4>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                contact.created_from_lead_id
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}>
                {contact.created_from_lead_id ? 'Converted Lead' : 'Manual Entry'}
              </span>
            </div>

            <p className="text-[13px] text-gray-500 font-medium">
              {contact.created_from_lead_id ? (
                <>
                  This contact was created by converting lead{' '}
                  <Link
                    href={`/leads/${contact.created_from_lead_id}`}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    {contact.original_lead_name || `#${contact.created_from_lead_id}`}
                  </Link>
                  .
                </>
              ) : (
                'This contact was added manually into the CRM database.'
              )}
            </p>
          </div>

        </div>
      </div>

      {/* ─── Edit Modal ─── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          />

          {/* Dialog Container */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-[16px] font-semibold text-gray-900">Edit Contact Details</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">Modify profile fields for {contact.name}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 overflow-y-auto">
              {editError && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700 animate-pulse">
                  {editError}
                </div>
              )}
              <ContactForm
                contact={contact}
                onSubmit={handleEditContactFormSubmit}
                onCancel={() => setIsEditModalOpen(false)}
                isLoading={editLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContactDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[40vh] flex items-center justify-center text-gray-500">
        Loading contact details...
      </div>
    }>
      <ContactDetailContent />
    </Suspense>
  );
}
