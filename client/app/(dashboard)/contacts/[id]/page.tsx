'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';

export default function ContactDetailPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Contact Details #${id}`}
        subtitle="Detailed contact customer record profile"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Profile Information">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Full Name</p>
                <p className="text-sm font-medium text-gray-900">Contact Placeholder</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Email Address</p>
                <p className="text-sm font-medium text-gray-900">contact@example.com</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Quick Actions">
            <button className="w-full text-center px-4 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 text-gray-700">
              Create Deal
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
