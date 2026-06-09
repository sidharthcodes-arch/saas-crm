import React from 'react';
import { Property } from '../../lib/types';

interface PropertyFormProps {
  property?: Property;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PropertyForm({ property, onSubmit, onCancel, isLoading = false }: PropertyFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        {property ? 'Edit Property' : 'Create Property'}
      </h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          defaultValue={property?.name || ''}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Code</label>
        <input
          type="text"
          defaultValue={property?.code || ''}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Area (sqft)</label>
        <input
          type="number"
          defaultValue={property?.area_sqft || ''}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Price</label>
        <input
          type="number"
          defaultValue={property?.price || ''}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
export default PropertyForm;
