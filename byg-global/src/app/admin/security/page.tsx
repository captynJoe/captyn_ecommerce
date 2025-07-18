"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { 
  Shield, 
  Search, 
  Eye,
  Edit,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Package
} from "lucide-react";

interface SecurityProduct {
  id: string;
  name: string;
  category: 'hardware' | 'software' | 'books' | 'certification';
  type: string;
  price: number;
  description: string;
  legalStatus: 'approved' | 'pending' | 'restricted';
  popularity: number;
  searchCount: number;
  lastUpdated: string;
  tags: string[];
}

export default function AdminSecurity() {
  const { isDark } = useApp();
  const [products, setProducts] = useState<SecurityProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    // Simulate loading security products data
    const loadSecurityProducts = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for security tools
        setProducts([
          {
            id: "SEC-001",
            name: "USB Rubber Ducky",
            category: "hardware",
            type: "Keystroke Injection Tool",
            price: 89,
            description: "USB device for automated keystroke injection and penetration testing",
            legalStatus: "approved",
            popularity: 95,
            searchCount: 1247,
            lastUpdated: "2024-01-15",
            tags: ["penetration-testing", "keystroke-injection", "usb", "hak5"]
          },
          {
            id: "SEC-002",
            name: "Flipper Zero",
            category: "hardware",
            type: "Multi-tool Device",
            price: 169,
            description: "Portable multi-tool for pentesters and geeks with RFID, NFC, and more",
            legalStatus: "approved",
            popularity: 92,
            searchCount: 2156,
            lastUpdated: "2024-01-14",
            tags: ["rfid", "nfc", "sub-ghz", "infrared", "multi-tool"]
          },
          {
            id: "SEC-003",
            name: "WiFi Pineapple",
            category: "hardware",
            type: "Wireless Auditing Platform",
            price: 199,
            description: "Wireless network auditing and penetration testing platform",
            legalStatus: "approved",
            popularity: 88,
            searchCount: 892,
            lastUpdated: "2024-01-13",
            tags: ["wifi", "wireless", "auditing", "mitm", "hak5"]
          },
          {
            id: "SEC-004",
            name: "Proxmark3",
            category: "hardware",
            type: "RFID Research Tool",
            price: 299,
            description: "Advanced RFID research and cloning tool for security professionals",
            legalStatus: "pending",
            popularity: 76,
            searchCount: 543,
            lastUpdated: "2024-01-12",
            tags: ["rfid", "cloning", "research", "125khz", "13.56mhz"]
          },
          {
            id: "SEC-005",
            name: "Kali Linux Revealed",
            category: "books",
            type: "Educational Book",
            price: 45,
            description: "Comprehensive guide to Kali Linux for penetration testing",
            legalStatus: "approved",
            popularity: 84,
            searchCount: 1876,
            lastUpdated: "2024-01-11",
            tags: ["kali-linux", "penetration-testing", "education", "book"]
          },
          {
            id: "SEC-006",
            name: "OSCP Certification",
            category: "certification",
            type: "Professional Certification",
            price: 1499,
            description: "Offensive Security Certified Professional certification course",
            legalStatus: "approved",
            popularity: 97,
            searchCount: 3421,
            lastUpdated: "2024-01-10",
            tags: ["oscp", "certification", "offensive-security", "training"]
          },
          {
            id: "SEC-007",
            name: "HackRF One",
            category: "hardware",
            type: "Software Defined Radio",
            price: 349,
            description: "Software Defined Radio platform for RF analysis and research",
            legalStatus: "restricted",
            popularity: 71,
            searchCount: 234,
            lastUpdated: "2024-01-09",
            tags: ["sdr", "rf", "radio", "research", "gnu-radio"]
          },
          {
            id: "SEC-008",
            name: "Burp Suite Professional",
            category: "software",
            type: "Web Security Testing",
            price: 399,
            description: "Advanced web vulnerability scanner and testing platform",
            legalStatus: "approved",
            popularity: 89,
            searchCount: 1654,
            lastUpdated: "2024-01-08",
            tags: ["web-security", "vulnerability-scanner", "burp-suite", "portswigger"]
          }
        ]);
      } catch (error) {
        console.error("Error loading security products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSecurityProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    const matchesStatus = filterStatus === "all" || product.legalStatus === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'restricted':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hardware':
        return <Package className="w-4 h-4" />;
      case 'software':
        return <Shield className="w-4 h-4" />;
      case 'books':
        return <Eye className="w-4 h-4" />;
      case 'certification':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
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
            Security Tools Management
          </h1>
          <p className={`text-sm ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}>
            Manage security tools, penetration testing equipment, and educational resources
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          Add Security Tool
        </button>
      </div>

      {/* Legal Notice */}
      <div className={`p-4 rounded-lg border-l-4 border-orange-500 ${
        isDark ? "bg-orange-900/20" : "bg-orange-50"
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className={`font-semibold ${
            isDark ? "text-orange-400" : "text-orange-800"
          }`}>
            Legal Compliance Notice
          </h3>
        </div>
        <p className={`text-sm ${
          isDark ? "text-orange-300" : "text-orange-700"
        }`}>
          All security tools must be approved for legitimate educational, research, or authorized penetration testing purposes only. 
          Tools intended for malicious activities are strictly prohibited.
        </p>
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
                Total Tools
              </p>
              <p className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {products.length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-blue-600" />
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
                Approved Tools
              </p>
              <p className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {products.filter(p => p.legalStatus === 'approved').length}
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
                Pending Review
              </p>
              <p className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {products.filter(p => p.legalStatus === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
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
                Total Searches
              </p>
              <p className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {products.reduce((sum, p) => sum + p.searchCount, 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
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
                placeholder="Search security tools..."
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
            <option value="hardware">Hardware</option>
            <option value="software">Software</option>
            <option value="books">Books</option>
            <option value="certification">Certifications</option>
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
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="restricted">Restricted</option>
          </select>
        </div>
      </div>

      {/* Security Tools Table */}
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
                  Tool
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
                  Popularity
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? "text-gray-300" : "text-gray-500"
                }`}>
                  Searches
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
                      <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${
                        isDark ? "bg-gray-600" : "bg-gray-200"
                      } flex items-center justify-center`}>
                        {getCategoryIcon(product.category)}
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}>
                          {product.name}
                        </div>
                        <div className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {product.type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                      isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                    }`}>
                      {getCategoryIcon(product.category)}
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
                      getStatusColor(product.legalStatus)
                    }`}>
                      {product.legalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2`}>
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${product.popularity}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}>
                        {product.popularity}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${
                      isDark ? "text-gray-300" : "text-gray-900"
                    }`}>
                      {product.searchCount.toLocaleString()}
                    </span>
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
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            No security tools found
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
