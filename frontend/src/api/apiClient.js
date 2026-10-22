import { getAccessToken } from "../utils/authSession";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function apiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

export async function apiFetch(path, options = {}) {
  const { parseJson = true, headers, ...rest } = options;
  const token = getAccessToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(apiUrl(path), {
    ...rest,
    headers: {
      Accept: "application/json",
      ...authHeader,
      ...headers,
    },
  });

  if (!response.ok) {
    let body;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    const detail =
      typeof body?.detail === "string"
        ? body.detail
        : Array.isArray(body?.detail)
          ? body.detail.map((item) => item.msg ?? JSON.stringify(item)).join("; ")
          : null;
    throw new ApiError(detail ?? `Request failed (${response.status})`, {
      status: response.status,
      body,
    });
  }

  if (!parseJson) return response;
  if (response.status === 204) return null;
  return response.json();
}

function pick(obj, ...keys) {
  for (const key of keys) {
    if (obj != null && obj[key] !== undefined) return obj[key];
  }
  return undefined;
}

export function mapKeys(obj, keyMap) {
  if (!obj || typeof obj !== "object") return obj;
  const out = { ...obj };
  Object.entries(keyMap).forEach(([from, to]) => {
    if (from in out && !(to in out)) {
      out[to] = out[from];
      delete out[from];
    }
  });
  return out;
}

export { pick };
