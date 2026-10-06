import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Category, Brand, Supplier, UnitType } from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Barcode, ArrowLeft, Save, Sparkles, AlertCircle } from 'lucide-react';

export const ProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Form State
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [unitType, setUnitType] = useState<UnitType>('PIECE');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [taxRate, setTaxRate] = useState('5');
  const [currentStock, setCurrentStock] = useState('0');
  const [minStockLevel, setMinStockLevel] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [mfgDate, setMfgDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  const fetchPrerequisites = async () => {
    try {
      const [catsRes, brandsRes, supsRes] = await Promise.all([
        api.get('/catalog/categories'),
        api.get('/catalog/brands'),
        api.get('/suppliers'),
      ]);
      setCategories(catsRes.data.data);
      setBrands(brandsRes.data.data);
      setSuppliers(supsRes.data.data);

      if (isEditing && id) {
        const prodRes = await api.get(`/products/${id}`);
        const p = prodRes.data.data;
        setName(p.name);
        setBarcode(p.barcode);
        setSku(p.sku);
        setDescription(p.description || '');
        setUnitType(p.unitType);
        setSellingPrice(p.sellingPrice.toString());
        setCostPrice(p.costPrice.toString());
        setTaxRate(p.taxRate.toString());
        setCurrentStock(p.currentStock.toString());
        setMinStockLevel(p.minStockLevel.toString());
        setCategoryId(p.categoryId);
        setBrandId(p.brandId || '');
        setSupplierId(p.supplierId || '');
        if (p.mfgDate) setMfgDate(p.mfgDate.slice(0, 10));
        if (p.expiryDate) setExpiryDate(p.expiryDate.slice(0, 10));
      } else if (catsRes.data.data.length > 0) {
        setCategoryId(catsRes.data.data[0].id);
      }
    } catch (err: any) {
      setError('Failed to load form metadata');
    }
  };

  const handleGenerateBarcode = () => {
    const randomBarcode = `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const randomSku = `SKU-${Date.now().toString().slice(-6)}`;
    setBarcode(randomBarcode);
    if (!sku) setSku(randomSku);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    const payload: any = {
      name: name.trim(),
      barcode: barcode.trim() || undefined,
      sku: sku.trim() || undefined,
      description: description.trim() || undefined,
      unitType,
      sellingPrice: parseFloat(sellingPrice) || 0,
      costPrice: parseFloat(costPrice) || 0,
      taxRate: parseFloat(taxRate) || 0,
      minStockLevel: parseFloat(minStockLevel) || 10,
      categoryId,
      brandId: brandId || null,
      supplierId: supplierId || null,
      mfgDate: mfgDate ? new Date(mfgDate).toISOString() : null,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
    };

    if (!isEditing) {
      payload.currentStock = parseFloat(currentStock) || 0;
    }

    setIsLoading(true);
    try {
      if (isEditing) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      navigate('/products');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/products')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-xs text-gray-500">Configure supermarket item details, selling rates, and taxes</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader title="Product Details" subtitle="Core identification, pricing, and category mapping" />
          <CardContent className="space-y-4">
            {/* Row 1: Name & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Product Name"
                placeholder="e.g. Aashirvaad Shudh Chakki Atta 5kg"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Unit Type
                </label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value as UnitType)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white font-medium focus:ring-emerald-500 focus:outline-none"
                >
                  {['PIECE', 'KG', 'GRAM', 'LITRE', 'ML', 'PACKET', 'BOX'].map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Barcode & SKU Generator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="Barcode"
                    placeholder="Scan or enter barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    icon={<Barcode className="w-4 h-4" />}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleGenerateBarcode}
                  className="mb-0.5 text-xs font-bold"
                  icon={<Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
                >
                  Generate
                </Button>
              </div>

              <Input
                label="SKU (Stock Keeping Unit)"
                placeholder="e.g. GROC-ATT-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
            </div>

            {/* Row 3: Category, Brand, Supplier */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white font-medium focus:ring-emerald-500 focus:outline-none"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Brand (Optional)
                </label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white font-medium focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Select Brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Supplier (Optional)
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white font-medium focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Pricing & GST Tax */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
              <Input
                label="Selling Price (₹) *"
                type="number"
                step="any"
                placeholder="255.00"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
              />

              <Input
                label="Cost / Wholesale Price (₹) *"
                type="number"
                step="any"
                placeholder="210.00"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  GST Tax Rate (%)
                </label>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white font-medium focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="0">0% (Exempt / Daily Staples)</option>
                  <option value="5">5% (Essential Food / Oil)</option>
                  <option value="12">12% (Processed Food / Dairy)</option>
                  <option value="18">18% (Personal Care / Detergents)</option>
                  <option value="28">28% (Aerated Drinks / Luxury)</option>
                </select>
              </div>
            </div>

            {/* Row 5: Inventory Stock & Expiry */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-gray-100">
              {!isEditing && (
                <Input
                  label="Initial Stock Quantity"
                  type="number"
                  step="any"
                  placeholder="50"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  helperText="Initial onboarding stock count"
                />
              )}

              <Input
                label="Reorder Alert Level"
                type="number"
                step="any"
                placeholder="10"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(e.target.value)}
                helperText="Low stock warning triggers at this count"
              />

              <Input
                label="Manufacturing Date (Optional)"
                type="date"
                value={mfgDate}
                onChange={(e) => setMfgDate(e.target.value)}
              />

              <Input
                label="Expiry Date (Optional)"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" type="button" onClick={() => navigate('/products')}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isLoading} icon={<Save className="w-4 h-4" />}>
                {isEditing ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};
