/**
 * AgentShield API Client Service
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData.detail) errorMsg = errorData.detail;
      } catch {
        // fallback
      }
      throw new Error(errorMsg);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Request Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  getHealth: () => request('/api/health'),
  getStats: () => request('/api/stats'),
  getActions: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.agent) query.append('agent', params.agent);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString();
    return request(`/api/actions${queryString ? `?${queryString}` : ''}`);
  },
  getActionDetail: (id) => request(`/api/actions/${id}`),
  simulateAction: (data) =>
    request('/api/actions/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approveAction: (id, note = '') =>
    request(`/api/actions/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ supervisor_note: note || 'Approved by security supervisor.' }),
    }),
  rejectAction: (id, note = '') =>
    request(`/api/actions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ supervisor_note: note || 'Rejected by security supervisor.' }),
    }),
  getPolicies: () => request('/api/policies'),
  resetSeed: () =>
    request('/api/actions/reset-seed', {
      method: 'POST',
    }),
};
