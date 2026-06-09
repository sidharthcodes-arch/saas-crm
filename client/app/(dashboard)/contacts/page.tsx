'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import ContactForm from '@/components/contacts/ContactForm';
import { useContacts } from '@/hooks/useContacts';
import { Contact } from '@/lib/types';

export default function ContactsPage() {
  const { contacts, isLoading, createContact } = useContacts();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { header: 'ID', accessor: (contact: Contact) => contact.id },
    { header: 'Name', accessor: (contact: Contact) => contact.name },
    { header: 'Email', accessor: (contact: Contact) => contact.email || '-' },
    { header: 'Phone', accessor: (contact: Contact) => contact.phone || '-' },
    { header: 'Original Lead ID', accessor: (contact: Contact) => contact.created_from_lead_id || '-' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        subtitle="Manage and view all customer contact records"
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            Add Contact
          </Button>
        }
      />

      <Table
        columns={columns}
        data={contacts}
        isLoading={isLoading}
        emptyState="No contacts found. Create your first contact to get started."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Contact"
      >
        <ContactForm
          onSubmit={(data: any) => {
            createContact(data);
            setIsModalOpen(false);
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
