import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Supplier } from '../types';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Truck, Plus, Phone, Mail, MapPin } from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState('30');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data.data);
    } catch {
      // ignore
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSaving(true);
    try {
      await api.post('/suppliers', {
        name: name.trim(),
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        gstin: gstin.trim() || undefined,
        paymentTermsDays: parseInt(paymentTermsDays, 10) || 30,
      });

      setIsModalOpen(false);
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setGstin('');
      fetchSuppliers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add supplier');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Suppliers Directory</h1>
          <p className="text-xs text-gray-500">Manage FMCG vendors, purchase contacts, and payment credit terms</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
          Add Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <Card key={s.id} className="p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{s.name}</h3>
                  {s.contactPerson && (
                    <p className="text-xs text-emerald-700 font-semibold">Contact: {s.contactPerson}</p>
                  )}
                </div>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {s.paymentTermsDays}d terms
                </span>
              </div>

              <div className="text-xs text-gray-600 space-y-1 pt-2 border-t">
                <p className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {s.phone}
                </p>
                {s.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {s.email}
                  </p>
                )}
                {s.address && (
                  <p className="flex items-start gap-1.5 text-[11px] text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                    {s.address}
                  </p>
                )}
                {s.gstin && (
                  <p className="text-[10px] text-gray-400 font-mono">GSTIN: {s.gstin}</p>
                )}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t flex justify-between items-center text-[11px] text-gray-500">
              <span>{s._count?.products || 0} products supplied</span>
              <span>{s._count?.purchases || 0} purchase orders</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Supplier Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register FMCG Supplier">
        <form onSubmit={handleCreateSupplier} className="space-y-3">
          <Input label="Supplier Business Name *" placeholder="e.g. Apex Wholesale Ltd" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Contact Person" placeholder="e.g. Suresh Menon" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
          <Input label="Phone Number *" placeholder="+91 94441 23456" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <Input label="Email Address" type="email" placeholder="orders@supplier.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Warehouse / Dispatch Address" placeholder="Plot 45, Logistics Park" value={address} onChange={(e) => setAddress(e.target.value)} />
          <Input label="GSTIN Number" placeholder="29ABCDE1234F1Z5" value={gstin} onChange={(e) => setGstin(e.target.value)} />
          <Input label="Credit Payment Terms (Days)" type="number" value={paymentTermsDays} onChange={(e) => setPaymentTermsDays(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>Save Supplier</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
