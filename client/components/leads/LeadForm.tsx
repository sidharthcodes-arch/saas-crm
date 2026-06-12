"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "@/lib/axios";
import { Lead, User } from "@/lib/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

// ─── Constants ──────────────────────────────────────────────────────────────────

const STATUSES = [
  { id: 1, name: "New" },
  { id: 2, name: "Contacted" },
  { id: 3, name: "Follow Up" },
  { id: 4, name: "Qualified" },
  { id: 5, name: "Converted" },
  { id: 6, name: "Lost" },
];

// ─── Raw form values (HTML form always yields strings for select) ───────────────

interface RawFormValues {
  name: string;
  phone: string;
  email: string;
  source: string;
  status_id: string;
  assigned_to: string;
}

// ─── Coerced output values ──────────────────────────────────────────────────────

export interface LeadFormData {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  status_id: number;
  assigned_to?: number | null;
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (data: LeadFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function LeadForm({
  lead,
  onSubmit,
  onCancel,
  isLoading = false,
}: LeadFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [errors, setErrors] = useState<
    Partial<Record<keyof RawFormValues, string>>
  >({});

  const { register, handleSubmit } = useForm<RawFormValues>({
    defaultValues: {
      name: lead?.name ?? "",
      phone: lead?.phone ?? "",
      email: lead?.email ?? "",
      source: lead?.source ?? "",
      status_id: lead?.status_id ? String(lead.status_id) : "1",
      assigned_to: lead?.assigned_to ? String(lead.assigned_to) : "",
    },
  });

  useEffect(() => {
    api
      .get("/users")
      .then((res) => setUsers(res.data.data ?? []))
      .catch(() => setUsers([]));
  }, []);

  // ── Validate + coerce ──
  const handleFormSubmit = async (raw: RawFormValues) => {
    const errs: Partial<Record<keyof RawFormValues, string>> = {};
    if (!raw.name.trim()) errs.name = "Name is required";
    if (!raw.phone.trim()) errs.phone = "Phone is required";
    if (raw.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email)) {
      errs.email = "Invalid email address";
    }
    if (!raw.status_id || Number(raw.status_id) < 1) {
      errs.status_id = "Status is required";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const coerced: LeadFormData = {
      name: raw.name.trim(),
      phone: raw.phone.trim(),
      email: raw.email.trim() || undefined,
      source: raw.source.trim() || undefined,
      status_id: Number(raw.status_id),
      assigned_to: raw.assigned_to ? Number(raw.assigned_to) : null,
    };
    await onSubmit(coerced);
  };

  const selectClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-[#111827] bg-white focus:outline-none focus:ring-1 focus:ring-[#2563eb] focus:border-[#2563eb] transition-colors duration-150";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Row 1: Name | Phone */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Name *"
          placeholder="Full name"
          error={errors.name}
          {...register("name")}
        />
        <Input
          label="Phone *"
          placeholder="+1 234 567 8900"
          error={errors.phone}
          {...register("phone")}
        />
      </div>

      {/* Row 2: Email | Source */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="email@example.com"
          error={errors.email}
          {...register("email")}
        />
        <Input
          label="Source"
          placeholder="e.g. Website, Referral"
          {...register("source")}
        />
      </div>

      {/* Status — full width */}
      <div className="w-full">
        <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
          Status *
        </label>
        <select className={selectClass} {...register("status_id")}>
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.status_id && (
          <p className="mt-1 text-[11px] text-red-600">{errors.status_id}</p>
        )}
      </div>

      {/* Assigned To — full width */}
      <div className="w-full">
        <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
          Assigned To
        </label>
        <select className={selectClass} {...register("assigned_to")}>
          <option value="">— Unassigned —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {lead ? 'Save Changes' : 'Save Lead'}
        </Button>
      </div>
    </form>
  );
}

export default LeadForm;
