'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  DragEndEvent,
  useDraggable,
  useDroppable,
  DragOverlay
} from '@dnd-kit/core';
import {
  Plus,
  GripVertical,
  Inbox,
  User,
  Search,
  Check,
  Building,
  DollarSign,
  Briefcase,
  AlertCircle,
  X,
  Sparkles,
  Clock,
  MoreVertical,
  Eye,
  FileText,
  Calendar,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  Target,
  Scale
} from 'lucide-react';

import api from '@/lib/axios';
import { Deal, Contact, Property } from '@/lib/types';
import { useDeals } from '@/hooks/useDeals';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(value: number | string | null): string {
  if (value === null || value === undefined) return '₹0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
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

function getStatusColorClasses(statusName: string) {
  const map: Record<string, { border: string; bg: string; text: string; dot: string; headerBg: string }> = {
    Open: {
      border: 'border-l-4 border-l-amber-500',
      bg: 'bg-amber-50/50',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      headerBg: 'bg-amber-50/40 border-b border-amber-100/60',
    },
    Negotiation: {
      border: 'border-l-4 border-l-orange-500',
      bg: 'bg-orange-50/50',
      text: 'text-orange-700',
      dot: 'bg-orange-500',
      headerBg: 'bg-orange-50/40 border-b border-orange-100/60',
    },
    Won: {
      border: 'border-l-4 border-l-green-500',
      bg: 'bg-green-50/50',
      text: 'text-green-700',
      dot: 'bg-green-500',
      headerBg: 'bg-green-50/40 border-b border-green-100/60',
    },
    Lost: {
      border: 'border-l-4 border-l-red-500',
      bg: 'bg-red-50/50',
      text: 'text-red-700',
      dot: 'bg-red-500',
      headerBg: 'bg-red-50/40 border-b border-red-100/60',
    },
  };
  return map[statusName] ?? {
    border: 'border-l-4 border-l-gray-300',
    bg: 'bg-gray-50/50',
    text: 'text-gray-705',
    dot: 'bg-gray-400',
    headerBg: 'bg-white border-b border-gray-100',
  };
}

// ─── Draggable Deal Card Component ─────────────────────────────────────────────

// ─── Deal Card Layout Component (Static or Overlay) ──────────────────────────

interface DealCardProps {
  deal: Deal;
  isOverlay?: boolean;
  isDragging?: boolean;
}

function DealCard({ deal, isOverlay, isDragging }: DealCardProps) {
  const router = useRouter();
  const colorSetup = getStatusColorClasses(deal.status_name);
  const mainItem = deal.items?.[0];

  return (
    <div
      onClick={() => !isOverlay && router.push(`/deals/${deal.id}`)}
      className={`bg-white border rounded-xl p-3.5 hover:shadow-md hover:border-slate-350 transition-all duration-150 relative flex flex-col gap-2.5 group ${
        isOverlay ? 'border-blue-400 shadow-xl scale-[1.025] cursor-grabbing z-[9999]' : 'border-slate-205/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-grab active:cursor-grabbing'
      } ${colorSetup.border} ${isDragging ? 'opacity-30' : ''}`}
    >
      {/* Top Row: Status Tag & Created Date */}
      <div className="flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border border-current/25 ${colorSetup.bg} ${colorSetup.text}`}>
          {deal.status_name}
        </span>

        {/* Hover Quick Actions */}
        {!isOverlay && (
          <div 
            className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm transition-opacity duration-150 absolute right-2 top-2 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => router.push(`/deals/${deal.id}`)}
              className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-800 rounded transition-colors"
              title="View Details"
            >
              <Eye size={12} />
            </button>
            <button
              onClick={() => alert(`Add Note for deal with ${deal.contact_name}`)}
              className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-800 rounded transition-colors"
              title="Add Note"
            >
              <FileText size={12} />
            </button>
            <button
              onClick={() => alert(`Schedule follow-up for deal with ${deal.contact_name}`)}
              className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-800 rounded transition-colors"
              title="Schedule Follow-up"
            >
              <Calendar size={12} />
            </button>
          </div>
        )}

        {/* Date Display */}
        <div className={`flex items-center gap-1 text-[11px] text-slate-400 transition-opacity duration-150 ${!isOverlay ? 'group-hover:opacity-0' : ''}`}>
          <Clock size={11} />
          <span>
            {new Date(deal.created_at).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Client Name */}
      <div>
        <h4 className="text-[13.5px] font-bold text-slate-800 hover:text-blue-600 transition-colors duration-150 truncate" title={deal.contact_name}>
          {deal.contact_name}
        </h4>
      </div>

      {/* Property Context (First-Class Citizen) */}
      {mainItem ? (
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex flex-col gap-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold truncate">
            <Building size={12} className="text-slate-450 shrink-0" />
            <span className="truncate">{mainItem.property_name}</span>
          </div>
          <div className="text-slate-500 font-medium pl-4 flex items-center justify-between">
            <span className="truncate">{mainItem.property_type || 'Property'} • {mainItem.area_sqft ? `${mainItem.area_sqft} sqft` : 'N/A sqft'}</span>
            {deal.items && deal.items.length > 1 && (
              <span className="px-1 py-0.2 bg-blue-50 text-blue-600 font-bold rounded text-[9px] border border-blue-100/50 shrink-0">
                +{deal.items.length - 1} more
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50/50 border border-dashed border-slate-250 rounded-lg py-2.5 px-3 text-center text-[11px] text-slate-400 font-medium">
          No properties linked
        </div>
      )}

      {/* Deal Value */}
      <div>
        <p className="text-[16px] font-extrabold text-slate-900 leading-tight">
          {formatINR(deal.total_amount)}
        </p>
      </div>

      {/* Footer Row: Divider, Properties Count & Avatar Circle */}
      <div className="border-t border-slate-100 mt-1 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
          <Building size={12} className="text-slate-355" />
          <span>
            {deal.properties_count || 0} {deal.properties_count === 1 ? 'property' : 'properties'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Contact Initial Avatar */}
          <div
            className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-white font-bold text-[9px] border border-white shadow-sm flex-shrink-0"
            style={{ backgroundColor: getAvatarColor(deal.contact_name || 'U') }}
            title={deal.contact_name}
          >
            {getInitials(deal.contact_name || 'U')}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Draggable Deal Card Component ─────────────────────────────────────────────

function DraggableDealCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `deal-${deal.id}`,
    data: deal,
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="outline-none">
      <DealCard
        deal={deal}
        isDragging={isDragging}
      />
    </div>
  );
}

// ─── Droppable Column Component ────────────────────────────────────────────────

interface DroppableColumnProps {
  status: { id: number; name: string };
  deals: Deal[];
  getColumnTotal: (statusName: string) => number;
  onAddDealClick: (statusId: number) => void;
}

function DroppableColumn({ status, deals, getColumnTotal, onAddDealClick }: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${status.id}`,
  });

  const colorSetup = getStatusColorClasses(status.name);

  // Stage empty states:
  const getEmptyStateDetails = (stageName: string) => {
    switch (stageName.toLowerCase()) {
      case 'open':
        return {
          title: 'No open pipeline deals',
          description: 'Create a new deal to start tracking pipeline progress.',
          action: 'Add Deal',
        };
      case 'negotiation':
        return {
          title: 'No active negotiations',
          description: 'Drag qualified deals here once property details are selected.',
          action: 'Select Properties',
        };
      case 'won':
        return {
          title: 'No won deals yet',
          description: 'Move successful negotiations here to close them!',
          action: 'Close a Negotiation',
        };
      case 'lost':
        return {
          title: 'No lost deals',
          description: 'Keep up the good work and keep conversion rates high.',
          action: 'Review Policies',
        };
      default:
        return {
          title: 'No deals here',
          description: 'No deal pipeline cards are currently in this stage.',
          action: 'Add Deal',
        };
    }
  };

  const emptyState = getEmptyStateDetails(status.name);

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-50 border border-slate-200/60 rounded-2xl min-h-[580px] flex flex-col flex-1 min-w-[280px] max-w-[320px] transition-all duration-150 ${
        isOver ? 'ring-2 ring-blue-500 border-transparent shadow-md bg-blue-50/15' : ''
      }`}
    >
      {/* Column Header */}
      <div className={`px-4 py-3.5 rounded-t-2xl flex flex-col gap-1 ${colorSetup.headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full ${colorSetup.dot} flex-shrink-0`} />
            <h3 className="text-[13px] font-bold text-slate-800 truncate">
              {status.name}
            </h3>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-150 text-[10px] font-bold text-slate-650 border border-slate-200/60 flex-shrink-0">
              {deals.length}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onAddDealClick(status.id)}
              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100/60 transition-colors"
              title={`Add deal to ${status.name}`}
            >
              <Plus size={14} />
            </button>
            <button className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100/60 transition-colors">
              <MoreVertical size={13} />
            </button>
          </div>
        </div>
        <div>
          <span className="text-[12px] font-extrabold text-slate-500">
            {formatINR(getColumnTotal(status.name))}
          </span>
        </div>
      </div>

      {/* Column Cards Container */}
      <div className="p-3 flex-1 overflow-y-auto max-h-[580px] space-y-3 rounded-b-2xl">
        {deals.length === 0 ? (
          <div className="h-full min-h-[250px] border border-dashed border-slate-200/80 rounded-xl flex flex-col items-center justify-center p-5 text-center bg-slate-100/10">
            <Inbox size={24} className="text-slate-350 mb-2" />
            <p className="text-[12.5px] text-slate-705 font-bold mb-1">{emptyState.title}</p>
            <p className="text-[10px] text-slate-400 font-semibold max-w-[185px] leading-relaxed mb-3">
              {emptyState.description}
            </p>
            <button
              onClick={() => onAddDealClick(status.id)}
              className="px-3 py-1 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded-md text-[10px] font-bold shadow-sm transition-all duration-150 animate-pulse"
            >
              {emptyState.action}
            </button>
          </div>
        ) : (
          deals.map((deal) => <DraggableDealCard key={deal.id} deal={deal} />)
        )}
      </div>
    </div>
  );
}

// ─── Main Deals Content Component ──────────────────────────────────────────────

function DealsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactIdPrefill = searchParams.get('contact_id');

  // Core deals hook
  const { deals, setDeals, fetchDeals, createDeal, updateDeal } = useDeals();

  // Reference data
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [statuses, setStatuses] = useState<{ id: number; name: string }[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  // Page loading & modal state
  const [pageLoading, setPageLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form inputs
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [selectedStatusId, setSelectedStatusId] = useState<string>('');
  const [addPropertyNow, setAddPropertyNow] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [dealPrice, setDealPrice] = useState<string>('');

  // Search filter query inputs
  const [contactSearch, setContactSearch] = useState('');
  const [propertySearch, setPropertySearch] = useState('');

  // Dropdown list toggles
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);

  // Fetch all initial data
  const loadInitialData = useCallback(async () => {
    setPageLoading(true);
    try {
      await fetchDeals();
      const [contactsRes, propertiesRes, statusesRes] = await Promise.all([
        api.get('/contacts'),
        api.get('/properties?status=Available'),
        api.get('/statuses?context=deal'),
      ]);

      setContacts(contactsRes.data.data ?? []);
      setProperties(propertiesRes.data.data ?? []);
      setStatuses(statusesRes.data.data ?? []);
    } catch (err) {
      console.error('Failed to load initial Kanban board details', err);
    } finally {
      setPageLoading(false);
    }
  }, [fetchDeals]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Open modal prefill handler
  useEffect(() => {
    if (contactIdPrefill && contacts.length > 0) {
      setSelectedContactId(contactIdPrefill);
      setModalOpen(true);
    }
  }, [contactIdPrefill, contacts]);

  // Dnd Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  // Drag and Drop End Handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const dealId = Number(active.id.toString().replace('deal-', ''));
    const newStatusId = Number(over.id.toString().replace('column-', ''));

    // Find deal
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.status_id === newStatusId) return;

    // Find status name
    const newStatusObj = statuses.find((s) => s.id === newStatusId);
    if (!newStatusObj) return;

    const previousDeals = [...deals];

    // Optimistic Update
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              status_id: newStatusId,
              status_name: newStatusObj.name,
            }
          : d
      )
    );

    try {
      await api.put(`/deals/${dealId}`, { status_id: newStatusId });
      // Reload details to sync calculations and audits
      await fetchDeals();
    } catch {
      alert('Failed to update deal stage. Reverting...');
      setDeals(previousDeals);
    }
  };

  // Calculations
  const getDealsForStatus = (statusName: string) => {
    return deals.filter((d) => d.status_name.toLowerCase() === statusName.toLowerCase());
  };

  const getColumnTotal = (statusName: string) => {
    return getDealsForStatus(statusName).reduce((sum, d) => sum + Number(d.total_amount || 0), 0);
  };

  // 1. Total Deals
  const totalDeals = deals.length;

  // 2. Open Pipeline Value (Open + Negotiation)
  const openDeals = getDealsForStatus('Open');
  const negotiationDeals = getDealsForStatus('Negotiation');
  const openPipelineValue = openDeals.reduce((sum, d) => sum + Number(d.total_amount || 0), 0) +
                            negotiationDeals.reduce((sum, d) => sum + Number(d.total_amount || 0), 0);
  const openCount = openDeals.length + negotiationDeals.length;

  // 3. Weighted Pipeline Value (20% for Open, 60% for Negotiation, 100% for Won, 0% for Lost)
  const weightedPipelineValue =
    openDeals.reduce((sum, d) => sum + Number(d.total_amount || 0) * 0.2, 0) +
    negotiationDeals.reduce((sum, d) => sum + Number(d.total_amount || 0) * 0.6, 0) +
    getDealsForStatus('Won').reduce((sum, d) => sum + Number(d.total_amount || 0) * 1.0, 0);

  // 4. Deals Won
  const wonCount = getDealsForStatus('Won').length;
  const wonValue = getColumnTotal('Won');

  // 5. Deals Lost
  const lostCount = getDealsForStatus('Lost').length;
  const lostValue = getColumnTotal('Lost');

  // 6. Conversion Rate (Won Deals / Total Closed Deals)
  const closedCount = wonCount + lostCount;
  const conversionRate = closedCount > 0 ? (wonCount / closedCount) * 100 : 0;

  // 7. Average Deal Size (Total Value of Deals / Number of Deals)
  const totalValue = deals.reduce((sum, d) => sum + Number(d.total_amount || 0), 0);
  const avgDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;

  // Form Handlers
  const handlePropertyChange = (propIdStr: string) => {
    setSelectedPropertyId(propIdStr);
    if (propIdStr === '') {
      setDealPrice('');
      return;
    }
    const propObj = properties.find((p) => p.id === Number(propIdStr));
    if (propObj) {
      setDealPrice(propObj.price?.toString() || '');
    }
  };

  const handleCreateDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedContactId) {
      setFormError('Please select a contact.');
      return;
    }
    if (!selectedStatusId) {
      setFormError('Please select a pipeline status.');
      return;
    }

    const payload: {
      contact_id: number;
      status_id: number;
      property_id?: number;
      price?: number;
    } = {
      contact_id: Number(selectedContactId),
      status_id: Number(selectedStatusId),
    };

    if (addPropertyNow) {
      if (!selectedPropertyId) {
        setFormError('Please select a property or uncheck "Add Property Now".');
        return;
      }
      if (!dealPrice || isNaN(Number(dealPrice)) || Number(dealPrice) < 0) {
        setFormError('Please enter a valid deal price.');
        return;
      }
      payload.property_id = Number(selectedPropertyId);
      payload.price = Number(dealPrice);
    }

    try {
      setSubmitLoading(true);
      await createDeal(payload);
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create new deal.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddDealWithStatus = (statusId: number) => {
    setSelectedStatusId(statusId.toString());
    setModalOpen(true);
  };

  const resetForm = () => {
    setSelectedContactId('');
    setSelectedStatusId('');
    setAddPropertyNow(false);
    setSelectedPropertyId('');
    setDealPrice('');
    setContactSearch('');
    setPropertySearch('');
    setFormError(null);
  };

  // Contacts search filter
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(contactSearch.toLowerCase())
  );

  // Properties search filter
  const filteredProperties = properties.filter((p) =>
    p.name.toLowerCase().includes(propertySearch.toLowerCase()) ||
    p.code.toLowerCase().includes(propertySearch.toLowerCase())
  );

  const selectedContactObj = contacts.find((c) => c.id === Number(selectedContactId));
  const selectedPropertyObj = properties.find((p) => p.id === Number(selectedPropertyId));

  if (pageLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-6 w-36 bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-100 rounded" />
          </div>
          <div className="h-10 w-28 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-96 w-64 bg-gray-155 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  // Ordering columns Open | Negotiation | Won | Lost
  const columnsOrder = ['Open', 'Negotiation', 'Won', 'Lost'];
  const orderedStatuses = columnsOrder
    .map((name) => statuses.find((s) => s.name.toLowerCase() === name.toLowerCase()))
    .filter(Boolean) as { id: number; name: string }[];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Deals</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Track and manage pipeline sales opportunities</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 font-bold text-[13px]">
            Pipeline: <span className="text-gray-900">{formatINR(openPipelineValue)}</span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-lg shadow-sm transition-colors duration-150"
          >
            <Plus size={14} />
            Add Deal
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Stat 1: Total Deals */}
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">Total Deals</span>
            <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Briefcase size={13} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-[18px] font-extrabold text-gray-900 leading-none">{totalDeals}</span>
            <span className="block text-[10px] text-gray-400 font-semibold mt-0.5">All opportunities</span>
          </div>
        </div>

        {/* Stat 2: Open Pipeline */}
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">Open Pipeline</span>
            <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-650">
              <Sparkles size={13} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-[15px] font-extrabold text-amber-600 leading-none truncate block">{formatINR(openPipelineValue)}</span>
            <span className="block text-[10px] text-gray-400 font-semibold mt-0.5">{openCount} active deals</span>
          </div>
        </div>

        {/* Stat 3: Deals Won */}
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">Won Deals</span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={13} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-[18px] font-extrabold text-emerald-600 leading-none">{wonCount}</span>
            <span className="block text-[10px] text-gray-455 font-bold mt-0.5 truncate">{formatINR(wonValue)}</span>
          </div>
        </div>

        {/* Stat 4: Deals Lost */}
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">Lost Deals</span>
            <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <XCircle size={13} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-[18px] font-extrabold text-rose-600 leading-none">{lostCount}</span>
            <span className="block text-[10px] text-gray-455 font-bold mt-0.5 truncate">{formatINR(lostValue)}</span>
          </div>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          onDragStart={(event) => {
            const { active } = event;
            const dealId = Number(active.id.toString().replace('deal-', ''));
            setActiveId(dealId);
          }}
          onDragEnd={async (event) => {
            setActiveId(null);
            handleDragEnd(event);
          }}
          onDragCancel={() => {
            setActiveId(null);
          }}
        >
          <div className="flex gap-4 min-w-[1150px] py-1">
            {orderedStatuses.map((status) => (
              <DroppableColumn
                key={status.id}
                status={status}
                deals={getDealsForStatus(status.name)}
                getColumnTotal={getColumnTotal}
                onAddDealClick={handleAddDealWithStatus}
              />
            ))}
          </div>
          <DragOverlay>
            {activeId ? (
              <div className="w-[280px] md:w-[300px]">
                <DealCard deal={deals.find((d) => d.id === activeId)!} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* ─── Add Deal Modal ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setModalOpen(false);
              resetForm();
            }}
          />

          {/* Dialog Container */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-[16px] font-semibold text-gray-900">Create New Deal</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">Add a deal pipeline opportunity to the CRM</p>
              </div>
              <button
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateDealSubmit} className="flex flex-col min-h-0">
              <div className="px-6 py-5 overflow-y-auto space-y-4 flex-1">
                {formError && (
                  <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700">
                    {formError}
                  </div>
                )}

                {/* Contact Selection (Searchable Custom Dropdown) */}
                <div className="relative">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Contact <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={selectedContactObj ? selectedContactObj.name : "Search & select contact..."}
                      value={contactSearch}
                      onChange={(e) => {
                        setContactSearch(e.target.value);
                        setShowContactDropdown(true);
                      }}
                      onFocus={() => setShowContactDropdown(true)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors duration-150"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                    {selectedContactId && !contactSearch && (
                      <span className="absolute right-3 top-2.5 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        Selected
                      </span>
                    )}
                  </div>

                  {showContactDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowContactDropdown(false)} />
                      <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20 divide-y divide-gray-50">
                        {filteredContacts.length === 0 ? (
                          <div className="px-4 py-3 text-[13px] text-gray-500 italic">No contacts found</div>
                        ) : (
                          filteredContacts.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedContactId(c.id.toString());
                                setContactSearch('');
                                setShowContactDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[13px] text-gray-700 flex items-center justify-between gap-2 transition-colors"
                            >
                              <div>
                                <p className="font-bold text-gray-900">{c.name}</p>
                                <p className="text-[11px] text-gray-400">{c.email || 'No email'}</p>
                              </div>
                              {selectedContactId === c.id.toString() && (
                                <Check size={14} className="text-blue-600 flex-shrink-0" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Deal Status Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Pipeline Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedStatusId}
                    onChange={(e) => setSelectedStatusId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors duration-150"
                  >
                    <option value="">Select status...</option>
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Property Add Toggle */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={addPropertyNow}
                      onChange={(e) => setAddPropertyNow(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-[13px] font-semibold text-gray-700">Add Property Now</span>
                  </label>
                </div>

                {/* Conditional Property Fields */}
                {addPropertyNow && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                    {/* Property Dropdown (Searchable) */}
                    <div className="relative">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Property <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={selectedPropertyObj ? `${selectedPropertyObj.name} [${selectedPropertyObj.code}]` : "Search & select available property..."}
                          value={propertySearch}
                          onChange={(e) => {
                            setPropertySearch(e.target.value);
                            setShowPropertyDropdown(true);
                          }}
                          onFocus={() => setShowPropertyDropdown(true)}
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors duration-150"
                        />
                        <Building className="absolute left-3 top-2.5 text-gray-400" size={14} />
                        {selectedPropertyId && !propertySearch && (
                          <span className="absolute right-3 top-2.5 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            Selected
                          </span>
                        )}
                      </div>

                      {showPropertyDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowPropertyDropdown(false)} />
                          <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20 divide-y divide-gray-50">
                            {filteredProperties.length === 0 ? (
                              <div className="px-4 py-3 text-[13px] text-gray-500 italic">No available properties found</div>
                            ) : (
                              filteredProperties.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    handlePropertyChange(p.id.toString());
                                    setPropertySearch('');
                                    setShowPropertyDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[13px] text-gray-700 flex items-center justify-between gap-2 transition-colors"
                                >
                                  <div>
                                    <p className="font-bold text-gray-900">{p.name}</p>
                                    <p className="text-[11px] text-gray-400">Code: {p.code} • {p.price ? formatINR(p.price) : 'No Price'}</p>
                                  </div>
                                  {selectedPropertyId === p.id.toString() && (
                                    <Check size={14} className="text-blue-600 flex-shrink-0" />
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Deal Price Input */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Deal Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0"
                          value={dealPrice}
                          onChange={(e) => setDealPrice(e.target.value)}
                          required
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors duration-150"
                        />
                        <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={14} />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Prefilled with property price, but fully editable.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitLoading ? 'Creating...' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[40vh] flex items-center justify-center text-gray-500">
        Loading deals pipeline...
      </div>
    }>
      <DealsContent />
    </Suspense>
  );
}
