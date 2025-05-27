import React, { useState, useEffect } from 'react';
import { fetchCustomerAccounts, createCreditCard } from '../services/api';

const CreditCardManager = ({ customer, refreshTrigger, onRefresh }) => {
  const [creditCards, setCreditCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    card_number: '',
    credit_limit: ''
  });

  useEffect(() => {
    if (customer) {
      loadCreditCards();
    }
  }, [customer, refreshTrigger]);

  const loadCreditCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCustomerAccounts(customer.id);
      setCreditCards(data.credit_cards || []);
    } catch (err) {
      setError('Failed to load credit cards');
      console.error('Error loading credit cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCardNumber = () => {
    // Generate a fake credit card number (not real)
    const prefix = '4111'; // Visa test prefix
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${timestamp}${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.card_number.trim() || !formData.credit_limit || parseFloat(formData.credit_limit) <= 0) return;

    try {
      setLoading(true);
      await createCreditCard({
        card_number: formData.card_number,
        credit_limit: parseFloat(formData.credit_limit),
        customer_id: customer.id
      });
      
      setFormData({ card_number: '', credit_limit: '' });
      setShowForm(false);
      loadCreditCards();
      onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to create credit card');
      console.error('Error creating credit card:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount || 0));
  };

  const formatCardNumber = (cardNumber) => {
    // Format card number with spaces for readability
    return cardNumber.replace(/(.{4})/g, '$1 ').trim();
  };

  const getAvailableCredit = (card) => {
    const limit = parseFloat(card.credit_limit || 0);
    const balance = parseFloat(card.current_balance || 0);
    return limit - balance;
  };

  const getUtilizationPercentage = (card) => {
    const limit = parseFloat(card.credit_limit || 0);
    const balance = parseFloat(card.current_balance || 0);
    if (limit === 0) return 0;
    return Math.round((balance / limit) * 100);
  };

  const resetForm = () => {
    setFormData({ card_number: '', credit_limit: '' });
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
                Credit Cards for {customer.first_name} {customer.last_name}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Manage credit cards and credit limits
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary"
              disabled={loading}
            >
              {showForm ? 'Cancel' : '+ New Credit Card'}
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
            <h3 className="text-lg font-medium text-gray-100 mb-4">Create New Credit Card</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="card_number" className="block text-sm font-medium text-gray-100 mb-2">
                  Card Number *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="card_number"
                    value={formData.card_number}
                    onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                    className="input-field flex-1"
                    placeholder="Enter card number"
                    maxLength="16"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, card_number: generateCardNumber() })}
                    className="btn-secondary whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  16-digit card number (test cards only)
                </p>
              </div>
              <div>
                <label htmlFor="credit_limit" className="block text-sm font-medium text-gray-100 mb-2">
                  Credit Limit *
                </label>
                <input
                  type="number"
                  id="credit_limit"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter credit limit"
                  min="100"
                  step="100"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum credit limit: $100
                </p>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !formData.card_number.trim() || !formData.credit_limit || parseFloat(formData.credit_limit) < 100}
              >
                {loading ? 'Creating...' : 'Create Credit Card'}
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
            <div className="text-gray-400">Loading credit cards...</div>
          </div>
        )}

        <div className="grid gap-6">
          {creditCards.map((card) => (
            <div
              key={card.id}
              className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6 border border-gray-600 shadow-lg"
            >
              {/* Credit Card Design */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs text-gray-300 uppercase tracking-wide">Credit Card</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {customer.first_name} {customer.last_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-300 uppercase tracking-wide">Status</p>
                  <p className={`text-sm font-medium ${
                    card.is_active ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {card.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              {/* Card Number */}
              <div className="mb-6">
                <p className="text-xl font-mono text-white tracking-wider">
                  {formatCardNumber(card.card_number)}
                </p>
              </div>

              {/* Card Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-300 uppercase tracking-wide">Credit Limit</p>
                  <p className="text-lg font-semibold text-white">
                    {formatAmount(card.credit_limit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-300 uppercase tracking-wide">Current Balance</p>
                  <p className="text-lg font-semibold text-white">
                    {formatAmount(card.current_balance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-300 uppercase tracking-wide">Available Credit</p>
                  <p className="text-lg font-semibold text-green-400">
                    {formatAmount(getAvailableCredit(card))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-300 uppercase tracking-wide">Utilization</p>
                  <p className={`text-lg font-semibold ${
                    getUtilizationPercentage(card) > 80 ? 'text-red-400' : 
                    getUtilizationPercentage(card) > 50 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {getUtilizationPercentage(card)}%
                  </p>
                </div>
              </div>

              {/* Utilization Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getUtilizationPercentage(card) > 80 ? 'bg-red-500' : 
                      getUtilizationPercentage(card) > 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(getUtilizationPercentage(card), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Credit utilization: {getUtilizationPercentage(card)}% of {formatAmount(card.credit_limit)}
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-gray-600 flex justify-between items-center">
                <p className="text-xs text-gray-400">
                  Issued on {new Date(card.created_at).toLocaleDateString()}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💎</span>
                  <span className="text-sm text-gray-300 font-medium">Premium Card</span>
                </div>
              </div>
            </div>
          ))}

          {!loading && creditCards.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💳</div>
              <div className="text-gray-400">No credit cards found</div>
              <p className="text-sm text-gray-500 mt-2">
                Create the first credit card for {customer.first_name}
              </p>
            </div>
          )}
        </div>

        {creditCards.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Cards</p>
                <p className="text-lg font-semibold text-gray-100">{creditCards.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Credit Limit</p>
                <p className="text-lg font-semibold text-banking-secondary">
                  {formatAmount(creditCards.reduce((sum, card) => sum + parseFloat(card.credit_limit || 0), 0))}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Balance</p>
                <p className="text-lg font-semibold text-gray-100">
                  {formatAmount(creditCards.reduce((sum, card) => sum + parseFloat(card.current_balance || 0), 0))}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Available Credit</p>
                <p className="text-lg font-semibold text-banking-success">
                  {formatAmount(creditCards.reduce((sum, card) => sum + getAvailableCredit(card), 0))}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditCardManager;