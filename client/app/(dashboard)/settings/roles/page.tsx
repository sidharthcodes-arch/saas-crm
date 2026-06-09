'use client';

import React from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';

export default function RolesSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Manage access control tiers and system role assignments"
      />

      <Card title="Workspace Roles">
        <p className="text-sm text-gray-500 mb-4 font-medium">Configure permissions associated with built-in or custom roles.</p>
        <div className="border border-gray-200 rounded p-4 text-center text-sm text-gray-400">
          Role configurations will load here.
        </div>
      </Card>
    </div>
  );
}
