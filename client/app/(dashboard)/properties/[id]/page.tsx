'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';

export default function PropertyDetailPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Property Details #${id}`}
        subtitle="Detailed specifications and status of the listed property"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Specifications">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Code</p>
                <p className="text-sm font-medium text-gray-900">PROP-PLACEHOLDER</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Price</p>
                <p className="text-sm font-medium text-blue-600">$0.00</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Activity log">
            <p className="text-sm text-gray-500">No recent activity log recorded.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
