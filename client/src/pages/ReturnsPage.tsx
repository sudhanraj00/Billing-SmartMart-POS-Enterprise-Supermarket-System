import React, { useState } from 'react';
import { api } from '../services/api';
import { Invoice } from '../types';
import { formatCurrency } from '../hooks/useCurrency';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { RotateCcw, Search, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const ReturnsPage: React.FC = () => {
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [foundInvoice, setFoundInvoice] = useState<Invoice | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'CREDIT_NOTE'>('CASH');
  const [managerPin, setManagerPin] = useState('');
  const [itemSelections, setItemSelections] = useState<Record<string, { qty: number; condition: 'RESTOCKABLE' | 'DAMAGED' }>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [processSuccess, setProcessSuccess] = useState<any>(null);
  const [processError, setProcessError] = useState('');

  const handleSearchInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setFoundInvoice(null);
    setProcessSuccess(null);

    const q = invoiceQuery.trim();
    if (!q) return;

    setIsLoading(true);
    try {
      const res = await api.get(`/invoices?search=${encodeURIComponent(q)}&limit=1`);
      const invs = res.data.data.invoices;
      if (invs.length === 0) {
        setSearchError(`No invoice found for query '${q}'`);
        return;
      }

      // Fetch full details
      const detailRes = await api.get(`/invoices/${invs[0].id}`);
      const inv = detailRes.data.data.invoice;
      setFoundInvoice(inv);

      // Initialize default return selections
      const initialMap: Record<string, { qty: number; condition: 'RESTOCKABLE' | 'DAMAGED' }> = {};
      inv.items.forEach((item: any) => {
        initialMap[item.id] = { qty: 0, condition: 'RESTOCKABLE' };
      });
      setItemSelections(initialMap);
    } catch {
      setSearchError('Error searching invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessError('');
    setProcessSuccess(null);

    if (!foundInvoice) return;
    if (!returnReason.trim()) {
      setProcessError('Return reason is required');
      return;
    }

    const itemsToReturn = Object.entries(itemSelections)
      .filter(([_, val]) => val.qty > 0)
      .map(([invoiceItemId, val]) => {
        const invItem = foundInvoice.items.find((i) => i.id === invoiceItemId);
        return {
          invoiceItemId,
          productId: invItem!.productId,
          quantity: val.qty,
          condition: val.condition,
        };
      });

    if (itemsToReturn.length === 0) {
      setProcessError('Please specify quantity > 0 for at least one item to return');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/returns', {
        invoiceId: foundInvoice.id,
        reason: returnReason.trim(),
        refundMethod,
        managerPin: managerPin.trim() || undefined,
        items: itemsToReturn,
      });

      setProcessSuccess(res.data.data);
      setFoundInvoice(null);
      setReturnReason('');
      setManagerPin('');
    } catch (err: any) {
      setProcessError(err.response?.data?.message || 'Failed to process return');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Sales Returns & Refunds</h1>
        <p className="text-xs text-gray-500">Lookup original invoice, process partial or full item returns, and restock goods</p>
      </div>

      {/* Invoice Search Box */}
      <Card>
        <CardContent>
          <form onSubmit={handleSearchInvoice} className="flex gap-2">
            <Input
              placeholder="Search original invoice number (e.g. SM-20261005-0001) or customer phone..."
              value={invoiceQuery}
              onChange={(e) => setInvoiceQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              autoFocus
            />
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Lookup
            </Button>
          </form>

          {searchError && (
            <p className="mt-2 text-xs font-semibold text-rose-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {searchError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Return Success Banner */}
      {processSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Return Processed Successfully!
          </div>
          <p>
            Credit Note / Return Number: <span className="font-mono font-bold">{processSuccess.returnNumber}</span>
          </p>
          <p>
            Total Refund Amount: <span className="font-bold">{formatCurrency(processSuccess.refundAmount)}</span> via {processSuccess.refundMethod}
          </p>
          <p className="text-emerald-700">Restockable items have been automatically restored to inventory.</p>
        </div>
      )}

      {/* Found Invoice Item Selection Form */}
      {foundInvoice && (
        <form onSubmit={handleProcessReturn} className="space-y-4">
          <Card>
            <CardHeader
              title={`Original Invoice: ${foundInvoice.invoiceNumber}`}
              subtitle={`Billed on ${new Date(foundInvoice.invoiceDate).toLocaleString()} &bull; Total: ${formatCurrency(foundInvoice.grandTotal)}`}
              action={<Badge variant={foundInvoice.status === 'COMPLETED' ? 'success' : 'warning'}>{foundInvoice.status}</Badge>}
            />
            <CardContent className="space-y-4">
              {processError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg">
                  {processError}
                </div>
              )}

              {/* Items Table */}
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b text-[11px] font-bold text-gray-500 uppercase">
                    <tr>
                      <th className="p-3">Item Name</th>
                      <th className="p-3 text-right">Sold Qty</th>
                      <th className="p-3 text-right">Unit Rate</th>
                      <th className="p-3 text-center">Return Qty</th>
                      <th className="p-3">Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {foundInvoice.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <span className="font-bold text-gray-900 block">{item.productName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{item.sku}</span>
                        </td>
                        <td className="p-3 text-right font-medium text-gray-700">{item.quantity}</td>
                        <td className="p-3 text-right font-medium text-gray-700">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={itemSelections[item.id]?.qty || 0}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setItemSelections({
                                ...itemSelections,
                                [item.id]: {
                                  qty: Math.min(item.quantity, Math.max(0, val)),
                                  condition: itemSelections[item.id]?.condition || 'RESTOCKABLE',
                                },
                              });
                            }}
                            className="w-16 p-1 border rounded text-center text-xs font-bold"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={itemSelections[item.id]?.condition || 'RESTOCKABLE'}
                            onChange={(e) => {
                              setItemSelections({
                                ...itemSelections,
                                [item.id]: {
                                  qty: itemSelections[item.id]?.qty || 0,
                                  condition: e.target.value as any,
                                },
                              });
                            }}
                            className="p-1 border rounded text-xs bg-white"
                          >
                            <option value="RESTOCKABLE">Good / Restock</option>
                            <option value="DAMAGED">Damaged / Write-off</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Refund Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Reason for Return *"
                  placeholder="e.g. Customer purchased wrong brand / duplicate purchase"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  required
                />

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Refund Tender Method
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="w-full p-2 border rounded-lg text-xs bg-white"
                  >
                    <option value="CASH">Cash Refund</option>
                    <option value="UPI">UPI Reverse Transfer</option>
                    <option value="CARD">Card Reversal</option>
                    <option value="CREDIT_NOTE">Store Credit Note</option>
                  </select>
                </div>
              </div>

              <Input
                label="Manager Authorization PIN (if required)"
                type="password"
                maxLength={6}
                placeholder="Enter 4-digit PIN"
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" type="button" onClick={() => setFoundInvoice(null)}>
                  Cancel
                </Button>
                <Button variant="danger" type="submit" isLoading={isLoading} icon={<RotateCcw className="w-4 h-4" />}>
                  Process Return & Restock
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
};
