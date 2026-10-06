import React, { useState } from 'react';
import { Invoice, Store } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../hooks/useCurrency';
import { Printer, FileText, PlusCircle, CheckCircle, Mail, Download } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  store: Store | null;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  invoice,
  store,
  onNewSale,
}) => {
  const [viewMode, setViewMode] = useState<'THERMAL' | 'A4'>('THERMAL');
  const [emailStatus, setEmailStatus] = useState<string>('');

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleEmailReceipt = () => {
    setEmailStatus('Receipt sent to customer email placeholder successfully!');
    setTimeout(() => setEmailStatus(''), 4000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sale Completed Successfully"
      description={`Invoice: ${invoice.invoiceNumber}`}
      maxWidth={viewMode === 'A4' ? '4xl' : 'md'}
    >
      <div className="space-y-4">
        {emailStatus && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {emailStatus}
          </div>
        )}

        {/* View mode toggle */}
        <div className="flex items-center justify-between no-print border-b pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('THERMAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'THERMAL' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              80mm Thermal Receipt
            </button>
            <button
              onClick={() => setViewMode('A4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'A4' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              A4 Tax Invoice
            </button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleEmailReceipt} icon={<Mail className="w-3.5 h-3.5" />}>
              Email
            </Button>
            <Button variant="primary" size="sm" onClick={handlePrint} icon={<Printer className="w-3.5 h-3.5" />}>
              Print Receipt
            </Button>
          </div>
        </div>

        {/* 1. Thermal Receipt (80mm) View */}
        {viewMode === 'THERMAL' ? (
          <div className="printable-receipt bg-white p-4 rounded-xl border border-gray-300 font-mono text-[11px] leading-relaxed max-w-[320px] mx-auto shadow-inner text-gray-800">
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-gray-400">
              <h2 className="text-sm font-black tracking-tight uppercase text-black">
                {store?.name || 'SmartMart Supermarket'}
              </h2>
              {store?.legalName && <p className="text-[10px] text-gray-600">{store.legalName}</p>}
              <p className="text-[10px] text-gray-600 mt-0.5">
                {store?.address}, {store?.city}
              </p>
              <p className="text-[10px] text-gray-600">
                Ph: {store?.phone} {store?.gstin && `| GSTIN: ${store.gstin}`}
              </p>
            </div>

            {/* Bill Details */}
            <div className="py-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>Invoice: {invoice.invoiceNumber}</span>
                <span>{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier: {invoice.cashier?.fullName || 'Cashier'}</span>
                <span>{new Date(invoice.invoiceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {invoice.customerName && (
                <div className="flex justify-between">
                  <span>Customer: {invoice.customerName}</span>
                  <span>{invoice.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-gray-400">
              <div className="flex justify-between font-bold pb-1 text-[10px] uppercase">
                <span className="w-1/2">Item</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/6 text-right">Rate</span>
                <span className="w-1/6 text-right">Amt</span>
              </div>
              <div className="space-y-1">
                {invoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[10px]">
                    <div className="w-1/2 truncate font-semibold">
                      {item.productName}
                    </div>
                    <div className="w-1/6 text-center">{item.quantity}</div>
                    <div className="w-1/6 text-right">{item.unitPrice.toFixed(2)}</div>
                    <div className="w-1/6 text-right font-bold">{item.lineTotal.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="py-2 border-b border-dashed border-gray-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>

              {invoice.discountTotal > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>Total Discount:</span>
                  <span>-{formatCurrency(invoice.discountTotal)}</span>
                </div>
              )}

              {invoice.taxTotal > 0 && (
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>Included Tax (GST):</span>
                  <span>{formatCurrency(invoice.taxTotal)}</span>
                </div>
              )}

              {invoice.roundOff !== 0 && (
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>Round-off:</span>
                  <span>{invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black pt-1 border-t border-dashed border-gray-400 text-black">
                <span>GRAND TOTAL:</span>
                <span>{formatCurrency(invoice.grandTotal)}</span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="py-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
              {invoice.payments?.map((p, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>Paid ({p.paymentMethod}):</span>
                  <span>{formatCurrency(p.amount)}</span>
                </div>
              ))}
              {invoice.changeReturned > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Change Returned:</span>
                  <span>{formatCurrency(invoice.changeReturned)}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 text-center text-[10px] text-gray-600 space-y-1">
              <p className="font-semibold text-black whitespace-pre-line">
                {store?.receiptHeader || 'Thank you for shopping with us!'}
              </p>
              <p className="whitespace-pre-line">{store?.receiptFooter}</p>
              <div className="py-1">
                {/* Barcode visual string */}
                <div className="font-mono text-center tracking-widest font-black text-sm text-black">
                  *{invoice.invoiceNumber}*
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 2. Formal A4 Invoice View */
          <div className="printable-a4 bg-white p-6 rounded-xl border border-gray-300 text-xs text-gray-800 space-y-4">
            <div className="flex justify-between items-start pb-4 border-b">
              <div>
                <h1 className="text-xl font-black text-gray-900">{store?.name || 'SmartMart Supermarket'}</h1>
                <p className="text-gray-500">{store?.legalName}</p>
                <p className="text-gray-500">{store?.address}, {store?.city}, {store?.state} - {store?.pincode}</p>
                <p className="text-gray-500">GSTIN: <span className="font-mono font-bold text-gray-900">{store?.gstin}</span></p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  TAX INVOICE
                </span>
                <p className="font-bold text-gray-900 mt-2">Invoice No: {invoice.invoiceNumber}</p>
                <p className="text-gray-500">Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                <p className="text-gray-500">Cashier: {invoice.cashier?.fullName}</p>
              </div>
            </div>

            {/* Customer info */}
            <div className="bg-slate-50 p-3 rounded-lg border">
              <span className="font-bold text-gray-700 block mb-1">Billed To:</span>
              <p className="font-bold text-gray-900">{invoice.customerName || 'Walk-in Customer'}</p>
              {invoice.customerPhone && <p className="text-gray-500">Phone: {invoice.customerPhone}</p>}
            </div>

            {/* Line Items Table */}
            <table className="w-full text-left border-collapse border border-gray-200 text-xs">
              <thead className="bg-gray-100 font-bold text-gray-700">
                <tr>
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Product Description</th>
                  <th className="p-2 border">SKU</th>
                  <th className="p-2 border text-right">Qty</th>
                  <th className="p-2 border text-right">Unit Rate</th>
                  <th className="p-2 border text-right">Tax Rate</th>
                  <th className="p-2 border text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2 border">{idx + 1}</td>
                    <td className="p-2 border font-medium text-gray-900">{item.productName}</td>
                    <td className="p-2 border font-mono text-[11px] text-gray-500">{item.sku}</td>
                    <td className="p-2 border text-right">{item.quantity}</td>
                    <td className="p-2 border text-right">{item.unitPrice.toFixed(2)}</td>
                    <td className="p-2 border text-right">{item.taxRate}%</td>
                    <td className="p-2 border text-right font-bold">{item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discountTotal > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(invoice.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>Tax Total (GST):</span>
                  <span>{formatCurrency(invoice.taxTotal)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-black text-sm text-gray-900">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700">{formatCurrency(invoice.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t no-print">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button
              variant="success"
              onClick={() => {
                onNewSale();
                onClose();
              }}
              icon={<PlusCircle className="w-4 h-4" />}
            >
              Start New Sale
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
