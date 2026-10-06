import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Category, Brand } from '../types';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Layers, Plus, Tag } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Brand Modal State
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandDesc, setBrandDesc] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catsRes, brandsRes] = await Promise.all([
        api.get('/catalog/categories'),
        api.get('/catalog/brands'),
      ]);
      setCategories(catsRes.data.data);
      setBrands(brandsRes.data.data);
    } catch {
      // ignore
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catCode) return;
    try {
      await api.post('/catalog/categories', {
        name: catName.trim(),
        code: catCode.trim().toUpperCase(),
        description: catDesc.trim() || undefined,
      });
      setIsCatModalOpen(false);
      setCatName('');
      setCatCode('');
      setCatDesc('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName) return;
    try {
      await api.post('/catalog/brands', {
        name: brandName.trim(),
        description: brandDesc.trim() || undefined,
      });
      setIsBrandModalOpen(false);
      setBrandName('');
      setBrandDesc('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create brand');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Categories & Brands</h1>
        <p className="text-xs text-gray-500">Organize supermarket inventory by department classifications and manufacturers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories Section */}
        <Card>
          <CardHeader
            title="Product Categories"
            subtitle={`${categories.length} active departments`}
            action={
              <Button variant="primary" size="sm" onClick={() => setIsCatModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                Add Category
              </Button>
            }
          />
          <div className="divide-y divide-gray-100 text-xs">
            {categories.map((c) => (
              <div key={c.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <span className="font-bold text-gray-900 block">{c.name}</span>
                  <span className="text-[11px] text-gray-400 font-mono">Code: {c.code}</span>
                  {c.description && <p className="text-[11px] text-gray-500 mt-0.5">{c.description}</p>}
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {c._count?.products || 0} items
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Brands Section */}
        <Card>
          <CardHeader
            title="Manufacturer Brands"
            subtitle={`${brands.length} partner brands`}
            action={
              <Button variant="primary" size="sm" onClick={() => setIsBrandModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                Add Brand
              </Button>
            }
          />
          <div className="divide-y divide-gray-100 text-xs">
            {brands.map((b) => (
              <div key={b.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <span className="font-bold text-gray-900 block">{b.name}</span>
                  {b.description && <p className="text-[11px] text-gray-500 mt-0.5">{b.description}</p>}
                </div>
                <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                  {b._count?.products || 0} items
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Add Category Modal */}
      <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title="Add Product Category">
        <form onSubmit={handleCreateCategory} className="space-y-3">
          <Input label="Category Name" placeholder="e.g. Organic Produce" value={catName} onChange={(e) => setCatName(e.target.value)} required />
          <Input label="Category Code (Uppercase)" placeholder="e.g. ORG" value={catCode} onChange={(e) => setCatCode(e.target.value)} required />
          <Input label="Description (Optional)" placeholder="Short department note" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsCatModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Category</Button>
          </div>
        </form>
      </Modal>

      {/* Add Brand Modal */}
      <Modal isOpen={isBrandModalOpen} onClose={() => setIsBrandModalOpen(false)} title="Add Manufacturer Brand">
        <form onSubmit={handleCreateBrand} className="space-y-3">
          <Input label="Brand Name" placeholder="e.g. Nestle" value={brandName} onChange={(e) => setBrandName(e.target.value)} required />
          <Input label="Description (Optional)" placeholder="Brand details" value={brandDesc} onChange={(e) => setBrandDesc(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsBrandModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Brand</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
