const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("token") || "";
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload, auth: false }),
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  me: () => request("/me"),
  getPlans: () => request("/plans", { auth: false }),
  getAddons: () => request("/addons", { auth: false }),
  selectPlan: (plan) => request("/me/plan", { method: "POST", body: { plan } }),
  saveApiKey: (apiKey) => request("/me/api-key", { method: "PUT", body: { api_key: apiKey } }),
  deleteApiKey: () => request("/me/api-key", { method: "DELETE" }),
  saveAnthropicKey: (apiKey) => request("/me/anthropic-key", { method: "PUT", body: { api_key: apiKey } }),
  deleteAnthropicKey: () => request("/me/anthropic-key", { method: "DELETE" }),
  saveSmtp: (settings) => request("/me/smtp", { method: "PUT", body: settings }),
  deleteSmtp: () => request("/me/smtp", { method: "DELETE" }),
  generatePitch: (leadId) => request(`/leads/${leadId}/pitch`, { method: "POST" }),
  emailLead: (leadId, payload) => request(`/leads/${leadId}/email`, { method: "POST", body: payload }),
  createRun: (payload) => request("/runs", { method: "POST", body: payload }),
  listRuns: () => request("/runs"),
  getRun: (id) => request(`/runs/${id}`),
  getLeads: (id) => request(`/runs/${id}/leads`),
  exportCsvUrl: (id) => `${API_BASE_URL}/runs/${id}/export.csv`,
};

export { getToken, API_BASE_URL };
