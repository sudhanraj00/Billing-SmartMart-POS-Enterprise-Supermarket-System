import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../store/cartStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../hooks/useCurrency';
import { Banknote, QrCode, CreditCard, Layers, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompletePayment: (paymentPayload: any) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

type MethodType = 'CASH' | 'UPI' | 'CARD' | 'SPLIT' | 'CREDIT';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onCompletePayment,
  isLoading,
  error,
}) => {
  const { getTotals, customer } = useCartStore();
  const totals = getTotals();

  const [method, setMethod] = useState<MethodType>('CASH');
  const [tenderAmount, setTenderAmount] = useState<string>(totals.grandTotal.toString());
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [managerPin, setManagerPin] = useState<string>('');

  // Split payment state
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitUPI, setSplitUPI] = useState<string>('');
  const [splitCard, setSplitCard] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTenderAmount(totals.grandTotal.toString());
      setTransactionRef('');
      setManagerPin('');
      setSplitCash((totals.grandTotal / 2).toFixed(0));
      setSplitUPI((totals.grandTotal - Math.floor(totals.grandTotal / 2)).toFixed(0));
      setSplitCard('0');
    }
  }, [isOpen, totals.grandTotal]);

  const numericTender = parseFloat(tenderAmount) || 0;
  const changeReturned = Math.max(0, numericTender - totals.grandTotal);
  const balanceDue = Math.max(0, totals.grandTotal - numericTender);

  const handleQuickCash = (amount: number) => {
    setTenderAmount(amount.toString());
  };

  const handleExactCash = () => {
    setTenderAmount(totals.grandTotal.toString());
  };

  const handleCheckoutSubmit = async () => {
    let payments: Array<{ amount: number; paymentMethod: string; transactionRef?: string }> = [];

    if (method === 'CASH') {
      payments.push({
        amount: Math.min(numericTender, totals.grandTotal),
        paymentMethod: 'CASH',
      });
    } else if (method === 'UPI') {
      payments.push({
        amount: totals.grandTotal,
        paymentMethod: 'UPI',
        transactionRef: transactionRef || `UPI-${Date.now()}`,
      });
    } else if (method === 'CARD') {
      payments.push({
        amount: totals.grandTotal,
        paymentMethod: 'CARD',
        transactionRef: transactionRef || `CARD-${Date.now()}`,
      });
    } else if (method === 'CREDIT') {
      if (!customer) {
        alert('Please attach a customer to process Pay Later / Credit sale');
        return;
      }
      payments.push({
        amount: totals.grandTotal,
        paymentMethod: 'CREDIT',
      });
    } else if (method === 'SPLIT') {
      const c = parseFloat(splitCash) || 0;
      const u = parseFloat(splitUPI) || 0;
      const cd = parseFloat(splitCard) || 0;

      if (c + u + cd < totals.grandTotal) {
        alert(`Total split tender (${c + u + cd}) is less than grand total (${totals.grandTotal})`);
        return;
      }

      if (c > 0) payments.push({ amount: c, paymentMethod: 'CASH' });
      if (u > 0) payments.push({ amount: u, paymentMethod: 'UPI', transactionRef });
      if (cd > 0) payments.push({ amount: cd, paymentMethod: 'CARD', transactionRef });
    }

    const payload = {
      subtotal: totals.subtotal,
      itemDiscountTotal: totals.itemDiscountTotal,
      invoiceDiscountTotal: totals.invoiceDiscountTotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      cgstTotal: totals.cgstTotal,
      sgstTotal: totals.sgstTotal,
      roundOff: totals.roundOff,
      grandTotal: totals.grandTotal,
      amountPaid: method === 'CASH' ? numericTender : totals.grandTotal,
      balanceDue: method === 'CREDIT' ? totals.grandTotal : balanceDue,
      changeReturned: method === 'CASH' ? changeReturned : 0,
      payments,
      managerPin: managerPin.trim() || undefined,
    };

    await onCompletePayment(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Payment & Checkout [F8]"
      description="Select payment tender and verify change amount"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Grand Total Header */}
        <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Total Amount Due</span>
            <span className="text-3xl font-black text-emerald-400">
              {formatCurrency(totals.grandTotal)}
            </span>
          </div>
          {customer && (
            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold block">Customer</span>
              <span className="text-sm font-bold text-white">{customer.name}</span>
            </div>
          )}
        </div>

        {/* Tender Method Tabs */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { id: 'CASH', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
            { id: 'UPI', label: 'UPI / QR', icon: <QrCode className="w-4 h-4" /> },
            { id: 'CARD', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
            { id: 'SPLIT', label: 'Split', icon: <Layers className="w-4 h-4" /> },
            { id: 'CREDIT', label: 'Pay Later', icon: <Clock className="w-4 h-4" /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setMethod(t.id as MethodType)}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all font-bold text-xs select-none ${
                method === t.id
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className={method === t.id ? 'text-emerald-600' : 'text-gray-400'}>
                {t.icon}
              </span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Cash Form */}
        {method === 'CASH' && (
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-gray-200">
            <Input
              label="Cash Received from Customer (₹)"
              type="number"
              step="any"
              value={tenderAmount}
              onChange={(e) => setTenderAmount(e.target.value)}
              className="text-lg font-black text-emerald-700"
              autoFocus
            />

            {/* Quick Cash Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 mr-1">Quick Tender:</span>
              <button
                type="button"
                onClick={handleExactCash}
                className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs font-bold text-gray-800 hover:bg-gray-100"
              >
                Exact ({totals.grandTotal})
              </button>
              {[100, 200, 500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickCash(amt)}
                  className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs font-bold text-gray-800 hover:bg-gray-100"
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {/* Change Display */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-xs text-gray-500 font-semibold block">Change to Return</span>
                <span className="text-xl font-black text-rose-600">
                  {formatCurrency(changeReturned)}
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-xs text-gray-500 font-semibold block">Balance Due</span>
                <span className="text-xl font-black text-gray-700">
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: UPI / QR */}
        {method === 'UPI' && (
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-gray-200 text-center">
            <div className="w-28 h-28 bg-white border-2 border-dashed border-emerald-400 rounded-xl mx-auto flex flex-col items-center justify-center p-2 shadow-inner">
              <QrCode className="w-16 h-16 text-emerald-600" />
              <span className="text-[10px] font-bold text-gray-500">Scan at Counter</span>
            </div>
            <p className="text-xs text-gray-600 font-medium">
              Present merchant QR code to customer for {formatCurrency(totals.grandTotal)}
            </p>
            <Input
              label="UPI UTR / Reference ID (Optional)"
              placeholder="e.g. 427819283719"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
            />
          </div>
        )}

        {/* Tab 3: Card */}
        {method === 'CARD' && (
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <CreditCard className="w-8 h-8 text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-gray-900">Card POS Terminal</p>
                <p className="text-[11px] text-gray-500">Swipe or tap debit/credit card for {formatCurrency(totals.grandTotal)}</p>
              </div>
            </div>
            <Input
              label="Card Auth / Approval Code (Optional)"
              placeholder="e.g. AUTH-88219"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
            />
          </div>
        )}

        {/* Tab 4: Split Payment */}
        {method === 'SPLIT' && (
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-600 font-medium mb-1">
              Enter tender split across multiple payment methods:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="Cash Amount"
                type="number"
                value={splitCash}
                onChange={(e) => setSplitCash(e.target.value)}
              />
              <Input
                label="UPI Amount"
                type="number"
                value={splitUPI}
                onChange={(e) => setSplitUPI(e.target.value)}
              />
              <Input
                label="Card Amount"
                type="number"
                value={splitCard}
                onChange={(e) => setSplitCard(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Tab 5: Credit / Pay Later */}
        {method === 'CREDIT' && (
          <div className="space-y-2 bg-amber-50 p-4 rounded-xl border border-amber-200">
            <h4 className="text-xs font-bold text-amber-900">Customer Credit Sale (Store Ledger)</h4>
            {customer ? (
              <div className="text-xs space-y-1 text-amber-800">
                <p>
                  Customer: <span className="font-bold text-gray-900">{customer.name}</span> ({customer.phone})
                </p>
                <p>
                  Current Dues: <span className="font-bold">{formatCurrency(customer.outstandingBalance)}</span>
                </p>
                <p>
                  Credit Limit: <span className="font-bold">{formatCurrency(customer.creditLimit)}</span>
                </p>
              </div>
            ) : (
              <p className="text-xs text-rose-600 font-bold">
                ⚠️ No customer attached! Credit billing requires attaching a registered customer.
              </p>
            )}
          </div>
        )}

        {/* Manager PIN override (optional) */}
        <div className="pt-2 border-t border-gray-100">
          <Input
            label="Manager Override PIN (if required for special discount)"
            type="password"
            maxLength={6}
            placeholder="Enter 4-digit PIN only if prompted"
            value={managerPin}
            onChange={(e) => setManagerPin(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel [Esc]
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCheckoutSubmit}
            isLoading={isLoading}
            disabled={method === 'CREDIT' && !customer}
            icon={<CheckCircle2 className="w-5 h-5" />}
            className="px-6 font-extrabold"
          >
            Complete Sale [F9]
          </Button>
        </div>
      </div>
    </Modal>
  );
};
