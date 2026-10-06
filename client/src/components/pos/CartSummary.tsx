import React, { useState } from 'react';
import { useCartStore } from '../../store/cartStore';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../hooks/useCurrency';
import { CreditCard, PauseCircle, Trash2, UserPlus, User, Percent, DollarSign } from 'lucide-react';

interface CartSummaryProps {
  onOpenCustomerModal: () => void;
  onOpenPaymentModal: () => void;
  onHoldBill: () => void;
  isHoldingBill?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  onOpenCustomerModal,
  onOpenPaymentModal,
  onHoldBill,
  isHoldingBill,
}) => {
  const { customer, clearCart, getTotals, invoiceDiscountType, invoiceDiscountValue, setInvoiceDiscount } = useCartStore();
  const totals = getTotals();

  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [discountTypeInput, setDiscountTypeInput] = useState<'PERCENTAGE' | 'FIXED'>(
    invoiceDiscountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE'
  );
  const [discountValInput, setDiscountValInput] = useState(invoiceDiscountValue.toString());

  const applyDiscount = () => {
    const val = parseFloat(discountValInput);
    if (!isNaN(val) && val >= 0) {
      setInvoiceDiscount(val === 0 ? 'NONE' : discountTypeInput, val);
      setIsDiscountOpen(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
      {/* Customer Quick Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <User className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-gray-900 block leading-tight">
              {customer ? customer.name : 'Walk-in Customer'}
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              {customer ? customer.phone : 'No customer attached'}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCustomerModal}
          className="text-xs py-1 px-2.5"
          icon={<UserPlus className="w-3.5 h-3.5" />}
        >
          {customer ? 'Change' : 'Attach'}
        </Button>
      </div>

      {/* Bill Breakdown */}
      <div className="space-y-1.5 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Subtotal ({totals.itemCount} items)</span>
          <span className="font-medium text-gray-900">{formatCurrency(totals.subtotal)}</span>
        </div>

        {totals.itemDiscountTotal > 0 && (
          <div className="flex justify-between text-rose-600">
            <span>Item Discounts</span>
            <span>-{formatCurrency(totals.itemDiscountTotal)}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={() => setIsDiscountOpen(!isDiscountOpen)}
            className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
          >
            Bill Discount {totals.invoiceDiscountTotal > 0 ? `(${formatCurrency(totals.invoiceDiscountTotal)})` : '+ Add'}
          </button>
          {totals.invoiceDiscountTotal > 0 && (
            <span className="text-rose-600 font-medium">-{formatCurrency(totals.invoiceDiscountTotal)}</span>
          )}
        </div>

        {/* Invoice Discount Popover */}
        {isDiscountOpen && (
          <div className="p-2.5 bg-slate-50 border rounded-lg space-y-2">
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDiscountTypeInput('PERCENTAGE')}
                className={`flex-1 py-1 rounded font-bold border ${
                  discountTypeInput === 'PERCENTAGE' ? 'bg-emerald-600 text-white' : 'bg-white'
                }`}
              >
                % Percent
              </button>
              <button
                type="button"
                onClick={() => setDiscountTypeInput('FIXED')}
                className={`flex-1 py-1 rounded font-bold border ${
                  discountTypeInput === 'FIXED' ? 'bg-emerald-600 text-white' : 'bg-white'
                }`}
              >
                ₹ Fixed
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={discountValInput}
                onChange={(e) => setDiscountValInput(e.target.value)}
                placeholder="Value"
                className="w-full px-2 py-1 border rounded text-xs"
              />
              <Button size="sm" onClick={applyDiscount}>
                Apply
              </Button>
            </div>
          </div>
        )}

        {/* GST Tax Breakdown */}
        {totals.taxTotal > 0 && (
          <div className="flex justify-between text-slate-500 text-[11px] pt-1">
            <span>GST Included (CGST: {formatCurrency(totals.cgstTotal)}, SGST: {formatCurrency(totals.sgstTotal)})</span>
            <span>{formatCurrency(totals.taxTotal)}</span>
          </div>
        )}

        {totals.roundOff !== 0 && (
          <div className="flex justify-between text-gray-500 text-[11px]">
            <span>Round-off</span>
            <span>{totals.roundOff > 0 ? `+${totals.roundOff}` : totals.roundOff}</span>
          </div>
        )}
      </div>

      {/* Payable Grand Total Display */}
      <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-baseline justify-between shadow-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Payable Amount
          </span>
          <span className="text-2xl font-black text-emerald-400 tracking-tight">
            {formatCurrency(totals.grandTotal)}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">Net Due</span>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          variant="outline"
          size="md"
          onClick={onHoldBill}
          isLoading={isHoldingBill}
          disabled={totals.itemCount === 0}
          icon={<PauseCircle className="w-4 h-4" />}
          className="text-xs font-bold"
        >
          Hold Bill [F4]
        </Button>

        <Button
          variant="danger"
          size="md"
          onClick={clearCart}
          disabled={totals.itemCount === 0}
          icon={<Trash2 className="w-4 h-4" />}
          className="text-xs font-bold"
        >
          Clear
        </Button>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onOpenPaymentModal}
        disabled={totals.itemCount === 0}
        icon={<CreditCard className="w-5 h-5" />}
        className="w-full text-base font-extrabold py-3 shadow-md"
      >
        Pay Now [F8]
      </Button>
    </div>
  );
};
