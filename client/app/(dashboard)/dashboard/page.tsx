'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import api from '@/lib/axios';
import { DashboardStats } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get('/dashboard/stats');
        setStats(response.data.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to fetch dashboard statistics.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your business metrics and CRM activity"
      />

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md border border-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Total Leads">
          {isLoading ? (
            <LoadingSkeleton variant="text" width={80} height={32} className="mt-2" />
          ) : (
            <p className="text-3xl font-bold text-gray-900">{stats?.leads.total ?? 0}</p>
          )}
          <span className="text-xs text-gray-500 font-medium">
            {isLoading ? (
              <LoadingSkeleton variant="text" width={120} height={12} className="mt-1" />
            ) : (
              `${stats?.leads.new_this_month ?? 0} new this month`
            )}
          </span>
        </Card>

        <Card title="Active Contacts">
          {isLoading ? (
            <LoadingSkeleton variant="text" width={80} height={32} className="mt-2" />
          ) : (
            <p className="text-3xl font-bold text-gray-900">{stats?.contacts.total ?? 0}</p>
          )}
          <span className="text-xs text-gray-500 font-medium">
            {isLoading ? (
              <LoadingSkeleton variant="text" width={120} height={12} className="mt-1" />
            ) : (
              `${stats?.contacts.new_this_month ?? 0} new this month`
            )}
          </span>
        </Card>

        <Card title="Open Deals">
          {isLoading ? (
            <LoadingSkeleton variant="text" width={80} height={32} className="mt-2" />
          ) : (
            <p className="text-3xl font-bold text-gray-900">{stats?.deals.open.count ?? 0}</p>
          )}
          <span className="text-xs text-gray-500 font-medium">
            {isLoading ? (
              <LoadingSkeleton variant="text" width={120} height={12} className="mt-1" />
            ) : (
              `Value: $${(stats?.deals.open.value ?? 0).toLocaleString()}`
            )}
          </span>
        </Card>

        <Card title="Properties Listed">
          {isLoading ? (
            <LoadingSkeleton variant="text" width={80} height={32} className="mt-2" />
          ) : (
            <p className="text-3xl font-bold text-gray-900">{stats?.properties.total ?? 0}</p>
          )}
          <span className="text-xs text-gray-500 font-medium">
            {isLoading ? (
              <LoadingSkeleton variant="text" width={120} height={12} className="mt-1" />
            ) : (
              `Available: ${stats?.properties.available ?? 0} • Sold: ${stats?.properties.sold ?? 0}`
            )}
          </span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Recent Activity" className="min-h-[350px]">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="space-y-2 py-2">
                    <LoadingSkeleton variant="text" width="60%" height={16} />
                    <LoadingSkeleton variant="text" width="40%" height={12} />
                  </div>
                ))}
              </div>
            ) : stats?.recent_activities && stats.recent_activities.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {stats.recent_activities.map((act) => (
                  <li key={act.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-950">{act.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          By {act.creator_name || 'System'} • {act.type.toUpperCase()}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(act.activity_at || act.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No recent activity found.</p>
            )}
          </Card>
        </div>

        <div>
          <Card title="Deals Summary" className="min-h-[350px]">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="flex justify-between items-center py-2">
                    <LoadingSkeleton variant="text" width="40%" height={16} />
                    <LoadingSkeleton variant="text" width="20%" height={16} />
                  </div>
                ))}
              </div>
            ) : stats?.deals ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-500 font-medium">Total Pipeline Value</span>
                  <span className="text-base font-bold text-gray-950">
                    ${stats.deals.total_value.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-500">Total Deals Count</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.deals.total}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-500">Open Deals</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-blue-600 block">
                      {stats.deals.open.count}
                    </span>
                    <span className="text-xs text-gray-400 block">
                      ${stats.deals.open.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-500">Won Deals</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-green-600 block">
                      {stats.deals.won.count}
                    </span>
                    <span className="text-xs text-gray-400 block">
                      ${stats.deals.won.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-sm text-gray-500">Lost Deals</span>
                  <span className="text-sm font-semibold text-red-600">{stats.deals.lost.count}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No deals pipeline information found.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
