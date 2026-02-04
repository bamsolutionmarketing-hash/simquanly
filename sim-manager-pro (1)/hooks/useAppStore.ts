import { useState, useEffect, useCallback } from 'react';
import { SimPackage, SaleOrder, Transaction, SimType, Customer, DueDateLog } from '../types';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

interface AppData {
  packages: SimPackage[];
  orders: SaleOrder[];
  transactions: Transaction[];
  simTypes: SimType[];
  customers: Customer[];
  dueDateLogs: DueDateLog[];
}

const initialData: AppData = {
  packages: [],
  orders: [],
  transactions: [],
  simTypes: [],
  customers: [],
  dueDateLogs: []
};

export const useAppStore = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(initialData);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [simTypes, packages, customers, orders, transactions] = await Promise.all([
        api.get('/sim-types'),
        api.get('/sim-packages'),
        api.get('/customers'),
        api.get('/orders'),
        api.get('/transactions')
      ]);

      setData({
        simTypes: simTypes || [],
        packages: packages || [],
        customers: customers || [],
        orders: orders || [],
        transactions: transactions || [],
        dueDateLogs: [] // Log API needs to be implemented if crucial
      });
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- FULL DATA MANAGEMENT ---
  const importFullData = useCallback((newData: AppData) => {
    // This will be handled by DataManager calling the bulk import API
    // and then triggering a re-fetch here.
    fetchData();
  }, [fetchData]);

  // --- PACKAGES ---
  const addPackage = useCallback(async (pkg: SimPackage) => {
    try {
      const newPkg = await api.post('/sim-packages', pkg);
      setData(prev => ({ ...prev, packages: [newPkg, ...prev.packages] }));
    } catch (e) { console.error(e); }
  }, []);

  const deletePackage = useCallback(async (id: string) => {
    try {
      await api.delete(`/sim-packages/${id}`);
      setData(prev => ({ ...prev, packages: prev.packages.filter(p => p.id !== id) }));
    } catch (e) { console.error(e); }
  }, []);

  // --- ORDERS ---
  const addOrder = useCallback(async (order: SaleOrder) => {
    try {
      const newOrder = await api.post('/orders', order);
      setData(prev => ({ ...prev, orders: [newOrder, ...prev.orders] }));
    } catch (e) { console.error(e); }
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    try {
      await api.delete(`/orders/${id}`);
      setData(prev => ({ ...prev, orders: prev.orders.filter(o => o.id !== id) }));
    } catch (e) { console.error(e); }
  }, []);

  const updateOrderDueDate = useCallback(async (orderId: string, newDate: string, log: DueDateLog) => {
    try {
      // Logic to update server would go here (PUT /orders/:id)
      // For now, optimistic update or just simple update (API endpoint needed for patching)
      const order = data.orders.find(o => o.id === orderId);
      if (!order) return;

      const updatedOrder = { ...order, dueDate: newDate, dueDateChanges: (order.dueDateChanges || 0) + 1 };
      await api.put(`/orders/${orderId}`, updatedOrder);

      setData(prev => ({
        ...prev,
        orders: prev.orders.map(o => o.id === orderId ? updatedOrder : o)
      }));
    } catch (e) { console.error(e); }
  }, [data.orders]);

  // --- TRANSACTIONS ---
  const addTransaction = useCallback(async (tx: Transaction) => {
    try {
      const newTx = await api.post('/transactions', tx);
      setData(prev => ({ ...prev, transactions: [newTx, ...prev.transactions] }));
    } catch (e) { console.error(e); }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`);
      setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
    } catch (e) { console.error(e); }
  }, []);

  // --- SIM TYPES ---
  const addSimType = useCallback(async (type: SimType) => {
    try {
      const newType = await api.post('/sim-types', type);
      setData(prev => ({ ...prev, simTypes: [newType, ...prev.simTypes] }));
    } catch (e) { console.error(e); }
  }, []);

  const deleteSimType = useCallback(async (id: string) => {
    try {
      await api.delete(`/sim-types/${id}`);
      setData(prev => ({ ...prev, simTypes: prev.simTypes.filter(t => t.id !== id) }));
    } catch (e) { console.error(e); }
  }, []);

  // --- CUSTOMERS ---
  const addCustomer = useCallback(async (customer: Customer) => {
    try {
      const newCust = await api.post('/customers', customer);
      setData(prev => ({ ...prev, customers: [newCust, ...prev.customers] }));
    } catch (e) { console.error(e); }
  }, []);

  const updateCustomer = useCallback(async (updated: Customer) => {
    try {
      await api.put(`/customers/${updated.id}`, updated);
      setData(prev => ({ ...prev, customers: prev.customers.map(c => c.id === updated.id ? updated : c) }));
    } catch (e) { console.error(e); }
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      await api.delete(`/customers/${id}`);
      setData(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id) }));
    } catch (e) { console.error(e); }
  }, []);

  return {
    fullData: data,
    loading,
    packages: data.packages,
    orders: data.orders,
    transactions: data.transactions,
    simTypes: data.simTypes,
    customers: data.customers,
    dueDateLogs: data.dueDateLogs,

    importFullData,
    addPackage, deletePackage,
    addOrder, deleteOrder, updateOrderDueDate,
    addTransaction, deleteTransaction,
    addSimType, deleteSimType,
    addCustomer, updateCustomer, deleteCustomer
  };
};