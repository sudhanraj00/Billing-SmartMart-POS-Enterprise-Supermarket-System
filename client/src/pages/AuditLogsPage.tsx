import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ShieldCheck, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
      });
      if (actionFilter) params.append('action', actionFilter);

      const res = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(res.data.data.logs);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">System Security & Audit Trail</h1>
          <p className="text-xs text-gray-500">Immutable chronological log of logins, price changes, voids, refunds, and adjustments</p>
        </div>
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="p-2 border rounded-lg text-xs bg-white text-gray-700 font-semibold focus:outline-none"
        >
          <option value="">All Log Actions</option>
          <option value="LOGIN">User Logins</option>
          <option value="CHECKOUT_COMPLETED">POS Checkouts</option>
          <option value="STOCK_ADJUSTMENT">Stock Adjustments</option>
          <option value="INVOICE_VOIDED">Invoice Voids</option>
          <option value="RETURN_PROCESSED">Returns / Refunds</option>
          <option value="PRODUCT_CREATED">Product Creations</option>
          <option value="PRODUCT_UPDATED">Product Updates</option>
          <option value="SHIFT_OPENED">Shift Openings</option>
          <option value="SHIFT_CLOSED">Shift Closings</option>
        </select>
      </div>

      <Card>
        <CardHeader title="Audit Trail Ledger" subtitle="Security and operational event log" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b text-[11px] font-bold text-gray-500 uppercase">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action Event</th>
                <th className="p-3">User & Role</th>
                <th className="p-3">Entity Reference</th>
                <th className="p-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">Loading audit records...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">No audit logs found for this filter.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          log.action.includes('VOID') || log.action.includes('DELET')
                            ? 'danger'
                            : log.action.includes('CHECKOUT') || log.action.includes('LOGIN')
                            ? 'success'
                            : log.action.includes('RETURN') || log.action.includes('ADJUST')
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3 font-semibold text-gray-900">
                      {log.userName}
                      <span className="text-[10px] text-gray-400 block uppercase font-mono">{log.userRole}</span>
                    </td>
                    <td className="p-3 font-mono text-gray-600">
                      {log.entity} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ''}
                    </td>
                    <td className="p-3 text-gray-600 font-mono text-[11px] max-w-sm truncate">
                      {log.newValuesJson || log.oldValuesJson || '—'}
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
