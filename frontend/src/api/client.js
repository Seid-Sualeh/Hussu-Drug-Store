const rawApiBase = import.meta.env.VITE_API_BASE || "/api";
const normalizedBase = rawApiBase.trim().replace(/\/+$/, "");
const API_BASE = normalizedBase.endsWith("/api")
  ? normalizedBase
  : `${normalizedBase}/api`;

function getToken() {
  return localStorage.getItem("medicare_auth_token");
}

export function clearAuthStorage() {
  localStorage.removeItem("medicare_auth_token");
  localStorage.removeItem("medicare_auth_user");
}

async function fetchWithTimeout(resource, options = {}) {
  const timeoutMs = options.timeout ?? 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetchWithTimeout(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection.");
    }
    if (err instanceof TypeError) {
      throw new Error("Network error. Please check your connection.");
    }
    throw err;
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    clearAuthStorage();
    if (!options.skipAuthRedirect) {
      window.dispatchEvent(
        new CustomEvent("auth:session-expired", {
          detail: {
            message: data.error || "Session expired. Please sign in again.",
          },
        }),
      );
    }
    throw new Error(data.error || "Session expired");
  }

  if (!res.ok) {
    throw new Error(
      data.error || res.statusText || `Request failed (${res.status})`,
    );
  }
  return data;
}

export const api = {
  getMe: () => request("/auth/me", { skipAuthRedirect: true }),

  login: async (username, password) => {
    let res;
    try {
      res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error("Network timeout. Please check your connection.");
      }
      if (err instanceof TypeError) {
        throw new Error("Network error. Please check your connection.");
      }
      throw err;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Login failed");
    return data;
  },

  getDashboard: () => request("/dashboard"),
  getStats: () => request("/inventory/stats"),
  getCategories: () => request("/inventory/categories"),
  getSuppliers: () => request("/inventory/suppliers"),
  getInventory: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/inventory?${q}`);
  },
  globalSearch: (q) =>
    request(`/inventory/search-global?q=${encodeURIComponent(q)}`),
  getMedicine: (id) => request(`/inventory/${id}`),
  createMedicine: (body) =>
    request("/inventory", { method: "POST", body: JSON.stringify(body) }),
  updateMedicine: (id, body) =>
    request(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteMedicine: (id) => request(`/inventory/${id}`, { method: "DELETE" }),

  getCategoriesFull: () => request("/categories"),
  createCategory: (body) =>
    request("/categories", { method: "POST", body: JSON.stringify(body) }),
  updateCategory: (id, body) =>
    request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: "DELETE" }),

  getSuppliersFull: () => request("/suppliers"),
  createSupplier: (body) =>
    request("/suppliers", { method: "POST", body: JSON.stringify(body) }),
  updateSupplier: (id, body) =>
    request(`/suppliers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: "DELETE" }),

  getStockMovements: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/stock?${q}`);
  },
  stockIn: (body) =>
    request("/stock/in", { method: "POST", body: JSON.stringify(body) }),
  stockOut: (body) =>
    request("/stock/out", { method: "POST", body: JSON.stringify(body) }),

  getSales: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/sales?${q}`);
  },
  createSale: (body) =>
    request("/sales", { method: "POST", body: JSON.stringify(body) }),

  getSettings: () => request("/settings"),
  updateSettings: (body) =>
    request("/settings", { method: "PUT", body: JSON.stringify(body) }),

  getReportSummary: () => request("/reports/summary"),
  getReportExpiry: () => request("/reports/expiry"),
  getReportStock: () => request("/reports/stock-movements"),
  getReportSales: () => request("/reports/sales"),
  getReportLowStock: () => request("/reports/low-stock"),

  getNotifications: () => request("/notifications"),
  getNotificationCount: () => request("/notifications/count"),
  markNotificationRead: (id) =>
    request(`/notifications/${id}/read`, { method: "PATCH" }),
};

export function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatETB(value) {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrency(value, currency = "ETB") {
  if (currency === "INR") return formatINR(value);
  return formatETB(value);
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(n) {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function downloadCsv(filename, headers, rows) {
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
