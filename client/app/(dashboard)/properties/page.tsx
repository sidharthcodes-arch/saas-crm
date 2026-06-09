'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import PropertyForm from '@/components/properties/PropertyForm';
import { useProperties } from '@/hooks/useProperties';
import { Property } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function PropertiesPage() {
  const { properties, isLoading, createProperty } = useProperties();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: 'ID', accessor: (p: Property) => p.id },
    { header: 'Name', accessor: (p: Property) => p.name },
    { header: 'Code', accessor: (p: Property) => p.code },
    { header: 'Area (sqft)', accessor: (p: Property) => p.area_sqft?.toLocaleString() || '-' },
    { header: 'Price', accessor: (p: Property) => p.price !== null ? formatCurrency(p.price) : '-' },
    { header: 'Sellable', accessor: (p: Property) => (p.is_sellable ? 'Yes' : 'No') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        subtitle="Manage listing inventory and available workspaces"
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            Add Property
          </Button>
        }
      />

      <Table
        columns={columns}
        data={properties}
        isLoading={isLoading}
        emptyState="No properties found. Create your first property listing."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Property"
      >
        <PropertyForm
          onSubmit={(data: any) => {
            createProperty(data);
            setIsModalOpen(false);
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
