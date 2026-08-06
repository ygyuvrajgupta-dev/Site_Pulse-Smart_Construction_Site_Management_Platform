import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FiBox, FiGrid, FiHome, FiTrendingUp, FiShoppingCart,
  FiTruck, FiBarcode, FiQrCode, FiPlus, FiSearch
} from 'react-icons/fi';
import api from '@/services/axios';

const INVENTORY_API = '/api/v1/inventory';

function InventoryPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FiGrid },
    { id: 'products', label: 'Products', icon: FiBox },
    { id: 'categories', label: 'Categories', icon: FiGrid },
    { id: 'warehouses', label: 'Warehouses', icon: FiHome },
    { id: 'stock', label: 'Stock', icon: FiTrendingUp },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: FiShoppingCart },
    { id: 'suppliers', label: 'Suppliers', icon: FiTruck },
    { id: 'barcode', label: 'Barcode', icon: FiBarcode },
    { id: 'qr-code', label: 'QR Code', icon: FiQrCode },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage products, stock, warehouses, and suppliers
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-secondary text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'warehouses' && <WarehousesTab />}
        {activeTab === 'stock' && <StockTab />}
        {activeTab === 'purchase-orders' && <PurchaseOrdersTab />}
        {activeTab === 'suppliers' && <SuppliersTab />}
        {activeTab === 'barcode' && <BarcodeTab />}
        {activeTab === 'qr-code' && <QrCodeTab />}
      </div>
    </div>
  );
}

function DashboardTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['inventoryStats'],
    queryFn: async () => {
      const response = await api.get(`${INVENTORY_API}/stats`);
      return response.data.data;
    },
  });

  const statCards = [
    { label: 'Total Products', value: stats?.totalProducts || 0, icon: FiBox, color: 'bg-blue-100 text-blue-600' },
    { label: 'Categories', value: stats?.totalCategories || 0, icon: FiGrid, color: 'bg-green-100 text-green-600' },
    { label: 'Warehouses', value: stats?.totalWarehouses || 0, icon: FiHome, color: 'bg-purple-100 text-purple-600' },
    { label: 'Suppliers', value: stats?.totalSuppliers || 0, icon: FiTruck, color: 'bg-orange-100 text-orange-600' },
    { label: 'Purchase Orders', value: stats?.totalPurchaseOrders || 0, icon: FiShoppingCart, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: FiShoppingCart, color: 'bg-red-100 text-red-600' },
    { label: 'Stock In', value: stats?.totalStockIn || 0, icon: FiTrendingUp, color: 'bg-green-100 text-green-600' },
    { label: 'Stock Out', value: stats?.totalStockOut || 0, icon: FiTrendingUp, color: 'bg-red-100 text-red-600' },
  ];

  if (isLoading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="card">
            <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function ProductsTab() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['inventoryProducts', search],
    queryFn: async () => {
      const response = await api.get(`${INVENTORY_API}/products`, { params: { search } });
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Products</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {(data?.products || []).map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary text-white flex items-center justify-center">
                          <FiBox className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          {product.description && <p className="text-sm text-gray-500">{product.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.sku || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.category?.name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.type?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.unitPrice ? `${product.currency} ${Number(product.unitPrice).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.barcode || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventoryCategories'],
    queryFn: async () => {
      const response = await api.get(`${INVENTORY_API}/categories`);
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Categories</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data || []).map((category) => (
            <div key={category.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">{category.name}</h4>
                <span className="px-2 py-1 text-xs font-medium bg-secondary text-white rounded-full">
                  {category._count?.products || 0} products
                </span>
              </div>
              {category.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WarehousesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventoryWarehouses'],
    queryFn: async () => {
      const response = await api.get(`${INVENTORY_API}/warehouses`);
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Warehouses</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Add Warehouse
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data || []).map((warehouse) => (
            <div key={warehouse.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">{warehouse.name}</h4>
                <span className="px-2 py-1 text-xs font-medium bg-secondary text-white rounded-full">
                  {warehouse._count?.stockMovements || 0} movements
                </span>
              </div>
              {warehouse.code && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Code: {warehouse.code}</p>}
              {warehouse.address && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {warehouse.address}, {warehouse.city}, {warehouse.state}
                </p>
              )}
              {warehouse.manager && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Manager: {warehouse.manager}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StockTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventoryStock'],
    queryFn: async () => {
      const response = await api.get(`${INVENTORY_API}/stock`);
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stock Movements</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Record Movement
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="card">
          {(!data || data.length === 0) ? (
            <div className="text-center py-8 text-gray-500">No stock movements.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {(data || []).map((movement) => (
                    <tr key={movement.id}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{movement.product?.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          movement.type === 'IN' ? 'bg-green-100 text-green-800' :
                          movement.type === 'OUT' ? 'bg-red-100 text-red-800' :
                          movement.type === 'ADJUSTMENT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {movement.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{movement.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{movement.warehouse?.name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(movement.movedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PurchaseOrdersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventoryPurchaseOrders'],
    queryFn: async () => {
      const response = await api.get(`${INVENTORY_API}/purchase-orders`);
      return response.data.data;
    },
  });

  function getStatusColor(status) {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'RECEIVED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Purchase Orders</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          New Purchase Order
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="card">
          {(!data || data.length === 0) ? (
            <div className="text-center py-8 text-gray-500">No purchase orders.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {(data || []).map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{order.orderNo}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.supplier?.name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.orderDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.items?.length || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.total ? `${order.currency} ${Number(order.total).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuppliersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventorySuppliers'],
    queryFn: async () => {
      const response = await api.get(`${INVENTORY_API}/suppliers`);
      return response.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Suppliers</h3>
        <button className="btn btn-primary">
          <FiPlus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data || []).map((supplier) => (
            <div key={supplier.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">{supplier.name}</h4>
                <span className="px-2 py-1 text-xs font-medium bg-secondary text-white rounded-full">
                  {supplier._count?.purchaseOrders || 0} orders
                </span>
              </div>
              {supplier.email && <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">✉️ {supplier.email}</p>}
              {supplier.phone && <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">📞 {supplier.phone}</p>}
              {supplier.address && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {supplier.address}, {supplier.city}, {supplier.state}
                </p>
              )}
              {supplier.paymentTerms && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Terms: {supplier.paymentTerms}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BarcodeTab() {
  return (
    <div className="card text-center py-12">
      <FiBarcode className="w-16 h-16 mx-auto mb-4 text-secondary opacity-50" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Barcode Scanner</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        Scan product barcodes to quickly look up inventory items
      </p>
      <button className="btn btn-primary">
        <FiBarcode className="w-4 h-4" />
        Start Scanning
      </button>
    </div>
  );
}

function QrCodeTab() {
  return (
    <div className="card text-center py-12">
      <FiQrCode className="w-16 h-16 mx-auto mb-4 text-secondary opacity-50" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">QR Code Generator</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        Generate QR codes for products to enable quick mobile scanning
      </p>
      <button className="btn btn-primary">
        <FiQrCode className="w-4 h-4" />
        Generate QR Code
      </button>
    </div>
  );
}

export default InventoryPage;