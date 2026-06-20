'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building,
  Pencil,
  Trash2,
  AlertCircle,
  FileText,
  MapPin,
  Maximize,
  Calendar,
  User,
  X,
  Plus,
  IndianRupee,
  Link as LinkIcon
} from 'lucide-react';

import api from '@/lib/axios';
import { Property, ApiResponse } from '@/lib/types';

// ─── Styling Helpers ─────────────────────────────────────────────────────────

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
    Available: {
      border: 'border-green-200',
      bg: 'bg-green-50/50',
      text: 'text-green-700',
      dot: 'bg-green-500',
    },
    Reserved: {
      border: 'border-amber-200',
      bg: 'bg-amber-50/50',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
    },
    Sold: {
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

interface PropertyType {
  id: number;
  name: string;
}

interface LinkedDeal {
  deal_id: number;
  total_amount: number;
  created_at: string;
  contact_name: string;
  status_name: string;
  deal_price: number;
}

interface ExtendedProperty extends Property {
  deals?: LinkedDeal[];
}

interface PropertyFile {
  id: number;
  original_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  // Core Data States
  const [property, setProperty] = useState<ExtendedProperty | null>(null);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [files, setFiles] = useState<PropertyFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [propertyTypeId, setPropertyTypeId] = useState('');
  const [areaSqft, setAreaSqft] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Type creator inside Edit Modal
  const [showInlineTypeForm, setShowInlineTypeForm] = useState(false);
  const [inlineTypeName, setInlineTypeName] = useState('');

  // ─── Fetching Logic ──────────────────────────────────────────────────────────

  const fetchPropertyData = useCallback(async () => {
    try {
      setError(null);

      // 1. Fetch Property specs details (includes linked deals via backend service update)
      const propRes = await api.get(`/properties/${id}`);
      const propData = propRes.data.data;
      setProperty(propData);

      // Pre-fill edit form states
      setName(propData.name || '');
      setCode(propData.code || '');
      setPropertyTypeId(String(propData.property_type_id || ''));
      setAreaSqft(String(propData.area_sqft || ''));
      setPrice(String(propData.price || ''));
      setAddress(propData.address || '');
      setCity(propData.city || '');
      setDescription(propData.description || '');

      // 2. Fetch Property Types for dropdown options
      const typesRes = await api.get('/property-types');
      setPropertyTypes(typesRes.data.data ?? []);

      // 3. Fetch property attached files (graceful catch if route is not implemented)
      try {
        const filesRes = await api.get(`/files/property/${id}`);
        setFiles(filesRes.data.data ?? []);
      } catch (fErr) {
        console.warn('Files module not registered or failed', fErr);
      }

    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message ?? 'Failed to load property record');
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchPropertyData().finally(() => setLoading(false));
  }, [fetchPropertyData]);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property || !name.trim() || !code.trim() || !propertyTypeId || !areaSqft || !price) {
      setEditError('Please fill out all required fields.');
      return;
    }

    try {
      setEditError(null);
      setIsSubmitting(true);

      const res = await api.put(`/properties/${property.id}`, {
        name: name.trim(),
        code: code.trim(),
        property_type_id: Number(propertyTypeId),
        area_sqft: parseFloat(areaSqft),
        price: parseFloat(price),
        address: address.trim() || null,
        city: city.trim() || null,
        description: description.trim() || null,
      });

      setEditModalOpen(false);
      await fetchPropertyData();
    } catch (err: any) {
      setEditError(err?.response?.data?.message ?? 'Failed to update property listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProperty = async () => {
    if (!property) return;
    if (property.status_name !== 'Available') {
      alert('Only available properties can be deleted from inventory.');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${property.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/properties/${property.id}`);
      router.push('/properties');
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to delete property.');
    }
  };

  // Inline Quick Add Type
  const handleCreateTypeInline = async () => {
    if (!inlineTypeName.trim()) return;
    try {
      setEditError(null);
      const res = await api.post('/property-types', { name: inlineTypeName.trim() });
      const newType = res.data.data;
      
      // Refresh types
      const typesRes = await api.get('/property-types');
      setPropertyTypes(typesRes.data.data ?? []);

      setPropertyTypeId(String(newType.id));
      setInlineTypeName('');
      setShowInlineTypeForm(false);
    } catch (err: any) {
      setEditError(err?.response?.data?.message ?? 'Failed to add type');
    }
  };

  // ─── Loading Skeleton ────────────────────────────────────────────────────────

  if (loading) {
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
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-gray-100 rounded" />
                <div className="h-10 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <div className="h-12 bg-gray-200 rounded-lg" />
              <div className="h-12 bg-gray-205 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────────

  if (error || !property) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-[18px] font-semibold text-gray-900 mb-1">Property Listing Not Found</h2>
        <p className="text-[14px] text-gray-500 max-w-sm mb-6">
          {error || "The property record you are looking for doesn't exist or has been deleted."}
        </p>
        <button
          onClick={() => router.push('/properties')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-205 rounded-lg text-[13px] font-medium text-gray-707 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Inventory
        </button>
      </div>
    );
  }

  const badge = getStatusColorClasses(property.status_name);
  const isDeletable = property.status_name === 'Available';

  // ─── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/properties')}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[22px] font-bold text-gray-900 truncate">{property.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                {property.status_name}
              </span>
            </div>
            <p className="text-[13px] text-gray-500 mt-0.5">Real Estate Inventory ID: {property.code}</p>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Property Info specs */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-[15px] font-semibold text-gray-900">Property Details Specifications</h3>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6">
                
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Unique Code</p>
                  <p className="text-[13.5px] font-bold text-gray-900 mt-1 font-mono">{property.code}</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Property Category</p>
                  <p className="text-[13.5px] font-semibold text-gray-805 mt-1">{property.property_type_name}</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Built Up Area</p>
                  <p className="text-[13.5px] font-bold text-gray-900 mt-1 font-mono">
                    {property.area_sqft?.toLocaleString() ?? '—'} <span className="text-[11px] text-gray-500 font-normal">Sqft</span>
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Base Valuation Price</p>
                  <p className="text-[13.5px] font-extrabold text-blue-600 mt-1">
                    {formatINR(property.price)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">City Location</p>
                  <p className="text-[13.5px] font-semibold text-gray-800 mt-1">{property.city || '—'}</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Full Address</p>
                  <p className="text-[13.5px] font-medium text-gray-700 mt-1">{property.address || '—'}</p>
                </div>

              </div>

              {property.description && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Listing Description</p>
                  <p className="text-[13px] text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">
                    {property.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Associated/Linked Deals */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-gray-900">Associated Pipeline Deals</h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[11px] font-bold text-blue-600 border border-blue-100">
                {property.deals?.length || 0}
              </span>
            </div>

            <div className="px-6 py-5">
              {!property.deals || property.deals.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center justify-center">
                  <LinkIcon size={28} className="text-gray-300 mb-2" />
                  <p className="text-[13px] text-gray-400 font-semibold">Not part of any deal yet</p>
                  <p className="text-[11.5px] text-gray-400 mt-0.5 max-w-[240px]">
                    This property has not been attached to a buyer opportunity pipeline.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {property.deals.map((d) => (
                    <div key={d.deal_id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/deals/${d.deal_id}`}
                            className="text-[13.5px] font-bold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            Buyer: {d.contact_name}
                          </Link>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            {d.status_name}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                          Linked on {new Date(d.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[14.5px] font-extrabold text-gray-950">
                          {formatINR(d.deal_price)}
                        </p>
                        <p className="text-[10px] text-gray-400">Transaction Price</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Files Attachment (Optional feature integration) */}
          {files.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-[15px] font-semibold text-gray-900">Listing Documents</h3>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {files.map((file) => (
                    <div key={file.id} className="p-3 border border-gray-100 rounded-lg flex items-center gap-3 hover:bg-gray-50 transition-colors">
                      <FileText className="text-blue-600" size={20} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-semibold text-gray-900 truncate">{file.original_name}</p>
                        <p className="text-[10.5px] text-gray-450 mt-0.5">{(file.file_size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <a
                        href={`http://localhost:5000/${file.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] font-semibold text-blue-600 hover:underline shrink-0"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* Card 1: Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
            <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Quick Actions</h4>

            <button
              onClick={() => setEditModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-250 hover:bg-gray-50 text-gray-700 rounded-lg text-[13px] font-semibold transition-colors"
            >
              <Pencil size={14} />
              Edit Specifications
            </button>

            <div className="relative group">
              <button
                onClick={handleDeleteProperty}
                disabled={!isDeletable}
                className={`w-full flex items-center justify-center gap-1.5 px-4 py-2 border rounded-lg text-[13px] font-semibold transition-colors ${
                  isDeletable
                    ? 'border-red-200 bg-red-50 hover:bg-red-100 text-red-655'
                    : 'border-gray-150 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'
                }`}
              >
                <Trash2 size={14} />
                Delete Property
              </button>
              {!isDeletable && (
                <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 hidden group-hover:block bg-gray-900 text-white text-[11px] p-2 rounded shadow-lg text-center leading-normal">
                  Properties linked to active deals or marked as Reserved/Sold cannot be deleted.
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Auto-managed Status Card */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
            <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">System Status</h4>
            
            <div className="flex items-center gap-3">
              <span className={`w-3.5 h-3.5 rounded-full ${badge.dot}`} />
              <span className="text-[14px] font-bold text-gray-900">{property.status_name}</span>
            </div>

            <p className="text-[12px] text-gray-500 leading-relaxed bg-gray-50/50 p-3 rounded-lg border border-gray-100">
              Note: Status updates automatically based on buyer deal activities. It cannot be altered manually.
            </p>
          </div>

        </div>
      </div>

      {/* ─── EDIT PROPERTY MODAL ──────────────────────────────────────────────── */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setEditModalOpen(false);
              setEditError(null);
            }}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-[16px] font-semibold text-gray-900">Edit Property Details</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">Modify specifications and inventory tags</p>
              </div>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditError(null);
                }}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-5 overflow-y-auto space-y-4">
                {editError && (
                  <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700 flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 mb-1.5">
                      Property Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Skyline Residency"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 mb-1.5">
                      Unique Code / SKU *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SKY-RES-05"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>
                </div>

                {/* Property Type Dropdown + Inline Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[12px] font-bold text-gray-600">
                      Property Type *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowInlineTypeForm(!showInlineTypeForm)}
                      className="text-[11.5px] font-semibold text-blue-600 hover:text-blue-800"
                    >
                      {showInlineTypeForm ? 'Select Type' : '+ Add New Type'}
                    </button>
                  </div>

                  {showInlineTypeForm ? (
                    <div className="flex gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                      <input
                        type="text"
                        placeholder="New type name"
                        value={inlineTypeName}
                        onChange={(e) => setInlineTypeName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded border border-gray-200 text-[12.5px]"
                      />
                      <button
                        type="button"
                        onClick={handleCreateTypeInline}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[12px] font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      value={propertyTypeId}
                      onChange={(e) => setPropertyTypeId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    >
                      <option value="">— Select Type —</option>
                      {propertyTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 mb-1.5">
                      Area (Sqft) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1200"
                      value={areaSqft}
                      onChange={(e) => setAreaSqft(e.target.value)}
                      required
                      min="1"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 mb-1.5">
                      Valuation Price (INR) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 7500000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      min="0"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 mb-1.5">
                      Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bandra West"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-gray-600 mb-1.5">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe listing specifications, amenities..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditError(null);
                  }}
                  className="px-4 py-2 border border-gray-250 hover:bg-gray-100 text-gray-700 rounded-lg text-[13px] font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Specifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
