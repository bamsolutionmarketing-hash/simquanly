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
    <div className="min-h-screen bg-[#f5f6f7] font-sans text-[#1f2329] flex flex-col">
      {/* --- Top Header (Lark Style) --- */}
      <header className="h-12 bg-white border-b border-[#dee0e3] sticky top-0 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#3370ff] rounded flex items-center justify-center">
            <Cpu className="text-white w-5 h-5" />
          </div>
          <span className="text-base font-semibold text-[#1f2329]">Quản Lý SIM</span>
        </div>

        <div className="hidden md:flex flex-1 max-w-lg mx-12">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8f959e]" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full pl-9 pr-4 py-1.5 bg-[#f5f6f7] border-none rounded text-sm focus:bg-white focus:ring-1 focus:ring-[#3370ff] outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-1.5 text-[#646a73] hover:bg-[#eff0f1] rounded">
            <Bell className="w-5 h-5" />
          </button>

          <div className="h-4 w-[1px] bg-[#dee0e3]"></div>

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 hover:bg-[#eff0f1] rounded"
            >
              <div className="w-7 h-7 rounded border border-[#dee0e3] overflow-hidden bg-[#f5f6f7]">
                <img src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <ChevronDown className={`w-4 h-4 text-[#8f959e] ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                <div className="absolute right-0 mt-1 w-56 bg-white rounded shadow-lg border border-[#dee0e3] py-1 z-20">
                  <div className="px-4 py-2 border-b border-[#eff0f1] mb-1">
                    <p className="text-xs text-[#8f959e]">Đăng nhập với</p>
                    <p className="text-sm font-medium text-[#1f2329] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('ACCOUNT'); setIsProfileOpen(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-[#1f2329] hover:bg-[#eff0f1] flex items-center gap-3"
                  >
                    <UserCircle className="w-4 h-4" />
                    Hồ sơ cá nhân
                  </button>
                  <button
                    onClick={() => { setActiveTab('SYSTEM'); setIsProfileOpen(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-[#1f2329] hover:bg-[#eff0f1] flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4" />
                    Cài đặt hệ thống
                  </button>
                  <div className="h-[1px] bg-[#eff0f1] my-1"></div>
                  <button
                    onClick={signOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-medium"
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
        {/* --- Sidebar Navigation (Lark Style) --- */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#dee0e3] md:relative md:w-20 lg:w-56 md:h-full md:border-r md:border-t-0 z-40 overflow-y-auto">
          <div className="flex md:flex-col h-full py-2 lg:px-2">
            <div className="flex-1 flex md:flex-col justify-around md:justify-start gap-1">
              {[
                { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Tổng quan' },
                { id: 'REPORTS', icon: BarChart3, label: 'Báo cáo' },
                { id: 'CUSTOMERS', icon: Users, label: 'Khách Hàng' },
                { id: 'SALES', icon: ShoppingCart, label: 'Bán Hàng' },
                { id: 'CASHFLOW', icon: Wallet, label: 'Sổ Quỹ' },
                { id: 'INVENTORY', icon: Package, label: 'Kho Sim' },
                { id: 'PRODUCTS', icon: Tags, label: 'Danh mục' },
                { id: 'SYSTEM', icon: Settings, label: 'Hệ thống' }
              ].map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col md:flex-row items-center gap-2 p-2 rounded transition-none group ${activeTab === item.id ? 'bg-[#3370ff1a] text-[#3370ff]' : 'text-[#646a73] hover:bg-[#eff0f1] hover:text-[#1f2329]'}`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-[10px] lg:text-sm font-medium lg:block hidden">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* --- Main Content Area --- */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 md:pb-6 relative">
          {dataLoading && activeTab !== 'ACCOUNT' && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-white rounded border border-[#dee0e3] flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-[#3370ff]"></div>
              <span className="text-xs font-medium text-[#646a73]">Đang đồng bộ...</span>
            </div>
          )}

          <div className="max-w-full space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#dee0e3] pb-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-[#1f2329]">
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

            <div className="">
              {activeTab === 'DASHBOARD' && <Dashboard packages={dashboardPackages} orders={orderStats} transactions={transactions} customers={customerStats} />}
              {activeTab === 'REPORTS' && <Reports transactions={transactions} orders={orderStats} onUpdateDueDate={updateOrderDueDate} />}
              {activeTab === 'CUSTOMERS' && <CustomerCRM customers={customerStats} onAdd={addCustomer} onUpdate={updateCustomer} onDelete={deleteCustomer} />}
              {activeTab === 'PRODUCTS' && <ProductManager simTypes={simTypes} onAdd={addSimType} onDelete={deleteSimType} />}
              {activeTab === 'INVENTORY' && <SimInventory inventoryStats={inventoryStats} simTypes={simTypes} onAdd={addPackage} onDeleteBatch={deletePackage} onNavigateToProducts={() => setActiveTab('PRODUCTS')} />}
              {activeTab === 'SALES' && <SalesList orders={orders} inventoryStats={inventoryStats} customers={customers} getOrderStats={getOrderStats} onAdd={addOrder} onAddTransaction={addTransaction} onDelete={deleteOrder} onUpdateDueDate={updateOrderDueDate} />}
              {activeTab === 'CASHFLOW' && <CashFlow transactions={transactions} orders={orderStats} packages={packages} onAdd={addTransaction} onDelete={deleteTransaction} />}
              {activeTab === 'SYSTEM' && (
                <div className="space-y-4">
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
