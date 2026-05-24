import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { categories, monthlySales } from './inventoryData';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  ClipboardList,
  Download,
  Edit3,
  Home,
  LogOut,
  Mail,
  MapPin,
  Package,
  PackagePlus,
  Phone,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  TrendingUp,
  User,
  Warehouse,
} from 'lucide-react';
import {
  clearSession,
  createOrder,
  createProduct,
  deleteOrder,
  fetchOrders,
  fetchProducts,
  resetSampleProducts,
  updateOrder,
} from './api';
import ThemeToggle from './ThemeToggle';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'add', label: 'Add Product', icon: PackagePlus },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'reports', label: 'Reports', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const categoryColors = ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

const emptyForm = {
  sku: '',
  name: '',
  category: categories[0],
  stock: '',
  reorderLevel: '',
  price: '',
  cost: '',
};

const emptyOrderForm = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  productSku: '',
  quantity: '1',
  status: 'Completed',
};

function currency(value) {
  return `Rs. ${Math.round(value).toLocaleString('en-IN')}`;
}

function readStoredProfile() {
  try {
    return JSON.parse(localStorage.getItem('stockProfile') || '{}');
  } catch {
    return {};
  }
}

function getStatus(product) {
  if (Number(product.stock) === 0) {
    return {
      label: 'Out of Stock',
      badge: 'bg-red-100 text-red-700',
      panel: 'border-red-200 bg-red-50 text-red-800',
    };
  }

  if (Number(product.stock) <= Number(product.reorderLevel)) {
    return {
      label: 'Low Stock',
      badge: 'bg-amber-100 text-amber-700',
      panel: 'border-amber-200 bg-amber-50 text-amber-800',
    };
  }

  return {
    label: 'In Stock',
    badge: 'bg-emerald-100 text-emerald-700',
    panel: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  };
}

export default function InventoryDashboard({ setPage, theme, toggleTheme }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [form, setForm] = useState(emptyForm);
  const [orderForm, setOrderForm] = useState(emptyOrderForm);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingOrderSnapshot, setEditingOrderSnapshot] = useState(null);
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile] = useState(readStoredProfile);

  const handleApiError = useCallback((error) => {
    if (error.status === 401) {
      clearSession();
      if (typeof setPage === 'function') setPage('login');
      return;
    }

    setMessage(error.message || 'Something went wrong while talking to the backend.');
  }, [setPage]);

  const loadWorkspace = useCallback(async ({ showLoading = true, seedIfEmpty = true } = {}) => {
    if (showLoading) setIsLoading(true);

    try {
      let nextProducts = await fetchProducts();
      let seeded = false;

      if (seedIfEmpty && nextProducts.length === 0) {
        const resetResult = await resetSampleProducts();
        nextProducts = resetResult.products || [];
        seeded = true;
      }

      const nextOrders = await fetchOrders();
      setProducts(nextProducts);
      setOrders(nextOrders);

      if (seeded) {
        setMessage('Sample products loaded into MongoDB.');
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!orderForm.productSku && products.length > 0) {
      setOrderForm((current) => ({ ...current, productSku: products[0].sku }));
    }
  }, [orderForm.productSku, products]);

  const axisColor = theme === 'dark' ? '#cbd5e1' : '#64748b';
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
    border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
    borderRadius: '12px',
    color: theme === 'dark' ? '#f8fafc' : '#0f172a',
  };

  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, product) => sum + Number(product.stock), 0);
    const inventoryValue = products.reduce((sum, product) => sum + Number(product.stock) * Number(product.price), 0);
    const purchaseValue = products.reduce((sum, product) => sum + Number(product.stock) * Number(product.cost), 0);
    const lowStock = products.filter((product) => product.stock <= product.reorderLevel).length;
    const topProduct = [...products].sort((a, b) => b.sold - a.sold)[0];

    return {
      totalProducts,
      totalUnits,
      inventoryValue,
      purchaseValue,
      lowStock,
      topProduct,
      profitPotential: inventoryValue - purchaseValue,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const search = searchTerm.toLowerCase();
      const status = getStatus(product).label;
      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search);
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, selectedStatus]);

  const categoryData = useMemo(() => {
    return categories
      .map((category) => {
        const items = products.filter((product) => product.category === category);
        return {
          category,
          units: items.reduce((sum, product) => sum + Number(product.stock), 0),
          value: items.reduce((sum, product) => sum + Number(product.stock) * Number(product.price), 0),
        };
      })
      .filter((item) => item.units > 0);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return [...products]
      .filter((product) => product.stock <= product.reorderLevel)
      .sort((a, b) => a.stock - b.stock);
  }, [products]);

  const selectedOrderProduct = useMemo(() => {
    return products.find((product) => product.sku === orderForm.productSku) || products[0];
  }, [orderForm.productSku, products]);

  const orderQuantity = Math.max(0, Number(orderForm.quantity) || 0);
  const orderTotal = selectedOrderProduct ? selectedOrderProduct.price * orderQuantity : 0;
  const availableStock = selectedOrderProduct
    ? Number(selectedOrderProduct.stock) + (editingOrderSnapshot?.productSku === selectedOrderProduct.sku ? Number(editingOrderSnapshot.quantity) : 0)
    : 0;

  const resetInventory = async () => {
    setIsSaving(true);

    try {
      const resetResult = await resetSampleProducts();
      setProducts(resetResult.products || []);
      setOrders([]);
      setEditingOrderId(null);
      setEditingOrderSnapshot(null);
      setMessage(resetResult.message || 'Inventory reset to sample stock data.');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleAddProduct = async (event) => {
    event.preventDefault();

    const requiredFields = ['sku', 'name', 'stock', 'reorderLevel', 'price', 'cost'];
    if (requiredFields.some((field) => String(form[field]).trim() === '')) {
      setMessage('Please fill all product fields before saving.');
      return;
    }

    setIsSaving(true);

    try {
      const nextProduct = await createProduct({
        sku: form.sku.trim().toUpperCase(),
        name: form.name.trim(),
        category: form.category,
        stock: Number(form.stock),
        reorderLevel: Number(form.reorderLevel),
        price: Number(form.price),
        cost: Number(form.cost),
        sold: 0,
        updatedAt: new Date().toISOString().slice(0, 10),
      });

      setProducts((current) => [nextProduct, ...current]);
      setForm(emptyForm);
      setMessage(`${nextProduct.name} added to MongoDB inventory.`);
      setActiveTab('inventory');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOrderFormChange = (event) => {
    const { name, value } = event.target;
    setOrderForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateOrder = async (event) => {
    event.preventDefault();

    const requiredFields = ['customerName', 'customerEmail', 'customerPhone', 'productSku', 'quantity'];
    if (requiredFields.some((field) => String(orderForm[field]).trim() === '')) {
      setMessage('Please fill all order fields before creating an order.');
      return;
    }

    if (!selectedOrderProduct) {
      setMessage('Please add a product before creating an order.');
      return;
    }

    if (orderQuantity < 1) {
      setMessage('Order quantity must be at least 1.');
      return;
    }

    if (orderQuantity > availableStock) {
      setMessage(`Only ${availableStock} units available for ${selectedOrderProduct.name}.`);
      return;
    }

    const orderPayload = {
      customerName: orderForm.customerName.trim(),
      customerEmail: orderForm.customerEmail.trim(),
      customerPhone: orderForm.customerPhone.trim(),
      productSku: selectedOrderProduct.sku,
      quantity: orderQuantity,
      status: orderForm.status,
      date: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setIsSaving(true);

    try {
      const result = editingOrderId
        ? await updateOrder(editingOrderId, orderPayload)
        : await createOrder(orderPayload);

      await loadWorkspace({ showLoading: false, seedIfEmpty: false });
      setOrderForm({ ...emptyOrderForm, productSku: selectedOrderProduct.sku });
      setEditingOrderId(null);
      setEditingOrderSnapshot(null);
      setMessage(`${result.order.customerName}'s order ${editingOrderId ? 'updated' : 'created'} and inventory synced.`);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditOrder = (order) => {
    setOrderForm({
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      productSku: order.productSku,
      quantity: String(order.quantity),
      status: order.status,
    });
    setEditingOrderId(order.id);
    setEditingOrderSnapshot(order);
    setMessage('Order loaded for editing. Save it again to deduct inventory.');
  };

  const handleDeleteOrder = async (order) => {
    setIsSaving(true);

    try {
      await deleteOrder(order.id);
      await loadWorkspace({ showLoading: false, seedIfEmpty: false });

      if (editingOrderId === order.id) {
        setOrderForm(emptyOrderForm);
        setEditingOrderId(null);
        setEditingOrderSnapshot(null);
      }

      setMessage(`${order.customerName}'s order deleted and inventory restored.`);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const exportCsv = () => {
    const header = ['SKU', 'Name', 'Category', 'Stock', 'Reorder Level', 'Price', 'Cost', 'Status'];
    const rows = products.map((product) => [
      product.sku,
      product.name,
      product.category,
      product.stock,
      product.reorderLevel,
      product.price,
      product.cost,
      getStatus(product).label,
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'stockwise-inventory.csv';
    link.click();
    URL.revokeObjectURL(url);
    setMessage('CSV export downloaded.');
  };

  const handleBack = () => {
    if (typeof setPage === 'function') setPage('login');
  };

  const handleLogout = () => {
    clearSession();
    if (typeof setPage === 'function') setPage('login');
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              title="Back to login"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="rounded-2xl bg-blue-600 p-3 text-white">
              <Warehouse className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Inventory-&-Stock-management</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Products, orders, reports, low-stock alerts, and CSV export.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Home className="h-4 w-4" /> Login
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-4 w-4" />
              {lowStockProducts.length} stock alerts
            </div>
            <p className="mt-2 text-xs leading-5">Items at or below reorder level need purchase action.</p>
          </div>
        </aside>

        <section className="space-y-6">
          {message && (
            <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              <span>{message}</span>
              <button type="button" onClick={() => setMessage('')} className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-100">
                Clear
              </button>
            </div>
          )}

          {isLoading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              Loading inventory from MongoDB...
            </div>
          )}

          {activeTab === 'dashboard' && (
            <>
              <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Package} label="Total Products" value={metrics.totalProducts} tone="blue" />
                <MetricCard icon={Warehouse} label="Stock Units" value={metrics.totalUnits} tone="emerald" />
                <MetricCard icon={TrendingUp} label="Inventory Value" value={currency(metrics.inventoryValue)} tone="violet" />
                <MetricCard icon={AlertTriangle} label="Low Stock" value={metrics.lowStock} tone="rose" />
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Card title="Stock by Category" subtitle="Available units grouped by product category.">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="category" tick={{ fill: axisColor, fontSize: 12 }} />
                        <YAxis tick={{ fill: axisColor }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="units" fill="#2563eb" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card title="Critical Stock Alerts" subtitle="Products that need restocking soon.">
                  <div className="space-y-3">
                    {lowStockProducts.length ? (
                      lowStockProducts.map((product) => (
                        <div key={product._id || product.id || product.sku} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold">{product.name}</p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{product.sku} - {product.category}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatus(product).badge}`}>{product.stock} left</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                        All products are above reorder level.
                      </div>
                    )}
                  </div>
                </Card>
              </section>

              <section className="grid gap-6 xl:grid-cols-3">
                <Card title="Top Product" subtitle="Best moving item by units sold.">
                  <div className="rounded-2xl bg-blue-50 p-5 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em]">Sales Leader</p>
                    <p className="mt-2 text-2xl font-bold">{metrics.topProduct?.name}</p>
                    <p className="mt-2 text-sm">{metrics.topProduct?.sold} units sold</p>
                  </div>
                </Card>
                <Card title="Profit Potential" subtitle="Estimated margin on current stock.">
                  <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em]">Value - Cost</p>
                    <p className="mt-2 text-2xl font-bold">{currency(metrics.profitPotential)}</p>
                    <p className="mt-2 text-sm">Based on current price and cost.</p>
                  </div>
                </Card>
                <Card title="Quick Actions" subtitle="Common inventory tasks.">
                  <div className="grid gap-3">
                    <button onClick={() => setActiveTab('add')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">
                      <PackagePlus className="h-4 w-4" /> Add Product
                    </button>
                    <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800">
                      <Download className="h-4 w-4" /> Export CSV
                    </button>
                  </div>
                </Card>
              </section>
            </>
          )}

          {activeTab === 'inventory' && (
            <InventoryTable
              products={filteredProducts}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
            />
          )}

          {activeTab === 'add' && (
            <Card title="Add Product" subtitle="Create a new product SKU with stock and reorder settings.">
              <form onSubmit={handleAddProduct} className="grid gap-4 md:grid-cols-2">
                <Input label="SKU Code" name="sku" value={form.sku} onChange={handleFormChange} placeholder="EL-MON-900" />
                <Input label="Product Name" name="name" value={form.name} onChange={handleFormChange} placeholder="LED Monitor" />
                <Select label="Category" name="category" value={form.category} onChange={handleFormChange} options={categories} />
                <Input label="Opening Stock" name="stock" type="number" value={form.stock} onChange={handleFormChange} placeholder="100" />
                <Input label="Reorder Level" name="reorderLevel" type="number" value={form.reorderLevel} onChange={handleFormChange} placeholder="25" />
                <Input label="Selling Price" name="price" type="number" value={form.price} onChange={handleFormChange} placeholder="1499" />
                <Input label="Cost Price" name="cost" type="number" value={form.cost} onChange={handleFormChange} placeholder="950" />
                <div className="flex items-end">
                  <button type="submit" disabled={isSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                    <PackagePlus className="h-5 w-5" /> {isSaving ? 'Saving...' : 'Save Product'}
                  </button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'orders' && (
            <section className="space-y-6">
              <Card title="Create Order" subtitle="Customer details and inventory deduction happen together.">
                <form onSubmit={handleCreateOrder} className="space-y-4">
                  <Input label="Customer Name" name="customerName" value={orderForm.customerName} onChange={handleOrderFormChange} />
                  <Input label="Customer Email" name="customerEmail" type="email" value={orderForm.customerEmail} onChange={handleOrderFormChange} />
                  <Input label="Customer Phone" name="customerPhone" value={orderForm.customerPhone} onChange={handleOrderFormChange} />

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Product</span>
                    <select
                      name="productSku"
                      value={orderForm.productSku}
                      onChange={handleOrderFormChange}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      {products.map((product) => (
                        <option key={product.sku} value={product.sku}>
                          {product.name} - {product.stock} in stock
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Quantity" name="quantity" type="number" min="1" value={orderForm.quantity} onChange={handleOrderFormChange} />
                    <Select label="Status" name="status" value={orderForm.status} onChange={handleOrderFormChange} options={['Completed', 'Pending', 'Processing']} />
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    <p>Unit price: {selectedOrderProduct ? currency(selectedOrderProduct.price) : currency(0)}</p>
                    <p>Available stock: {availableStock}</p>
                    <p>Order total: {currency(orderTotal)}</p>
                  </div>

                  <button type="submit" disabled={isSaving || !selectedOrderProduct} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                    <PackagePlus className="h-5 w-5" /> {isSaving ? 'Saving...' : editingOrderId ? 'Update Order' : 'Create Order'}
                  </button>
                </form>
              </Card>

              <Card title="Recent Orders" subtitle="Latest customer purchases with quick edit and delete actions.">
                <div className="space-y-4">
                  {orders.length ? (
                    orders.map((order) => (
                      <div key={order.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-bold text-slate-950 dark:text-white">{order.customerName}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{order.customerEmail}</p>
                            <p className="mt-4 text-sm font-semibold">{order.productName}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Qty: {order.quantity} | Total: {currency(order.amount)}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{order.date}</p>
                          </div>
                          <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditOrder(order)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-950/40 dark:text-blue-200"
                          >
                            <Edit3 className="h-4 w-4" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-950/40 dark:text-red-200"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                      No orders created yet.
                    </div>
                  )}
                </div>
              </Card>
            </section>
          )}

          {activeTab === 'reports' && (
            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card title="Sales vs Purchases" subtitle="Monthly movement overview.">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlySales}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                      <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} />
                      <YAxis tick={{ fill: axisColor }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value) => currency(value)} />
                      <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} name="Sales" />
                      <Line type="monotone" dataKey="purchases" stroke="#f59e0b" strokeWidth={3} name="Purchases" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Category Share" subtitle="Inventory units by category.">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="units" nameKey="category" innerRadius={60} outerRadius={105} paddingAngle={4}>
                        {categoryData.map((entry, index) => (
                          <Cell key={entry.category} fill={categoryColors[index % categoryColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </section>
          )}

          {activeTab === 'settings' && (
            <section className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-600 dark:text-blue-300">Workspace Settings</p>
                <h2 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">Customize your account and system preferences</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Manage your profile, password, notifications, theme, and contact details from one clean control center.</p>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <Card title="Profile Settings" subtitle="Keep your account details up to date.">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="space-y-3">
                    <input
                      value={profile.name || 'Inventory Admin'}
                      readOnly
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <input
                      value={profile.email || 'Example@gmail.com'}
                      readOnly
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                    />
                    <button type="button" className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700">
                      Save Profile
                    </button>
                  </div>
                </Card>

                <Card title="Change Password" subtitle="Use a secure password with at least 6 characters.">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Old Password"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <button type="button" className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700">
                      Update Password
                    </button>
                  </div>
                </Card>

                <Card title="Notifications" subtitle="Choose which updates you want to receive.">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold dark:bg-slate-950">
                      <input type="checkbox" defaultChecked className="h-4 w-4 accent-blue-600" />
                      Email Alerts
                    </label>
                    <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold dark:bg-slate-950">
                      <input type="checkbox" defaultChecked className="h-4 w-4 accent-blue-600" />
                      Low Stock Alerts
                    </label>
                  </div>
                </Card>

                <Card title="System Settings" subtitle="Export inventory data or restore sample workspace data.">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-700">
                        <Download className="h-4 w-4" /> Export CSV
                      </button>
                      <button onClick={resetInventory} disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800">
                        <RefreshCcw className="h-4 w-4" /> {isSaving ? 'Resetting...' : 'Reset Data'}
                      </button>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/20">
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-600 dark:text-blue-300">Contact Us</p>
                <h2 className="mt-3 text-xl font-bold text-slate-950 dark:text-white">Need help with the inventory system?</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Reach out for support, clarification, or coordination.</p>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white">Muskan Kumawat</h3>
                  <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                    <a href="mailto:muskankumawat224@gmail.com" className="inline-flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-300">
                      <Mail className="h-4 w-4 text-blue-600" /> muskankumawat224@gmail.com
                    </a>
                    <a href="tel:7597006011" className="inline-flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-300">
                      <Phone className="h-4 w-4 text-blue-600" /> 7597006011
                    </a>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <MapPin className="h-4 w-4 text-blue-600" /> Address
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Jaipur, Vaishali Nagar
                  </p>
                </div>
              </div>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-4">
        <div className={`rounded-2xl p-3 ${tones[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function InventoryTable({
  products,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
}) {
  return (
    <Card title="Inventory" subtitle="Search and filter product stock.">
      <div className="mb-5 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search SKU or product..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="All">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="All">All Status</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              <th className="py-3 pr-4">Product</th>
              <th className="py-3 pr-4">Category</th>
              <th className="py-3 pr-4">Stock</th>
              <th className="py-3 pr-4">Value</th>
              <th className="py-3 pr-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {products.map((product) => {
              const status = getStatus(product);

              return (
                <tr key={product._id || product.id || product.sku}>
                  <td className="py-4 pr-4">
                    <p className="font-semibold">{product.name}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{product.sku}</p>
                  </td>
                  <td className="py-4 pr-4">{product.category}</td>
                  <td className="py-4 pr-4">
                    <p className="font-bold">{product.stock}</p>
                  </td>
                  <td className="py-4 pr-4">{currency(product.stock * product.price)}</td>
                  <td className="py-4 pr-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.badge}`}>{status.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
          No products found for this filter.
        </div>
      )}
    </Card>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <input
        {...props}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
    </label>
  );
}

function Select({ label, options, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <select
        {...props}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
