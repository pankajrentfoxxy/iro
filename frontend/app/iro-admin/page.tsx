'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock data - TODO: replace with Supabase queries
const growthData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  }),
  count: 120 + i * 8 + Math.floor(Math.random() * 20),
}));

const stateData = [
  { name: 'Uttar Pradesh', value: 450, color: '#E8892C' },
  { name: 'Maharashtra', value: 320, color: '#0D1B2A' },
  { name: 'Bihar', value: 280, color: '#1D6A42' },
  { name: 'West Bengal', value: 210, color: '#718096' },
  { name: 'Madhya Pradesh', value: 180, color: '#FAD7A0' },
];

const channelData = [
  { label: 'Missed Call', count: 420, pct: 42 },
  { label: 'WhatsApp', count: 280, pct: 28 },
  { label: 'Direct Signup', count: 180, pct: 18 },
  { label: 'Referral', count: 120, pct: 12 },
];

const recentSignups = [
  { id: '1', name: 'Rahul Sharma', phone: '+91 XXXXX X1234', state: 'UP', joined: '2 hours ago', source: 'missed_call' },
  { id: '2', name: 'Priya Patel', phone: '+91 XXXXX X5678', state: 'MH', joined: '3 hours ago', source: 'whatsapp' },
  { id: '3', name: 'Amit Kumar', phone: '+91 XXXXX X9012', state: 'BH', joined: '5 hours ago', source: 'referral' },
  { id: '4', name: 'Sneha Reddy', phone: '+91 XXXXX X3456', state: 'KA', joined: '6 hours ago', source: 'direct' },
  { id: '5', name: 'Vikram Singh', phone: '+91 XXXXX X7890', state: 'RJ', joined: '8 hours ago', source: 'missed_call' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function IroAdminDashboard() {
  const [chartRange, setChartRange] = useState<'7' | '30' | '90'>('30');

  return (
    <div>
      {/* Top bar */}
      <div className="flex justify-between items-center mb-8">
        <nav className="text-sm text-gray-500">
          <span>Dashboard</span>
        </nav>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <div className="w-8 h-8 rounded-full bg-[#E8892C]/20 flex items-center justify-center text-[#E8892C] font-semibold text-sm">
            A
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Reformers', value: '1,250', icon: '👥', trend: '+12% vs yesterday' },
          { label: 'New Today', value: '48', icon: '📈', trend: '+8% vs yesterday' },
          { label: 'Active Campaigns', value: '3', icon: '📢', trend: '2 running' },
          { label: 'Total Donations', value: '₹2.4L', icon: '₹', trend: '+5% this week' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">{kpi.label}</span>
              <span className="text-xl">{kpi.icon}</span>
            </div>
            <p className="font-display font-bold text-[#0D1B2A] text-2xl mt-1">
              {kpi.value}
            </p>
            <p className="text-xs text-success mt-1">{kpi.trend}</p>
          </div>
        ))}
      </div>

      {/* Growth Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-[#0D1B2A]">
            Reformer Growth – Last 30 Days
          </h3>
          <div className="flex gap-2">
            {(['7', '30', '90'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setChartRange(r)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  chartRange === r
                    ? 'bg-[#E8892C] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {r} Days
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#E8892C"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-column row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* State Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-display font-bold text-[#0D1B2A] mb-4">
            State Distribution
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stateData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Signups */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-display font-bold text-[#0D1B2A] mb-4">
            Recent Signups
          </h3>
          <div className="space-y-2">
            {recentSignups.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-[#E8892C]/20 flex items-center justify-center text-[#E8892C] font-semibold text-xs">
                  {getInitials(m.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#0D1B2A] truncate">{m.name}</p>
                  <p className="text-xs text-gray-500">
                    {m.phone} • {m.state} • {m.joined}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <a
            href="/iro-admin/members"
            className="inline-block mt-4 text-[#E8892C] text-sm font-medium hover:underline"
          >
            View All Members →
          </a>
        </div>
      </div>

      {/* Onboarding Channel Breakdown */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-display font-bold text-[#0D1B2A] mb-4">
          Signups by Channel
        </h3>
        <div className="space-y-4">
          {channelData.map((ch) => (
            <div key={ch.label} className="flex items-center gap-4">
              <span className="w-28 text-sm text-gray-600">{ch.label}</span>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#E8892C] to-[#F0A04D]"
                  style={{ width: `${ch.pct}%` }}
                />
              </div>
              <span className="w-12 text-sm text-right font-medium">
                {ch.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
