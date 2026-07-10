'use client';

export default function AnalyticsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <nav className="text-sm text-muted-foreground">Analytics</nav>
      </div>
      <h1 className="font-display font-bold text-primary text-2xl mb-6">
        Analytics
      </h1>
      <div className="bg-white rounded-xl p-12 text-center text-muted-foreground shadow-sm border border-border">
        Analytics – Coming soon (TODO: wire to Supabase)
      </div>
    </div>
  );
}
