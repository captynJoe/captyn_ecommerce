"use client";

import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { 
  ShoppingBag, 
  Search, 
  Eye,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign
} from "lucide-react";

import { OrderStatus, PaymentStatus } from "@/types/orderStatus";

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  orderDate: string;
  shippingAddress: string;
  trackingNumber?: string;
}

export default function AdminOrders() {
  const { isDark } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [filterPayment, setFilterPayment] = useState<PaymentStatus | "all">("all");

  async function loadOrders() {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in real app, fetch from API
      setOrders([
        {
          id: "ORD-001",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          items: [
            { name: "iPhone 15 Pro", quantity: 1, price: 1299 },
            { name: "AirPods Pro", quantity: 1, price: 249 }
          ],
          total: 1548,
          status: OrderStatus.Delivered,
          paymentStatus: PaymentStatus.Paid,
          orderDate: "2024-01-15",
          shippingAddress: "123 Main St, Nairobi, Kenya",
          trackingNumber: "TRK123456789"
        },
        {
          id: "ORD-002",
          customerName: "Jane Smith",
          customerEmail: "jane@example.com",
          items: [
            { name: "USB Rubber Ducky", quantity: 2, price: 89 },
            { name: "Flipper Zero", quantity: 1, price: 169 }
          ],
          total: 347,
          status: OrderStatus.Shipped,
          paymentStatus: PaymentStatus.Paid,
          orderDate: "2024-01-14",
          shippingAddress: "456 Oak Ave, Mombasa, Kenya",
          trackingNumber: "TRK987654321"
        },
        {
          id: "ORD-003",
          customerName: "Mike Johnson",
          customerEmail: "mike@example.com",
          items: [
            { name: "MacBook Pro 16-inch", quantity: 1, price: 2499 }
          ],
          total: 2499,
          status: OrderStatus.Processing,
          paymentStatus: PaymentStatus.Paid,
          orderDate: "2024-01-13",
          shippingAddress: "789 Pine St, Kisumu, Kenya"
        },
        {
          id: "ORD-004",
          customerName: "Sarah Wilson",
          customerEmail: "sarah@example.com",
          items: [
            { name: "PlayStation 5", quantity: 1, price: 499 },
            { name: "PS5 Controller", quantity: 2, price: 69 }
          ],
          total: 637,
          status: OrderStatus.Pending,
          paymentStatus: PaymentStatus.Pending,
          orderDate: "2024-01-12",
          shippingAddress: "321 Elm St, Eldoret, Kenya"
        },
        {
          id: "ORD-005",
          customerName: "David Brown",
          customerEmail: "david@example.com",
          items: [
            { name: "WiFi Pineapple", quantity: 1, price: 199 }
          ],
          total: 199,
          status: OrderStatus.Cancelled,
          paymentStatus: PaymentStatus.Refunded,
          orderDate: "2024-01-11",
          shippingAddress: "654 Maple Dr, Nakuru, Kenya"
        }
      ]);
      setError(null);
    } catch (error) {
      console.error("Error loading orders:", error);
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || order.status === filterStatus;
      const matchesPayment = filterPayment === "all" || order.paymentStatus === filterPayment;
      
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchTerm, filterStatus, filterPayment]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.Delivered:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case OrderStatus.Shipped:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case OrderStatus.Processing:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case OrderStatus.Pending:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case OrderStatus.Cancelled:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.Paid:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case PaymentStatus.Pending:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case PaymentStatus.Failed:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case PaymentStatus.Refunded:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.Delivered:
        return <CheckCircle className="w-4 h-4" />;
      case OrderStatus.Shipped:
        return <Truck className="w-4 h-4" />;
      case OrderStatus.Processing:
        return <Package className="w-4 h-4" />;
      case OrderStatus.Pending:
        return <Clock className="w-4 h-4" />;
      case OrderStatus.Cancelled:
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>{error}</p>
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
            Orders Management
          </h1>
          <p className={`text-sm ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}>
            Track and manage customer orders
          </p>
        </div>
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
                Total Orders
              </p>
              <p className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {orders.length}
              </p>
            </div>
            <ShoppingBag className="w-8 h-8 text-blue-600" />
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
                Pending Orders
              </p>
              <p className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {orders.filter(o => o.status === OrderStatus.Pending).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
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
                Delivered
              </p>
              <p className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {orders.filter(o => o.status === OrderStatus.Delivered).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
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
                Total Revenue
              </p>
              <p className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                KSh {orders.filter(o => o.paymentStatus === PaymentStatus.Paid).reduce((sum, o) => sum + o.total, 0).toLocaleString()}
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
                placeholder="Search orders..."
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as OrderStatus | "all")}
            className={`px-4 py-2 border rounded-lg ${
              isDark 
                ? "bg-gray-700 border-gray-600 text-white" 
                : "bg-white border-gray-300 text-gray-900"
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Status</option>
            <option value={OrderStatus.Pending}>Pending</option>
            <option value={OrderStatus.Processing}>Processing</option>
            <option value={OrderStatus.Shipped}>Shipped</option>
            <option value={OrderStatus.Delivered}>Delivered</option>
            <option value={OrderStatus.Cancelled}>Cancelled</option>
          </select>

          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value as PaymentStatus | "all")}
            className={`px-4 py-2 border rounded-lg ${
              isDark 
                ? "bg-gray-700 border-gray-600 text-white" 
                : "bg-white border-gray-300 text-gray-900"
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Payments</option>
            <option value={PaymentStatus.Paid}>Paid</option>
            <option value={PaymentStatus.Pending}>Pending</option>
            <option value={PaymentStatus.Failed}>Failed</option>
            <option value={PaymentStatus.Refunded}>Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
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
                  Order
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? "text-gray-300" : "text-gray-500"
                }`}>
                  Customer
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? "text-gray-300" : "text-gray-500"
                }`}>
                  Items
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? "text-gray-300" : "text-gray-500"
                }`}>
                  Total
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? "text-gray-300" : "text-gray-500"
                }`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? "text-gray-300" : "text-gray-500"
                }`}>
                  Payment
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
              {filteredOrders.map((order) => (
                <tr key={order.id} className={`hover:${
                  isDark ? "bg-gray-700" : "bg-gray-50"
                } transition-colors`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className={`text-sm font-medium ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}>
                        {order.id}
                      </div>
                      <div className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}>
                        {order.orderDate}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className={`text-sm font-medium ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}>
                        {order.customerName}
                      </div>
                      <div className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}>
                        {order.customerEmail}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {order.items.map((item, index) => (
                        <div key={index} className={`${
                          isDark ? "text-gray-300" : "text-gray-900"
                        }`}>
                          {item.quantity}x {item.name}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}>
                      KSh {order.total.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                      getStatusColor(order.status)
                    }`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getPaymentStatusColor(order.paymentStatus)
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            No orders found
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
