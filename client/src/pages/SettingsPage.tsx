import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Store } from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [store, setStore] = useState<Store | null>(null);
  const [taxSettings, setTaxSettings] = useState<any[]>([]);

  // Form State
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [pricingMode, setPricingMode] = useState<'INCLUSIVE' | 'EXCLUSIVE'>('INCLUSIVE');
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [maxCashierDiscount, setMaxCashierDiscount] = useState('10');
  const [receiptHeader, setReceiptHeader] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/settings');
      const s = res.data.data.store;
      setStore(s);
      setTaxSettings(res.data.data.taxSettings);

      if (s) {
        setName(s.name);
        setLegalName(s.legalName || '');
        setAddress(s.address);
        setCity(s.city);
        setState(s.state);
        setPincode(s.pincode);
        setPhone(s.phone);
        setEmail(s.email);
        setGstin(s.gstin || '');
        setPricingMode(s.pricingMode);
        setAllowNegativeStock(s.allowNegativeStock);
        setMaxCashierDiscount(s.maxCashierDiscount.toString());
        setReceiptHeader(s.receiptHeader || '');
        setReceiptFooter(s.receiptFooter || '');
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await api.put('/settings/store', {
        name,
        legalName: legalName || undefined,
        address,
        city,
        state,
        pincode,
        phone,
        email,
        gstin: gstin || undefined,
        pricingMode,
        allowNegativeStock,
        maxCashierDiscount: parseFloat(maxCashierDiscount) || 10,
        receiptHeader: receiptHeader || undefined,
        receiptFooter: receiptFooter || undefined,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update store settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !store) {
    return <div className="p-8 text-center text-xs text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Store & POS System Settings</h1>
        <p className="text-xs text-gray-500">Configure supermarket identity, tax pricing modes, receipt header/footers, and cashier rules</p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Store configuration updated successfully!
        </div>
      )}

      {/* Tax disclaimer alert */}
      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Software Configuration Notice: </span>
          Tax rules, CGST/SGST/IGST breakdown, and pricing modes provided in this software are configurable calculation tools and do not constitute legal or tax advice. Consult with your registered chartered accountant or tax advisor for compliance in your state.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Store Profile Card */}
        <Card>
          <CardHeader title="Supermarket Profile & Invoicing Details" />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Store Display Name *" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="Legal Company Name" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
            </div>

            <Input label="Store Physical Address *" value={address} onChange={(e) => setAddress(e.target.value)} required />

            <div className="grid grid-cols-3 gap-4">
              <Input label="City *" value={city} onChange={(e) => setCity(e.target.value)} required />
              <Input label="State *" value={state} onChange={(e) => setState(e.target.value)} required />
              <Input label="Postal Code / PIN *" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Store Contact Phone *" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              <Input label="Store Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="GSTIN / Tax ID Number" value={gstin} onChange={(e) => setGstin(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* POS Operational Rules Card */}
        <Card>
          <CardHeader title="POS Business Rules & Limits" />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Pricing Mode
                </label>
                <select
                  value={pricingMode}
                  onChange={(e) => setPricingMode(e.target.value as any)}
                  className="w-full p-2 border rounded-lg text-xs bg-white focus:outline-none"
                >
                  <option value="INCLUSIVE">Tax Inclusive (Prices include GST)</option>
                  <option value="EXCLUSIVE">Tax Exclusive (GST added on top)</option>
                </select>
              </div>

              <Input
                label="Cashier Discount Limit (%)"
                type="number"
                value={maxCashierDiscount}
                onChange={(e) => setMaxCashierDiscount(e.target.value)}
                helperText="Discounts above this % trigger Manager PIN"
              />

              <div className="flex flex-col justify-center">
                <span className="text-xs font-semibold text-gray-700 uppercase mb-2">Negative Stock Policy</span>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowNegativeStock}
                    onChange={(e) => setAllowNegativeStock(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  Allow billing when stock is zero
                </label>
              </div>
            </div>

            {/* Receipt Header & Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Thermal Receipt Header Note
                </label>
                <textarea
                  rows={3}
                  value={receiptHeader}
                  onChange={(e) => setReceiptHeader(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Thermal Receipt Footer Note
                </label>
                <textarea
                  rows={3}
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs focus:outline-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configured GST Tax Brackets Card */}
        <Card>
          <CardHeader title="Configured GST Tax Slabs" subtitle="Tax brackets registered in database" />
          <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            {taxSettings.map((t) => (
              <div key={t.id} className="p-3 bg-slate-50 border rounded-xl text-center">
                <span className="font-bold text-gray-900 block text-sm">{t.name}</span>
                <span className="text-gray-500 font-mono text-[11px] block">{t.code}</span>
                <span className="text-emerald-700 font-bold block mt-1">Rate: {t.rate}%</span>
                {t.cgstRate > 0 && (
                  <span className="text-[10px] text-gray-400 block">
                    (CGST {t.cgstRate}% + SGST {t.sgstRate}%)
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end pt-2">
          <Button variant="primary" size="lg" type="submit" isLoading={isSaving} icon={<Save className="w-5 h-5" />}>
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
