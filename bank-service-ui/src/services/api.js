const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: 'Network error occurred' };
    }
    
    throw new ApiError(
      errorData.detail || `HTTP ${response.status}`,
      response.status,
      errorData
    );
  }
  
  return response.json();
};

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error: Unable to connect to server', 0, null);
  }
};

// Customer API functions
export const fetchCustomers = async () => {
  return apiRequest('/customers/');
};

export const fetchCustomer = async (customerId) => {
  return apiRequest(`/customers/${customerId}`);
};

export const createCustomer = async (customerData) => {
  return apiRequest('/customers/', {
    method: 'POST',
    body: JSON.stringify(customerData),
  });
};

export const fetchCustomerAccounts = async (customerId) => {
  return apiRequest(`/customers/${customerId}/accounts`);
};

// Checking Account API functions
export const fetchCheckingAccounts = async () => {
  return apiRequest('/checking-accounts/');
};

export const fetchCheckingAccount = async (accountId) => {
  return apiRequest(`/checking-accounts/${accountId}`);
};

export const createCheckingAccount = async (accountData) => {
  return apiRequest('/checking-accounts/', {
    method: 'POST',
    body: JSON.stringify(accountData),
  });
};

// Transaction API functions
export const fetchAccountTransactions = async (accountId) => {
  return apiRequest(`/checking-accounts/${accountId}/transactions`);
};

export const depositFunds = async (accountId, depositData) => {
  return apiRequest(`/checking-accounts/${accountId}/deposit`, {
    method: 'POST',
    body: JSON.stringify(depositData),
  });
};

export const withdrawFunds = async (accountId, withdrawalData) => {
  return apiRequest(`/checking-accounts/${accountId}/withdraw`, {
    method: 'POST',
    body: JSON.stringify(withdrawalData),
  });
};

// Credit Card API functions
export const fetchCreditCards = async () => {
  return apiRequest('/credit-cards/');
};

export const fetchCreditCard = async (cardId) => {
  return apiRequest(`/credit-cards/${cardId}`);
};

export const createCreditCard = async (cardData) => {
  return apiRequest('/credit-cards/', {
    method: 'POST',
    body: JSON.stringify(cardData),
  });
};

// Health check
export const checkApiHealth = async () => {
  return apiRequest('/');
};

export { ApiError };