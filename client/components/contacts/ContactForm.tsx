import React, { useState } from 'react';
import { Contact } from '../../lib/types';

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (data: { name: string; email: string; phone: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ContactForm({ contact, onSubmit, onCancel, isLoading = false }: ContactFormProps) {
  const [name, setName] = useState(contact?.name || '');
  const [email, setEmail] = useState(contact?.email || '');
  const [phone, setPhone] = useState(contact?.phone || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Contact's full name"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors duration-150"
        />
      </div>

      <div>
        <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Contact's email"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors duration-150"
        />
      </div>

      <div>
        <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Phone Number
        </label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Contact's phone"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors duration-150"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 flex-shrink-0">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-250 rounded-lg text-[13px] font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-150"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors duration-150"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export default ContactForm;
