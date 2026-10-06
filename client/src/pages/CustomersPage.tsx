import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Customer } from '../types';
import { formatCurrency } from '../hooks/useCurrency';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Users, Plus, Phone, Search, DollarSign } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('5000');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    try {
      const res = await api.get(`/customers?q=${encodeURIComponent(search)}`);
      setCustomers(res.data.data);
    } catch {
      // ignore
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSaving(true);
    try {
      await api.post('/customers', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        creditLimit: parseFloat(creditLimit) || 5000,
      });

      setIsModalOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add customer');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Customer CRM & Credit Ledger</h1>
          <p className="text-xs text-gray-500">Track supermarket shoppers, loyalty mobile numbers, and store credit ledger</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
          Register Customer
        </Button>
      </div>

      <Card>
        <div className="p-3 border-b flex items-center gap-2">
          <Input
            placeholder="Search by customer name or mobile number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b text-[11px] font-bold text-gray-500 uppercase">
              <tr>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Mobile Phone</th>
                <th className="p-3">Email</th>
                <th className="p-3">Address</th>
                <th className="p-3 text-right">Credit Limit</th>
                <th className="p-3 text-right">Outstanding Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No customers found matching search query.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-gray-900">{c.name}</td>
                    <td className="p-3 font-mono text-gray-700">{c.phone}</td>
                    <td className="p-3 text-gray-500">{c.email || '—'}</td>
                    <td className="p-3 text-gray-500 max-w-xs truncate">{c.address || '—'}</td>
                    <td className="p-3 text-right text-gray-700 font-medium">{formatCurrency(c.creditLimit)}</td>
                    <td className="p-3 text-right">
                      <span
                        className={`font-black ${
                          c.outstandingBalance > 0 ? 'text-amber-600' : 'text-emerald-700'
                        }`}
                      >
                        {formatCurrency(c.outstandingBalance)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Customer Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Customer">
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          <Input label="Customer Full Name *" placeholder="e.g. Ramesh Kumar" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Phone Number (10 digits) *" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <Input label="Email Address" type="email" placeholder="customer@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Delivery / Billing Address" placeholder="Apartment / Street details" value={address} onChange={(e) => setAddress(e.target.value)} />
          <Input label="Store Credit Limit (₹)" type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>Save Customer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
