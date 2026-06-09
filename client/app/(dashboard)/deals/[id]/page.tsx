'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';

export default function DealDetailPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Deal Details #${id}`}
        subtitle="Detailed financials and history of the sales opportunity"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Deal Summary">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Stage</p>
                <p className="text-sm font-medium text-gray-900">Proposal Sent</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Amount</p>
                <p className="text-sm font-medium text-blue-600">$0.00</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Deal Items">
            <p className="text-sm text-gray-500">No items attached to this deal.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
