"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Star,
  DollarSign
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  condition: string;
  category: string;
  seller: string;
  rating: number;
  image: string;
  status: 'active' | 'inactive' | 'pending';
}

export default function AdminProducts() {
  const { isDark } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    // Simulate loading products data
    const loadProducts = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - in real app, fetch from API
        setProducts([
          {
            id: "1",
            title: "iPhone 15 Pro Max 256GB",
            price: 1299,
            condition: "New",
            category: "Phones",
            seller: "Apple Store",
            rating: 4.8,
            image: "/placeholder-image.jpg",
            status: "active"
          },
          {
            id: "2", 
            title: "MacBook Pro 16-inch M3",
            price: 2499,
            condition: "New",
            category: "Laptops",
            seller: "Apple Store",
            rating: 4.9,
            image: "/placeholder-image.jpg",
            status: "active"
          },
          {
            id: "3",
            title: "USB Rubber Ducky",
            price: 89,
            condition: "New",
            category: "Security",
            seller: "Hak5",
            rating: 4.7,
            image: "/placeholder-image.jpg",
            status: "active"
          },
          {
            id: "4",
            title: "Flipper Zero",
            price: 169,
            condition: "New", 
            category: "Security",
            seller: "Flipper Devices",
            rating: 4.6,
            image: "/placeholder-image.jpg",
            status: "pending"
          },
          {
            id: "5",
            title: "PlayStation 5 Console",
            price: 499,
            condition: "New",
            category: "Gaming",
            seller: "Sony",
            rating: 4.5,
            image: "/placeholder-image.jpg",
            status: "inactive"
          }
        ]);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.seller.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || product.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesStatus = filterStatus === "all" || product.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            Products Management
          </h1>
          <p className={`text-sm ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}>
            Manage your product catalog and inventory
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`p-6 rounded-xl border ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                Total Products
              </p>
              <p className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {products.length}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                Active Products
              </p>
              <p className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {products.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                Pending Review
              </p>
              <p className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {products.filter(p => p.status === 'pending').length}
              </p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                Total Value
              </p>
              <p className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                ${products.reduce((sum, p) => sum + p.price, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-6 rounded-xl border ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } shadow-sm`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                  isDark 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`px-4 py-2 border rounded-lg ${
              isDark 
                ? "bg-gray-700 border-gray-600 text-white" 
                : "bg-white border-gray-300 text-gray-900"
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Categories</option>
            <option value="phones">Phones</option>
            <option value="laptops">Laptops</option>
            <option value="security">Security</option>
            <option value="gaming">Gaming</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 border rounded-lg ${
              isDark 
                ? "bg-gray-700 border-gray-600 text-white" 
                : "bg-white border-gray-300 text-gray-900"
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className={`rounded-xl border ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${
              isDark ? "bg-gray-700" : "bg-gray-50"
            }`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? "text-gray-300" : "text-gray-500"
                }`}>
                  Product
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? "text-gray-300" : "text-gray-500"
                }`}>
                  Category
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? "text-gray-300" : "text-gray-500"
                }`}>
                  Price
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? "text-gray-300" : "text-gray-500"
                }`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? "text-gray-300" : "text-gray-500"
                }`}>
                  Rating
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? "text-gray-300" : "text-gray-500"
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDark ? "divide-gray-700" : "divide-gray-200"
            }`}>
              {filteredProducts.map((product) => (
                <tr key={product.id} className={`hover:${
                  isDark ? "bg-gray-700" : "bg-gray-50"
                } transition-colors`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className={`h-10 w-10 rounded-lg ${
                          isDark ? "bg-gray-600" : "bg-gray-200"
                        } flex items-center justify-center`}>
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}>
                          {product.title}
                        </div>
                        <div className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {product.seller}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${
                      isDark ? "text-gray-300" : "text-gray-900"
                    }`}>
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}>
                      ${product.price}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getStatusColor(product.status)
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className={`ml-1 text-sm ${
                        isDark ? "text-gray-300" : "text-gray-900"
                      }`}>
                        {product.rating}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            No products found
          </h3>
          <p className={`text-sm ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}>
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
