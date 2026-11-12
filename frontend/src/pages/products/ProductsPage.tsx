import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Download,
  Upload,
  Barcode as BarcodeIcon,
  Tag,
  Package,
  Trash2,
  Edit,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Skeleton, EmptyState } from '@/components/ui/Feedback';
import api from '@/lib/axios';

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters & State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Form state
  const initialForm = {
    name: '',
    categoryId: '',
    brandId: '',
    sku: '',
    barcode: '',
    purchasePrice: '',
    sellingPrice: '',
    wholesalePrice: '',
    minStockQty: '5',
    unit: 'dona',
  };
  const [formData, setFormData] = useState(initialForm);

  // 1. Fetch Products
  const { data: productData, isLoading } = useQuery({
    queryKey: ['products', page, search, selectedCategory, selectedBrand],
    queryFn: async () => {
      const params: any = { page, limit: 12 };
      if (search) params.search = search;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedBrand) params.brandId = selectedBrand;
      const res = await api.get('/products', { params });
      return res.data;
    },
  });

  // 2. Fetch Categories & Brands
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await api.get('/brands');
      return res.data.data;
    },
  });

  // 3. Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/products', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Yangi mahsulot yaratildi');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateOpen(false);
      setFormData(initialForm);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Mahsulot yaratishda xatolik');
    },
  });

  // 4. Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.put(`/products/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Mahsulot yangilandi');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingProduct(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Yangilashda xatolik');
    },
  });

  // 5. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      toast.success('Mahsulot arxivlandi');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'O‘chirishda xatolik');
    },
  });

  // 6. Excel Export
  const handleExport = async () => {
    try {
      toast.loading('Excel fayl shakllantirilmoqda...', { id: 'export' });
      const response = await api.get('/products/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `smartpos-products-${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel fayl yuklab olindi', { id: 'export' });
    } catch {
      toast.error('Excel eksportida xatolik', { id: 'export' });
    }
  };

  // 7. Excel Import
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Iltimos, Excel faylni tanlang');
      return;
    }
    const data = new FormData();
    data.append('file', importFile);

    try {
      toast.loading('Fayl import qilinmoqda...', { id: 'import' });
      const res = await api.post('/products/import/excel', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`${res.data.data.importedCount} ta mahsulot muvaffaqiyatli import qilindi!`, { id: 'import' });
      setIsImportOpen(false);
      setImportFile(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Importda xatolik', { id: 'import' });
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      categoryId: formData.categoryId || undefined,
      brandId: formData.brandId || undefined,
      sku: formData.sku || undefined,
      barcode: formData.barcode || undefined,
      purchasePrice: Number(formData.purchasePrice),
      sellingPrice: Number(formData.sellingPrice),
      wholesalePrice: formData.wholesalePrice ? Number(formData.wholesalePrice) : undefined,
      minStockQty: Number(formData.minStockQty),
      unit: formData.unit,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: editingProduct.id,
      payload: {
        name: editingProduct.name,
        categoryId: editingProduct.categoryId || undefined,
        brandId: editingProduct.brandId || undefined,
        sellingPrice: Number(editingProduct.sellingPrice),
        purchasePrice: Number(editingProduct.purchasePrice),
        wholesalePrice: editingProduct.wholesalePrice ? Number(editingProduct.wholesalePrice) : undefined,
        minStockQty: Number(editingProduct.minStockQty),
        unit: editingProduct.unit,
      },
    });
  };

  const formatUZS = (val: number) => new Intl.NumberFormat('uz-UZ').format(val) + ' UZS';

  const products = productData?.data || [];
  const meta = productData?.meta;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mahsulotlar katalogi</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Do‘kon tovarlari, narxlar, shtrix-kodlar va toifalar boshqaruvi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            leftIcon={<Download className="w-4 h-4 text-emerald-600" />}
          >
            Excel Eksport
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            leftIcon={<Upload className="w-4 h-4 text-blue-600" />}
          >
            Excel Import
          </Button>

          <Button
            variant="accent"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Yangi tovar
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card noPadding className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <Input
              placeholder="Tovar nomi, SKU yoki shtrix-kod bo‘yicha qidirish..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-700 outline-none focus:border-[#1e3a5f]"
            >
              <option value="">Barcha toifalar</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-700 outline-none focus:border-[#1e3a5f]"
            >
              <option value="">Barcha brendlar</option>
              {brands.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card noPadding className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Package className="w-10 h-10" />}
            title="Tovarlar topilmadi"
            description="Qidiruv parametrlari bo‘yicha mahsulot topilmadi yoki hali mahsulotlar kiritilmagan."
            action={
              <Button variant="accent" size="sm" onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Birinchi tovarni qo‘shish
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Mahsulot</th>
                  <th className="py-3.5 px-4">Shtrix-kod & SKU</th>
                  <th className="py-3.5 px-4">Kategoriya / Brend</th>
                  <th className="py-3.5 px-4 text-right">Xarid narxi</th>
                  <th className="py-3.5 px-4 text-right">Sotish narxi</th>
                  <th className="py-3.5 px-4 text-center">Birligi</th>
                  <th className="py-3.5 px-4 text-center">Holat</th>
                  <th className="py-3.5 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p: any) => {
                  const barcode = p.barcodes?.[0]?.barcode;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-tight">{p.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Min: {p.minStockQty} {p.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {barcode && (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded-md text-gray-700">
                              <BarcodeIcon className="w-3 h-3 text-gray-500" />
                              {barcode}
                            </span>
                          )}
                          <p className="font-mono text-[10px] text-gray-400">{p.sku}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-gray-800">{p.category?.name || '—'}</p>
                        <p className="text-[11px] text-gray-400">{p.brand?.name || ''}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right text-gray-600 font-medium">
                        {formatUZS(Number(p.purchasePrice))}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-emerald-600">
                          {formatUZS(Number(p.sellingPrice))}
                        </span>
                        {p.wholesalePrice && (
                          <p className="text-[10px] text-gray-400">
                            Ulgurji: {formatUZS(Number(p.wholesalePrice))}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-[11px]">
                          {p.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={p.isActive ? 'success' : 'danger'} size="sm">
                          {p.isActive ? 'Faol' : 'Nofaol'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingProduct(p)}
                            title="Tahrirlash"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Haqiqatan ham ushbu mahsulotni arxivlamoqchimisiz?')) {
                                deleteMutation.mutate(p.id);
                              }
                            }}
                            title="Arxivlash"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
            <span>
              Jami <strong>{meta.total}</strong> ta tovardan {(meta.page - 1) * meta.limit + 1}-
              {Math.min(meta.page * meta.limit, meta.total)} ko‘rsatilmoqda
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Oldingi
              </Button>
              <span className="px-2 font-medium">
                {meta.page} / {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Keyingi
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* CREATE PRODUCT MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Yangi mahsulot qo‘shish"
        subtitle="Mahsulot ma’lumotlari, narxlari va shtrix-kodini kiriting"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Mahsulot nomi *"
            required
            placeholder="Masalan: Coca-Cola Classic 1.5L"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kategoriya</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-700 outline-none focus:border-[#1e3a5f]"
              >
                <option value="">Toifani tanlang</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Brend</label>
              <select
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-700 outline-none focus:border-[#1e3a5f]"
              >
                <option value="">Brendni tanlang</option>
                {brands.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Shtrix-kod (bo‘sh qolsa avtomatik yaratiladi)"
              placeholder="Masalan: 4780001234567"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              leftIcon={<BarcodeIcon className="w-4 h-4" />}
            />
            <Input
              label="SKU (Artikul)"
              placeholder="Avtomatik generatsiya"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Xarid narxi (UZS) *"
              type="number"
              required
              placeholder="9500"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
            />
            <Input
              label="Sotish narxi (UZS) *"
              type="number"
              required
              placeholder="14000"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
            />
            <Input
              label="Ulgurji narxi (UZS)"
              type="number"
              placeholder="12500"
              value={formData.wholesalePrice}
              onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">O‘lchov birligi</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-700 outline-none focus:border-[#1e3a5f]"
              >
                <option value="dona">dona (shtuk)</option>
                <option value="kg">kg (kilogramm)</option>
                <option value="litr">litr</option>
                <option value="metr">metr</option>
                <option value="quti">quti (blok)</option>
              </select>
            </div>
            <Input
              label="Minimal ogohlantirish qoldig‘i"
              type="number"
              value={formData.minStockQty}
              onChange={(e) => setFormData({ ...formData, minStockQty: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsCreateOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="accent" size="md" type="submit" isLoading={createMutation.isPending}>
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <Modal
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          title="Mahsulotni tahrirlash"
          subtitle={editingProduct.sku}
          size="lg"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="Mahsulot nomi *"
              required
              value={editingProduct.name}
              onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kategoriya</label>
                <select
                  value={editingProduct.categoryId || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-700 outline-none focus:border-[#1e3a5f]"
                >
                  <option value="">Kategoriyasiz</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Brend</label>
                <select
                  value={editingProduct.brandId || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, brandId: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-700 outline-none focus:border-[#1e3a5f]"
                >
                  <option value="">Brendsiz</option>
                  {brands.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Xarid narxi (UZS) *"
                type="number"
                required
                value={editingProduct.purchasePrice}
                onChange={(e) => setEditingProduct({ ...editingProduct, purchasePrice: e.target.value })}
              />
              <Input
                label="Sotish narxi (UZS) *"
                type="number"
                required
                value={editingProduct.sellingPrice}
                onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: e.target.value })}
              />
              <Input
                label="Ulgurji narxi (UZS)"
                type="number"
                value={editingProduct.wholesalePrice || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, wholesalePrice: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">O‘lchov birligi</label>
                <select
                  value={editingProduct.unit}
                  onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-700 outline-none focus:border-[#1e3a5f]"
                >
                  <option value="dona">dona</option>
                  <option value="kg">kg</option>
                  <option value="litr">litr</option>
                  <option value="metr">metr</option>
                  <option value="quti">quti</option>
                </select>
              </div>
              <Input
                label="Minimal qoldiq"
                type="number"
                value={editingProduct.minStockQty}
                onChange={(e) => setEditingProduct({ ...editingProduct, minStockQty: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
              <Button variant="secondary" size="md" type="button" onClick={() => setEditingProduct(null)}>
                Bekor qilish
              </Button>
              <Button variant="accent" size="md" type="submit" isLoading={updateMutation.isPending}>
                Yangilash
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* EXCEL IMPORT MODAL */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Excel orqali tovarlarni import qilish"
        subtitle="XLSX yoki XLS formatdagi tovarlar ro‘yxatini yuklang"
        size="md"
      >
        <form onSubmit={handleImport} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl p-8 text-center transition-colors">
            <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <p className="text-xs font-semibold text-gray-700">
              {importFile ? importFile.name : 'Excel faylni tanlang yoki shu yerga tashlang'}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">.xlsx, .xls fayllar qabul qilinadi</p>
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              id="excel-file-input"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
            <label
              htmlFor="excel-file-input"
              className="mt-4 inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
            >
              Faylni tanlash
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-800">
            <strong>Eslatma:</strong> Jadval ustunlari: <code>Mahsulot nomi</code>, <code>Sotish narxi</code>, <code>Xarid narxi</code>, <code>Shtrix-kod</code> bo‘lishi tavsiya etiladi.
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsImportOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="accent" size="md" type="submit" disabled={!importFile}>
              Import qilish
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
