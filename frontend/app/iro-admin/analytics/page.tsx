'use client';

export default function AnalyticsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <nav className="text-sm text-gray-500">Analytics</nav>
      </div>
      <h1 className="font-display font-bold text-[#0D1B2A] text-2xl mb-6">
        Analytics
      </h1>
      <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm border border-gray-100">
        Analytics – Coming soon (TODO: wire to Supabase)
      </div>
    </div>
  );
}
