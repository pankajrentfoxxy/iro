"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

type BoothListItem = {
  id: string;
  name: string;
  boothDetail: { boothNumber: string | null; registeredVoters: number } | null;
  _count: { usersBooth: number };
};

type BoothDetail = BoothListItem & {
  parent: { id: string; name: string; type: string } | null;
  usersBooth: Array<{
    id: string;
    fullName: string;
    referralCode: string;
    role: { levelCode: string; roleName: string } | null;
  }>;
};

type UserSearchRow = {
  id: string;
  fullName: string;
  referralCode: string;
  role: { levelCode: string; roleName: string } | null;
  booth?: { id: string; name: string } | null;
};

export default function BoothsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  const [manageId, setManageId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [onlyL7, setOnlyL7] = useState(true);

  const listQ = useQuery({
    queryKey: ["admin-booths"],
    enabled: Boolean(token),
    queryFn: () => apiFetch<{ items: BoothListItem[] }>("/booths", { token }),
  });

  const detailQ = useQuery({
    queryKey: ["admin-booth", manageId],
    enabled: Boolean(token && manageId),
    queryFn: () => apiFetch<BoothDetail>(`/booths/${manageId}`, { token }),
  });

  const searchQ = useQuery({
    queryKey: ["admin-users-search", userSearch, onlyL7],
    enabled: Boolean(token && assignOpen && userSearch.trim().length >= 2),
    queryFn: () =>
      apiFetch<{ items: UserSearchRow[] }>(
        `/users?search=${encodeURIComponent(userSearch.trim())}&pageSize=25&page=1${onlyL7 ? "&roleLevel=L7" : ""}`,
        { token },
      ),
  });

  const assignM = useMutation({
    mutationFn: async ({ boothId, userId }: { boothId: string; userId: string }) => {
      await apiFetch<{ user: unknown }>("/booths/assign-worker", {
        method: "POST",
        token,
        body: JSON.stringify({ boothId, userId }),
      });
    },
    onSuccess: async (_, vars) => {
      await qc.invalidateQueries({ queryKey: ["admin-booths"] });
      await qc.invalidateQueries({ queryKey: ["admin-booth", vars.boothId] });
      setAssignOpen(false);
      setUserSearch("");
    },
  });

  const unassignM = useMutation({
    mutationFn: async (userId: string) => {
      await apiFetch<{ user: unknown }>("/booths/unassign-worker", {
        method: "POST",
        token,
        body: JSON.stringify({ userId }),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-booths"] });
      if (manageId) await qc.invalidateQueries({ queryKey: ["admin-booth", manageId] });
    },
  });

  const rows = listQ.data?.items ?? [];
  const booth = detailQ.data;

  const searchRows = useMemo(() => searchQ.data?.items ?? [], [searchQ.data?.items]);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-semibold">Booths</h1>
        {/* <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Polling booths in your jurisdiction. Assign a booth worker (typically L7); they use the mobile app booth dashboard
          against the main API once <code className="text-saffron">user.boothId</code> is set.
        </p> */}

      <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-4 py-3">Booth #</th>
              <th className="px-4 py-3">Area name</th>
              <th className="px-4 py-3">Workers</th>
              <th className="px-4 py-3">Registered voters</th>
              <th className="px-4 py-3 w-40" />
            </tr>
          </thead>
          <tbody>
            {listQ.isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-slate-400">
                  No booths in your jurisdiction (or hierarchy not seeded).
                </td>
              </tr>
            ) : (
              rows.map((b) => (
                <tr key={b.id} className="border-t border-white/5">
                  <td className="px-4 py-3 font-medium">{b.boothDetail?.boothNumber ?? b.name}</td>
                  <td className="px-4 py-3 text-slate-300">{b.name}</td>
                  <td className="px-4 py-3">{b._count.usersBooth}</td>
                  <td className="px-4 py-3">{b.boothDetail?.registeredVoters?.toLocaleString("en-IN") ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="rounded-md bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
                      onClick={() => setManageId(b.id)}
                    >
                      Manage workers
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {manageId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-navy-light p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Booth workers</h2>
                {detailQ.isLoading ? (
                  <p className="mt-2 text-sm text-slate-400">Loading booth…</p>
                ) : booth ? (
                  <p className="mt-1 text-sm text-slate-400">
                    {booth.boothDetail?.boothNumber ?? booth.name} · {booth.name}
                    {booth.parent ? ` · ${booth.parent.name}` : ""}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-red-400">Could not load booth.</p>
                )}
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-white"
                onClick={() => {
                  setManageId(null);
                  setAssignOpen(false);
                  setUserSearch("");
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {booth ? (
              <>
                <button
                  type="button"
                  className="mt-4 w-full rounded-lg bg-saffron py-2 text-sm font-semibold text-white disabled:opacity-50"
                  onClick={() => setAssignOpen(true)}
                  disabled={assignM.isPending}
                >
                  Assign worker…
                </button>

                <ul className="mt-4 divide-y divide-white/10">
                  {(booth.usersBooth ?? []).length === 0 ? (
                    <li className="py-4 text-sm text-slate-400">No workers assigned yet.</li>
                  ) : (
                    booth.usersBooth.map((u) => (
                      <li key={u.id} className="flex items-center justify-between gap-2 py-3">
                        <div>
                          <div className="font-medium">{u.fullName}</div>
                          <div className="text-xs text-slate-500">
                            {u.referralCode} · {u.role?.levelCode ?? "—"}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 rounded-md border border-white/15 px-2 py-1 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-40"
                          disabled={unassignM.isPending}
                          onClick={() => unassignM.mutate(u.id)}
                        >
                          Remove
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {assignOpen && manageId ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-navy-light p-6">
            <h3 className="text-lg font-semibold">Assign to booth</h3>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-400">
              <input type="checkbox" checked={onlyL7} onChange={(e) => setOnlyL7(e.target.checked)} />
              Limit search to L7 (booth worker role)
            </label>
            <input
              className="mt-3 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm outline-none focus:border-saffron"
              placeholder="Search name, email, or referral code…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            <p className="mt-2 text-xs text-slate-500">Type at least 2 characters to search.</p>

            <ul className="mt-4 max-h-52 overflow-y-auto divide-y divide-white/10">
              {searchRows.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{u.fullName}</div>
                    <div className="truncate text-xs text-slate-500">
                      {u.referralCode} · {u.role?.levelCode ?? "—"}
                      {u.booth ? ` · booth: ${u.booth.name}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-md bg-saffron px-2 py-1 text-xs font-semibold disabled:opacity-40"
                    disabled={assignM.isPending || u.booth?.id === manageId}
                    onClick={() => assignM.mutate({ boothId: manageId, userId: u.id })}
                  >
                    {u.booth?.id === manageId ? "Here" : "Assign"}
                  </button>
                </li>
              ))}
            </ul>

            {assignM.isError ? (
              <p className="mt-2 text-sm text-red-400">
                {assignM.error instanceof Error ? assignM.error.message : "Assign failed"}
              </p>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-white/15 px-4 py-2 text-sm"
                onClick={() => {
                  setAssignOpen(false);
                  setUserSearch("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
