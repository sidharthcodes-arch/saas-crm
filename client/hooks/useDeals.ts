import { useState, useCallback } from 'react';
import { Deal } from '../lib/types';
import api from '../lib/axios';

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/deals');
      setDeals(response.data.data ?? []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch deals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDeal = async (data: {
    contact_id: number;
    status_id: number;
    property_id?: number;
    price?: number;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/deals', data);
      await fetchDeals();
      return response.data.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create deal';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDeal = async (id: number, data: { status_id: number }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.put(`/deals/${id}`, data);
      await fetchDeals();
      return response.data.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update deal';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDeal = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/deals/${id}`);
      await fetchDeals();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete deal';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deals,
    setDeals, // exposing setDeals for optimistic updates
    isLoading,
    error,
    fetchDeals,
    createDeal,
    updateDeal,
    deleteDeal,
  };
}
