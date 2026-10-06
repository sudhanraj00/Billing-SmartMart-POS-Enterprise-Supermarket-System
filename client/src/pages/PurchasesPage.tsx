import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Supplier, Product } from '../types';
import { formatCurrency } from '../hooks/useCurrency';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ClipboardList, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const PurchasesPage: React.FC = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New purchase entry form state
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; quantity: number; unitCost: number; taxRate: number }>>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPurchases();
    fetchSuppliersAndProducts();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await api.get('/inventory/purchases');
      setPurchases(res.data.data);
    } catch {
      // ignore
    }
  };

  const fetchSuppliersAndProducts = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/products?limit=100'),
      ]);
      setSuppliers(supRes.data.data);
      setProducts(prodRes.data.data.products);
      if (supRes.data.data.length > 0) setSupplierId(supRes.data.data[0].id);
    } catch {
      // ignore
    }
  };

  const addItemRow = () => {
    if (products.length === 0) return;
    const first = products[0];
    setItems([
      ...items,
      { productId: first.id, quantity: 10, unitCost: first.costPrice, taxRate: first.taxRate },
    ]);
  };

  const removeItemRow = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx: number, field: string, value: any) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    if (field === 'productId') {
      const p = products.find((prod) => prod.id === value);
      if (p) {
        updated[idx].unitCost = p.costPrice;
        updated[idx].taxRate = p.taxRate;
      }
    }
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0) {
      alert('Please select supplier and add at least one line item');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/inventory/purchases', {
        supplierId,
        invoiceNumber: invoiceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        items,
      });
      setIsModalOpen(false);
      setItems([]);
      setInvoiceNumber('');
      setNotes('');
      fetchPurchases();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record purchase entry');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Supplier Purchase Entries</h1>
          <p className="text-xs text-gray-500">Record inward stock deliveries from vendors to atomically increment inventory</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            if (items.length === 0 && products.length > 0) addItemRow();
            setIsModalOpen(true);
          }}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          New Stock-In Entry
        </Button>
      </div>

      <Card>
        <CardHeader title="Purchase Inward History" subtitle="Deliveries and purchase order records" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b text-[11px] font-bold text-gray-500 uppercase">
              <tr>
                <th className="p-3">PO Number</th>
                <th className="p-3">Vendor Supplier</th>
                <th className="p-3">Vendor Bill #</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">Items Count</th>
                <th className="p-3 text-right">Grand Total</th>
                <th className="p-3 text-center">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No purchase inward entries recorded yet.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-gray-900">{p.purchaseNumber}</td>
                    <td className="p-3 font-semibold text-gray-800">{p.supplier?.name}</td>
                    <td className="p-3 font-mono text-gray-500">{p.invoiceNumber || '—'}</td>
                    <td className="p-3 text-gray-500">{new Date(p.invoiceDate).toLocaleDateString()}</td>
                    <td className="p-3 text-center font-bold">{p.items?.length || 0}</td>
                    <td className="p-3 text-right font-black text-gray-900">{formatCurrency(p.grandTotal)}</td>
                    <td className="p-3 text-center">
                      <Badge variant="success">{p.paymentStatus}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Stock-In Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Supplier Stock-In Delivery"
        description="Line items entered here will directly increment warehouse inventory and update cost prices"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full p-2 border rounded-lg text-xs bg-white focus:outline-none"
                required
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Supplier Invoice / Bill #"
              placeholder="e.g. INV-2026-9921"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>

          {/* Items Section */}
          <div className="border rounded-xl p-3 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">Delivered Stock Items</span>
              <Button type="button" variant="outline" size="sm" onClick={addItemRow} icon={<Plus className="w-3 h-3" />}>
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border text-xs">
                  <select
                    value={row.productId}
                    onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                    className="flex-1 p-1 border rounded text-xs bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={row.quantity}
                    onChange={(e) => updateItemRow(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-16 p-1 border rounded text-center text-xs"
                    title="Quantity"
                  />

                  <input
                    type="number"
                    step="any"
                    placeholder="Cost"
                    value={row.unitCost}
                    onChange={(e) => updateItemRow(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                    className="w-20 p-1 border rounded text-right text-xs"
                    title="Unit Cost Price"
                  />

                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="p-1 text-gray-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Input
            label="Inward Delivery Notes (Optional)"
            placeholder="e.g. Received in good condition via truck KA-01-AB-1234"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving} icon={<CheckCircle2 className="w-4 h-4" />}>
              Save Delivery & Increment Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
