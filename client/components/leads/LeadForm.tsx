'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import { User } from '@/lib/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const STATUSES = [
  { id: 1, name: 'New' },
  { id: 2, name: 'Contacted' },
  { id: 3, name: 'Follow Up' },
  { id: 4, name: 'Qualified' },
  { id: 5, name: 'Converted' },
  { id: 6, name: 'Lost' },
];

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  source: z.string().optional(),
  status_id: z.coerce.number({ required_error: 'Status is required' }).min(1, 'Status is required'),
  assigned_to: z.coerce.number().optional().nullable(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadFormProps {
  onSubmit: (data: LeadFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LeadForm({ onSubmit, onCancel, isLoading = false }: LeadFormProps) {
  const [users, setUsers] = useState<User[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      source: '',
      status_id: 1,
      assigned_to: null,
    },
  });

  useEffect(() => {
    api.get('/users')
      .then((res) => setUsers(res.data.data ?? []))
      .catch(() => setUsers([]));
  }, []);

  const selectClass =
    'w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
      <Input
        label="Name *"
        placeholder="Full name"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Phone *"
        placeholder="+1 234 567 8900"
        error={errors.phone?.message}
        {...register('phone')}
      />

      <Input
        label="Email"
        type="email"
        placeholder="email@example.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Source"
        placeholder="e.g. Website, Referral, Walk-in"
        {...register('source')}
      />

      {/* Status */}
      <div className="w-full mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status *
        </label>
        <select className={selectClass} {...register('status_id')}>
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.status_id && (
          <p className="mt-1 text-xs text-red-600">{errors.status_id.message}</p>
        )}
      </div>

      {/* Assigned To */}
      <div className="w-full mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assigned To
        </label>
        <select className={selectClass} {...register('assigned_to')}>
          <option value="">— Unassigned —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Create Lead
        </Button>
      </div>
    </form>
  );
}

export default LeadForm;
