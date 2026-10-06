import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { formatCurrency } from '../hooks/useCurrency';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  Package,
  Plus,
  Search,
  Download,
  Upload,
  Filter,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Edit,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Bulk import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCat, lowStockFilter, page]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/catalog/categories');
      setCategories(res.data.data);
    } catch {
      // ignore
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search,
        categoryId: selectedCat,
        lowStock: lowStockFilter ? 'true' : 'false',
      });
      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data.data.products);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/products/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'smartmart-products.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Failed to export CSV');
    }
  };

  const handleBulkImport = async () => {
    if (!csvText.trim()) return;
    setIsImporting(true);
    setImportStatus('');
    try {
      const res = await api.post('/products/bulk-import', { csvText });
      setImportStatus(`Successfully imported ${res.data.data.importedCount} products!`);
      setCsvText('');
      fetchProducts();
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportStatus('');
      }, 2000);
    } catch (err: any) {
      setImportStatus(`Import error: ${err.response?.data?.message || 'Check CSV format'}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Products Catalog</h1>
          <p className="text-xs text-gray-500">Manage supermarket items, prices, barcodes, and inventory thresholds</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv} icon={<Download className="w-3.5 h-3.5" />}>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)} icon={<Upload className="w-3.5 h-3.5" />}>
            Import CSV
          </Button>
          <Link to="/products/new">
            <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by product name, barcode, SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => {
            setSelectedCat(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 font-medium focus:ring-emerald-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setLowStockFilter(!lowStockFilter);
            setPage(1);
          }}
          className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
            lowStockFilter
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Low Stock Only
        </button>
      </div>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-3">Barcode / SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-center">GST Tax</th>
                <th className="py-3 px-3 text-center">Current Stock</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.currentStock <= p.minStockLevel && p.currentStock > 0;
                  const isOut = p.currentStock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900 block leading-tight">{p.name}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-medium">{p.unitType}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <span className="block text-gray-900">{p.barcode}</span>
                        <span className="text-gray-400 text-[10px]">{p.sku}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-600 font-medium">
                        {p.category?.name || '—'}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-500">
                        {formatCurrency(p.costPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {p.taxRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isOut ? (
                          <Badge variant="danger">Out of stock</Badge>
                        ) : isLow ? (
                          <Badge variant="warning">{p.currentStock} units</Badge>
                        ) : (
                          <Badge variant="success">{p.currentStock} units</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link to={`/products/edit/${p.id}`}>
                          <button className="p-1 rounded text-gray-400 hover:text-emerald-700 hover:bg-emerald-50">
                            <Edit className="w-4 h-4" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Page {page} of {totalPages || 1}
          </span>
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

      {/* CSV Bulk Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import Products via CSV"
        description="Paste standard CSV text with Name, Barcode, SKU, SellingPrice, CostPrice, TaxRate, Stock"
        maxWidth="lg"
      >
        <div className="space-y-3">
          {importStatus && (
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs">
              {importStatus}
            </div>
          )}
          <textarea
            rows={8}
            placeholder={`Name,Barcode,SKU,SellingPrice,CostPrice,TaxRate,Stock\nOrganic Honey 500g,8901239841201,GROC-HNY-001,240,180,5,30`}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full p-3 font-mono text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBulkImport} isLoading={isImporting}>
              Import Products
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
