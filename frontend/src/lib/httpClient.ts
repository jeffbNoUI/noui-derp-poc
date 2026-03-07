// ─── Shared HTTP helpers ─────────────────────────────────────────────────────
// Extracted from api.ts / crmApi.ts / dqApi.ts / kbApi.ts / correspondenceApi.ts
// to eliminate duplication. All domain-specific API clients import from here.

export interface APIResponse<T> {
  data: T;
  meta: { request_id: string; timestamp: string };
}

export async function fetchAPI<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message || `API error: ${res.status}`);
  }
  const body: APIResponse<T> = await res.json();
  return body.data;
}

export async function postAPI<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message || `API error: ${res.status}`);
  }
  const body: APIResponse<T> = await res.json();
  return body.data;
}

export async function patchAPI<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message || `API error: ${res.status}`);
  }
  const body: APIResponse<T> = await res.json();
  return body.data;
}

export async function putAPI<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message || `API error: ${res.status}`);
  }
  const body: APIResponse<T> = await res.json();
  return body.data;
}

export async function deleteAPI<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message || `API error: ${res.status}`);
  }
  const body: APIResponse<T> = await res.json();
  return body.data;
}

export function toQueryString(params: object): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}
