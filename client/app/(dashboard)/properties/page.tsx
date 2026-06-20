'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Pencil,
  Building,
  X,
  AlertCircle,
  Settings,
  Sparkles
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

function getStatusBadgeClass(statusName: string): string {
  const map: Record<string, string> = {
    Available: 'bg-green-50 text-green-700 border border-green-200',
    Reserved: 'bg-amber-50 text-amber-700 border border-amber-200',
    Sold: 'bg-red-50 text-red-700 border border-red-200',
  };
  return map[statusName] ?? 'bg-gray-50 text-gray-700 border border-gray-200';
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

interface PropertyType {
  id: number;
  name: string;
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function PropertiesListPage() {
  const router = useRouter();

  // Core States
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats Counters
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    reserved: 0,
    sold: 0,
  });

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);

  // Add Property Form States
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [propertyTypeId, setPropertyTypeId] = useState('');
  const [areaSqft, setAreaSqft] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manage Types Form States
  const [newTypeName, setNewTypeName] = useState('');
  const [typeFormError, setTypeFormError] = useState<string | null>(null);
  const [isAddingType, setIsAddingType] = useState(false);

  // Inline Quick Add Type Toggle (inside Add Property Modal)
  const [showInlineTypeForm, setShowInlineTypeForm] = useState(false);
  const [inlineTypeName, setInlineTypeName] = useState('');

  // ─── Fetching Logic ──────────────────────────────────────────────────────────

  const fetchPropertyTypes = useCallback(async () => {
    try {
      const res = await api.get('/property-types');
      setPropertyTypes(res.data.data ?? []);
    } catch (err) {
      console.error('Failed to fetch property types', err);
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build Query Params
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('property_type_id', typeFilter);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);

      const res = await api.get(`/properties?${params.toString()}`);
      const data: Property[] = res.data.data ?? [];
      setProperties(data);

      // Calculate Stats (on full workspace inventory)
      const allRes = await api.get('/properties');
      const allData: Property[] = allRes.data.data ?? [];
      setStats({
        total: allData.length,
        available: allData.filter((p) => p.status_name === 'Available').length,
        reserved: allData.filter((p) => p.status_name === 'Reserved').length,
        sold: allData.filter((p) => p.status_name === 'Sold').length,
      });

    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load properties list');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, minPrice, maxPrice]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchPropertyTypes();
  }, [fetchPropertyTypes]);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const handleAddPropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !propertyTypeId || !areaSqft || !price) {
      setFormError('Please fill out all required fields.');
      return;
    }

    try {
      setFormError(null);
      setIsSubmitting(true);

      await api.post('/properties', {
        name: name.trim(),
        code: code.trim(),
        property_type_id: Number(propertyTypeId),
        area_sqft: parseFloat(areaSqft),
        price: parseFloat(price),
        address: address.trim() || null,
        city: city.trim() || null,
        description: description.trim() || null,
      });

      // Clear Form & Reload
      setName('');
      setCode('');
      setPropertyTypeId('');
      setAreaSqft('');
      setPrice('');
      setAddress('');
      setCity('');
      setDescription('');
      setIsAddModalOpen(false);
      await fetchProperties();
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Failed to create property listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProperty = async (property: Property) => {
    if (property.status_name !== 'Available') {
      alert(`Cannot delete. This property is currently ${property.status_name}.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${property.name}" (${property.code})?`)) {
      return;
    }

    try {
      await api.delete(`/properties/${property.id}`);
      await fetchProperties();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to delete property.');
    }
  };

  // Type Actions
  const handleCreateType = async (typeName: string, isInline = false) => {
    if (!typeName.trim()) return;
    try {
      if (isInline) setFormError(null);
      else setTypeFormError(null);

      const res = await api.post('/property-types', { name: typeName.trim() });
      const newType = res.data.data;
      
      // Update local state
      await fetchPropertyTypes();

      if (isInline) {
        setPropertyTypeId(String(newType.id));
        setInlineTypeName('');
        setShowInlineTypeForm(false);
      } else {
        setNewTypeName('');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to add type';
      if (isInline) setFormError(msg);
      else setTypeFormError(msg);
    }
  };

  const handleDeleteType = async (typeId: number) => {
    if (!confirm('Are you sure you want to delete this property type? Properties with this type may become uncategorized.')) {
      return;
    }
    try {
      setTypeFormError(null);
      await api.delete(`/property-types/${typeId}`);
      await fetchPropertyTypes();
    } catch (err: any) {
      setTypeFormError(err?.response?.data?.message ?? 'Cannot delete type. It is currently in use.');
    }
  };

  // ─── Skeleton View ───────────────────────────────────────────────────────────

  const SkeletonRows = () => (
    <>
      {Array.from({ length: 5 }).map((_, idx) => (
        <tr key={idx} className="border-b border-gray-100 animate-pulse">
          <td className="px-6 py-4">
            <div className="space-y-1">
              <div className="h-4 w-36 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          </td>
          <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
          <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
          <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
          <td className="px-6 py-4"><div className="h-5 w-20 bg-gray-100 rounded-full" /></td>
          <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
          <td className="px-6 py-4"><div className="h-8 w-24 bg-gray-100 rounded" /></td>
        </tr>
      ))}
    </>
  );

  // ─── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">Properties Inventory</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Manage real estate listings, tracking areas, valuation, and reservation statuses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsManageTypesOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-250 hover:bg-gray-50 text-gray-700 rounded-lg text-[13px] font-semibold transition-colors duration-150"
          >
            <Settings size={15} />
            Manage Types
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold transition-colors duration-150 shadow-sm"
          >
            <Plus size={15} />
            Add Property
          </button>
        </div>
      </div>

      {/* Stats Summary Row */}
      <div className="flex flex-wrap gap-3">
        <StatPill label="Total Listings" value={stats.total} color="#2563eb" />
        <StatPill label="Available" value={stats.available} color="#16a34a" />
        <StatPill label="Reserved" value={stats.reserved} color="#d97706" />
        <StatPill label="Sold" value={stats.sold} color="#dc2626" />
      </div>

      {/* Advanced Filters Panel */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
          >
            <option value="">— Any Status —</option>
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
            <option value="Sold">Sold</option>
          </select>

          {/* Property Type Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
          >
            <option value="">— Any Type —</option>
            {propertyTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Price Range Fields */}
          <div className="relative">
            <span className="absolute left-3 top-2 text-[11px] text-gray-400 font-bold">₹</span>
            <input
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full pl-6 pr-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>

          <div className="relative">
            <span className="absolute left-3 top-2 text-[11px] text-gray-400 font-bold">₹</span>
            <input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full pl-6 pr-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Clear Filters Button (Shows if filters are active) */}
        {(search || statusFilter || typeFilter || minPrice || maxPrice) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setTypeFilter('');
                setMinPrice('');
                setMaxPrice('');
              }}
              className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear active filters
            </button>
          </div>
        )}
      </div>

      {/* Properties Data Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Name & Code</th>
                <th className="px-6 py-3.5">Property Type</th>
                <th className="px-6 py-3.5">Area (Sqft)</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">City</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
              {loading ? (
                <SkeletonRows />
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Building size={32} className="text-gray-300" />
                      <p className="font-semibold text-gray-400">No properties found</p>
                      <p className="text-[11.5px] text-gray-400">Try adjusting your filters or create a new listing.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                properties.map((p) => {
                  const isDeletable = p.status_name === 'Available';
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <Link
                            href={`/properties/${p.id}`}
                            className="font-bold text-gray-900 hover:text-blue-600 transition-colors block truncate"
                          >
                            {p.name}
                          </Link>
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border px-1.5 py-0.2 rounded mt-0.5 inline-block">
                            {p.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {p.property_type_name}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium">
                        {p.area_sqft?.toLocaleString() ?? '—'}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-gray-900">
                        {formatINR(p.price)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(p.status_name)}`}>
                          {p.status_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">
                        {p.city || '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/properties/${p.id}`)}
                            className="p-1.5 rounded-lg border border-gray-250 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150"
                            title="View specs & specs details"
                          >
                            <Eye size={14} />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteProperty(p)}
                            disabled={!isDeletable}
                            className={`p-1.5 rounded-lg border transition-all duration-150 ${
                              isDeletable
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                            }`}
                            title={isDeletable ? 'Delete listing' : `Cannot delete a ${p.status_name} property`}
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* ─── ADD PROPERTY MODAL ───────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setIsAddModalOpen(false);
              setFormError(null);
            }}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-[16px] font-semibold text-gray-900">Add New Property Listing</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">Register a property into inventory (default status: Available)</p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setFormError(null);
                }}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddPropertySubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-5 overflow-y-auto space-y-4">
                {formError && (
                  <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700 flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 mb-1.5">
                      Property Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Skyline Residency Apt 5"
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
                        placeholder="New type name (e.g. Villa)"
                        value={inlineTypeName}
                        onChange={(e) => setInlineTypeName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded border border-gray-200 text-[12.5px] focus:outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleCreateType(inlineTypeName, true)}
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
                      Base Valuation Price (INR) *
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
                      placeholder="e.g. Bandra West, Off Hill Road"
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
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder-gray-405 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setFormError(null);
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
                  {isSubmitting ? 'Creating...' : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MANAGE TYPES MODAL ───────────────────────────────────────────────── */}
      {isManageTypesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setIsManageTypesOpen(false);
              setTypeFormError(null);
            }}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-[16px] font-semibold text-gray-900">Manage Property Categories</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">Add or remove categories for property specifications</p>
              </div>
              <button
                onClick={() => {
                  setIsManageTypesOpen(false);
                  setTypeFormError(null);
                }}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {typeFormError && (
                <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[12.5px] text-red-700">
                  {typeFormError}
                </div>
              )}

              {/* Add Type Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Penthouse, Office Space"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                <button
                  onClick={() => handleCreateType(newTypeName, false)}
                  disabled={isAddingType || !newTypeName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>

              {/* Types List */}
              <div className="border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100">
                {propertyTypes.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 italic text-[12.5px]">
                    No types registered yet.
                  </div>
                ) : (
                  propertyTypes.map((t) => (
                    <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                      <span className="text-[13px] font-semibold text-gray-900">{t.name}</span>
                      <button
                        onClick={() => handleDeleteType(t.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Type"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => {
                  setIsManageTypesOpen(false);
                  setTypeFormError(null);
                }}
                className="px-4 py-2 border border-gray-250 hover:bg-gray-100 text-gray-700 rounded-lg text-[13px] font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
