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
  useDroppable
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
  Sparkles
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

function getStatusBorderColor(statusName: string): string {
  const map: Record<string, string> = {
    Open: 'border-l-4 border-l-amber-500',
    Negotiation: 'border-l-4 border-l-orange-500',
    Won: 'border-l-4 border-l-green-500',
    Lost: 'border-l-4 border-l-red-500',
  };
  return map[statusName] ?? 'border-l-4 border-l-gray-300';
}

function getStatusDotColor(statusName: string): string {
  const map: Record<string, string> = {
    Open: 'bg-amber-500',
    Negotiation: 'bg-orange-500',
    Won: 'bg-green-500',
    Lost: 'bg-red-500',
  };
  return map[statusName] ?? 'bg-gray-400';
}

function getColumnHeaderTint(statusName: string): string {
  const map: Record<string, string> = {
    Open: 'bg-amber-50/40 border-b border-amber-100',
    Negotiation: 'bg-orange-50/40 border-b border-orange-100',
    Won: 'bg-green-50/40 border-b border-green-100',
    Lost: 'bg-red-50/40 border-b border-red-100',
  };
  return map[statusName] ?? 'bg-white';
}

// ─── Draggable Deal Card Component ─────────────────────────────────────────────

function DraggableDealCard({ deal }: { deal: Deal }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `deal-${deal.id}`,
    data: deal,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => router.push(`/deals/${deal.id}`)}
      className={`bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow duration-150 cursor-pointer relative flex flex-col gap-3 ${getStatusBorderColor(
        deal.status_name
      )} ${isDragging ? 'opacity-40 border-blue-400 shadow-lg' : ''}`}
    >
      {/* Top row: Contact display & Drag handle */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-[11px] flex-shrink-0"
            style={{ backgroundColor: getAvatarColor(deal.contact_name || 'U') }}
          >
            {getInitials(deal.contact_name || 'U')}
          </div>
          <span className="text-[13px] font-bold text-gray-900 truncate">
            {deal.contact_name}
          </span>
        </div>
        <div
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
          className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-grab active:cursor-grabbing flex-shrink-0"
          title="Drag to update stage"
        >
          <GripVertical size={14} />
        </div>
      </div>

      {/* Center row: Deal value */}
      <div>
        <p className="text-[16px] font-bold text-gray-900">
          {formatINR(deal.total_amount)}
        </p>
      </div>

      {/* Bottom row: Properties & Date */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
        <span>
          {deal.properties_count || 0} {deal.properties_count === 1 ? 'property' : 'properties'}
        </span>
        <span>
          {new Date(deal.created_at).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
}

// ─── Droppable Column Component ────────────────────────────────────────────────

interface DroppableColumnProps {
  status: { id: number; name: string };
  deals: Deal[];
  getColumnTotal: (statusName: string) => number;
}

function DroppableColumn({ status, deals, getColumnTotal }: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${status.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-100/70 border border-gray-200 rounded-xl min-h-[500px] flex flex-col flex-1 min-w-[270px] max-w-[320px] transition-all duration-150 ${
        isOver ? 'ring-2 ring-blue-500 border-transparent shadow-sm' : ''
      }`}
    >
      {/* Column Header */}
      <div className={`px-4 py-3 rounded-t-xl flex flex-col gap-1.5 ${getColumnHeaderTint(status.name)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full ${getStatusDotColor(status.name)} flex-shrink-0`} />
            <h3 className="text-[13px] font-bold text-gray-900 truncate">
              {status.name}
            </h3>
            <span className="px-1.5 py-0.5 rounded-full bg-gray-150 text-[10px] font-bold text-gray-650 border border-gray-200 flex-shrink-0">
              {deals.length}
            </span>
          </div>
        </div>
        <div>
          <span className="text-[12px] font-bold text-gray-500">
            {formatINR(getColumnTotal(status.name))}
          </span>
        </div>
      </div>

      {/* Column Cards Container */}
      <div className="p-3 flex-1 overflow-y-auto max-h-[600px] space-y-3">
        {deals.length === 0 ? (
          <div className="h-full min-h-[200px] border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-4 text-center bg-gray-50/20">
            <Inbox size={24} className="text-gray-300 mb-1.5" />
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">No deals</p>
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

  const totalPipeline = deals
    .filter((d) => d.status_name === 'Open' || d.status_name === 'Negotiation')
    .reduce((sum, d) => sum + Number(d.total_amount || 0), 0);

  const openCount = deals.filter((d) => d.status_name === 'Open' || d.status_name === 'Negotiation').length;
  const wonCount = getDealsForStatus('Won').length;
  const wonValue = getColumnTotal('Won');
  const lostCount = getDealsForStatus('Lost').length;

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
            <div key={i} className="h-96 w-64 bg-gray-150 rounded-xl flex-shrink-0" />
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
            Pipeline: <span className="text-gray-900">{formatINR(totalPipeline)}</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Deals</span>
            <span className="text-[20px] font-bold text-gray-900 mt-1 block">{deals.length}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Briefcase size={16} />
          </div>
        </div>

        {/* Stat 2: Open */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Open Pipeline</span>
            <span className="text-[20px] font-bold text-amber-600 mt-1 block">{openCount}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Sparkles size={16} />
          </div>
        </div>

        {/* Stat 3: Won */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Deals Won</span>
            <span className="text-[20px] font-bold text-green-600 mt-1 block">
              {wonCount} <span className="text-[12px] font-medium text-gray-400 ml-1">({formatINR(wonValue)})</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
            <DollarSign size={16} />
          </div>
        </div>

        {/* Stat 4: Lost */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Deals Lost</span>
            <span className="text-[20px] font-bold text-red-600 mt-1 block">{lostCount}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
            <AlertCircle size={16} />
          </div>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-4">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 min-w-[1100px] py-1">
            {orderedStatuses.map((status) => (
              <DroppableColumn
                key={status.id}
                status={status}
                deals={getDealsForStatus(status.name)}
                getColumnTotal={getColumnTotal}
              />
            ))}
          </div>
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
