import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ShieldCheck, Mail, Lock, ShoppingBag, UserCheck, ShieldAlert } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      // Direct Cashiers straight to POS; Admins to Dashboard
      navigate('/pos');
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-700/30 overflow-hidden">
        {/* Brand Header */}
        <div className="bg-slate-900 p-6 text-center text-white relative">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 mx-auto flex items-center justify-center font-black text-2xl text-white shadow-lg mb-3">
            S
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">SmartMart POS</h1>
          <p className="text-xs text-slate-400 mt-1">Supermarket Billing & Inventory System</p>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="user@smartmart.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-bold shadow-md"
              icon={<ShieldCheck className="w-5 h-5" />}
            >
              Sign In to SmartMart
            </Button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="pt-4 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block text-center mb-2">
              Instant 1-Click Demo Login
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin@smartmart.com')}
                className="p-2 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group"
              >
                <span className="text-[10px] font-bold text-emerald-700 block">Admin</span>
                <span className="text-[9px] text-gray-500 block truncate">admin@smartmart.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('cashier@smartmart.com')}
                className="p-2 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group"
              >
                <span className="text-[10px] font-bold text-emerald-700 block">Cashier</span>
                <span className="text-[9px] text-gray-500 block truncate">cashier@smartmart.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('inventory@smartmart.com')}
                className="p-2 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group"
              >
                <span className="text-[10px] font-bold text-emerald-700 block">Inventory</span>
                <span className="text-[9px] text-gray-500 block truncate">inventory@smartmart.com</span>
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2 font-mono">
              Default password for all demo accounts: <span className="font-bold text-gray-600">Password@123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
