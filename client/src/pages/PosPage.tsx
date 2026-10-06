import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Product, Category, Invoice, Store } from '../types';
import { useCartStore } from '../store/cartStore';
import { useShiftStore } from '../store/shiftStore';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { useHotkeys } from '../hooks/useHotkeys';
import { BarcodeBar } from '../components/pos/BarcodeBar';
import { ProductCatalog } from '../components/pos/ProductCatalog';
import { CartTable } from '../components/pos/CartTable';
import { CartSummary } from '../components/pos/CartSummary';
import { PaymentModal } from '../components/pos/PaymentModal';
import { CustomerModal } from '../components/pos/CustomerModal';
import { HeldSalesModal } from '../components/pos/HeldSalesModal';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { ShieldAlert, History, Layers } from 'lucide-react';

export const PosPage: React.FC = () => {
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const { items, addItem, clearCart, customer, setCustomer, getTotals, loadHeldCart } = useCartStore();
  const { currentShift, fetchCurrentShift } = useShiftStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [heldSales, setHeldSales] = useState<any[]>([]);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isHoldingBill, setIsHoldingBill] = useState(false);

  useEffect(() => {
    fetchInitialData();
    fetchCurrentShift();
  }, []);

  const fetchInitialData = async () => {
    setIsLoadingProducts(true);
    try {
      const [prodsRes, catsRes, settingsRes] = await Promise.all([
        api.get('/products?limit=100'),
        api.get('/catalog/categories'),
        api.get('/settings'),
      ]);
      setProducts(prodsRes.data.data.products);
      setCategories(catsRes.data.data);
      setStore(settingsRes.data.data.store);
    } catch (err: any) {
      setErrorToast('Failed to load initial POS product catalog');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const showToast = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4000);
  };

  // Barcode / Query Handler
  const handleBarcodeOrSearch = async (query = searchQuery) => {
    const q = query.trim();
    if (!q) return;

    // 1. First attempt instant barcode lookup
    try {
      const res = await api.get(`/products/barcode/${encodeURIComponent(q)}`);
      if (res.data.data) {
        const added = addItem(res.data.data, 1);
        if (!added.success) {
          showToast(added.message || 'Cannot add item');
        }
        setSearchQuery('');
        barcodeInputRef.current?.focus();
        return;
      }
    } catch {
      // Not an exact barcode, search by text in product list
    }

    // 2. Search local products
    const match = products.find(
      (p) =>
        p.barcode.toLowerCase() === q.toLowerCase() ||
        p.sku.toLowerCase() === q.toLowerCase() ||
        p.name.toLowerCase().includes(q.toLowerCase())
    );

    if (match) {
      const added = addItem(match, 1);
      if (!added.success) {
        showToast(added.message || 'Cannot add item');
      }
      setSearchQuery('');
    } else {
      showToast(`No product matched '${q}'`);
    }

    barcodeInputRef.current?.focus();
  };

  // Hardware USB Barcode Scanner Hook
  useBarcodeScanner({
    onScan: (scannedBarcode) => {
      handleBarcodeOrSearch(scannedBarcode);
    },
  });

  // Hotkey Bindings (F2, F4, F8, F9, Escape)
  useHotkeys({
    onF2: () => {
      barcodeInputRef.current?.focus();
    },
    onF4: () => {
      if (items.length > 0) handleHoldBill();
    },
    onF8: () => {
      if (items.length > 0) setIsPaymentModalOpen(true);
    },
    onEscape: () => {
      setIsPaymentModalOpen(false);
      setIsCustomerModalOpen(false);
      setIsHeldModalOpen(false);
      setIsReceiptModalOpen(false);
      barcodeInputRef.current?.focus();
    },
  });

  // Hold Bill
  const handleHoldBill = async () => {
    if (items.length === 0) return;
    setIsHoldingBill(true);
    try {
      const totals = getTotals();
      await api.post('/pos/hold', {
        referenceNote: customer ? `${customer.name} (${items.length} items)` : `Held Cart (${items.length} items)`,
        customerId: customer?.id || null,
        items,
        subtotal: totals.subtotal,
        discount: totals.discountTotal,
        tax: totals.taxTotal,
        total: totals.grandTotal,
      });
      clearCart();
      showToast('Bill held successfully');
    } catch (err: any) {
      showToast('Failed to hold bill');
    } finally {
      setIsHoldingBill(false);
      barcodeInputRef.current?.focus();
    }
  };

  // Open Held Bills Modal
  const handleOpenHeldModal = async () => {
    try {
      const res = await api.get('/pos/held');
      setHeldSales(res.data.data);
      setIsHeldModalOpen(true);
    } catch {
      showToast('Failed to load held bills');
    }
  };

  // Resume a held sale
  const handleResumeHeldSale = (heldSale: any) => {
    loadHeldCart({
      id: heldSale.id,
      items: heldSale.items,
      customer: heldSale.customer,
    });
    showToast('Held bill loaded into active cart');
  };

  // Delete held sale
  const handleDeleteHeldSale = async (id: string) => {
    try {
      await api.delete(`/pos/held/${id}`);
      setHeldSales((prev) => prev.filter((s) => s.id !== id));
      showToast('Held cart removed');
    } catch {
      showToast('Failed to delete held bill');
    }
  };

  // Checkout submission
  const handleCompletePayment = async (paymentPayload: any) => {
    setIsCheckoutLoading(true);
    try {
      // Generate client UUID for idempotency key to prevent double checkout
      const idempotencyKey = crypto.randomUUID();

      const payload = {
        idempotencyKey,
        customerId: customer?.id || null,
        customerName: customer?.name || null,
        customerPhone: customer?.phone || null,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          costPrice: i.product.costPrice,
          discountType: i.discountType,
          discountValue: i.discountValue,
          discountAmount: i.discountAmount,
          taxRate: i.taxRate,
          taxAmount: i.taxAmount,
          cgstAmount: i.cgstAmount,
          sgstAmount: i.sgstAmount,
          igstAmount: i.igstAmount,
          lineTotal: i.lineTotal,
        })),
        ...paymentPayload,
      };

      const res = await api.post('/pos/checkout', payload);
      const invoiceData = res.data.data;

      setCompletedInvoice(invoiceData);
      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(true);

      // Refresh shift status and product inventory
      fetchCurrentShift();
      fetchInitialData();
      clearCart();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Checkout failed. Please check balance and try again.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] gap-3">
      {/* Toast Notification */}
      {errorToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Top Bar: Barcode Scanner Input + Held Bills Button */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <BarcodeBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onEnter={() => handleBarcodeOrSearch()}
            inputRef={barcodeInputRef}
          />
        </div>
        <button
          onClick={handleOpenHeldModal}
          className="px-4 py-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-xs transition-colors"
          title="Retrieve Parked / Held Bills"
        >
          <History className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Held Bills</span>
        </button>
      </div>

      {/* Main Grid: Left Catalog (60%) vs Right Cart (40%) */}
      <div className="grid grid-cols-12 gap-3 flex-1 overflow-hidden">
        {/* Left Side: Product Catalog (7 columns on desktop) */}
        <div className="col-span-12 lg:col-span-7 h-full overflow-hidden">
          <ProductCatalog
            products={products}
            categories={categories}
            onSelectProduct={(p) => {
              const res = addItem(p, 1);
              if (!res.success) showToast(res.message || 'Error adding item');
              barcodeInputRef.current?.focus();
            }}
            isLoading={isLoadingProducts}
          />
        </div>

        {/* Right Side: Cart Table & Summary (5 columns on desktop) */}
        <div className="col-span-12 lg:col-span-5 h-full flex flex-col gap-3 overflow-hidden">
          <CartTable />
          <CartSummary
            onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
            onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
            onHoldBill={handleHoldBill}
            isHoldingBill={isHoldingBill}
          />
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          barcodeInputRef.current?.focus();
        }}
        onCompletePayment={handleCompletePayment}
        isLoading={isCheckoutLoading}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          barcodeInputRef.current?.focus();
        }}
        onSelectCustomer={(c) => setCustomer(c)}
        selectedCustomerId={customer?.id}
      />

      <HeldSalesModal
        isOpen={isHeldModalOpen}
        onClose={() => {
          setIsHeldModalOpen(false);
          barcodeInputRef.current?.focus();
        }}
        heldSales={heldSales}
        onResumeSale={handleResumeHeldSale}
        onDeleteHeldSale={handleDeleteHeldSale}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          barcodeInputRef.current?.focus();
        }}
        invoice={completedInvoice}
        store={store}
        onNewSale={() => {
          setCompletedInvoice(null);
          barcodeInputRef.current?.focus();
        }}
      />
    </div>
  );
};
