import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, RoleType } from '../types';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { UserCheck, Plus, Shield, UserX, Mail, Phone, Lock } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<RoleType>('CASHIER');
  const [managerPin, setManagerPin] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch {
      // ignore
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName || !email || !password) {
      setError('Full name, email, and password are required');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/users', {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        role,
        managerPin: managerPin.trim() || undefined,
      });

      setIsModalOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setManagerPin('');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this user account?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to deactivate user');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Staff & Role Management</h1>
          <p className="text-xs text-gray-500">Configure supermarket cashiers, inventory managers, administrators, and manager PINs</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
          Add Staff User
        </Button>
      </div>

      <Card>
        <CardHeader title="Supermarket Staff Directory" subtitle="Active team members and assigned authorization roles" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b text-[11px] font-bold text-gray-500 uppercase">
              <tr>
                <th className="p-3">Staff Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Assigned Role</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-gray-900">{u.fullName}</td>
                  <td className="p-3 text-gray-600 font-mono">{u.email}</td>
                  <td className="p-3 text-gray-500">{u.phone || '—'}</td>
                  <td className="p-3">
                    <Badge
                      variant={
                        u.role === 'ADMIN'
                          ? 'danger'
                          : u.role === 'INVENTORY_MANAGER'
                          ? 'info'
                          : 'success'
                      }
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant={u.isActive ? 'success' : 'neutral'}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    {u.isActive && u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleDeactivate(u.id)}
                        className="text-xs font-semibold text-rose-600 hover:underline"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Staff Member">
        <form onSubmit={handleCreateUser} className="space-y-3">
          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg">
              {error}
            </div>
          )}

          <Input label="Full Name *" placeholder="e.g. Suresh Kumar" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input label="Email Address *" type="email" placeholder="suresh@smartmart.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password *" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input label="Mobile Phone" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as RoleType)}
              className="w-full p-2 border rounded-lg text-xs bg-white focus:outline-none"
            >
              <option value="CASHIER">Cashier (POS Checkout only)</option>
              <option value="INVENTORY_MANAGER">Inventory Manager (Stock & Catalog only)</option>
              <option value="ADMIN">Admin / Owner (Full System Access)</option>
            </select>
          </div>

          {role === 'ADMIN' && (
            <Input
              label="Manager Override PIN (4-6 digits)"
              type="password"
              maxLength={6}
              placeholder="e.g. 1234"
              value={managerPin}
              onChange={(e) => setManagerPin(e.target.value)}
              helperText="PIN used to authorize cashier discount overrides, refunds, and voids"
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>Create Staff User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
