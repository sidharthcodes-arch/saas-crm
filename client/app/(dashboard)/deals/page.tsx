'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import DealForm from '@/components/deals/DealForm';
import DealKanban from '@/components/deals/DealKanban';
import { useDeals } from '@/hooks/useDeals';

export default function DealsPage() {
  const { deals, createDeal } = useDeals();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        subtitle="Track sales opportunities through pipeline stages"
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            Add Deal
          </Button>
        }
      />

      <div className="h-full overflow-x-auto">
        <DealKanban deals={deals} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Deal"
      >
        <DealForm
          onSubmit={(data: any) => {
            createDeal(data);
            setIsModalOpen(false);
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
