import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Invoice, Store } from '../types';
import { formatCurrency } from '../hooks/useCurrency';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ArrowLeft, Printer, ShieldAlert, CheckCircle, Ban } from 'lucide-react';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Void Modal State
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [managerPin, setManagerPin] = useState('');
  const [voidError, setVoidError] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const fetchInvoiceDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data.data.invoice);
      setStore(res.data.data.store);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleVoidInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoidError('');
    if (!voidReason.trim()) {
      setVoidError('Void reason is required');
      return;
    }

    setIsVoiding(true);
    try {
      await api.post(`/invoices/${id}/void`, {
        reason: voidReason.trim(),
        managerPin: managerPin.trim() || undefined,
      });
      setIsVoidModalOpen(false);
      fetchInvoiceDetails();
    } catch (err: any) {
      setVoidError(err.response?.data?.message || 'Failed to void invoice');
    } finally {
      setIsVoiding(false);
    }
  };

  if (isLoading || !invoice) {
    return (
      <div className="p-8 text-center text-xs text-gray-400">Loading invoice details...</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between no-print">
        <Button variant="outline" size="sm" onClick={() => navigate('/invoices')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back to Invoices
        </Button>
        <div className="flex items-center gap-2">
          {invoice.status !== 'VOIDED' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsVoidModalOpen(true)}
              icon={<Ban className="w-3.5 h-3.5" />}
            >
              Void Invoice
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={handlePrint} icon={<Printer className="w-3.5 h-3.5" />}>
            Print Thermal Receipt
          </Button>
        </div>
      </div>

      {invoice.status === 'VOIDED' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
          <div>
            <span className="font-bold block text-sm">This invoice has been VOIDED</span>
            <span className="text-gray-600 mt-0.5 block">
              Reason: {invoice.voidReason || 'Not specified'} &bull; Approved by: {invoice.voidApprovedBy?.fullName || 'Manager'}
            </span>
          </div>
          <Badge variant="danger">VOIDED</Badge>
        </div>
      )}

      {/* Printable Thermal Receipt Container */}
      <div className="printable-receipt bg-white p-6 rounded-2xl border border-gray-200 shadow-sm font-mono text-xs max-w-sm mx-auto space-y-3 text-gray-800">
        <div className="text-center pb-3 border-b border-dashed border-gray-400">
          <h2 className="text-base font-black uppercase text-black">{store?.name || 'SmartMart Supermarket'}</h2>
          <p className="text-[11px] text-gray-600">{store?.address}, {store?.city}</p>
          <p className="text-[11px] text-gray-600">GSTIN: {store?.gstin}</p>
        </div>

        <div className="text-[11px] space-y-1 pb-3 border-b border-dashed border-gray-400">
          <div className="flex justify-between font-bold">
            <span>Invoice: {invoice.invoiceNumber}</span>
            <span>{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier: {invoice.cashier?.fullName}</span>
            <span>{new Date(invoice.invoiceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {invoice.customerName && (
            <div className="flex justify-between font-medium">
              <span>Customer: {invoice.customerName}</span>
              <span>{invoice.customerPhone}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="py-2 border-b border-dashed border-gray-400 space-y-1.5">
          <div className="flex justify-between font-bold text-[10px] uppercase text-gray-600">
            <span className="w-1/2">Item</span>
            <span className="w-1/6 text-center">Qty</span>
            <span className="w-1/6 text-right">Rate</span>
            <span className="w-1/6 text-right">Amt</span>
          </div>
          {invoice.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-[11px]">
              <div className="w-1/2 font-semibold truncate">{item.productName}</div>
              <div className="w-1/6 text-center">{item.quantity}</div>
              <div className="w-1/6 text-right">{item.unitPrice.toFixed(2)}</div>
              <div className="w-1/6 text-right font-bold">{item.lineTotal.toFixed(2)}</div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="py-2 border-b border-dashed border-gray-400 text-xs space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.discountTotal > 0 && (
            <div className="flex justify-between text-rose-700">
              <span>Discount:</span>
              <span>-{formatCurrency(invoice.discountTotal)}</span>
            </div>
          )}
          {invoice.taxTotal > 0 && (
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>Included GST:</span>
              <span>{formatCurrency(invoice.taxTotal)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-sm pt-1 border-t border-dashed border-gray-400 text-black">
            <span>GRAND TOTAL:</span>
            <span>{formatCurrency(invoice.grandTotal)}</span>
          </div>
        </div>

        {/* Payments */}
        <div className="py-1 text-[11px] space-y-1">
          {invoice.payments?.map((p, idx) => (
            <div key={idx} className="flex justify-between">
              <span>Paid ({p.paymentMethod}):</span>
              <span>{formatCurrency(p.amount)}</span>
            </div>
          ))}
        </div>

        <div className="text-center pt-2 text-[10px] text-gray-500">
          <p className="font-bold text-black">{store?.receiptHeader}</p>
          <p className="mt-0.5">{store?.receiptFooter}</p>
        </div>
      </div>

      {/* Void Invoice Modal */}
      <Modal isOpen={isVoidModalOpen} onClose={() => setIsVoidModalOpen(false)} title="Void Completed Invoice">
        <form onSubmit={handleVoidInvoice} className="space-y-3">
          {voidError && (
            <div className="p-2.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg">
              {voidError}
            </div>
          )}
          <p className="text-xs text-rose-700 font-medium">
            Warning: Voiding an invoice will immediately restore all items to product inventory and record an audit log. This action cannot be undone.
          </p>
          <Input
            label="Reason for Voiding *"
            placeholder="e.g. Wrong items billed / customer transaction cancelled"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Manager Override PIN (if required)"
            type="password"
            maxLength={6}
            placeholder="Enter 4-digit PIN"
            value={managerPin}
            onChange={(e) => setManagerPin(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsVoidModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" isLoading={isVoiding}>
              Confirm & Void Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
