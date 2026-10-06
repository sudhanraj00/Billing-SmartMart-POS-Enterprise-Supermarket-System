import React from 'react';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../hooks/useCurrency';
import { Plus, Minus, Trash2, ShoppingCart, Tag } from 'lucide-react';

interface CartTableProps {
  onOpenDiscountModal?: (productId: string) => void;
}

export const CartTable: React.FC<CartTableProps> = () => {
  const { items, updateItemQuantity, removeItem, updateItemDiscount } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-gray-200">
        <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
          <ShoppingCart className="w-7 h-7 stroke-[1.5]" />
        </div>
        <h3 className="text-sm font-bold text-gray-800">Cart is empty</h3>
        <p className="text-xs text-gray-400 max-w-xs mt-1">
          Scan item barcode using a scanner or click products on the left catalog to add to cart
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-xs flex flex-col overflow-hidden">
      {/* Table Header */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-gray-200 grid grid-cols-12 text-[11px] font-bold uppercase tracking-wider text-gray-500">
        <span className="col-span-5">Item</span>
        <span className="col-span-2 text-right">Price</span>
        <span className="col-span-3 text-center">Qty</span>
        <span className="col-span-2 text-right">Total</span>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {items.map((item) => (
          <div
            key={item.product.id}
            className="px-4 py-3 grid grid-cols-12 items-center hover:bg-slate-50/70 transition-colors text-xs"
          >
            {/* Col 1: Product Name, SKU, Disount */}
            <div className="col-span-5 pr-2">
              <h4 className="font-bold text-gray-900 leading-tight truncate">{item.product.name}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-gray-400 font-mono">{item.product.sku}</span>
                {item.discountAmount > 0 && (
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1 rounded flex items-center gap-0.5">
                    <Tag className="w-2.5 h-2.5" />
                    -{formatCurrency(item.discountAmount)}
                  </span>
                )}
                {item.taxRate > 0 && (
                  <span className="text-[10px] text-gray-400">GST {item.taxRate}%</span>
                )}
              </div>
            </div>

            {/* Col 2: Unit Price */}
            <div className="col-span-2 text-right font-medium text-gray-700">
              {formatCurrency(item.unitPrice)}
            </div>

            {/* Col 3: Quantity Controls */}
            <div className="col-span-3 flex items-center justify-center gap-1.5 px-1">
              <button
                onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
                title="Decrease"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <input
                type="number"
                min="1"
                max={item.product.currentStock}
                value={item.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) updateItemQuantity(item.product.id, val);
                }}
                className="w-10 text-center py-1 rounded-md border border-gray-300 font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
              />

              <button
                onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}
                disabled={item.quantity >= item.product.currentStock}
                className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
                title="Increase"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Col 4: Line Total & Remove */}
            <div className="col-span-2 text-right flex items-center justify-end gap-2">
              <span className="font-extrabold text-gray-900">
                {formatCurrency(item.lineTotal)}
              </span>
              <button
                onClick={() => removeItem(item.product.id)}
                className="p-1 rounded text-gray-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
