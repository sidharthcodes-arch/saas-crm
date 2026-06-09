import React from 'react';
import { Lead } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  return (
    <Card 
      title={lead.name} 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="space-y-2 text-sm text-gray-600">
        {lead.email ? <p>Email: {lead.email}</p> : null}
        {lead.phone ? <p>Phone: {lead.phone}</p> : null}
        {lead.source ? <p>Source: {lead.source}</p> : null}
        <div className="pt-2 flex justify-between items-center">
          <Badge variant="info">{lead.status_name || `Status #${lead.status_id}`}</Badge>
          <span className="text-xs text-gray-400">
            {new Date(lead.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Card>
  );
}
export default LeadCard;
