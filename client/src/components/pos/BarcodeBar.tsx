import React, { useRef, useEffect } from 'react';
import { Search, Barcode, Plus } from 'lucide-react';
import { Button } from '../ui/Button';

interface BarcodeBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onEnter: () => void;
  isLoading?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const BarcodeBar: React.FC<BarcodeBarProps> = ({
  searchQuery,
  setSearchQuery,
  onEnter,
  isLoading,
  inputRef,
}) => {
  const localRef = useRef<HTMLInputElement>(null);
  const ref = inputRef || localRef;

  useEffect(() => {
    // Keep focus on barcode input for continuous rapid scanning
    ref.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
      <div className="relative flex-1">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 flex items-center gap-1.5 pointer-events-none">
          <Barcode className="w-5 h-5 text-emerald-600" />
          <span className="h-4 w-px bg-gray-200" />
          <Search className="w-4 h-4 text-gray-400" />
        </div>
        <input
          ref={ref}
          type="text"
          placeholder="Scan barcode or type product name / SKU (Press F2 to focus)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-20 pr-16 py-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-inner bg-slate-50/50"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded shadow-xs">
            F2
          </kbd>
        </div>
      </div>
      <Button
        variant="primary"
        onClick={onEnter}
        isLoading={isLoading}
        icon={<Plus className="w-4 h-4" />}
        className="py-3 px-5 text-sm font-bold"
      >
        Add
      </Button>
    </div>
  );
};
