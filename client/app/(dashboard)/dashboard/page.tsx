'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Contact,
  Handshake,
  Building2,
  Calendar,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '@/lib/axios';
import { DashboardStats, Activity, Deal } from '@/lib/types';

// ─── Design tokens ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  New: '#2563eb',
  Contacted: '#d97706',
  'Follow Up': '#f97316',
  Qualified: '#16a34a',
  Converted: '#7c3aed',
  Lost: '#dc2626',
};

const DEAL_STATUS_COLORS: Record<string, string> = {
  Open: '#2563eb',
  Won: '#16a34a',
  Lost: '#dc2626',
  'On Hold': '#d97706',
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: number | string;
  label: string;
  badge: string;
  loading: boolean;
}

function StatCard({ icon, iconBg, value, label, badge, loading }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          {loading ? (
            <>
              <div className="h-7 w-20 bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-3.5 w-24 bg-gray-100 rounded animate-pulse" />
            </>
          ) : (
            <>
              <p className="text-[28px] font-bold text-[#111827] leading-none">{value}</p>
              <p className="text-[13px] text-[#6b7280] mt-1">{label}</p>
            </>
          )}
        </div>
      </div>
      {loading ? (
        <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
      ) : (
        <p className="text-[12px] font-medium text-[#16a34a]">{badge}</p>
      )}
    </div>
  );
}

// ─── Chart card wrapper ─────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-[16px] font-semibold text-[#111827] mb-5">{title}</h2>
      {children}
    </div>
  );
}

// ─── Time-ago helper ────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ─── Activity icon by type ──────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: string }) {
  const t = type?.toLowerCase() ?? '';
  if (t.includes('call')) return <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0"><Contact size={14} className="text-blue-600" /></div>;
  if (t.includes('deal')) return <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0"><Handshake size={14} className="text-amber-600" /></div>;
  if (t.includes('meet')) return <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0"><Calendar size={14} className="text-purple-600" /></div>;
  return <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0"><TrendingUp size={14} className="text-slate-500" /></div>;
}

// ─── Deal status badge ──────────────────────────────────────────────────────────

function DealBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    Open: 'bg-blue-50 text-blue-700 border-blue-200',
    Won: 'bg-green-50 text-green-700 border-green-200',
    Lost: 'bg-red-50 text-red-700 border-red-200',
    'On Hold': 'bg-amber-50 text-amber-700 border-amber-200',
  };
  const cls = variants[status] ?? 'bg-gray-50 text-gray-700 border-gray-200';
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      {status}
    </span>
  );
}

// ─── Custom Tooltip for BarChart ────────────────────────────────────────────────

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2">
      <p className="text-[12px] font-semibold text-[#111827]">{label}</p>
      <p className="text-[12px] text-[#6b7280]">{payload[0].value} leads</p>
    </div>
  );
}

// ─── Custom label for PieChart ──────────────────────────────────────────────────

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── Dashboard Page ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/dashboard/stats');
        setStats(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message ?? err.message ?? 'Failed to fetch stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // ── Derived chart data ──
  const pipelineData =
    stats?.leads?.by_status?.map((s) => ({
      name: s.status_name,
      count: s.count,
      fill: STATUS_COLORS[s.status_name] ?? '#6b7280',
    })) ?? [];

  const propertiesData = [
    { name: 'Available', value: stats?.properties?.available ?? 0, fill: '#16a34a' },
    { name: 'Reserved', value: stats?.properties?.reserved ?? 0, fill: '#d97706' },
    { name: 'Sold', value: stats?.properties?.sold ?? 0, fill: '#dc2626' },
  ].filter((d) => d.value > 0);

  // ── Fallback pie data when empty ──
  const pieData = propertiesData.length > 0
    ? propertiesData
    : [{ name: 'No data', value: 1, fill: '#e5e7eb' }];

  return (
    <div className="space-y-6">
      {/* ── Page title ── */}
      <div>
        <h1 className="text-[24px] font-semibold text-[#111827]">Dashboard</h1>
        <p className="text-[14px] text-[#6b7280] mt-1">
          Overview of your business metrics and CRM activity
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {/* ── ROW 1: 4 stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          icon={<Users size={22} className="text-white" />}
          iconBg="#2563eb"
          value={stats?.leads?.total ?? 0}
          label="Total Leads"
          badge={`+${stats?.leads?.new_this_month ?? 0} new this month`}
          loading={loading}
        />
        <StatCard
          icon={<Contact size={22} className="text-white" />}
          iconBg="#16a34a"
          value={stats?.contacts?.total ?? 0}
          label="Active Contacts"
          badge={`+${stats?.contacts?.new_this_month ?? 0} new this month`}
          loading={loading}
        />
        <StatCard
          icon={<Handshake size={22} className="text-white" />}
          iconBg="#d97706"
          value={stats?.deals?.open?.count ?? 0}
          label="Open Deals"
          badge={`$${(stats?.deals?.open?.value ?? 0).toLocaleString()} pipeline value`}
          loading={loading}
        />
        <StatCard
          icon={<Building2 size={22} className="text-white" />}
          iconBg="#7c3aed"
          value={stats?.properties?.total ?? 0}
          label="Properties Listed"
          badge={`${stats?.properties?.available ?? 0} available now`}
          loading={loading}
        />
      </div>

      {/* ── ROW 2: Pipeline chart + Properties donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Lead Pipeline — 60% width */}
        <div className="lg:col-span-3">
          <ChartCard title="Lead Pipeline">
            {loading ? (
              <div className="h-52 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pipelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={pipelineData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} width={80} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {pipelineData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex flex-col items-center justify-center gap-2 text-[#6b7280]">
                <TrendingUp size={32} className="text-gray-200" />
                <p className="text-[13px]">No pipeline data yet</p>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Properties Overview — 40% width */}
        <div className="lg:col-span-2">
          <ChartCard title="Properties Overview">
            {loading ? (
              <div className="h-52 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={propertiesData.length > 0 ? renderPieLabel : undefined}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ fontSize: 12, color: '#374151' }}>{value}</span>
                    )}
                  />
                  <Tooltip
                    formatter={(value, name) => [`${value ?? 0}`, String(name)]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>

      {/* ── ROW 3: Recent Activities + Recent Deals ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-[16px] font-semibold text-[#111827] mb-5">Recent Activities</h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-100 rounded w-4/5" />
                    <div className="h-3 bg-gray-100 rounded w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats?.recent_activities && stats.recent_activities.length > 0 ? (
            <ul className="space-y-4">
              {stats.recent_activities.slice(0, 5).map((act: Activity) => (
                <li key={act.id} className="flex gap-3 items-start">
                  <ActivityIcon type={act.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#111827] leading-snug truncate">
                      {act.description}
                    </p>
                    <p className="text-[12px] text-[#6b7280] mt-0.5">
                      By {act.creator_name || 'System'} • {act.type}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#9ca3af] whitespace-nowrap flex-shrink-0 flex items-center gap-1 mt-0.5">
                    <Clock size={10} />
                    {timeAgo(act.activity_at || act.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Calendar size={22} className="text-blue-300" />
              </div>
              <p className="text-[13px] font-medium text-[#374151]">No recent activity</p>
              <p className="text-[12px] text-[#6b7280]">Activity will appear here as you work</p>
            </div>
          )}
        </div>

        {/* Recent Deals */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-[16px] font-semibold text-[#111827] mb-5">Recent Deals</h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center justify-between animate-pulse">
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 bg-gray-100 rounded w-28" />
                      <div className="h-3 bg-gray-100 rounded w-16" />
                    </div>
                  </div>
                  <div className="h-5 w-12 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : stats?.deals && stats.deals.total > 0 ? (
            <div className="space-y-0">
              {/* Show deal summary stats as a list */}
              <div className="divide-y divide-gray-50">
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <Handshake size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[#111827]">Open Deals</p>
                      <p className="text-[12px] text-[#6b7280]">${(stats.deals.open.value).toLocaleString()} value</p>
                    </div>
                  </div>
                  <DealBadge status="Open" />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                      <Handshake size={14} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[#111827]">Won Deals</p>
                      <p className="text-[12px] text-[#6b7280]">${(stats.deals.won.value).toLocaleString()} closed</p>
                    </div>
                  </div>
                  <DealBadge status="Won" />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                      <Handshake size={14} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[#111827]">Lost Deals</p>
                      <p className="text-[12px] text-[#6b7280]">{stats.deals.lost.count} deals</p>
                    </div>
                  </div>
                  <DealBadge status="Lost" />
                </div>

                <div className="flex items-center justify-between py-3 border-t border-dashed border-gray-100">
                  <p className="text-[13px] font-semibold text-[#111827]">Total Pipeline</p>
                  <p className="text-[15px] font-bold text-[#111827]">
                    ${(stats.deals.total_value).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                <Handshake size={22} className="text-amber-300" />
              </div>
              <p className="text-[13px] font-medium text-[#374151]">No deals yet</p>
              <p className="text-[12px] text-[#6b7280]">Create your first deal to see it here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
