import React, { useState } from 'react';
import CustomerManager from './components/CustomerManager';
import AccountManager from './components/AccountManager';
import TransactionManager from './components/TransactionManager';
import CreditCardManager from './components/CreditCardManager';

function App() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [activeTab, setActiveTab] = useState('customers');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSelectedAccount(null);
  };

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setActiveTab('transactions');
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const tabs = [
    { id: 'customers', label: '👥 Customers', icon: '👥' },
    { id: 'accounts', label: '💳 Accounts', icon: '💳', disabled: !selectedCustomer },
    { id: 'transactions', label: '💰 Transactions', icon: '💰', disabled: !selectedAccount },
    { id: 'credit-cards', label: '💎 Credit Cards', icon: '💎', disabled: !selectedCustomer },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🏦</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-100">
                  Banking Management System
                </h1>
                <p className="text-sm text-gray-400">
                  Manage customers, accounts, and transactions
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {selectedCustomer && (
                <div className="text-right">
                  <p className="text-sm text-gray-400">Selected Customer</p>
                  <p className="font-medium text-gray-100">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </p>
                </div>
              )}
              {selectedAccount && (
                <div className="text-right">
                  <p className="text-sm text-gray-400">Selected Account</p>
                  <p className="font-medium text-gray-100">
                    {selectedAccount.account_number}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-banking-primary text-banking-secondary'
                    : tab.disabled
                    ? 'border-transparent text-gray-500 cursor-not-allowed'
                    : 'border-transparent text-gray-300 hover:text-gray-100 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'customers' && (
          <CustomerManager
            onCustomerSelect={handleCustomerSelect}
            selectedCustomer={selectedCustomer}
            refreshTrigger={refreshTrigger}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'accounts' && selectedCustomer && (
          <AccountManager
            customer={selectedCustomer}
            onAccountSelect={handleAccountSelect}
            selectedAccount={selectedAccount}
            refreshTrigger={refreshTrigger}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'transactions' && selectedAccount && (
          <TransactionManager
            account={selectedAccount}
            refreshTrigger={refreshTrigger}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'credit-cards' && selectedCustomer && (
          <CreditCardManager
            customer={selectedCustomer}
            refreshTrigger={refreshTrigger}
            onRefresh={handleRefresh}
          />
        )}
      </main>

      <footer className="bg-gray-800 border-t border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 Banking Management System. Built with React & Tailwind CSS.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;