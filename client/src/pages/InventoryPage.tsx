import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, StockMovement } from '../types';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Boxes, AlertTriangle, Clock, Activity, Wrench, Search } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'LOW_STOCK' | 'EXPIRING' | 'MOVEMENTS'>('STOCK');
  const [stockList, setStockList] = useState<any[]>([]);
  const [lowStockList, setLowStockList] = useState<any[]>([]);
  const [expiringList, setExpiringList] = useState<any[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentQty, setAdjustmentQty] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('ADJUSTMENT_DAMAGE');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustError, setAdjustError] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    loadTabContent();
  }, [activeTab]);

  const loadTabContent = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'STOCK') {
        const res = await api.get(`/inventory/stock?q=${encodeURIComponent(search)}`);
        setStockList(res.data.data);
      } else if (activeTab === 'LOW_STOCK') {
        const res = await api.get('/inventory/low-stock');
        setLowStockList(res.data.data);
      } else if (activeTab === 'EXPIRING') {
        const res = await api.get('/inventory/expiring?days=30');
        setExpiringList(res.data.data);
      } else if (activeTab === 'MOVEMENTS') {
        const res = await api.get('/inventory/movements');
        setMovements(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError('');
    const qty = parseFloat(adjustmentQty);
    if (!selectedProductId || isNaN(qty) || qty === 0) {
      setAdjustError('Please select a product and enter a non-zero quantity change');
      return;
    }
    if (!adjustmentReason.trim()) {
      setAdjustError('Please provide a reason for the adjustment');
      return;
    }

    setIsAdjusting(true);
    try {
      await api.post('/inventory/adjust', {
        productId: selectedProductId,
        quantityChanged: qty,
        movementType: adjustmentType,
        reason: adjustmentReason.trim(),
      });
      setIsAdjustModalOpen(false);
      setSelectedProductId('');
      setAdjustmentQty('');
      setAdjustmentReason('');
      loadTabContent();
    } catch (err: any) {
      setAdjustError(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Inventory & Stock Ledger</h1>
          <p className="text-xs text-gray-500">Real-time stock balance, low-stock warnings, expiry alerts, and audit trail</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            if (stockList.length === 0) api.get('/inventory/stock').then((r) => setStockList(r.data.data));
            setIsAdjustModalOpen(true);
          }}
          icon={<Wrench className="w-3.5 h-3.5" />}
        >
          Manual Stock Adjustment
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {[
          { id: 'STOCK', label: 'Stock Balance', icon: <Boxes className="w-3.5 h-3.5" /> },
          { id: 'LOW_STOCK', label: 'Low Stock Alerts', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
          { id: 'EXPIRING', label: 'Expiring Soon (30d)', icon: <Clock className="w-3.5 h-3.5" /> },
          { id: 'MOVEMENTS', label: 'Stock Movement Ledger', icon: <Activity className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Current Stock */}
      {activeTab === 'STOCK' && (
        <Card>
          <div className="p-3 border-b flex items-center gap-2">
            <Input
              placeholder="Filter stock by name, barcode, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
            <Button variant="primary" size="md" onClick={() => loadTabContent()}>
              Filter
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-[11px] font-bold text-gray-500 uppercase">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3 font-mono">Barcode</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Unit</th>
                  <th className="p-3 text-center">Current Stock</th>
                  <th className="p-3 text-center">Reorder Threshold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stockList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-gray-900">{p.name}</td>
                    <td className="p-3 font-mono text-gray-500">{p.barcode}</td>
                    <td className="p-3 text-gray-600">{p.category?.name}</td>
                    <td className="p-3 text-center uppercase text-gray-500 text-[10px] font-bold">{p.unitType}</td>
                    <td className="p-3 text-center">
                      <Badge variant={p.currentStock <= p.minStockLevel ? 'warning' : 'success'}>
                        {p.currentStock}
                      </Badge>
                    </td>
                    <td className="p-3 text-center text-gray-500">{p.minStockLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Low Stock Alerts */}
      {activeTab === 'LOW_STOCK' && (
        <Card>
          <CardHeader title="Low Stock Warning List" subtitle="Items at or below configured reorder levels" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-[11px] font-bold text-gray-500 uppercase">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Available Stock</th>
                  <th className="p-3 text-center">Reorder Level</th>
                  <th className="p-3">Primary Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowStockList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-gray-900">{p.name}</td>
                    <td className="p-3 text-gray-600">{p.category?.name}</td>
                    <td className="p-3 text-center">
                      <Badge variant="danger">{p.currentStock} units</Badge>
                    </td>
                    <td className="p-3 text-center font-bold">{p.minStockLevel}</td>
                    <td className="p-3 text-gray-600">{p.supplier?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Expiring Soon */}
      {activeTab === 'EXPIRING' && (
        <Card>
          <CardHeader title="Expiring Soon Products" subtitle="Products reaching expiry within the next 30 days" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-[11px] font-bold text-gray-500 uppercase">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Current Stock</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expiringList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-gray-900">{p.name}</td>
                    <td className="p-3 text-gray-600">{p.category?.name}</td>
                    <td className="p-3 text-center font-bold">{p.currentStock}</td>
                    <td className="p-3 font-mono font-bold text-amber-700">
                      {new Date(p.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <Badge variant="warning">Expiring Soon</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 4: Stock Movement Ledger */}
      {activeTab === 'MOVEMENTS' && (
        <Card>
          <CardHeader title="Stock Movement Audit Ledger" subtitle="Immutable record of every inventory increase/decrease" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-[11px] font-bold text-gray-500 uppercase">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Product</th>
                  <th className="p-3 text-center">Previous</th>
                  <th className="p-3 text-center">Change</th>
                  <th className="p-3 text-center">New Balance</th>
                  <th className="p-3">Movement Type</th>
                  <th className="p-3">Reason / Ref</th>
                  <th className="p-3">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3 text-gray-500 text-[11px]">
                      {new Date(m.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-gray-900">{m.product?.name}</td>
                    <td className="p-3 text-center text-gray-500">{m.previousQuantity}</td>
                    <td className="p-3 text-center">
                      <span className={`font-black ${m.quantityChanged > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {m.quantityChanged > 0 ? `+${m.quantityChanged}` : m.quantityChanged}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-gray-900">{m.newQuantity}</td>
                    <td className="p-3">
                      <Badge variant="info" className="text-[10px]">{m.movementType}</Badge>
                    </td>
                    <td className="p-3 text-gray-600 truncate max-w-xs">{m.reason || '—'}</td>
                    <td className="p-3 text-gray-500">{m.user?.fullName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Manual Stock Adjustment Modal */}
      <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Manual Stock Adjustment">
        <form onSubmit={handleAdjustSubmit} className="space-y-3">
          {adjustError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg">
              {adjustError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Product *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:outline-none focus:ring-emerald-500"
              required
            >
              <option value="">Select a product...</option>
              {stockList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current Stock: {p.currentStock})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Quantity Changed (+ to add, - to subtract) *"
            type="number"
            step="any"
            placeholder="e.g. -5 for damaged, +10 for found stock"
            value={adjustmentQty}
            onChange={(e) => setAdjustmentQty(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Reason Category *</label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:outline-none"
            >
              <option value="ADJUSTMENT_DAMAGE">Damaged Goods / Breakage</option>
              <option value="ADJUSTMENT_EXPIRED">Expired Stock Disposal</option>
              <option value="ADJUSTMENT_WASTAGE">Wastage / Leakage</option>
              <option value="ADJUSTMENT_MANUAL">Physical Audit Discrepancy Correction</option>
            </select>
          </div>

          <Input
            label="Audit Notes / Explanation *"
            placeholder="e.g. 5 jars cracked during transport delivery"
            value={adjustmentReason}
            onChange={(e) => setAdjustmentReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" isLoading={isAdjusting}>
              Save Stock Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
