import { useState, useCallback } from 'react';
import api from '@/lib/axios';
import { Lead } from '@/lib/types';

interface CreateLeadData {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  status_id: number;
  assigned_to?: number | null;
}

interface LeadFilters {
  search?: string;
  status_id?: string;
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async (filters: LeadFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filters.search) params.search = filters.search;
      if (filters.status_id) params.status_id = filters.status_id;

      const res = await api.get('/leads', { params });
      setLeads(res.data.data ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch leads';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLead = async (data: CreateLeadData): Promise<Lead> => {
    const res = await api.post('/leads', data);
    return res.data.data;
  };

  const deleteLead = async (id: number): Promise<void> => {
    await api.delete(`/leads/${id}`);
  };

  return {
    leads,
    isLoading,
    error,
    fetchLeads,
    createLead,
    deleteLead,
  };
}
