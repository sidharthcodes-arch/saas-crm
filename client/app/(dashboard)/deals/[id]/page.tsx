'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  Building,
  Trash2,
  User,
  Plus,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Inbox
} from 'lucide-react';

import api from '@/lib/axios';
import { Deal, DealItem, Contact, Property, Activity } from '@/lib/types';

// ─── Constants & Styling Helpers ───────────────────────────────────────────────

const ACTIVITY_TYPES = [
  { value: 'call', label: 'Call', icon: <Phone size={14} /> },
  { value: 'email', label: 'Email', icon: <Mail size={14} /> },
  { value: 'meeting', label: 'Meeting', icon: <Calendar size={14} /> },
  { value: 'note', label: 'Note', icon: <FileText size={14} /> },
  { value: 'task', label: 'Task', icon: <CheckSquare size={14} /> },
];

function formatINR(value: number | string | null | undefined) {
  if (value === null || value === undefined) return '₹0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

function getStatusColorClasses(statusName: string) {
  const map: Record<string, { border: string; bg: string; text: string; dot: string }> = {
    Open: {
      border: 'border-amber-200',
      bg: 'bg-amber-50/50',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
    },
    Negotiation: {
      border: 'border-orange-200',
      bg: 'bg-orange-50/50',
      text: 'text-orange-700',
      dot: 'bg-orange-500',
    },
    Won: {
      border: 'border-green-200',
      bg: 'bg-green-50/50',
      text: 'text-green-700',
      dot: 'bg-green-500',
    },
    Lost: {
      border: 'border-red-200',
      bg: 'bg-red-50/50',
      text: 'text-red-700',
      dot: 'bg-red-500',
    },
  };
  return map[statusName] ?? {
    border: 'border-gray-200',
    bg: 'bg-gray-50/50',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
  };
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

  return date.toLocaleDateString('en-IN', {
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

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function DealDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  // Core Data States
  const [deal, setDeal] = useState<Deal | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [statuses, setStatuses] = useState<{ id: number; name: string }[]>([]);

  // Page Load / Loading State
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [propertyPrice, setPropertyPrice] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  // Log Activity Form States
  const [activityType, setActivityType] = useState<string>('call');
  const [activityDesc, setActivityDesc] = useState('');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().substring(0, 16));
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  // Fetch Deal & Associated Data
  const fetchDealData = useCallback(async () => {
    try {
      setError(null);
      // 1. Get Deal info
      const dealRes = await api.get(`/deals/${id}`);
      const dealData = dealRes.data.data;
      setDeal(dealData);
      setActivities(dealData.activities ?? []);

      // 2. Get Contact details using deal's contact_id
      if (dealData.contact_id) {
        const contactRes = await api.get(`/contacts/${dealData.contact_id}`);
        setContact(contactRes.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message ?? 'Failed to load deal detail record');
    }
  }, [id]);

  // Load Available Properties & Statuses
  const loadReferenceData = useCallback(async () => {
    try {
      const [propsRes, statusesRes] = await Promise.all([
        api.get('/properties?status=Available'),
        api.get('/statuses?context=deal'),
      ]);
      setAvailableProperties(propsRes.data.data ?? []);
      setStatuses(statusesRes.data.data ?? [
        { id: 1, name: 'Open' },
        { id: 2, name: 'Negotiation' },
        { id: 3, name: 'Won' },
        { id: 4, name: 'Lost' }
      ]);
    } catch (err) {
      console.error('Failed to load reference data', err);
    }
  }, []);

  // Initial Page Loader
  useEffect(() => {
    async function init() {
      setPageLoading(true);
      await Promise.all([fetchDealData(), loadReferenceData()]);
      setPageLoading(false);
    }
    init();
  }, [fetchDealData, loadReferenceData]);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  // Update Status
  const handleUpdateStatus = async (statusId: number) => {
    if (!deal) return;
    try {
      const res = await api.put(`/deals/${deal.id}`, { status_id: statusId });
      setDeal(res.data.data);
      await fetchDealData();
    } catch (err) {
      alert('Failed to update stage/status');
    }
  };

  // Delete Deal Opportunity
  const handleDeleteDeal = async () => {
    if (!deal) return;
    if (!confirm('Are you sure you want to delete this deal? This action will release all reserved properties and cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/deals/${deal.id}`);
      router.push('/deals');
    } catch (err) {
      alert('Failed to delete deal');
    }
  };

  // Add Item (Property) to Deal
  const handleAddPropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal || !selectedPropertyId || !propertyPrice) return;

    try {
      setModalError(null);
      setIsSubmittingItem(true);

      await api.post(`/deals/${deal.id}/items`, {
        property_id: Number(selectedPropertyId),
        price: parseFloat(propertyPrice),
      });

      // Reset form & reload
      setSelectedPropertyId('');
      setPropertyPrice('');
      setModalOpen(false);
      await fetchDealData();
      await loadReferenceData(); // Refresh available properties list
    } catch (err: any) {
      setModalError(err?.response?.data?.message ?? 'Failed to add property to deal');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Remove Item (Property) from Deal
  const handleRemoveProperty = async (itemId: number) => {
    if (!deal) return;
    if (!confirm('Are you sure you want to remove this property from the deal?')) {
      return;
    }
    try {
      await api.delete(`/deals/${deal.id}/items/${itemId}`);
      await fetchDealData();
      await loadReferenceData(); // Refresh available properties list
    } catch (err) {
      alert('Failed to remove property from deal');
    }
  };

  // Add Activity
  const handleAddActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityDesc.trim() || !deal) return;

    try {
      setIsSubmittingActivity(true);
      await api.post(`/deals/${deal.id}/activities`, {
        type: activityType,
        description: activityDesc.trim(),
        activity_at: activityDate,
      });
      setActivityDesc('');
      setActivityDate(new Date().toISOString().substring(0, 16));
      await fetchDealData();
    } catch (err) {
      alert('Failed to log activity.');
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  // Auto-fill price when property selection changes
  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    if (!propertyId) {
      setPropertyPrice('');
      return;
    }
    const prop = availableProperties.find(p => p.id === Number(propertyId));
    if (prop && prop.price !== null) {
      setPropertyPrice(String(prop.price));
    } else {
      setPropertyPrice('');
    }
  };

  // ─── Loading Skeleton ────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-200" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <div className="h-5 w-32 bg-gray-200 rounded" />
              <div className="h-10 w-2/3 bg-gray-100 rounded" />
              <div className="h-4 w-1/2 bg-gray-100 rounded" />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <div className="h-5 w-40 bg-gray-200 rounded" />
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

  // ─── Error State ─────────────────────────────────────────────────────────────

  if (error || !deal) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-[18px] font-semibold text-gray-900 mb-1">Deal Opportunity Not Found</h2>
        <p className="text-[14px] text-gray-500 max-w-sm mb-6">
          {error || "The deal record you are looking for doesn't exist or has been deleted."}
        </p>
        <button
          onClick={() => router.push('/deals')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-150"
        >
          <ArrowLeft size={14} />
          Back to Deals
        </button>
      </div>
    );
  }

  const colorSetup = getStatusColorClasses(deal.status_name);

  // ─── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/deals')}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[22px] font-bold text-gray-900 truncate">
                {deal.contact_name}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorSetup.bg} ${colorSetup.text} ${colorSetup.border}`}>
                {deal.status_name}
              </span>
            </div>
            <p className="text-[13px] text-gray-500 mt-0.5">Sales Opportunity Pipeline Record</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Deal Financial Info */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-[15px] font-semibold text-gray-900">Financial Summary</h3>
            </div>
            
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Value</p>
                <p className="text-[32px] font-extrabold text-gray-900 tracking-tight mt-1">
                  {formatINR(deal.total_amount)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Created Date</p>
                  <p className="text-[13px] font-medium text-gray-800 mt-1">
                    {new Date(deal.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Closed Date</p>
                  <p className="text-[13px] font-medium text-gray-805 mt-1">
                    {deal.closed_at ? (
                      new Date(deal.closed_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    ) : (
                      <span className="text-gray-400 italic">Deal is open</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Deal Items (Properties) */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-gray-900">Linked Properties</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[11px] font-bold text-blue-600 border border-blue-100">
                  {deal.items?.length || 0}
                </span>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[12px] font-semibold transition-colors duration-150"
              >
                <Plus size={14} />
                Add Property
              </button>
            </div>

            <div className="px-6 py-5">
              {!deal.items || deal.items.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center justify-center">
                  <Building size={28} className="text-gray-300 mb-2" />
                  <p className="text-[13px] text-gray-400 font-semibold">No properties linked to this deal</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 max-w-[220px]">Attach a property opportunity to populate financial details.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {deal.items.map((item) => (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/properties/${item.property_id}`}
                            className="text-[13.5px] font-bold text-gray-900 hover:text-blue-600 transition-colors truncate"
                          >
                            {item.property_name}
                          </Link>
                          <span className="px-1.5 py-0.2 bg-gray-100 text-gray-600 border rounded text-[10px] font-mono">
                            {item.property_code}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {item.property_type || 'Property'} {item.area_sqft ? `• ${item.area_sqft} sqft` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-[14.5px] font-extrabold text-gray-900">
                          {formatINR(item.price)}
                        </span>
                        <button
                          onClick={() => handleRemoveProperty(item.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove property"
                        >
                          <Trash2 size={15} />
                        </button>
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
                <h3 className="text-[15px] font-semibold text-gray-900">Timeline Activity</h3>
                <span className="px-2 py-0.5 rounded-full bg-gray-105 text-[11px] font-bold text-gray-500 border">
                  {activities.length}
                </span>
              </div>
            </div>

            <div className="px-6 py-5">
              {activities.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center justify-center">
                  <Inbox size={28} className="text-gray-305 mb-2" />
                  <p className="text-[13px] text-gray-400 font-semibold">No activity logs recorded yet</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-gray-100 ml-4 pl-6 space-y-6">
                  {activities.map((act) => {
                    const setup = getActivityIcon(act.type);
                    return (
                      <div key={act.id} className="relative">
                        <div
                          className={`absolute -left-[35px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center bg-white ${setup.bg}`}
                          title={setup.label}
                        >
                          {setup.icon}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[12px] font-semibold text-gray-900 capitalize bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                              {setup.label}
                            </span>
                            <span className="text-[11px] text-gray-405 flex-shrink-0">
                              {timeAgo(act.activity_at || act.created_at)}
                            </span>
                          </div>
                          {act.description && (
                            <p className="text-[13px] text-gray-600 mt-1.5 leading-relaxed break-words whitespace-pre-wrap">
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

                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                      Notes
                    </label>
                    <textarea
                      value={activityDesc}
                      onChange={(e) => setActivityDesc(e.target.value)}
                      placeholder="Add conversation notes, next steps..."
                      rows={3}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors duration-150"
                    />
                  </div>

                  <div className="w-full sm:w-72">
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                      Activity Time
                    </label>
                    <input
                      type="datetime-local"
                      value={activityDate}
                      onChange={(e) => setActivityDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors duration-150"
                    />
                  </div>

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

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* Card 1: Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
            <h4 className="text-[12px] font-bold text-gray-450 uppercase tracking-wider">Quick Actions</h4>

            <div>
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Change Pipeline Stage
              </label>
              <select
                value={deal.status_id}
                onChange={(e) => handleUpdateStatus(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors duration-150 font-medium"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleDeleteDeal}
              className="w-full text-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-655 border border-red-200 rounded-lg text-[13px] font-semibold transition-colors duration-150"
            >
              Delete Deal Opportunity
            </button>
          </div>

          {/* Card 2: Contact Info */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
            <h4 className="text-[12px] font-bold text-gray-450 uppercase tracking-wider">Contact Info</h4>
            
            {contact ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-[12px]"
                    style={{ backgroundColor: getAvatarColor(contact.name) }}
                  >
                    {getInitials(contact.name)}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="text-[13.5px] font-bold text-gray-900 hover:text-blue-600 transition-colors truncate block"
                    >
                      {contact.name}
                    </Link>
                    <p className="text-[11px] text-gray-400">Linked Account Contact</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-50 space-y-2.5">
                  <div className="flex items-center gap-2 text-[12.5px] text-gray-600">
                    <Phone size={13} className="text-gray-400 shrink-0" />
                    <span>{contact.phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12.5px] text-gray-600">
                    <Mail size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{contact.email || '—'}</span>
                  </div>
                </div>

                <Link
                  href={`/contacts/${contact.id}`}
                  className="w-full text-center block px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-[13px] font-semibold transition-colors duration-150"
                >
                  View Full Profile &rarr;
                </Link>
              </div>
            ) : (
              <div className="py-2 text-center text-gray-400 italic text-[12px]">
                No contact profile found
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ─── Add Property Modal (Dialog Styling) ─────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setModalOpen(false);
              setModalError(null);
            }}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-[16px] font-semibold text-gray-900">Add Property to Deal</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">Select a property and assign a deal price</p>
              </div>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setModalError(null);
                }}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddPropertySubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-5 overflow-y-auto space-y-4">
                {modalError && (
                  <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700 flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[12px] font-bold text-gray-600 mb-1.5">
                    Select Available Property
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => handlePropertyChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-950 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  >
                    <option value="">— Select Property —</option>
                    {availableProperties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code}) — {formatINR(p.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-gray-600 mb-1.5">
                    Price (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold text-[13px]">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={propertyPrice}
                      onChange={(e) => setPropertyPrice(e.target.value)}
                      placeholder="Enter price for this transaction"
                      required
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-950 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setModalError(null);
                  }}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg text-[13px] font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingItem || !selectedPropertyId || !propertyPrice}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmittingItem ? 'Adding...' : 'Add Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
