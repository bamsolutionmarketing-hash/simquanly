
import React, { useMemo, useState } from 'react';
import { Transaction, SaleOrderWithStats, DueDateLog } from '../types';
import { formatCurrency, formatDate, generateId } from '../utils';
import { useAppStore } from '../hooks/useAppStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
// Added BarChart3 and DollarSign to the imports from lucide-react
import { AlertTriangle, TrendingUp, TrendingDown, Calendar, Edit, ShieldAlert, Download, Siren, History, MessageSquare, Tag, Filter, BarChart3, DollarSign } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  transactions: Transaction[];
  orders: SaleOrderWithStats[];
  onUpdateDueDate: (orderId: string, newDate: string, log: DueDateLog) => void;
}

const Reports: React.FC<Props> = ({ transactions, orders, onUpdateDueDate }) => {
  const { dueDateLogs } = useAppStore();
  const [activeTab, setActiveTab] = useState<'CASHFLOW' | 'DEBT'>('CASHFLOW');
  
  // Date Filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Debt Management State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SaleOrderWithStats | null>(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [reason, setReason] = useState('');

  const debtOrders = useMemo(() => orders.filter(o => o.remaining > 0), [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
        if (startDate && o.date < startDate) return false;
        if (endDate && o.date > endDate) return false;
        return true;
    });
  }, [orders, startDate, endDate]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
        if (startDate && t.date < startDate) return false;
        if (endDate && t.date > endDate) return false;
        return true;
    });
  }, [transactions, startDate, endDate]);

  const statsData = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalProfit = filteredOrders.reduce((sum, o) => sum + o.profit, 0);
    const totalIn = filteredTransactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.amount, 0);
    const totalOut = filteredTransactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.amount, 0);
    
    return { totalRevenue, totalProfit, totalIn, totalOut };
  }, [filteredOrders, filteredTransactions]);

  const cashflowData = useMemo(() => {
    // Grouping by date for the selected period
    const map = new Map<string, { name: string, Thu: number, Chi: number, Profit: number }>();
    
    // Process transactions
    filteredTransactions.forEach(t => {
        const dateStr = t.date;
        if (!map.has(dateStr)) map.set(dateStr, { name: formatDate(dateStr), Thu: 0, Chi: 0, Profit: 0 });
        const val = map.get(dateStr)!;
        if (t.type === 'IN') val.Thu += t.amount;
        else val.Chi += t.amount;
    });

    // Process orders for profit tracking
    filteredOrders.forEach(o => {
        const dateStr = o.date;
        if (!map.has(dateStr)) map.set(dateStr, { name: formatDate(dateStr), Thu: 0, Chi: 0, Profit: 0 });
        map.get(dateStr)!.Profit += o.profit;
    });

    return Array.from(map.values()).sort((a, b) => {
        // Simple sort by internal date key if we stored it, but we only stored formatted name. 
        // Let's re-sort by the original entries.
        return 0; 
    });
    // Simplified: For better charts, let's just group by month if period is long, or by day if short.
  }, [filteredTransactions, filteredOrders]);

  // Re-calculating monthly data for the bar chart as originally designed but filtered
  const monthlyData = useMemo(() => {
    const months = new Set<string>();
    filteredTransactions.forEach(t => months.add(t.date.substring(0, 7)));
    filteredOrders.forEach(o => months.add(o.date.substring(0, 7)));
    
    return Array.from(months).sort().map(month => {
        const monthTxs = filteredTransactions.filter(t => t.date.startsWith(month));
        const monthOrders = filteredOrders.filter(o => o.date.startsWith(month));
        return {
            name: month,
            Thu: monthTxs.filter(t => t.type === 'IN').reduce((acc, t) => acc + t.amount, 0),
            Chi: monthTxs.filter(t => t.type === 'OUT').reduce((acc, t) => acc + t.amount, 0),
            Profit: monthOrders.reduce((acc, o) => acc + o.profit, 0)
        };
    });
  }, [filteredTransactions, filteredOrders]);

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const log: DueDateLog = {
        id: generateId(),
        orderId: selectedOrder.id,
        oldDate: selectedOrder.dueDate,
        newDate: newDueDate,
        reason: reason,
        updatedAt: new Date().toISOString()
    };
    onUpdateDueDate(selectedOrder.id, newDueDate, log);
    setIsModalOpen(false);
    setReason('');
  };

  const inputClass = "w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400";

  return (
    <div className="space-y-6">
       {/* Filters & Header */}
       <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" /> Báo cáo & Phân tích
          </h2>
          <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  <Filter size={14} className="text-gray-400" />
                  <input type="date" className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  <span className="text-gray-300">-</span>
                  <input type="date" className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
          </div>
       </div>

       <div className="flex gap-4 border-b border-gray-200">
            <button onClick={() => setActiveTab('CASHFLOW')} className={`pb-2 px-4 font-bold transition-all ${activeTab === 'CASHFLOW' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Dòng Tiền & Lợi Nhuận</button>
            <button onClick={() => setActiveTab('DEBT')} className={`pb-2 px-4 font-bold transition-all ${activeTab === 'DEBT' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`}>Quản Lý Công Nợ</button>
       </div>

       {activeTab === 'CASHFLOW' && (
           <div className="space-y-6">
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Doanh thu kỳ này</p>
                      <p className="text-lg font-black text-gray-900">{formatCurrency(statsData.totalRevenue)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Lợi nhuận gộp</p>
                      <p className="text-lg font-black text-emerald-600">+{formatCurrency(statsData.totalProfit)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Thực thu (Sổ quỹ)</p>
                      <p className="text-lg font-black text-blue-600">{formatCurrency(statsData.totalIn)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Thực chi (Sổ quỹ)</p>
                      <p className="text-lg font-black text-red-600">{formatCurrency(statsData.totalOut)}</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                       <h3 className="text-sm font-bold mb-6 flex items-center gap-2 text-gray-800"><TrendingUp className="text-emerald-600" /> Biến động Thu/Chi</h3>
                       <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={monthlyData}>
                                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                   <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000000}M`} tick={{fontSize: 10}} />
                                   <Tooltip formatter={(v) => formatCurrency(v as number)} contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                                   <Legend wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                                   <Bar dataKey="Thu" name="Tổng Thu" fill="#10B981" radius={[4, 4, 0, 0]} />
                                   <Bar dataKey="Chi" name="Tổng Chi" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                               </BarChart>
                           </ResponsiveContainer>
                       </div>
                   </div>

                   <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                       <h3 className="text-sm font-bold mb-6 flex items-center gap-2 text-gray-800"><DollarSign className="text-indigo-600" /> Lợi nhuận gộp theo tháng</h3>
                       <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                               <LineChart data={monthlyData}>
                                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                   <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000000}M`} tick={{fontSize: 10}} />
                                   <Tooltip formatter={(v) => formatCurrency(v as number)} contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                                   <Legend wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                                   <Line type="monotone" dataKey="Profit" name="Lợi nhuận" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: '#6366F1' }} />
                               </LineChart>
                           </ResponsiveContainer>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {activeTab === 'DEBT' && (
           <div className="space-y-4">
               {debtOrders.length === 0 ? (
                   <div className="bg-white p-12 text-center rounded-xl border border-dashed border-gray-300 text-gray-400">Không có khách hàng nợ.</div>
               ) : (
                   debtOrders.map(order => (
                       <div key={order.id} className={`bg-white p-4 rounded-xl border-2 shadow-sm transition-all flex flex-col md:flex-row gap-4 ${order.debtLevel === 'RECOVERY' ? 'border-red-500 bg-red-50' : 'border-gray-100'}`}>
                           <div className="flex-1">
                               <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-gray-900">{order.customerName}</h4>
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{order.code}</span>
                                    {order.debtLevel === 'RECOVERY' && <span className="flex items-center gap-1 text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded animate-pulse"><Siren size={10} /> THU HỒI NỢ</span>}
                               </div>
                               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                   <div>
                                       <p className="text-[10px] text-gray-400 uppercase font-bold">Tổng đơn</p>
                                       <p className="font-bold text-gray-800">{formatCurrency(order.totalAmount)}</p>
                                   </div>
                                   <div>
                                       <p className="text-[10px] text-gray-400 uppercase font-bold">Còn nợ</p>
                                       <p className="font-bold text-red-600">{formatCurrency(order.remaining)}</p>
                                   </div>
                                   <div>
                                       <p className="text-[10px] text-gray-400 uppercase font-bold">Hạn trả</p>
                                       <p className="font-bold text-gray-800">{formatDate(order.dueDate)}</p>
                                   </div>
                                   <div>
                                       <p className="text-[10px] text-gray-400 uppercase font-bold">Số lần khất</p>
                                       <p className="font-bold text-orange-600">{order.dueDateChanges} lần</p>
                                   </div>
                               </div>

                               {/* Debt History Tags */}
                               <div className="mt-4 pt-4 border-t border-gray-100">
                                   <p className="text-[10px] text-gray-400 font-black uppercase mb-2 flex items-center gap-1"><History size={12} /> Lịch sử khất nợ / Ghi chú:</p>
                                   <div className="flex flex-wrap gap-2">
                                       {dueDateLogs.filter(l => l.orderId === order.id).length === 0 ? (
                                           <span className="text-xs text-gray-400 italic">Chưa có lịch sử thay đổi.</span>
                                       ) : (
                                           dueDateLogs.filter(l => l.orderId === order.id).map((log, idx) => (
                                               <div key={log.id} className="bg-white border border-gray-200 p-2 rounded-lg shadow-sm flex items-start gap-2 max-w-[200px]">
                                                   <div className="mt-1"><Tag size={10} className="text-indigo-400" /></div>
                                                   <div>
                                                       <p className="text-[10px] font-bold text-gray-800 leading-tight">{log.reason}</p>
                                                       <p className="text-[8px] text-gray-400 mt-1">{formatDate(log.updatedAt)} • Hạn cũ: {formatDate(log.oldDate)}</p>
                                                   </div>
                                               </div>
                                           ))
                                       )}
                                   </div>
                               </div>
                           </div>

                           <div className="flex md:flex-col justify-center gap-2">
                               <button onClick={() => { setSelectedOrder(order); setNewDueDate(order.dueDate); setIsModalOpen(true); }} className="flex-1 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100">
                                   <Edit size={14} /> Gia hạn nợ
                               </button>
                               <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-sm">
                                   <MessageSquare size={14} /> Nhắc nợ Zalo
                               </button>
                           </div>
                       </div>
                   ))
               )}
           </div>
       )}

       {isModalOpen && selectedOrder && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-xl shadow-xl max-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                   <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-600"><Calendar size={20} /> Cập Nhật Hạn Trả Nợ</h3>
                   <form onSubmit={handleUpdateSubmit} className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày hẹn mới</label>
                           <input type="date" required className={inputClass} value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lý do thay đổi (Lưu thành tag)</label>
                           <textarea required rows={3} placeholder="VD: Khách báo chưa gom đủ tiền, xin lùi 5 ngày..." className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
                       </div>
                       <div className="flex gap-2 pt-2">
                           <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200">Hủy</button>
                           <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 shadow-sm transition-colors">Lưu & Tạo Tag</button>
                       </div>
                   </form>
               </div>
           </div>
       )}
    </div>
  );
};

export default Reports;
