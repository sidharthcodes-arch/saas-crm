import { useState, useCallback } from 'react';
import api from '@/lib/axios';
import { Contact } from '../lib/types';

interface ContactFilters {
  search?: string;
  created_from_lead_id?: string;
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async (filters: ContactFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filters.search) params.search = filters.search;
      if (filters.created_from_lead_id) params.created_from_lead_id = filters.created_from_lead_id;

      const res = await api.get('/contacts', { params });
      setContacts(res.data.data ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch contacts';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createContact = async (data: { name: string; phone: string; email?: string }): Promise<Contact> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/contacts', data);
      return res.data.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create contact';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateContact = async (id: number, data: Partial<Contact>): Promise<Contact> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.put(`/contacts/${id}`, data);
      return res.data.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update contact';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteContact = async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/contacts/${id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete contact';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    contacts,
    isLoading,
    error,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  };
}
