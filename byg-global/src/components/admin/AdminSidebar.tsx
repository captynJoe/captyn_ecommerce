"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  Settings, 
  Shield,
  Tag,
  TrendingUp,
  FileText,
  LogOut
} from "lucide-react";

const AdminSidebar = () => {
  const pathname = usePathname();
  const { isDark } = useApp();

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/categories", label: "Categories", icon: Tag },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/security", label: "Security Tools", icon: Shield },
    { href: "/admin/reports", label: "Reports", icon: FileText },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className={`w-64 min-h-screen ${
      isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    } border-r`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <h2 className={`text-xl font-bold ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            Admin Panel
          </h2>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : isDark
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <button className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full ${
            isDark
              ? "text-gray-300 hover:bg-gray-700 hover:text-white"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          }`}>
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
