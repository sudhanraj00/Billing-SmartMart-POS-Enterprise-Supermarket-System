import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Invoice } from '../types';
import { formatCurrency } from '../hooks/useCurrency';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Search, Eye, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [search, page]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search,
      });
      const res = await api.get(`/invoices?${params.toString()}`);
      setInvoices(res.data.data.invoices);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Completed Sales Invoices</h1>
        <p className="text-xs text-gray-500">History of all transactions, receipts, customer bills, and void states</p>
      </div>

      <Card>
        <div className="p-3 border-b flex items-center gap-2">
          <Input
            placeholder="Search by invoice number, customer phone, customer name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b text-[11px] font-bold text-gray-500 uppercase">
              <tr>
                <th className="p-3">Invoice Number</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Cashier</th>
                <th className="p-3">Customer</th>
                <th className="p-3 text-right">Items</th>
                <th className="p-3 text-right">Grand Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400">No invoices found matching criteria.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-gray-900 font-mono">{inv.invoiceNumber}</td>
                    <td className="p-3 text-gray-500">
                      {new Date(inv.invoiceDate).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium text-gray-800">{inv.cashier?.fullName}</td>
                    <td className="p-3 text-gray-700">
                      {inv.customerName || 'Walk-in'}
                      {inv.customerPhone && <span className="block text-[10px] text-gray-400 font-mono">{inv.customerPhone}</span>}
                    </td>
                    <td className="p-3 text-right font-medium">{(inv as any)._count?.items || inv.items?.length || '—'}</td>
                    <td className="p-3 text-right font-black text-gray-900">{formatCurrency(inv.grandTotal)}</td>
                    <td className="p-3 text-center">
                      <Badge
                        variant={
                          inv.status === 'COMPLETED'
                            ? 'success'
                            : inv.status === 'VOIDED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Link to={`/invoices/${inv.id}`}>
                        <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Page {page} of {totalPages || 1}</span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              icon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
