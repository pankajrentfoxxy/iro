"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

type UserRow = {
  id: string;
  fullName: string;
  role: { levelCode: string } | null;
  booth?: { id: string; name: string } | null;
};

export default function UsersPage() {
  const token = useAuthStore((s) => s.accessToken);
  const q = useQuery({
    queryKey: ["users", 1],
    enabled: Boolean(token),
    queryFn: () =>
      apiFetch<{ total: number; items: UserRow[] }>("/users?page=1&pageSize=20", { token }),
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-white">Users</h1>
      <p className="mt-1 text-slate-400">Total: {q.data?.total ?? "—"}</p>
      <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Booth</th>
            </tr>
          </thead>
          <tbody>
            {(q.data?.items ?? []).map((u) => (
              <tr key={u.id} className="border-t border-white/5 text-white">
                <td className="px-4 py-3">{u.fullName}</td>
                <td className="px-4 py-3">{u.role?.levelCode ?? "—"}</td>
                <td className="px-4 py-3 text-slate-300">{u.booth?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
