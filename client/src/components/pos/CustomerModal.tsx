import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Customer } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../hooks/useCurrency';
import { Search, UserPlus, Phone, UserCheck, Check } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer | null) => void;
  selectedCustomerId?: string;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  selectedCustomerId,
}) => {
  const [activeTab, setActiveTab] = useState<'SEARCH' | 'CREATE'>('SEARCH');
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New customer form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState('5000');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCustomers(searchQuery);
    }
  }, [isOpen]);

  const loadCustomers = async (query = '') => {
    setIsLoading(true);
    try {
      const res = await api.get(`/customers?q=${encodeURIComponent(query)}`);
      setCustomers(res.data.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers(searchQuery);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!newName.trim() || !newPhone.trim()) {
      setCreateError('Name and phone number are required');
      return;
    }

    setIsCreating(true);
    try {
      const res = await api.post('/customers', {
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || undefined,
        creditLimit: parseFloat(newCreditLimit) || 5000,
      });

      const created = res.data.data;
      onSelectCustomer(created);
      onClose();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attach Customer to Sale"
      description="Search existing customer or register a new customer"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('SEARCH')}
            className={`pb-2 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'SEARCH'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Search Customer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CREATE')}
            className={`pb-2 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'CREATE'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Quick Add New
          </button>
        </div>

        {activeTab === 'SEARCH' ? (
          <div className="space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <Input
                placeholder="Search by phone number or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
                autoFocus
              />
              <Button type="submit" variant="primary" size="md">
                Search
              </Button>
            </form>

            {/* Customer List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
              {isLoading ? (
                <div className="p-4 text-center text-xs text-gray-400">Loading customers...</div>
              ) : customers.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">
                  No customers found. Switch to "Quick Add New" to register.
                </div>
              ) : (
                customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectCustomer(c);
                      onClose();
                    }}
                    className={`p-3 flex items-center justify-between hover:bg-emerald-50/50 cursor-pointer transition-colors text-xs ${
                      selectedCustomerId === c.id ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                        {c.name}
                        {selectedCustomerId === c.id && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                        )}
                      </h4>
                      <p className="text-gray-500 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {c.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block">Outstanding</span>
                      <span
                        className={`font-extrabold ${
                          c.outstandingBalance > 0 ? 'text-amber-600' : 'text-gray-700'
                        }`}
                      >
                        {formatCurrency(c.outstandingBalance)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  onSelectCustomer(null);
                  onClose();
                }}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Clear Customer (Set Walk-in)
              </button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateCustomer} className="space-y-3">
            {createError && (
              <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold">
                {createError}
              </div>
            )}
            <Input
              label="Full Name"
              placeholder="e.g. Ramesh Kumar"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Mobile Number (10 digits)"
              placeholder="e.g. 9876543210"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              required
            />
            <Input
              label="Email (Optional)"
              type="email"
              placeholder="e.g. ramesh@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <Input
              label="Credit Limit (₹)"
              type="number"
              value={newCreditLimit}
              onChange={(e) => setNewCreditLimit(e.target.value)}
              helperText="Allowed store credit limit for Pay Later"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setActiveTab('SEARCH')}>
                Back to Search
              </Button>
              <Button variant="primary" type="submit" isLoading={isCreating} icon={<UserCheck className="w-4 h-4" />}>
                Register & Attach
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
