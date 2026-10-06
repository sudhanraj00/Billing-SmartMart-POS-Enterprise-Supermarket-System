import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useShiftStore } from '../../store/shiftStore';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { LogOut, User, Clock, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '../../hooks/useCurrency';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { currentShift, openShift, closeShift } = useShiftStore();

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [openingCashInput, setOpeningCashInput] = useState('2000');
  const [actualCashInput, setActualCashInput] = useState('');
  const [varianceReason, setVarianceReason] = useState('');
  const [shiftError, setShiftError] = useState('');

  const handleOpenShift = async () => {
    setShiftError('');
    const cash = parseFloat(openingCashInput);
    if (isNaN(cash) || cash < 0) {
      setShiftError('Please enter a valid opening cash float');
      return;
    }
    const success = await openShift(cash);
    if (success) {
      setIsShiftModalOpen(false);
    } else {
      setShiftError('Failed to open shift. Please check connection.');
    }
  };

  const handleCloseShift = async () => {
    setShiftError('');
    const actual = parseFloat(actualCashInput);
    if (isNaN(actual) || actual < 0) {
      setShiftError('Please enter actual counted cash amount');
      return;
    }

    const variance = actual - (currentShift?.expectedCash || 0);
    if (Math.abs(variance) > 0.01 && !varianceReason.trim()) {
      setShiftError(`Variance of ${formatCurrency(variance)} detected. Reason is required.`);
      return;
    }

    const success = await closeShift(actual, varianceReason);
    if (success) {
      setIsShiftModalOpen(false);
      setActualCashInput('');
      setVarianceReason('');
    } else {
      setShiftError('Failed to close shift');
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
              S
            </div>
            <div>
              <span className="font-extrabold text-gray-900 tracking-tight text-base block leading-none">
                SmartMart <span className="text-emerald-600">POS</span>
              </span>
              <span className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                Enterprise Supermarket System
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {/* Shift Indicator for Cashiers and Admins */}
          {(user?.role === 'CASHIER' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setIsShiftModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors text-xs"
            >
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span className="font-medium text-gray-700 hidden sm:inline">Shift:</span>
              {currentShift ? (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  Active ({formatCurrency(currentShift.expectedCash)})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Closed (Click to open)
                </span>
              )}
            </button>
          )}

          {/* User Profile */}
          <div className="flex items-center gap-2.5 border-l border-gray-200 pl-3 md:pl-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-gray-900 leading-tight">{user?.fullName}</p>
              <div className="flex items-center gap-1">
                <Badge
                  variant={
                    user?.role === 'ADMIN'
                      ? 'danger'
                      : user?.role === 'INVENTORY_MANAGER'
                      ? 'info'
                      : 'success'
                  }
                  className="text-[9px] px-1.5 py-0"
                >
                  {user?.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-gray-500 hover:text-rose-600 p-2"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Shift Management Modal */}
      <Modal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        title={currentShift ? 'Cashier Shift Reconciliation' : 'Open Cashier Shift'}
        description={
          currentShift
            ? `Shift opened at ${new Date(currentShift.openedAt).toLocaleTimeString()}`
            : 'Enter beginning float cash in register drawer to start billing'
        }
      >
        {shiftError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            {shiftError}
          </div>
        )}

        {currentShift ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-xs">
              <div>
                <p className="text-gray-500">Opening Cash</p>
                <p className="font-bold text-gray-900 text-sm">{formatCurrency(currentShift.openingCash)}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Cash Sales</p>
                <p className="font-bold text-emerald-600 text-sm">+{formatCurrency(currentShift.totalCashSales)}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Cash Refunds</p>
                <p className="font-bold text-rose-600 text-sm">-{formatCurrency(currentShift.totalCashRefunds)}</p>
              </div>
              <div>
                <p className="text-gray-500">Expected Register Cash</p>
                <p className="font-black text-gray-900 text-base">{formatCurrency(currentShift.expectedCash)}</p>
              </div>
            </div>

            <Input
              label="Actual Counted Cash"
              type="number"
              step="any"
              placeholder="e.g. 5250"
              value={actualCashInput}
              onChange={(e) => setActualCashInput(e.target.value)}
              helperText="Count physical bills and coins currently in cash drawer"
              required
            />

            {actualCashInput && !isNaN(parseFloat(actualCashInput)) && (
              <div className="p-3 rounded-lg border bg-gray-50 text-xs">
                <span className="text-gray-600">Calculated Variance: </span>
                <span
                  className={`font-bold ${
                    parseFloat(actualCashInput) - currentShift.expectedCash === 0
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}
                >
                  {formatCurrency(parseFloat(actualCashInput) - currentShift.expectedCash)}
                </span>
              </div>
            )}

            {actualCashInput &&
              Math.abs(parseFloat(actualCashInput) - currentShift.expectedCash) > 0.01 && (
                <Input
                  label="Variance Reason"
                  placeholder="Explain shortage/excess (e.g. coin rounding, customer change tip)"
                  value={varianceReason}
                  onChange={(e) => setVarianceReason(e.target.value)}
                  required
                />
              )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsShiftModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleCloseShift}>
                Confirm & Close Shift
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Opening Drawer Float (₹)"
              type="number"
              step="any"
              value={openingCashInput}
              onChange={(e) => setOpeningCashInput(e.target.value)}
              helperText="Standard default float: ₹2,000 in mixed denominations"
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsShiftModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleOpenShift}>
                Start Shift
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
