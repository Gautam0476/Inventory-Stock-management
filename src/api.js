const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export function getAuthToken() {
  return localStorage.getItem('stockToken');
}

export function hasAuthSession() {
  return Boolean(getAuthToken());
}

export function startSession({ token, user }) {
  if (!token || !user) {
    throw new Error('Login response was missing session data.');
  }

  const profile = {
    name: user.name,
    email: user.email,
    role: user.role || 'Inventory Manager',
    company: user.company || 'Inventory-&-Stock-management',
  };

  localStorage.setItem('stockToken', token);
  localStorage.setItem('stockSession', JSON.stringify({ name: user.name, email: user.email }));
  localStorage.setItem('stockProfile', JSON.stringify(profile));
}

export function clearSession() {
  localStorage.removeItem('stockToken');
  localStorage.removeItem('stockSession');
  localStorage.removeItem('stockProfile');
}

async function apiRequest(endpoint, options = {}) {
  const { method = 'GET', body, auth = true } = options;
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(`Backend not reachable at ${API_BASE_URL}. Start the Node server first.`);
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || 'API request failed.');
    error.status = response.status;
    throw error;
  }

  return data;
}

export function loginUser(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: credentials,
    auth: false,
  });
}

export function signupUser(payload) {
  return apiRequest('/auth/signup', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}

export function fetchProducts() {
  return apiRequest('/products');
}

export function createProduct(payload) {
  return apiRequest('/products', {
    method: 'POST',
    body: payload,
  });
}

export function resetSampleProducts() {
  return apiRequest('/products/reset/sample-data', {
    method: 'POST',
  });
}

export function fetchOrders() {
  return apiRequest('/orders');
}

export function createOrder(payload) {
  return apiRequest('/orders', {
    method: 'POST',
    body: payload,
  });
}

export function updateOrder(orderId, payload) {
  return apiRequest(`/orders/${orderId}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteOrder(orderId) {
  return apiRequest(`/orders/${orderId}`, {
    method: 'DELETE',
  });
}
