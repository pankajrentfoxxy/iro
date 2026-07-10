'use client';

import MembersTable from '@/components/admin/MembersTable';

export default function MembersPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <nav className="text-sm text-muted-foreground">
          <span>Members</span>
        </nav>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-primary text-2xl">
          Members
          <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-sm font-normal text-muted-foreground">
            10
          </span>
        </h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-muted">
            Export CSV
          </button>
          <button className="px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-muted">
            Export Excel
          </button>
        </div>
      </div>

      <MembersTable />
    </div>
  );
}
