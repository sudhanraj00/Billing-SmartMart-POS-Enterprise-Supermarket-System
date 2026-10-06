import React, { useState } from 'react';
import { Product, Category } from '../../types';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../hooks/useCurrency';
import { ShoppingBag, AlertTriangle, Layers } from 'lucide-react';

interface ProductCatalogProps {
  products: Product[];
  categories: Category[];
  onSelectProduct: (product: Product) => void;
  isLoading?: boolean;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  categories,
  onSelectProduct,
  isLoading,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');

  const filtered = selectedCategoryId === 'ALL'
    ? products
    : products.filter((p) => p.categoryId === selectedCategoryId);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      {/* Category Tabs */}
      <div className="p-3 border-b border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar bg-slate-50/70">
        <button
          onClick={() => setSelectedCategoryId('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedCategoryId === 'ALL'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          All Items ({products.length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategoryId === cat.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Cards Grid */}
      <div className="flex-1 p-3 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <ShoppingBag className="w-10 h-10 stroke-[1.5] mb-2" />
            <p className="text-sm font-semibold">No products found</p>
            <p className="text-xs text-gray-400">Try changing categories or search query</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {filtered.map((product) => {
              const isOutOfStock = product.currentStock <= 0;
              const isLowStock = !isOutOfStock && product.currentStock <= product.minStockLevel;

              return (
                <button
                  key={product.id}
                  disabled={isOutOfStock}
                  onClick={() => onSelectProduct(product)}
                  className={`group text-left p-3 rounded-xl border transition-all flex flex-col justify-between relative overflow-hidden select-none active:scale-[0.98] ${
                    isOutOfStock
                      ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                      : 'bg-white border-gray-200 hover:border-emerald-400 hover:shadow-md'
                  }`}
                >
                  {/* Top: Category & Stock Pill */}
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate max-w-[80px]">
                      {product.category?.name || product.unitType}
                    </span>
                    {isOutOfStock ? (
                      <Badge variant="danger" className="text-[9px] px-1.5 py-0">
                        Out of stock
                      </Badge>
                    ) : isLowStock ? (
                      <Badge variant="warning" className="text-[9px] px-1.5 py-0 flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {product.currentStock} left
                      </Badge>
                    ) : (
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-100">
                        {product.currentStock} in stock
                      </span>
                    )}
                  </div>

                  {/* Middle: Product Name & SKU */}
                  <div className="my-1.5">
                    <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{product.barcode}</p>
                  </div>

                  {/* Bottom: Price and Tax */}
                  <div className="pt-2 border-t border-gray-100 flex items-baseline justify-between w-full">
                    <div>
                      <span className="text-sm font-extrabold text-gray-900">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-1">/{product.unitType.toLowerCase()}</span>
                    </div>
                    {product.taxRate > 0 && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1 rounded">
                        +{product.taxRate}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
