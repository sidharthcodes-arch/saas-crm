'use client';

import React from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function WorkspaceSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace Settings"
        subtitle="Manage workspace defaults, profiles, and billing tiers"
      />

      <Card title="Workspace Profile">
        <form className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700">Workspace Name</label>
            <input
              type="text"
              placeholder="Acme Corp"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
            />
          </div>
          <Button type="button">
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
