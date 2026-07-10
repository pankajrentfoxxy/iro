'use client';

export default function DonationsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <nav className="text-sm text-muted-foreground">Donations</nav>
      </div>
      <h1 className="font-display font-bold text-primary text-2xl mb-6">
        Donations
      </h1>
      <div className="bg-white rounded-xl p-12 text-center text-muted-foreground shadow-sm border border-border">
        Donations management – Coming soon (TODO: wire to Supabase)
      </div>
    </div>
  );
}
