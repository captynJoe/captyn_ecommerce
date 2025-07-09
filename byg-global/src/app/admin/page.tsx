"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { 
  ShoppingBag, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Eye,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  monthlyGrowth: number;
}

export default function AdminDashboard() {
  const { isDark } = useApp();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0,
    completedOrders: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      try {
        // In a real app, you'd fetch this from your API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalOrders: 1247,
          totalUsers: 3456,
          totalRevenue: 125000,
          totalProducts: 892,
          pendingOrders: 23,
          completedOrders: 1224,
          monthlyGrowth: 12.5
        });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    change 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    color: string; 
    change?: string;
  }) => (
    <div className={`p-6 rounded-xl border ${
      isDark 
        ? "bg-gray-800 border-gray-700" 
        : "bg-white border-gray-200"
    } shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            {value}
          </p>
          {change && (
            <p className="text-sm text-green-600 mt-1">
              +{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

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
            Admin Dashboard
          </h1>
          <p className={`text-sm ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}>
            Welcome back! Here's what's happening with your store.
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg ${
          isDark ? "bg-green-900/20 text-green-400" : "bg-green-100 text-green-700"
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">System Online</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`KSh ${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-green-500"
          change={stats.monthlyGrowth.toString()}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={ShoppingBag}
          color="bg-blue-500"
          change="8.2"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          color="bg-purple-500"
          change="15.3"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          icon={Package}
          color="bg-orange-500"
          change="5.7"
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className={`p-6 rounded-xl border ${
          isDark 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        } shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
              <Package className="w-5 h-5" />
              <span>Add New Product</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors">
              <Eye className="w-5 h-5" />
              <span>View All Orders</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors">
              <Users className="w-5 h-5" />
              <span>Manage Users</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors">
              <TrendingUp className="w-5 h-5" />
              <span>View Analytics</span>
            </button>
          </div>
        </div>

        {/* Order Status */}
        <div className={`p-6 rounded-xl border ${
          isDark 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        } shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            Order Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                  Pending Orders
                </span>
              </div>
              <span className={`font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {stats.pendingOrders}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                  Completed Orders
                </span>
              </div>
              <span className={`font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {stats.completedOrders}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}>
                  Completion Rate
                </span>
                <span className="text-green-600 font-semibold">
                  {((stats.completedOrders / stats.totalOrders) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`p-6 rounded-xl border ${
        isDark 
          ? "bg-gray-800 border-gray-700" 
          : "bg-white border-gray-200"
      } shadow-sm`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          isDark ? "text-white" : "text-gray-900"
        }`}>
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[ 
            { action: "New order #1247 received", time: "2 minutes ago", type: "order" },
            { action: "User John Doe registered", time: "15 minutes ago", type: "user" },
            { action: "Product 'iPhone 15 Pro' updated", time: "1 hour ago", type: "product" },
            { action: "Payment of KSh 45,000 processed", time: "2 hours ago", type: "payment" },
            { action: "New security search performed", time: "3 hours ago", type: "search" }
          ].map((activity, index) => (
            <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
              isDark ? "bg-gray-700/50" : "bg-gray-50"
            }`}>
              <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                {activity.action}
              </span>
              <span className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}>
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
