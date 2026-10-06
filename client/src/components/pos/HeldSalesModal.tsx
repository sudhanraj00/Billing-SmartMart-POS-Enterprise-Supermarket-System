import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../hooks/useCurrency';
import { Clock, Play, Trash2, ShoppingBag, User } from 'lucide-react';

interface HeldSaleItem {
  id: string;
  referenceNote?: string;
  subtotal: number;
  total: number;
  heldAt: string;
  items: any[];
  customer?: { id: string; name: string; phone: string } | null;
}

interface HeldSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldSales: HeldSaleItem[];
  onResumeSale: (heldSale: HeldSaleItem) => void;
  onDeleteHeldSale: (id: string) => void;
  isLoading?: boolean;
}

export const HeldSalesModal: React.FC<HeldSalesModalProps> = ({
  isOpen,
  onClose,
  heldSales,
  onResumeSale,
  onDeleteHeldSale,
  isLoading,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Held / Parked Bills"
      description="Recall suspended customer carts to resume billing"
      maxWidth="lg"
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading held bills...</div>
        ) : heldSales.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <ShoppingBag className="w-10 h-10 mx-auto stroke-[1.5] mb-2" />
            <p className="text-sm font-semibold">No held bills currently parked</p>
            <p className="text-xs text-gray-400">Press F4 or click 'Hold Bill' during an active sale to park a cart</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {heldSales.map((sale) => (
              <div
                key={sale.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 text-sm">
                      {sale.referenceNote || 'Held Cart'}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(sale.heldAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-gray-500 text-xs">
                    {sale.items.length} items &bull; Total: <span className="font-bold text-gray-900">{formatCurrency(sale.total)}</span>
                  </p>

                  {sale.customer && (
                    <p className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1 mt-1">
                      <User className="w-3 h-3" />
                      Customer: {sale.customer.name} ({sale.customer.phone})
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onResumeSale(sale);
                      onClose();
                    }}
                    icon={<Play className="w-3.5 h-3.5" />}
                  >
                    Resume Bill
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteHeldSale(sale.id)}
                    className="text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
