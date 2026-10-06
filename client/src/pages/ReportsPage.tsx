import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatCurrency } from '../hooks/useCurrency';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BarChart3, Download, Calendar, DollarSign, Calculator, Layers } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SALES' | 'TAX' | 'VALUATION'>('SALES');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [salesData, setSalesData] = useState<any>(null);
  const [taxData, setTaxData] = useState<any>(null);
  const [valuationData, setValuationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [activeTab]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'SALES') {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const res = await api.get(`/reports/sales?${params.toString()}`);
        setSalesData(res.data.data);
      } else if (activeTab === 'TAX') {
        const res = await api.get('/reports/tax');
        setTaxData(res.data.data);
      } else if (activeTab === 'VALUATION') {
        const res = await api.get('/reports/inventory-valuation');
        setValuationData(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const exportCurrentReportCsv = () => {
    let csv = '';
    if (activeTab === 'SALES' && salesData) {
      csv = 'Invoice Number,Date,Cashier,Customer,Grand Total\n';
      salesData.invoices.forEach((inv: any) => {
        csv += `"${inv.invoiceNumber}","${inv.invoiceDate}","${inv.cashier?.fullName}","${inv.customerName || 'Walk-in'}",${inv.grandTotal}\n`;
      });
    } else if (activeTab === 'TAX' && taxData) {
      csv = 'Invoice Number,Taxable Amount,CGST,SGST,IGST,Total Tax\n';
      taxData.invoices.forEach((inv: any) => {
        csv += `"${inv.invoiceNumber}",${inv.subtotal},${inv.cgstTotal},${inv.sgstTotal},${inv.igstTotal},${inv.taxTotal}\n`;
      });
    } else if (activeTab === 'VALUATION' && valuationData) {
      csv = 'Product,SKU,Category,Current Stock,Unit Cost,Unit Selling,Total Cost,Total Retail,Potential Margin\n';
      valuationData.breakdown.forEach((b: any) => {
        csv += `"${b.name}","${b.sku}","${b.category}",${b.stock},${b.unitCost},${b.unitSelling},${b.totalCost},${b.totalRetail},${b.potentialMargin}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartmart-${activeTab.toLowerCase()}-report.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Business Reports & Tax Audits</h1>
          <p className="text-xs text-gray-500">Sales performance, GST tax liabilities, and inventory asset valuation</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCurrentReportCsv} icon={<Download className="w-3.5 h-3.5" />}>
          Export to CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {[
          { id: 'SALES', label: 'Sales & Revenue Report', icon: <BarChart3 className="w-3.5 h-3.5" /> },
          { id: 'TAX', label: 'GST / Tax Liability Report', icon: <Calculator className="w-3.5 h-3.5" /> },
          { id: 'VALUATION', label: 'Inventory Valuation Report', icon: <Layers className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Sales Report */}
      {activeTab === 'SALES' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex flex-wrap items-center gap-3">
            <Input type="date" label="Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" label="End Date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <div className="pt-4">
              <Button variant="primary" size="md" onClick={() => loadReport()}>
                Filter
              </Button>
            </div>
          </div>

          {salesData && (
            <>
              {/* Sales KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-xl border">
                  <span className="text-xs text-gray-500 block">Total Revenue</span>
                  <span className="text-xl font-black text-gray-900">{formatCurrency(salesData.summary.totalRevenue)}</span>
                </div>
                <div className="p-4 bg-white rounded-xl border">
                  <span className="text-xs text-gray-500 block">Invoices Count</span>
                  <span className="text-xl font-black text-gray-900">{salesData.summary.totalInvoices}</span>
                </div>
                <div className="p-4 bg-white rounded-xl border">
                  <span className="text-xs text-gray-500 block">Total Discounts Given</span>
                  <span className="text-xl font-black text-rose-600">-{formatCurrency(salesData.summary.totalDiscount)}</span>
                </div>
                <div className="p-4 bg-white rounded-xl border">
                  <span className="text-xs text-gray-500 block">Estimated Gross Profit</span>
                  <span className="text-xl font-black text-emerald-600">+{formatCurrency(salesData.summary.netProfit)}</span>
                </div>
              </div>

              {/* By Cashier Breakdown */}
              <Card>
                <CardHeader title="Sales Breakdown by Cashier" />
                <div className="divide-y text-xs">
                  {salesData.byCashier.map((c: any, i: number) => (
                    <div key={i} className="p-3 flex justify-between items-center">
                      <span className="font-bold text-gray-800">{c.cashier}</span>
                      <span className="text-gray-500">{c.count} transactions</span>
                      <span className="font-black text-gray-900">{formatCurrency(c.sales)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Tab 2: GST / Tax Report */}
      {activeTab === 'TAX' && taxData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-4 bg-white rounded-xl border">
              <span className="text-xs text-gray-500 block">Taxable Base</span>
              <span className="text-lg font-black text-gray-900">{formatCurrency(taxData.summary.totalTaxable)}</span>
            </div>
            <div className="p-4 bg-white rounded-xl border">
              <span className="text-xs text-gray-500 block">CGST Collected</span>
              <span className="text-lg font-black text-indigo-600">{formatCurrency(taxData.summary.totalCGST)}</span>
            </div>
            <div className="p-4 bg-white rounded-xl border">
              <span className="text-xs text-gray-500 block">SGST Collected</span>
              <span className="text-lg font-black text-indigo-600">{formatCurrency(taxData.summary.totalSGST)}</span>
            </div>
            <div className="p-4 bg-white rounded-xl border">
              <span className="text-xs text-gray-500 block">IGST Collected</span>
              <span className="text-lg font-black text-indigo-600">{formatCurrency(taxData.summary.totalIGST)}</span>
            </div>
            <div className="p-4 bg-white rounded-xl border">
              <span className="text-xs text-gray-500 block">Total GST Liability</span>
              <span className="text-lg font-black text-emerald-700">{formatCurrency(taxData.summary.totalTax)}</span>
            </div>
          </div>

          <Card>
            <CardHeader title="Invoice Tax Audit Ledger" subtitle="Line item tax snapshots preserved per completed transaction" />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-[11px] font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="p-3">Invoice Number</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Taxable Base</th>
                    <th className="p-3 text-right">CGST</th>
                    <th className="p-3 text-right">SGST</th>
                    <th className="p-3 text-right">Total GST</th>
                    <th className="p-3 text-right">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {taxData.invoices.map((inv: any) => (
                    <tr key={inv.invoiceNumber} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-gray-900">{inv.invoiceNumber}</td>
                      <td className="p-3 text-gray-500">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                      <td className="p-3 text-right text-gray-700">{formatCurrency(inv.subtotal)}</td>
                      <td className="p-3 text-right text-indigo-600">{formatCurrency(inv.cgstTotal)}</td>
                      <td className="p-3 text-right text-indigo-600">{formatCurrency(inv.sgstTotal)}</td>
                      <td className="p-3 text-right font-bold text-emerald-700">{formatCurrency(inv.taxTotal)}</td>
                      <td className="p-3 text-right font-black text-gray-900">{formatCurrency(inv.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Inventory Valuation */}
      {activeTab === 'VALUATION' && valuationData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-xl border">
              <span className="text-xs text-gray-500 block">Total Catalog Items</span>
              <span className="text-xl font-black text-gray-900">{valuationData.summary.totalProducts}</span>
            </div>
            <div className="p-4 bg-white rounded-xl border">
              <span className="text-xs text-gray-500 block">Asset Value (Cost)</span>
              <span className="text-xl font-black text-slate-800">{formatCurrency(valuationData.summary.totalValuationAtCost)}</span>
            </div>
            <div className="p-4 bg-white rounded-xl border">
              <span className="text-xs text-gray-500 block">Retail Value (Selling)</span>
              <span className="text-xl font-black text-gray-900">{formatCurrency(valuationData.summary.totalValuationAtRetail)}</span>
            </div>
            <div className="p-4 bg-white rounded-xl border">
              <span className="text-xs text-gray-500 block">Potential Margin</span>
              <span className="text-xl font-black text-emerald-600">+{formatCurrency(valuationData.summary.potentialProfit)}</span>
            </div>
          </div>

          <Card>
            <CardHeader title="Inventory Valuation Breakdown" subtitle="Current physical warehouse assets evaluated against latest cost and selling prices" />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-[11px] font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3 font-mono">SKU</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">Stock</th>
                    <th className="p-3 text-right">Unit Cost</th>
                    <th className="p-3 text-right">Unit Selling</th>
                    <th className="p-3 text-right">Total Cost Asset</th>
                    <th className="p-3 text-right">Total Retail Asset</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {valuationData.breakdown.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-gray-900">{b.name}</td>
                      <td className="p-3 font-mono text-gray-500">{b.sku}</td>
                      <td className="p-3 text-gray-600">{b.category}</td>
                      <td className="p-3 text-center font-bold">{b.stock}</td>
                      <td className="p-3 text-right text-gray-600">{formatCurrency(b.unitCost)}</td>
                      <td className="p-3 text-right font-medium text-gray-900">{formatCurrency(b.unitSelling)}</td>
                      <td className="p-3 text-right font-semibold text-slate-700">{formatCurrency(b.totalCost)}</td>
                      <td className="p-3 text-right font-bold text-gray-900">{formatCurrency(b.totalRetail)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
