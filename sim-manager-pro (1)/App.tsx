import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from './hooks/useAppStore';
import { SimPackage, SaleOrder, InventoryProductStat, SaleOrderWithStats, SimPackageWithStats, CustomerWithStats } from './types';
import SimInventory from './components/SimInventory';
import SalesList from './components/SalesList';
import CashFlow from './components/CashFlow';
import Dashboard from './components/Dashboard';
import ProductManager from './components/ProductManager';
import CustomerCRM from './components/CustomerCRM';
import Reports from './components/Reports';
import DataManager from './components/DataManager';
import AccountSettings from './components/AccountSettings';
import { LayoutDashboard, Package, ShoppingCart, Wallet, Tags, Users, BarChart3, Settings, Loader2, UserCircle, Cpu, Bell, Search, ChevronDown, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './supabase';
import Login from './components/Login';

function SimManager() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<{ full_name: string; avatar_url: string } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setUserProfile(data);
      };
      fetchProfile();

      const channel = supabase
        .channel('profile_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => setUserProfile(payload.new as any)
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <Cpu className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-500 font-medium animte-pulse">Đang khởi động hệ thống...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const {
    fullData, packages, orders, transactions, simTypes, customers, loading: dataLoading,
    addPackage, addOrder, addTransaction, addSimType, addCustomer,
    deletePackage, deleteOrder, deleteTransaction, deleteSimType, deleteCustomer,
    updateCustomer, updateOrderDueDate, importFullData
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PRODUCTS' | 'INVENTORY' | 'SALES' | 'CASHFLOW' | 'CUSTOMERS' | 'REPORTS' | 'SYSTEM' | 'ACCOUNT'>('DASHBOARD');

  // --- Derived State & Calculations ---
  const inventoryStats: InventoryProductStat[] = useMemo(() => {
    return simTypes.map(type => {
      const productBatches = packages.filter(p => p.simTypeId === type.id);
      const totalImported = productBatches.reduce((sum, p) => sum + p.quantity, 0);
      const totalImportPrice = productBatches.reduce((sum, p) => sum + p.totalImportPrice, 0);
      const weightedAvgCost = totalImported > 0 ? Math.round(totalImportPrice / totalImported) : 0;

      const totalSold = orders.reduce((sum, o) => {
        let isMatch = false;
        if (o.simTypeId) {
          isMatch = o.simTypeId === type.id;
        } else if (o.simPackageId) {
          const pkg = packages.find(p => p.id === o.simPackageId);
          isMatch = pkg?.simTypeId === type.id;
        }
        return isMatch ? sum + o.quantity : sum;
      }, 0);

      const currentStock = totalImported - totalSold;

      return {
        simTypeId: type.id,
        name: type.name,
        totalImported,
        totalSold,
        currentStock,
        weightedAvgCost,
        status: currentStock <= 50 ? 'LOW_STOCK' : 'OK',
        batches: productBatches
      };
    });
  }, [simTypes, packages, orders]);

  const getOrderStats = (order: SaleOrder): SaleOrderWithStats => {
    let productName = 'Unknown';
    let costPerSim = 0;

    if (order.simTypeId) {
      const type = simTypes.find(t => t.id === order.simTypeId);
      const stats = inventoryStats.find(s => s.simTypeId === order.simTypeId);
      productName = type?.name || 'Unknown';
      costPerSim = stats?.weightedAvgCost || 0;
    } else if (order.simPackageId) {
      const pkg = packages.find(p => p.id === order.simPackageId);
      productName = pkg?.name || 'Unknown';
    }

    const totalAmount = order.quantity * order.salePrice;
    const cost = order.quantity * costPerSim;
    const profit = totalAmount - cost;

    const paidAmount = transactions
      .filter(t => t.saleOrderId === order.id && t.type === 'IN')
      .reduce((sum, t) => sum + t.amount, 0);

    const remaining = Math.max(0, totalAmount - paidAmount);

    let status: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
    if (remaining <= 0) status = 'PAID';
    else if (paidAmount > 0) status = 'PARTIAL';

    const isOverdue = remaining > 0 && order.dueDate ? new Date() > new Date(order.dueDate) : false;

    let debtLevel: 'NORMAL' | 'WARNING' | 'OVERDUE' | 'RECOVERY' = 'NORMAL';
    if (remaining > 0) {
      if ((order.dueDateChanges || 0) >= 4) debtLevel = 'RECOVERY';
      else if ((order.dueDateChanges || 0) === 3) debtLevel = 'WARNING';
      else if (isOverdue) debtLevel = 'OVERDUE';
    }

    const isBadDebt = debtLevel === 'RECOVERY';

    const customer = customers.find(c => c.id === order.customerId);
    const customerName = customer ? customer.name : order.agentName;

    return {
      ...order,
      productName,
      customerName,
      totalAmount,
      cost,
      profit,
      paidAmount,
      remaining,
      status,
      isOverdue,
      isBadDebt,
      debtLevel
    };
  };

  const orderStats = useMemo(() => orders.map(getOrderStats), [orders, packages, transactions, inventoryStats, customers]);

  const customerStats: CustomerWithStats[] = useMemo(() => {
    return customers.map(c => {
      const customerOrders = orderStats.filter(o => o.customerId === c.id);
      const gmv = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const currentDebt = customerOrders.reduce((sum, o) => sum + o.remaining, 0);
      const unpaidWithDate = customerOrders.filter(o => o.remaining > 0 && o.dueDate);
      const dates = unpaidWithDate.map(o => new Date(o.dueDate).getTime());
      const nextDueDate = dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : null;

      let worstDebtLevel: any = 'NORMAL';
      const levels = ['NORMAL', 'WARNING', 'OVERDUE', 'RECOVERY'];
      customerOrders.forEach(o => {
        if (levels.indexOf(o.debtLevel) > levels.indexOf(worstDebtLevel)) {
          worstDebtLevel = o.debtLevel;
        }
      });

      return { ...c, gmv, currentDebt, nextDueDate, worstDebtLevel };
    });
  }, [customers, orderStats]);

  const dashboardPackages = inventoryStats.map(stat => ({
    id: stat.simTypeId,
    code: 'AGG',
    name: stat.name,
    importDate: '',
    quantity: stat.totalImported,
    totalImportPrice: stat.weightedAvgCost * stat.totalImported,
    sold: stat.totalSold,
    stock: stat.currentStock,
    costPerSim: stat.weightedAvgCost,
    status: stat.status
  } as SimPackageWithStats));

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 flex flex-col">
      {/* --- Top Header --- */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Cpu className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-800 uppercase">Quản Lý SIM</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Edition</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nhanh..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <button className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 pr-3 hover:bg-slate-50 rounded-2xl transition-all"
            >
              <div className="w-9 h-9 rounded-xl border-2 border-white shadow-sm overflow-hidden bg-blue-50">
                <img src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 truncate max-w-[100px]">{userProfile?.full_name || user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Admin</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-slate-50 mb-1">
                    <p className="text-xs text-slate-400 font-medium">Đăng nhập với</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('ACCOUNT'); setIsProfileOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-all"
                  >
                    <UserCircle className="w-4 h-4" />
                    Hồ sơ cá nhân
                  </button>
                  <button
                    onClick={() => { setActiveTab('SYSTEM'); setIsProfileOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    Cài đặt hệ thống
                  </button>
                  <div className="h-[1px] bg-slate-50 my-1"></div>
                  <button
                    onClick={signOut}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-all font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* --- Sidebar Navigation --- */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:relative md:w-64 md:h-full md:border-r md:border-t-0 z-40 overflow-y-auto">
          <div className="flex md:flex-col h-full py-2 md:py-6 md:px-4">
            <div className="flex-1 flex md:flex-col justify-around md:justify-start md:gap-1.5">
              {[
                { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Tổng quan', color: 'text-blue-600', bg: 'bg-blue-50' },
                { id: 'REPORTS', icon: BarChart3, label: 'Báo cáo', color: 'text-rose-600', bg: 'bg-rose-50' },
                { id: 'CUSTOMERS', icon: Users, label: 'Khách Hàng', color: 'text-violet-600', bg: 'bg-violet-50' },
                { id: 'SALES', icon: ShoppingCart, label: 'Bán Hàng', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { id: 'CASHFLOW', icon: Wallet, label: 'Sổ Quỹ', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { id: 'INVENTORY', icon: Package, label: 'Kho Sim', color: 'text-amber-600', bg: 'bg-amber-50' },
                { id: 'PRODUCTS', icon: Tags, label: 'Danh mục', color: 'text-slate-600', bg: 'bg-slate-100' },
                { id: 'SYSTEM', icon: Settings, label: 'Hệ thống', color: 'text-slate-600', bg: 'bg-slate-100' }
              ].map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col md:flex-row items-center md:gap-3 p-3 md:px-4 md:py-3 rounded-2xl transition-all duration-200 group ${activeTab === item.id ? `${item.bg} ${item.color} shadow-sm shadow-blue-100` : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  <item.icon className={`w-6 h-6 md:w-5 md:h-5 transition-transform duration-200 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className={`text-[10px] md:text-sm font-bold mt-1 md:mt-0 ${activeTab === item.id ? '' : 'text-slate-500'}`}>{item.label}</span>
                  {activeTab === item.id && <div className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-current"></div>}
                </button>
              ))}
            </div>

            <div className="hidden md:block mt-auto pt-6 border-t border-slate-100">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-lg shadow-blue-100 overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
                <p className="text-xs font-bold opacity-80 mb-1">Cần hỗ trợ?</p>
                <p className="text-[10px] leading-relaxed opacity-90 mb-3">Liên hệ đội ngũ kỹ thuật để được giải đáp thắc mắc 24/7.</p>
                <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-bold transition-all border border-white/20">
                  Trung tâm trợ giúp
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* --- Main Content Area --- */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 relative">
          {dataLoading && activeTab !== 'ACCOUNT' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-white rounded-full shadow-xl border border-blue-50 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-700">Đang đồng bộ dữ liệu server...</span>
            </div>
          )}

          <div className="max-w-7xl mx-auto space-y-8">
            {/* Page Header (Dynamic based on tab) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-1">
                  {activeTab === 'DASHBOARD' ? 'Phân tích' : 'Quản lý'}
                </p>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                  {activeTab === 'DASHBOARD' && 'Bảng điều khiển'}
                  {activeTab === 'REPORTS' && 'Báo cáo chi tiết'}
                  {activeTab === 'CUSTOMERS' && 'Danh sách khách hàng'}
                  {activeTab === 'PRODUCTS' && 'Danh mục sản phẩm'}
                  {activeTab === 'INVENTORY' && 'Quản lý kho hàng'}
                  {activeTab === 'SALES' && 'Giao dịch bán hàng'}
                  {activeTab === 'CASHFLOW' && 'Sổ quỹ thu chi'}
                  {activeTab === 'SYSTEM' && 'Cấu hình hệ thống'}
                  {activeTab === 'ACCOUNT' && 'Hồ sơ cá nhân'}
                </h2>
              </div>
            </div>

            <div className="fade-in">
              {activeTab === 'DASHBOARD' && <Dashboard packages={dashboardPackages} orders={orderStats} transactions={transactions} customers={customerStats} />}
              {activeTab === 'REPORTS' && <Reports transactions={transactions} orders={orderStats} onUpdateDueDate={updateOrderDueDate} />}
              {activeTab === 'CUSTOMERS' && <CustomerCRM customers={customerStats} onAdd={addCustomer} onUpdate={updateCustomer} onDelete={deleteCustomer} />}
              {activeTab === 'PRODUCTS' && <ProductManager simTypes={simTypes} onAdd={addSimType} onDelete={deleteSimType} />}
              {activeTab === 'INVENTORY' && <SimInventory inventoryStats={inventoryStats} simTypes={simTypes} onAdd={addPackage} onDeleteBatch={deletePackage} onNavigateToProducts={() => setActiveTab('PRODUCTS')} />}
              {activeTab === 'SALES' && <SalesList orders={orders} inventoryStats={inventoryStats} customers={customers} getOrderStats={getOrderStats} onAdd={addOrder} onAddTransaction={addTransaction} onDelete={deleteOrder} onUpdateDueDate={updateOrderDueDate} />}
              {activeTab === 'CASHFLOW' && <CashFlow transactions={transactions} orders={orderStats} packages={packages} onAdd={addTransaction} onDelete={deleteTransaction} />}
              {activeTab === 'SYSTEM' && (
                <div className="space-y-8">
                  <DataManager fullData={fullData} onImport={importFullData} />
                </div>
              )}
              {activeTab === 'ACCOUNT' && <AccountSettings />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SimManager />
    </AuthProvider>
  );
}

export default App;
