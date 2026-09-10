const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed with status ${response.status}.`);
  return data;
};

const authenticated = (token, options = {}) => ({
  ...options,
  headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` }
});

export const register = (email, password) => request('/api/auth/signup', {
  method: 'POST', body: JSON.stringify({ email, password })
});
export const login = (email, password) => request('/api/auth/login', {
  method: 'POST', body: JSON.stringify({ email, password })
});
export const uploadReport = (token, { title, dataType, content, file }) => {
  if (file) {
    const form = new FormData();
    form.append('title', title || file.name);
    form.append('data_type', dataType || 'report');
    form.append('file', file);
    return request('/api/ingest/file', authenticated(token, { method: 'POST', body: form }));
  }
  return request('/api/ingest', authenticated(token, {
    method: 'POST',
    body: JSON.stringify({ title, data_type: dataType || 'report', content })
  }));
};
export const getGraph = (token, sourceDocumentId) => request(
  sourceDocumentId ? `/api/graph?source_document_id=${encodeURIComponent(sourceDocumentId)}` : '/api/graph',
  authenticated(token)
);
export const getEntityRelationships = (token, entityId) => request(
  `/api/entities/${encodeURIComponent(entityId)}/relationships`, authenticated(token)
);
export const getNodeDetail = (token, entityId) => request(
  `/api/graph/node/${encodeURIComponent(entityId)}`, authenticated(token)
);
export const getIngestStatus = (token, jobId) => request(
  `/api/ingest/status/${encodeURIComponent(jobId)}`, authenticated(token)
);
export const getAnalytics = (token) => request('/api/analytics', authenticated(token));
export const search = (token, query, type = 'all') => request(
  `/api/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`, authenticated(token)
);
export const getCases = (token) => request('/api/cases', authenticated(token));
export const createCase = (token, payload) => request('/api/cases', authenticated(token, {
  method: 'POST', body: JSON.stringify(payload)
}));
export const updateCaseStatus = (token, id, status) => request(
  `/api/cases/${encodeURIComponent(id)}/status`,
  authenticated(token, { method: 'PATCH', body: JSON.stringify({ status }) })
);
export const getAuditLog = (token) => request('/api/audit', authenticated(token));
export const getAdminOverview = (token) => request('/api/admin/overview', authenticated(token));
export const getAdminUsers = (token) => request('/api/admin/users', authenticated(token));
export const updateAdminUserRole = (token, id, role) => request(
  `/api/admin/users/${encodeURIComponent(id)}/role`,
  authenticated(token, { method: 'PATCH', body: JSON.stringify({ role }) })
);

export { API_URL };
