"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function DashboardPage() {
  const token = useAuthStore((s) => s.accessToken);
  const q = useQuery({
    queryKey: ["analytics-dashboard"],
    enabled: Boolean(token),
    queryFn: () =>
      apiFetch<{
        users: { total: number; active: number };
        surveysLast7d: number;
        tasksPending: number;
        roleDistribution: { roleId: string | null; levelCode: string | null; count: number }[];
      }>("/analytics/dashboard", { token }),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
      <p className="mt-1 text-slate-400">Scoped to your jurisdiction</p>

      {q.isLoading ? (
        <div className="mt-8 animate-pulse text-slate-500">Loading metrics…</div>
      ) : q.isError ? (
        <div className="mt-8 text-red-400">{(q.error as Error).message}</div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric title="Users" value={q.data?.users.total ?? 0} sub={`${q.data?.users.active ?? 0} active`} />
          <Metric title="Surveys (7d)" value={q.data?.surveysLast7d ?? 0} />
          <Metric title="Tasks pending" value={q.data?.tasksPending ?? 0} />
          <Metric title="Role buckets" value={q.data?.roleDistribution.length ?? 0} sub="segments" />
        </div>
      )}
    </div>
  );
}

function Metric({ title, value, sub }: { title: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-navy-light p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-400">{sub}</div> : null}
    </div>
  );
}
