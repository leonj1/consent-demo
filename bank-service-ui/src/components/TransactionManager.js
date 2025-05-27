import React, { useState, useEffect } from 'react';
import { fetchAccountTransactions, depositFunds, withdrawFunds } from '../services/api';

const TransactionManager = ({ account, refreshTrigger, onRefresh }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [depositData, setDepositData] = useState({
    amount: '',
    description: ''
  });
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    description: ''
  });

  useEffect(() => {
    if (account) {
      loadTransactions();
    }
  }, [account, refreshTrigger]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAccountTransactions(account.id);
      setTransactions(data);
    } catch (err) {
      setError('Failed to load transactions');
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositData.amount || parseFloat(depositData.amount) <= 0) return;

    try {
      setLoading(true);
      await depositFunds(account.id, {
        amount: parseFloat(depositData.amount),
        description: depositData.description || 'Deposit'
      });
      
      setDepositData({ amount: '', description: '' });
      setShowDepositForm(false);
      loadTransactions();
      onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to deposit funds');
      console.error('Error depositing funds:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawData.amount || parseFloat(withdrawData.amount) <= 0) return;

    try {
      setLoading(true);
      await withdrawFunds(account.id, {
        amount: parseFloat(withdrawData.amount),
        description: withdrawData.description || 'Withdrawal'
      });
      
      setWithdrawData({ amount: '', description: '' });
      setShowWithdrawForm(false);
      loadTransactions();
      onRefresh();
    } catch (err) {
      setError(err.message || 'Failed to withdraw funds');
      console.error('Error withdrawing funds:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const resetForms = () => {
    setDepositData({ amount: '', description: '' });
    setWithdrawData({ amount: '', description: '' });
    setShowDepositForm(false);
    setShowWithdrawForm(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Account Summary */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-100">
                Account {account.account_number}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Current Balance: <span className={`font-semibold ${
                  parseFloat(account.balance) >= 0 ? 'balance-positive' : 'balance-negative'
                }`}>
                  {formatAmount(account.balance)}
                </span>
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  resetForms();
                  setShowDepositForm(true);
                }}
                className="btn-success"
                disabled={loading}
              >
                💰 Deposit
              </button>
              <button
                onClick={() => {
                  resetForms();
                  setShowWithdrawForm(true);
                }}
                className="btn-danger"
                disabled={loading}
              >
                💸 Withdraw
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Deposit Form */}
        {showDepositForm && (
          <form onSubmit={handleDeposit} className="mb-6 p-6 bg-green-900 bg-opacity-20 border border-green-600 rounded-lg">
            <h3 className="text-lg font-medium text-green-400 mb-4">💰 Deposit Funds</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deposit_amount" className="block text-sm font-medium text-gray-100 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  id="deposit_amount"
                  value={depositData.amount}
                  onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
                  className="input-field w-full"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label htmlFor="deposit_description" className="block text-sm font-medium text-gray-100 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  id="deposit_description"
                  value={depositData.description}
                  onChange={(e) => setDepositData({ ...depositData, description: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter description"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                type="submit"
                className="btn-success"
                disabled={loading || !depositData.amount || parseFloat(depositData.amount) <= 0}
              >
                {loading ? 'Processing...' : 'Deposit Funds'}
              </button>
              <button
                type="button"
                onClick={resetForms}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Withdraw Form */}
        {showWithdrawForm && (
          <form onSubmit={handleWithdraw} className="mb-6 p-6 bg-red-900 bg-opacity-20 border border-red-600 rounded-lg">
            <h3 className="text-lg font-medium text-red-400 mb-4">💸 Withdraw Funds</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="withdraw_amount" className="block text-sm font-medium text-gray-100 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  id="withdraw_amount"
                  value={withdrawData.amount}
                  onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                  className="input-field w-full"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  max={parseFloat(account.balance)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available balance: {formatAmount(account.balance)}
                </p>
              </div>
              <div>
                <label htmlFor="withdraw_description" className="block text-sm font-medium text-gray-100 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  id="withdraw_description"
                  value={withdrawData.description}
                  onChange={(e) => setWithdrawData({ ...withdrawData, description: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter description"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                type="submit"
                className="btn-danger"
                disabled={loading || !withdrawData.amount || parseFloat(withdrawData.amount) <= 0 || parseFloat(withdrawData.amount) > parseFloat(account.balance)}
              >
                {loading ? 'Processing...' : 'Withdraw Funds'}
              </button>
              <button
                type="button"
                onClick={resetForms}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-100">Transaction History</h3>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading transactions...</div>
          </div>
        )}

        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`text-2xl ${
                    transaction.transaction_type === 'deposit' ? 'transaction-deposit' : 'transaction-withdrawal'
                  }`}>
                    {transaction.transaction_type === 'deposit' ? '💰' : '💸'}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-100 capitalize">
                      {transaction.transaction_type}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {transaction.description || `${transaction.transaction_type} transaction`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${
                    transaction.transaction_type === 'deposit' ? 'transaction-deposit' : 'transaction-withdrawal'
                  }`}>
                    {transaction.transaction_type === 'deposit' ? '+' : '-'}{formatAmount(transaction.amount)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {!loading && transactions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <div className="text-gray-400">No transactions found</div>
              <p className="text-sm text-gray-500 mt-2">
                Start by making your first deposit or withdrawal
              </p>
            </div>
          )}
        </div>

        {transactions.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Transactions</p>
                <p className="text-lg font-semibold text-gray-100">{transactions.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Deposits</p>
                <p className="text-lg font-semibold transaction-deposit">
                  {formatAmount(
                    transactions
                      .filter(t => t.transaction_type === 'deposit')
                      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Withdrawals</p>
                <p className="text-lg font-semibold transaction-withdrawal">
                  {formatAmount(
                    transactions
                      .filter(t => t.transaction_type === 'withdrawal')
                      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionManager;