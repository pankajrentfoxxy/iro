const base = (process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "http://localhost:4010/api/admin").replace(/\/$/, "");

export type ApiEnvelope<T> = { success: true; data: T } | { success: false; error: { message: string } };

export async function apiFetch<T>(
  path: string,
  opts: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(opts.headers);
  headers.set("Content-Type", "application/json");
  if (opts.token) headers.set("Authorization", `Bearer ${opts.token}`);
  const res = await fetch(url, { ...opts, headers });
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!json.success) {
    throw new Error("error" in json ? json.error.message : "Request failed");
  }
  return json.data;
}
