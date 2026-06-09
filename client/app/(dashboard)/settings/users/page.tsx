'use client';

import React from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';

export default function UsersSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="User Settings"
        subtitle="Manage users and invitation controls for your workspace"
      />

      <Card title="Workspace Members">
        <p className="text-sm text-gray-500 mb-4 font-medium">Add, edit, or disable user accounts within this workspace.</p>
        <div className="border border-gray-200 rounded p-4 text-center text-sm text-gray-400">
          User list will load here.
        </div>
      </Card>
    </div>
  );
}
