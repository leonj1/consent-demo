import React, { useState, useEffect } from 'react';
import { fetchCustomers, createCustomer } from '../services/api';

const CustomerManager = ({ onCustomerSelect, selectedCustomer, refreshTrigger, onRefresh }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });

  useEffect(() => {
    loadCustomers();
  }, [refreshTrigger]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (err) {
      setError('Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim()) return;

    try {
      setLoading(true);
      await createCustomer(formData);
      
      setFormData({ first_name: '', last_name: '', email: '' });
      setShowForm(false);
      loadCustomers();
      onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to create customer');
      console.error('Error creating customer:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ first_name: '', last_name: '', email: '' });
    setShowForm(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-100">Customer Management</h2>
              <p className="text-sm text-gray-400 mt-1">
                Manage customer accounts and information
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary"
              disabled={loading}
            >
              {showForm ? 'Cancel' : '+ New Customer'}
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
            <h3 className="text-lg font-medium text-gray-100 mb-4">Create New Customer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-100 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-100 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter last name"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-100 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim()}
              >
                {loading ? 'Creating...' : 'Create Customer'}
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
            <div className="text-gray-400">Loading customers...</div>
          </div>
        )}

        <div className="space-y-3">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className={`bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-all duration-200 cursor-pointer border-2 ${
                selectedCustomer?.id === customer.id ? 'border-banking-primary' : 'border-transparent'
              }`}
              onClick={() => onCustomerSelect(customer)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-100">
                    {customer.first_name} {customer.last_name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">{customer.email}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Customer since {new Date(customer.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedCustomer?.id === customer.id && (
                    <span className="text-banking-secondary text-sm font-medium">Selected</span>
                  )}
                  <span className="text-2xl">👤</span>
                </div>
              </div>
            </div>
          ))}

          {!loading && customers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <div className="text-gray-400">No customers found</div>
              <p className="text-sm text-gray-500 mt-2">Create your first customer to get started</p>
            </div>
          )}
        </div>

        {customers.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="text-center text-sm text-gray-400">
              Total: {customers.length} customer{customers.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManager;