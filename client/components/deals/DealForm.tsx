import React from 'react';
import { Deal } from '../../lib/types';

interface DealFormProps {
  deal?: Deal;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DealForm({ deal, onSubmit, onCancel, isLoading = false }: DealFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        {deal ? 'Edit Deal' : 'Create Deal'}
      </h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">Contact ID</label>
        <input
          type="number"
          defaultValue={deal?.contact_id || ''}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Status ID</label>
        <input
          type="number"
          defaultValue={deal?.status_id || ''}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Total Amount</label>
        <input
          type="number"
          step="0.01"
          defaultValue={deal?.total_amount || 0}
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
export default DealForm;
