import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Barcode,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Clock,
  User,
  PauseCircle,
  PlayCircle,
  Printer,
  CheckCircle,
  RotateCcw,
  Sparkles,
  Layers,
  Percent,
  X,
  AlertTriangle,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Feedback';
import api from '@/lib/axios';

interface CartItem {
  id: string; // product id
  name: string;
  sku: string;
  barcode?: string;
  sellingPrice: number;
  costPrice: number;
  unit: string;
  quantity: number;
  discountAmount: number;
}

interface CustomerType {
  id: string;
  firstName: string;
  lastName?: string;
  phone: string;
  balance: number;
  loyaltyPoints: number;
}

export const POSPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Scanner
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState<string>('0');
  const [orderNotes, setOrderNotes] = useState('');

  // Modals State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isHoldTrayOpen, setIsHoldTrayOpen] = useState(false);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Completed Sale for Receipt
  const [completedSale, setCompletedSale] = useState<any>(null);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'split' | 'debt'>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [cardTendered, setCardTendered] = useState<string>('');
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitCard, setSplitCard] = useState<string>('');

  // Shift Form State
  const [openingBalance, setOpeningBalance] = useState('0');
  const [closingBalance, setClosingBalance] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');

  // New Customer Form State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // 1. Fetch Current Active Shift
  const { data: currentShift, isLoading: isShiftLoading } = useQuery({
    queryKey: ['current-shift'],
    queryFn: async () => {
      const res = await api.get('/shifts/current');
      return res.data.data;
    },
  });

  // 2. Fetch Branches
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data.data;
    },
  });

  const activeBranch = branches[0];

  // 3. Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
  });

  // 4. Fetch Products for POS
  const { data: productData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['pos-products', selectedCategoryId, searchQuery],
    queryFn: async () => {
      const params: any = { limit: 100 };
      if (selectedCategoryId !== 'all') params.categoryId = selectedCategoryId;
      if (searchQuery) params.search = searchQuery;
      const res = await api.get('/products', { params });
      return res.data.data;
    },
  });

  const products: any[] = productData || [];

  // 5. Fetch Customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data.data;
    },
  });

  // 6. Fetch Held Sales
  const { data: heldSales = [] } = useQuery({
    queryKey: ['held-sales'],
    queryFn: async () => {
      const res = await api.get('/sales/held');
      return res.data.data;
    },
  });

  // Focus scanner on mount and after actions
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Keyboard Shortcuts (F2: Pay, F4: Hold, Esc: Clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) openPaymentModal();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) handleHoldSale();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Cart Calculations
  const subtotal = cart.reduce(
    (acc, item) => acc + item.quantity * item.sellingPrice - item.discountAmount,
    0
  );
  const discount = Number(globalDiscount) || 0;
  const grandTotal = Math.max(0, subtotal - discount);

  // Add product to cart
  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            sku: product.sku || '',
            barcode: product.barcode || '',
            sellingPrice: Number(product.sellingPrice),
            costPrice: Number(product.costPrice) || 0,
            unit: product.unit || 'dona',
            quantity: 1,
            discountAmount: 0,
          },
        ];
      }
    });
    barcodeInputRef.current?.focus();
  };

  // Update item quantity
  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: qty } : item))
    );
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  // Clear Cart
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setGlobalDiscount('0');
    setOrderNotes('');
    barcodeInputRef.current?.focus();
  };

  // Handle barcode search / scanner submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    // Find exact match by barcode or SKU or name
    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === query) ||
        (p.sku && p.sku.toLowerCase() === query) ||
        p.name.toLowerCase() === query
    );

    if (found) {
      addToCart(found);
      setSearchQuery('');
      toast.success(`"${found.name}" savatchaga qo‘shildi`);
    } else if (products.length === 1) {
      addToCart(products[0]);
      setSearchQuery('');
      toast.success(`"${products[0].name}" savatchaga qo‘shildi`);
    } else {
      toast.error('Mahsulot topilmadi');
    }
  };

  // Open Payment Modal
  const openPaymentModal = () => {
    if (!currentShift) {
      toast.error('Avval kassa smenasini oching!');
      setIsOpenShiftModalOpen(true);
      return;
    }
    setPaymentMethod('cash');
    setCashTendered(String(grandTotal));
    setCardTendered(String(grandTotal));
    setSplitCash(String(Math.floor(grandTotal / 2)));
    setSplitCard(String(grandTotal - Math.floor(grandTotal / 2)));
    setIsPaymentModalOpen(true);
  };

  // 7. Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/sales/checkout', payload);
      return res.data.data;
    },
    onSuccess: (sale) => {
      setCompletedSale(sale);
      setIsPaymentModalOpen(false);
      clearCart();
      setIsReceiptModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ['current-shift'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      toast.success('Sotuv muvaffaqiyatli amalga oshirildi!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'To‘lovni amalga oshirishda xatolik');
    },
  });

  const handleConfirmPayment = () => {
    let payments: any[] = [];

    if (paymentMethod === 'cash') {
      const cashAmt = Number(cashTendered) || grandTotal;
      payments.push({ method: 'cash', amount: cashAmt });
    } else if (paymentMethod === 'card') {
      payments.push({ method: 'card', amount: grandTotal });
    } else if (paymentMethod === 'split') {
      const c = Number(splitCash) || 0;
      const k = Number(splitCard) || 0;
      if (c > 0) payments.push({ method: 'cash', amount: c });
      if (k > 0) payments.push({ method: 'card', amount: k });
    } else if (paymentMethod === 'debt') {
      if (!selectedCustomer) {
        toast.error('Nasiya savdo uchun mijoz tanlanishi shart');
        return;
      }
      payments.push({ method: 'cash', amount: 0 }); // 100% debt
    }

    checkoutMutation.mutate({
      branchId: activeBranch?.id,
      customerId: selectedCustomer?.id,
      shiftId: currentShift?.id,
      items: cart.map((it) => ({
        productId: it.id,
        quantity: it.quantity,
        unitPrice: it.sellingPrice,
        discountAmount: it.discountAmount,
      })),
      discountAmount: discount,
      payments,
      notes: orderNotes,
    });
  };

  // 8. Hold Sale Mutation
  const holdMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/sales/hold', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['held-sales'] });
      clearCart();
      toast.success('Chek muvaffaqiyatli kechiktirildi');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Chekni kechiktirishda xatolik');
    },
  });

  const handleHoldSale = () => {
    if (cart.length === 0) return;
    holdMutation.mutate({
      branchId: activeBranch?.id,
      customerId: selectedCustomer?.id,
      shiftId: currentShift?.id,
      items: cart.map((it) => ({
        productId: it.id,
        quantity: it.quantity,
        unitPrice: it.sellingPrice,
      })),
      notes: orderNotes || 'Kechiktirilgan chek',
    });
  };

  // 9. Resume Held Sale
  const resumeMutation = useMutation({
    mutationFn: async (heldId: string) => {
      const res = await api.post(`/sales/${heldId}/resume`);
      return res.data.data;
    },
    onSuccess: (resumed) => {
      queryClient.invalidateQueries({ queryKey: ['held-sales'] });
      // Restore items to cart
      const restoredItems: CartItem[] = (resumed.items || []).map((it: any) => ({
        id: it.productId,
        name: it.product?.name || 'Mahsulot',
        sku: it.product?.sku || '',
        sellingPrice: Number(it.unitPrice),
        costPrice: 0,
        unit: it.unit || 'dona',
        quantity: Number(it.quantity),
        discountAmount: Number(it.discountAmount) || 0,
      }));
      setCart(restoredItems);
      if (resumed.customer) setSelectedCustomer(resumed.customer);
      setIsHoldTrayOpen(false);
      toast.success('Kechiktirilgan chek savatchaga yuklandi');
    },
  });

  // 10. Open Shift Mutation
  const openShiftMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/shifts/open', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-shift'] });
      setIsOpenShiftModalOpen(false);
      toast.success('Kassa smenasi ochildi. Savdo boshlandi!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Smenani ochishda xatolik');
    },
  });

  // 11. Close Shift Mutation
  const closeShiftMutation = useMutation({
    mutationFn: async ({ shiftId, payload }: { shiftId: string; payload: any }) => {
      const res = await api.post(`/shifts/${shiftId}/close`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-shift'] });
      setIsCloseShiftModalOpen(false);
      toast.success('Kassa smenasi muvaffaqiyatli yopildi');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Smenani yopishda xatolik');
    },
  });

  // 12. Create Customer Mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/customers', payload);
      return res.data.data;
    },
    onSuccess: (newCust) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomer(newCust);
      setIsCustomerModalOpen(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      toast.success('Yangi mijoz qo‘shildi va tanlandi');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Mijoz yaratishda xatolik');
    },
  });

  // Change / Qaytim calculation
  const cashAmountNum = Number(cashTendered) || grandTotal;
  const changeAmount = Math.max(0, cashAmountNum - grandTotal);

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-3 -m-4 sm:-m-6 p-3 sm:p-4 bg-gray-100 overflow-hidden select-none">
      {/* Top Banner: Shift & Branch Info */}
      <div className="bg-white px-4 py-2 rounded-xl shadow-xs border border-gray-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-800">
              {activeBranch?.name || 'Asosiy filial'}
            </span>
          </div>

          <div className="h-4 w-px bg-gray-200" />

          {currentShift ? (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Smena ochiq: <strong>{new Date(currentShift.openedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</strong>
              </span>
              <span className="text-gray-400">|</span>
              <span>Kassa: <strong>{currentShift.register?.name || 'Kassa 1'}</strong></span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Kassa smenasi yopiq</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {heldSales.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHoldTrayOpen(true)}
              className="h-8 text-xs font-bold text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 gap-1.5"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              Kechiktirilgan ({heldSales.length})
            </Button>
          )}

          {currentShift ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCloseShiftModalOpen(true)}
              className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              Smenani yopish
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsOpenShiftModalOpen(true)}
              className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Smenani ochish
            </Button>
          )}
        </div>
      </div>

      {/* Main Split Grid: Left Catalog (60%) | Right Cart & Checkout (40%) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* LEFT COLUMN: Product Catalog & Search (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-xl shadow-xs border border-gray-200/80 p-3 overflow-hidden">
          {/* Scanner / Search Input */}
          <form onSubmit={handleBarcodeSubmit} className="mb-3 shrink-0">
            <div className="relative">
              <Barcode className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Shtrix-kod skaneri yoki mahsulot nomi / SKU bo‘yicha qidiruv (Enter)..."
                className="w-full pl-11 pr-24 py-2.5 text-sm font-medium bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition"
              >
                Qidirish
              </button>
            </div>
          </form>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 shrink-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                selectedCategoryId === 'all'
                  ? 'bg-[#1e3a5f] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Barcha mahsulotlar
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategoryId === cat.id
                    ? 'bg-[#1e3a5f] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {isProductsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <Skeleton key={n} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Search className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-600">Mahsulot topilmadi</p>
                <p className="text-xs text-gray-400 mt-0.5">Qidiruv so‘zini o‘zgartirib ko‘ring</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-1">
                {products.map((p) => {
                  const inCartItem = cart.find((it) => it.id === p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className={`relative group bg-white border rounded-xl p-2.5 cursor-pointer flex flex-col justify-between hover:border-emerald-500 hover:shadow-md transition-all active:scale-[0.98] ${
                        inCartItem ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-50/10' : 'border-gray-200'
                      }`}
                    >
                      {inCartItem && (
                        <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                          {inCartItem.quantity}
                        </span>
                      )}

                      <div>
                        <div className="text-[10px] font-mono text-gray-400 truncate">
                          {p.sku || p.barcode || 'Kod yo‘q'}
                        </div>
                        <h4 className="text-xs font-bold text-gray-900 mt-0.5 line-clamp-2 leading-tight">
                          {p.name}
                        </h4>
                      </div>

                      <div className="mt-2 pt-1 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-600">
                          {Number(p.sellingPrice).toLocaleString()} UZS
                        </span>
                        <span className="text-[10px] text-gray-400">/{p.unit || 'dona'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Cart & Checkout (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-xl shadow-xs border border-gray-200/80 p-3 overflow-hidden">
          {/* Cart Header & Customer Selector */}
          <div className="border-b border-gray-100 pb-2.5 mb-2 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span>Savatcha ({cart.length})</span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-0.5 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Tozalash
                </button>
              )}
            </div>

            {/* Customer Dropdown with Add New button */}
            <div className="flex items-center gap-1.5">
              <div className="flex-1 relative">
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const cust = customers.find((c: any) => c.id === e.target.value);
                    setSelectedCustomer(cust || null);
                  }}
                  className="w-full text-xs font-medium rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 outline-none focus:bg-white focus:border-emerald-500"
                >
                  <option value="">Oddiy xaridor (Tanlanmagan)</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName || ''} ({c.phone})
                      {Number(c.balance) > 0 ? ` — Qarz: ${Number(c.balance).toLocaleString()} UZS` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="p-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs"
                title="Yangi mijoz qo‘shish"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {selectedCustomer && (
              <div className="mt-1 flex items-center justify-between text-[11px] px-1 text-gray-500">
                <span>
                  Sodiqlik ballari: <strong className="text-amber-600">{selectedCustomer.loyaltyPoints || 0}</strong>
                </span>
                <span>
                  Qarzdorlik:{' '}
                  <strong className={Number(selectedCustomer.balance) > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    {Number(selectedCustomer.balance || 0).toLocaleString()} UZS
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Cart Item Rows (Scrollable) */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <ShoppingCart className="w-12 h-12 stroke-1 mb-2 text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">Savatcha bo‘sh</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                  Mahsulotlarni shtrix-kod skaneri orqali o‘qing yoki chap tarafdagi ro‘yxatdan tanlang
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50/75 border border-gray-100 rounded-lg p-2 flex items-center justify-between gap-2 hover:bg-gray-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-gray-900 truncate">{item.name}</h5>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {item.sellingPrice.toLocaleString()} UZS × {item.quantity} {item.unit}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-1 py-0.5">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-gray-100 rounded text-gray-600"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-gray-100 rounded text-gray-600"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Total & Delete */}
                  <div className="text-right min-w-[70px]">
                    <div className="text-xs font-bold text-gray-900">
                      {(item.quantity * item.sellingPrice).toLocaleString()} UZS
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 text-gray-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Financial Summary & Payment Action */}
          <div className="border-t border-gray-100 pt-2.5 mt-2 space-y-2 shrink-0">
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Oraliq summa:</span>
                <span className="font-semibold text-gray-900">{subtotal.toLocaleString()} UZS</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Chegirma:</span>
                <div className="w-28">
                  <Input
                    type="number"
                    min="0"
                    value={globalDiscount}
                    onChange={(e) => setGlobalDiscount(e.target.value)}
                    className="h-7 text-xs text-right"
                  />
                </div>
              </div>
            </div>

            {/* Big Grand Total Display */}
            <div className="bg-[#1e3a5f] text-white p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-300 uppercase tracking-wider font-semibold">
                  Jami to‘lov summasi
                </span>
                <div className="text-xl font-black tracking-tight text-emerald-400">
                  {grandTotal.toLocaleString()} UZS
                </div>
              </div>

              <div className="text-right text-[10px] text-gray-300">
                <span>Hotkeys: F2 - To‘lov | F4 - Hold</span>
              </div>
            </div>

            {/* Action Buttons: Hold | Pay */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleHoldSale}
                disabled={cart.length === 0}
                className="h-10 text-xs font-bold text-amber-700 border-amber-200 hover:bg-amber-50"
              >
                <PauseCircle className="w-4 h-4 mr-1" />
                Kechiktirish
              </Button>

              <Button
                size="sm"
                onClick={openPaymentModal}
                disabled={cart.length === 0}
                className="col-span-2 h-10 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                TO‘LOV (F2)
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Payment Checkout Dialog */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="To‘lovni qabul qilish"
        size="lg"
      >
        <div className="space-y-4">
          {/* Big Amount Due Header */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Jami to‘lanishi kerak
            </span>
            <h2 className="text-3xl font-black text-emerald-700 mt-0.5">
              {grandTotal.toLocaleString()} UZS
            </h2>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'cash', label: 'Naqd pul', icon: Banknote },
              { id: 'card', label: 'Plastik karta', icon: CreditCard },
              { id: 'split', label: 'Aralash (Split)', icon: Layers },
              { id: 'debt', label: 'Nasiya / Qarz', icon: AlertTriangle },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold ${
                    paymentMethod === m.id
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-xs'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cash Payment Tab */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Mijoz bergan summa (UZS)</label>
                <Input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="text-lg font-bold text-gray-900"
                />
              </div>

              {/* Quick Cash Denomination Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[grandTotal, 10000, 20000, 50000, 100000, 200000].map((denom, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCashTendered(String(denom))}
                    className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:border-emerald-300"
                  >
                    {denom === grandTotal ? 'Aniq summa' : `+${denom.toLocaleString()} UZS`}
                  </button>
                ))}
              </div>

              {/* Change / Qaytim display */}
              <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Mijozga qaytim:</span>
                <span className="text-lg font-black text-blue-600">
                  {changeAmount.toLocaleString()} UZS
                </span>
              </div>
            </div>
          )}

          {/* Card Payment Tab */}
          {paymentMethod === 'card' && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center space-y-2">
              <CreditCard className="w-8 h-8 text-blue-600 mx-auto" />
              <h4 className="text-sm font-bold text-gray-800">Bank terminali (Humo / Uzcard)</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Mijozdan <strong>{grandTotal.toLocaleString()} UZS</strong> terminal orqali qabul qilinganini tasdiqlang.
              </p>
            </div>
          )}

          {/* Split Payment Tab */}
          {paymentMethod === 'split' && (
            <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Naqd qismi (UZS)</label>
                  <Input
                    type="number"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    className="text-sm font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Karta qismi (UZS)</label>
                  <Input
                    type="number"
                    value={splitCard}
                    onChange={(e) => setSplitCard(e.target.value)}
                    className="text-sm font-bold"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500 flex justify-between">
                <span>Yig‘indi: {(Number(splitCash) + Number(splitCard)).toLocaleString()} UZS</span>
                <span>Kerakli: {grandTotal.toLocaleString()} UZS</span>
              </div>
            </div>
          )}

          {/* Debt Payment Tab */}
          {paymentMethod === 'debt' && (
            <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Nasiya (qarzga) savdoni rasmiylashtirish</span>
              </div>
              {selectedCustomer ? (
                <p className="text-xs text-rose-700">
                  Mijoz: <strong>{selectedCustomer.firstName} {selectedCustomer.lastName || ''}</strong> ({selectedCustomer.phone})
                  hisobiga <strong>{grandTotal.toLocaleString()} UZS</strong> qarz qo‘shiladi.
                </p>
              ) : (
                <p className="text-xs font-semibold text-rose-600">
                  ⚠️ Nasiya savdoni amalga oshirish uchun avval mijozni tanlang!
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleConfirmPayment}
              isLoading={checkoutMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold"
            >
              To‘lovni yakunlash
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Receipt Preview & Printing */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Savdo cheki (58mm / 80mm)"
        size="md"
      >
        {completedSale && (
          <div className="space-y-4">
            {/* Printable Thermal Receipt Container */}
            <div
              id="printable-receipt"
              className="bg-white p-4 border border-dashed border-gray-300 rounded-lg font-mono text-xs text-gray-800 space-y-2.5 max-w-sm mx-auto shadow-inner"
            >
              <div className="text-center border-b border-gray-200 pb-2">
                <h3 className="text-sm font-black text-gray-900 tracking-wider">SMARTPOS SHOP</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">{completedSale.branch?.name || 'Markaziy filial'}</p>
                <p className="text-[10px] text-gray-500">{completedSale.branch?.phone || '+998 71 200 00 00'}</p>
              </div>

              <div className="flex justify-between text-[10px] text-gray-500">
                <span>Chek: {completedSale.saleNumber}</span>
                <span>{new Date(completedSale.createdAt).toLocaleDateString('uz-UZ')}</span>
              </div>

              {completedSale.customer && (
                <div className="text-[10px] text-gray-600">
                  Mijoz: {completedSale.customer.firstName} {completedSale.customer.lastName || ''}
                </div>
              )}

              {/* Items List */}
              <div className="border-t border-b border-gray-200 py-1.5 space-y-1">
                {completedSale.items?.map((it: any) => (
                  <div key={it.id} className="flex justify-between text-[11px]">
                    <div className="truncate max-w-[170px]">
                      {it.product?.name || 'Mahsulot'}
                      <div className="text-[9px] text-gray-400">
                        {it.quantity} × {Number(it.unitPrice).toLocaleString()}
                      </div>
                    </div>
                    <span className="font-bold">{Number(it.totalPrice).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Receipt Totals */}
              <div className="space-y-0.5 text-right text-[11px]">
                <div className="flex justify-between">
                  <span>Oraliq summa:</span>
                  <span>{Number(completedSale.subtotal).toLocaleString()} UZS</span>
                </div>
                {Number(completedSale.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Chegirma:</span>
                    <span>-{Number(completedSale.discountAmount).toLocaleString()} UZS</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-gray-900 pt-1 border-t">
                  <span>JAMI:</span>
                  <span>{Number(completedSale.totalAmount).toLocaleString()} UZS</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>To‘landi:</span>
                  <span>{Number(completedSale.paidAmount).toLocaleString()} UZS</span>
                </div>
                {Number(completedSale.changeAmount) > 0 && (
                  <div className="flex justify-between text-[10px] font-bold text-blue-600">
                    <span>Qaytim:</span>
                    <span>{Number(completedSale.changeAmount).toLocaleString()} UZS</span>
                  </div>
                )}
                {Number(completedSale.debtAmount) > 0 && (
                  <div className="flex justify-between text-[10px] font-bold text-rose-600">
                    <span>Qarz (Nasiya):</span>
                    <span>{Number(completedSale.debtAmount).toLocaleString()} UZS</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-2 border-t border-gray-200 text-[10px] text-gray-500">
                <p>Xaridingiz uchun rahmat!</p>
                <p className="text-[8px] text-gray-400 mt-0.5">SMARTPOS SaaS Platform</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  window.print();
                }}
                className="gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Chop etish
              </Button>
              <Button
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setCompletedSale(null);
                  barcodeInputRef.current?.focus();
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Yangi sotuv
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Held Sales Tray */}
      <Modal
        isOpen={isHoldTrayOpen}
        onClose={() => setIsHoldTrayOpen(false)}
        title="Kechiktirilgan cheklar ro‘yxati"
        size="lg"
      >
        <div className="space-y-3">
          {heldSales.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-6">Kechiktirilgan cheklar mavjud emas</p>
          ) : (
            heldSales.map((sale: any) => (
              <div
                key={sale.id}
                className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-gray-900">
                    Chek: {sale.saleNumber} ({sale.items?.length || 0} ta mahsulot)
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Summa: <strong>{Number(sale.totalAmount).toLocaleString()} UZS</strong> | Vaqti:{' '}
                    {new Date(sale.createdAt).toLocaleTimeString('uz-UZ')}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => resumeMutation.mutate(sale.id)}
                  isLoading={resumeMutation.isPending}
                  className="text-xs gap-1"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  Savatchaga yuklash
                </Button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* MODAL 4: Open Cashier Shift */}
      <Modal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        title="Kassa smenasini ochish"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            openShiftMutation.mutate({
              branchId: activeBranch?.id,
              openingBalance: Number(openingBalance) || 0,
              notes: shiftNotes,
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Kassadagi boshlang‘ich naqd pul (UZS)</label>
            <Input
              type="number"
              min="0"
              placeholder="Masalan: 100000"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Izoh</label>
            <Input
              placeholder="Ertalabki smena..."
              value={shiftNotes}
              onChange={(e) => setShiftNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsOpenShiftModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={openShiftMutation.isPending}>
              Smenani ochish
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: Close Cashier Shift */}
      <Modal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
        title="Kassa smenasini yopish"
      >
        {currentShift && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              closeShiftMutation.mutate({
                shiftId: currentShift.id,
                payload: {
                  closingBalance: Number(closingBalance) || 0,
                  notes: shiftNotes,
                },
              });
            }}
            className="space-y-4"
          >
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Boshlang‘ich qoldiq:</span>
                <span className="font-bold">{Number(currentShift.openingBalance).toLocaleString()} UZS</span>
              </div>
              <div className="flex justify-between">
                <span>Jami sotuvlar:</span>
                <span className="font-bold text-emerald-600">
                  {Number(currentShift.totalSales || 0).toLocaleString()} UZS
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Kassadagi yakuniy haqiqiy naqd pul (UZS) *</label>
              <Input
                type="number"
                min="0"
                placeholder="Hisoblangan naqd pulni kiriting..."
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Smena yakuni bo‘yicha izoh</label>
              <Input
                placeholder="Kunlik tushum topshirildi..."
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCloseShiftModalOpen(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" isLoading={closeShiftMutation.isPending} className="bg-rose-600 hover:bg-rose-700">
                Smenani yopish
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 6: Add Quick Customer */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Yangi mijoz qo‘shish"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newCustomerName || !newCustomerPhone) {
              toast.error('Ism va telefon raqam kiritilishi shart');
              return;
            }
            createCustomerMutation.mutate({
              firstName: newCustomerName,
              phone: newCustomerPhone,
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Mijoz ismi *</label>
            <Input
              placeholder="Masalan: Dilshod"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Telefon raqam *</label>
            <Input
              placeholder="+998 90 123 45 67"
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCustomerModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={createCustomerMutation.isPending}>
              Saqlash va tanlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
