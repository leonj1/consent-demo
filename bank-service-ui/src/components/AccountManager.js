import React, { useState, useEffect } from 'react';
import { fetchCustomerAccounts, createCheckingAccount } from '../services/api';

const AccountManager = ({ customer, onAccountSelect, selectedAccount, refreshTrigger, onRefresh }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    account_number: ''
  });

  useEffect(() => {
    if (customer) {
      loadAccounts();
    }
  }, [customer, refreshTrigger]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCustomerAccounts(customer.id);
      setAccounts(data.checking_accounts || []);
    } catch (err) {
      setError('Failed to load accounts');
      console.error('Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAccountNumber = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ACC${timestamp}${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.account_number.trim()) return;

    try {
      setLoading(true);
      await createCheckingAccount({
        account_number: formData.account_number,
        customer_id: customer.id
      });
      
      setFormData({ account_number: '' });
      setShowForm(false);
      loadAccounts();
      onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to create account');
      console.error('Error creating account:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance) => {
    const num = parseFloat(balance || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const resetForm = () => {
    setFormData({ account_number: '' });
    setShowForm(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-100">
                Checking Accounts for {customer.first_name} {customer.last_name}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Manage checking accounts and balances
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary"
              disabled={loading}
            >
              {showForm ? 'Cancel' : '+ New Account'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-6 bg-gray-700 rounded-lg">
            <h3 className="text-lg font-medium text-gray-100 mb-4">Create New Checking Account</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="account_number" className="block text-sm font-medium text-gray-100 mb-2">
                  Account Number *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="input-field flex-1"
                    placeholder="Enter account number"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, account_number: generateAccountNumber() })}
                    className="btn-secondary whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Account number must be unique across all customers
                </p>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !formData.account_number.trim()}
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading && !showForm && (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading accounts...</div>
          </div>
        )}

        <div className="grid gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-all duration-200 cursor-pointer border-2 ${
                selectedAccount?.id === account.id ? 'border-banking-primary' : 'border-transparent'
              }`}
              onClick={() => onAccountSelect(account)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">💳</span>
                    <div>
                      <h3 className="font-medium text-gray-100">
                        Account {account.account_number}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Checking Account
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Current Balance</p>
                      <p className={`text-lg font-semibold ${
                        parseFloat(account.balance) >= 0 ? 'balance-positive' : 'balance-negative'
                      }`}>
                        {formatBalance(account.balance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Account Status</p>
                      <p className={`text-sm font-medium ${
                        account.is_active ? 'text-banking-success' : 'text-banking-danger'
                      }`}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-xs text-gray-500">
                      Opened on {new Date(account.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  {selectedAccount?.id === account.id && (
                    <span className="text-banking-secondary text-sm font-medium">Selected</span>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAccountSelect(account);
                      }}
                      className="text-banking-secondary hover:text-banking-primary text-sm"
                    >
                      View Transactions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!loading && accounts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💳</div>
              <div className="text-gray-400">No checking accounts found</div>
              <p className="text-sm text-gray-500 mt-2">
                Create the first checking account for {customer.first_name}
              </p>
            </div>
          )}
        </div>

        {accounts.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Accounts</p>
                <p className="text-lg font-semibold text-gray-100">{accounts.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Balance</p>
                <p className={`text-lg font-semibold ${
                  accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0) >= 0 
                    ? 'balance-positive' 
                    : 'balance-negative'
                }`}>
                  {formatBalance(accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0))}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Active Accounts</p>
                <p className="text-lg font-semibold text-banking-success">
                  {accounts.filter(acc => acc.is_active).length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountManager;