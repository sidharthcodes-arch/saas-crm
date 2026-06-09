'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';

export default function LeadDetailPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Lead Details #${id}`}
        subtitle="Detailed record of the business lead"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Overview">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Name</p>
                <p className="text-sm font-medium text-gray-900">Lead Placeholder</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Status</p>
                <p className="text-sm font-medium text-gray-900">New</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Quick Actions">
            <button className="w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium">
              Convert to Contact
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
