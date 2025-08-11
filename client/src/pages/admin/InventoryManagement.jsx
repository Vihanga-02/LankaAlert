import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Minus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  BarChart3
} from 'lucide-react';

const InventoryManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const inventoryItems = [
    {
      id: 1,
      name: 'Rice',
      category: 'Food',
      currentStock: 500,
      unit: 'kg',
      minThreshold: 100,
      maxCapacity: 1000,
      lastUpdated: '2024-01-26 09:00 AM',
      supplier: 'Lanka Rice Mills',
      location: 'Warehouse A',
      expiryDate: '2024-06-15',
      status: 'Good Stock'
    },
    {
      id: 2,
      name: 'Dhal',
      category: 'Food',
      currentStock: 75,
      unit: 'kg',
      minThreshold: 80,
      maxCapacity: 500,
      lastUpdated: '2024-01-26 08:30 AM',
      supplier: 'Ceylon Dhal Company',
      location: 'Warehouse A',
      expiryDate: '2024-08-20',
      status: 'Low Stock'
    },
    {
      id: 3,
      name: 'Milk Powder',
      category: 'Food',
      currentStock: 200,
      unit: 'packets',
      minThreshold: 50,
      maxCapacity: 400,
      lastUpdated: '2024-01-26 07:45 AM',
      supplier: 'Highland Milk',
      location: 'Warehouse B',
      expiryDate: '2024-04-10',
      status: 'Good Stock'
    },
    {
      id: 4,
      name: 'Biscuits',
      category: 'Food',
      currentStock: 150,
      unit: 'packets',
      minThreshold: 100,
      maxCapacity: 300,
      lastUpdated: '2024-01-26 06:15 AM',
      supplier: 'Munchee Biscuits',
      location: 'Warehouse B',
      expiryDate: '2024-03-25',
      status: 'Good Stock'
    },
    {
      id: 5,
      name: 'Paracetamol',
      category: 'Medicine',
      currentStock: 20,
      unit: 'bottles',
      minThreshold: 30,
      maxCapacity: 100,
      lastUpdated: '2024-01-26 05:30 AM',
      supplier: 'State Pharmaceuticals',
      location: 'Medical Storage',
      expiryDate: '2024-12-31',
      status: 'Critical Low'
    },
    {
      id: 6,
      name: 'Bandages',
      category: 'Medicine',
      currentStock: 80,
      unit: 'rolls',
      minThreshold: 40,
      maxCapacity: 150,
      lastUpdated: '2024-01-26 04:45 AM',
      supplier: 'Medical Supplies Ltd',
      location: 'Medical Storage',
      expiryDate: '2025-01-15',
      status: 'Good Stock'
    },
    {
      id: 7,
      name: 'Water Purification Tablets',
      category: 'Water & Sanitation',
      currentStock: 500,
      unit: 'tablets',
      minThreshold: 200,
      maxCapacity: 1000,
      lastUpdated: '2024-01-26 03:30 AM',
      supplier: 'Water Tech Solutions',
      location: 'Warehouse C',
      expiryDate: '2025-06-30',
      status: 'Good Stock'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Items', count: inventoryItems.length },
    { id: 'food', name: 'Food', count: inventoryItems.filter(item => item.category === 'Food').length },
    { id: 'medicine', name: 'Medicine', count: inventoryItems.filter(item => item.category === 'Medicine').length },
    { id: 'water', name: 'Water & Sanitation', count: inventoryItems.filter(item => item.category === 'Water & Sanitation').length }
  ];

  const recentMovements = [
    {
      id: 1,
      item: 'Rice',
      type: 'Out',
      quantity: 50,
      unit: 'kg',
      reason: 'Emergency distribution - Colombo flood victims',
      timestamp: '2024-01-26 08:30 AM',
      user: 'Sunil Fernando'
    },
    {
      id: 2,
      item: 'Milk Powder',
      type: 'In',
      quantity: 100,
      unit: 'packets',
      reason: 'New stock arrival',
      timestamp: '2024-01-26 07:00 AM',
      user: 'Admin User'
    },
    {
      id: 3,
      item: 'Paracetamol',
      type: 'Out',
      quantity: 10,
      unit: 'bottles',
      reason: 'Medical assistance - Kandy landslide',
      timestamp: '2024-01-25 16:45 PM',
      user: 'Priya Jayawardena'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Good Stock': return 'bg-green-100 text-green-800';
      case 'Low Stock': return 'bg-orange-100 text-orange-800';
      case 'Critical Low': return 'bg-red-100 text-red-800';
      case 'Out of Stock': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockPercentage = (current, max) => {
    return (current / max) * 100;
  };

  const getFilteredItems = () => {
    let filtered = inventoryItems;
    
    if (activeTab !== 'all') {
      const categoryMap = {
        'food': 'Food',
        'medicine': 'Medicine',
        'water': 'Water & Sanitation'
      };
      filtered = filtered.filter(item => item.category === categoryMap[activeTab]);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const totalValue = inventoryItems.length;
  const lowStockItems = inventoryItems.filter(item => 
    item.status === 'Low Stock' || item.status === 'Critical Low'
  ).length;
  const criticalItems = inventoryItems.filter(item => item.status === 'Critical Low').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="mt-2 text-gray-600">Track and manage emergency supplies and resources</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <BarChart3 className="h-5 w-5 mr-2" />
              Analytics
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="h-5 w-5 mr-2" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-semibold text-gray-900">{totalValue}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-semibold text-gray-900">{lowStockItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Critical Low</p>
              <p className="text-2xl font-semibold text-gray-900">{criticalItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Restocked Today</p>
              <p className="text-2xl font-semibold text-gray-900">3</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Inventory List */}
        <div className="lg:col-span-3">
          {/* Category Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveTab(category.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === category.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {category.name}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs">
                    {category.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5 mr-2 text-gray-400" />
              Filter
            </button>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredItems().map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.currentStock} {item.unit}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              getStockPercentage(item.currentStock, item.maxCapacity) > 50 ? 'bg-green-500' :
                              getStockPercentage(item.currentStock, item.maxCapacity) > 20 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ 
                              width: `${Math.min(getStockPercentage(item.currentStock, item.maxCapacity), 100)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Min: {item.minThreshold} {item.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="p-1 text-blue-600 hover:text-blue-900">
                            <Plus className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-orange-600 hover:text-orange-900">
                            <Minus className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-600 hover:text-gray-900">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar - Recent Movements */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
              </button>
              <button className="w-full inline-flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                <Minus className="h-4 w-4 mr-2" />
                Remove Stock
              </button>
              <button className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </button>
            </div>
          </div>

          {/* Recent Movements */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Movements</h3>
            <div className="space-y-4">
              {recentMovements.map((movement) => (
                <div key={movement.id} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900">{movement.item}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      movement.type === 'In' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {movement.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {movement.quantity} {movement.unit}
                  </p>
                  <p className="text-xs text-gray-500">{movement.reason}</p>
                  <p className="text-xs text-gray-400">{movement.timestamp}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Alerts</h3>
            <div className="space-y-3">
              {inventoryItems.filter(item => item.status === 'Low Stock' || item.status === 'Critical Low').map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.currentStock} {item.unit} remaining</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;