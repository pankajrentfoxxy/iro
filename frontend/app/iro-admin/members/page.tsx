'use client';

import MembersTable from '@/components/admin/MembersTable';

export default function MembersPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <nav className="text-sm text-gray-500">
          <span>Members</span>
        </nav>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-[#0D1B2A] text-2xl">
          Members
          <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-sm font-normal text-gray-600">
            10
          </span>
        </h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-[#0D1B2A] text-[#0D1B2A] rounded-lg text-sm font-medium hover:bg-gray-50">
            Export CSV
          </button>
          <button className="px-4 py-2 border border-[#0D1B2A] text-[#0D1B2A] rounded-lg text-sm font-medium hover:bg-gray-50">
            Export Excel
          </button>
        </div>
      </div>

      <MembersTable />
    </div>
  );
}
