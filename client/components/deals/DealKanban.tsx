import React from 'react';
import { Deal } from '../../lib/types';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface DealKanbanProps {
  deals: Deal[];
  onDealClick?: (deal: Deal) => void;
}

export function DealKanban({ deals, onDealClick }: DealKanbanProps) {
  // Simple representation of columns
  const stages = [
    { id: 1, name: 'Lead Generated' },
    { id: 2, name: 'Contacted' },
    { id: 3, name: 'Proposal Sent' },
    { id: 4, name: 'Negotiation' },
    { id: 5, name: 'Closed Won' },
    { id: 6, name: 'Closed Lost' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageDeals = deals.filter((d) => d.status_id === stage.id);
        const stageTotal = stageDeals.reduce((sum, d) => sum + Number(d.total_amount || 0), 0);

        return (
          <div key={stage.id} className="bg-gray-50 p-4 rounded-lg flex flex-col min-w-[250px] border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-sm text-gray-700">{stage.name}</span>
              <Badge variant="secondary">{stageDeals.length}</Badge>
            </div>
            
            <p className="text-xs text-gray-500 mb-4">Total: ${stageTotal.toLocaleString()}</p>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {stageDeals.map((deal) => (
                <Card 
                  key={deal.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onDealClick && onDealClick(deal)}
                >
                  <div className="text-sm font-medium text-gray-900 mb-1">Deal #{deal.id}</div>
                  <p className="text-xs text-gray-500">Contact: {deal.contact_name || `ID ${deal.contact_id}`}</p>
                  <p className="text-sm font-semibold text-blue-600 mt-2">${Number(deal.total_amount).toLocaleString()}</p>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default DealKanban;
