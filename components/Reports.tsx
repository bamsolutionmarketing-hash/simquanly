
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
            {/* Filters & Header (PetControl Style) */}
            <div className="bg-white p-4 rounded-xl border border-[#e1e4e8] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e8f2ff] rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-[#0068ff]" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-[#1c2126] uppercase tracking-wider">Báo cáo & Phân tích</h2>
                        <p className="text-[10px] text-[#646d78] uppercase font-bold">Hiệu suất kinh doanh & kiểm soát nợ</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#f4f6f8] px-3 py-1.5 rounded-lg border border-[#e1e4e8]">
                        <Filter size={14} className="text-[#646d78]" />
                        <input type="date" className="bg-transparent border-none text-[10px] font-black text-[#1c2126] outline-none uppercase" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        <span className="text-[#e1e4e8]">-</span>
                        <input type="date" className="bg-transparent border-none text-[10px] font-black text-[#1c2126] outline-none uppercase" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="flex gap-2 p-1 bg-[#f4f6f8] rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('CASHFLOW')}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg ${activeTab === 'CASHFLOW' ? 'bg-white text-[#0068ff] shadow-sm' : 'text-[#646d78] hover:text-[#1c2126]'}`}
                >
                    Dòng tiền & Lợi nhuận
                </button>
                <button
                    onClick={() => setActiveTab('DEBT')}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg ${activeTab === 'DEBT' ? 'bg-white text-[#0068ff] shadow-sm' : 'text-red-600 hover:bg-red-50'}`}
                >
                    Quản lý Công nợ
                </button>
            </div>

            {activeTab === 'CASHFLOW' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'DOANH THU', value: statsData.totalRevenue, color: 'text-[#1c2126]' },
                            { label: 'LỢI NHUẬN GỘP', value: statsData.totalProfit, color: 'text-emerald-600', prefix: '+' },
                            { label: 'THỰC THU (CASH)', value: statsData.totalIn, color: 'text-[#0068ff]' },
                            { label: 'THỰC CHI (EXPENSE)', value: statsData.totalOut, color: 'text-red-600' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-[#e1e4e8] shadow-sm">
                                <p className="text-[10px] font-black text-[#646d78] uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className={`text-lg font-black ${stat.color}`}>
                                    {stat.prefix}{formatCurrency(stat.value)}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-[#e1e4e8] shadow-sm">
                            <h3 className="text-[11px] font-black mb-6 flex items-center gap-2 text-[#1c2126] uppercase tracking-widest">
                                <TrendingUp className="w-4 h-4 text-emerald-600" /> Biến động Dòng tiền
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e4e8" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#646d78' }} />
                                        <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#646d78' }} />
                                        <Tooltip cursor={{ fill: '#f4f6f8' }} formatter={(v) => formatCurrency(v as number)} contentStyle={{ borderRadius: '8px', border: '1px solid #e1e4e8', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                                        <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                                        <Bar dataKey="Thu" name="TỔNG THU" fill="#10B981" radius={[2, 2, 0, 0]} />
                                        <Bar dataKey="Chi" name="TỔNG CHI" fill="#F43F5E" radius={[2, 2, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-[#e1e4e8] shadow-sm">
                            <h3 className="text-[11px] font-black mb-6 flex items-center gap-2 text-[#1c2126] uppercase tracking-widest">
                                <DollarSign className="w-4 h-4 text-[#0068ff]" /> Lợi nhuận gộp theo tháng
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e4e8" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#646d78' }} />
                                        <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#646d78' }} />
                                        <Tooltip formatter={(v) => formatCurrency(v as number)} contentStyle={{ borderRadius: '8px', border: '1px solid #e1e4e8', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                                        <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                                        <Line type="monotone" dataKey="Profit" name="LỢI NHUẬN" stroke="#0068ff" strokeWidth={3} dot={{ r: 3, fill: '#0068ff', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
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
                        <div className="bg-white p-12 text-center rounded-xl border border-dashed border-[#e1e4e8] text-[#646d78] text-xs font-black uppercase font-mono">
                            HIỆN TẠI KHÔNG CÓ CÔNG NỢ HOẠT ĐỘNG
                        </div>
                    ) : (
                        debtOrders.map(order => (
                            <div key={order.id} className={`bg-white p-5 rounded-xl border shadow-sm flex flex-col md:flex-row gap-6 ${order.debtLevel === 'RECOVERY' ? 'border-red-200 bg-red-50' : 'border-[#e1e4e8]'}`}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <h4 className="text-base font-black text-[#1c2126] uppercase tracking-tight">{order.customerName}</h4>
                                        <span className="text-[9px] bg-[#f4f6f8] text-[#646d78] px-1.5 py-0.5 rounded border border-[#e1e4e8] font-black uppercase tracking-widest">{order.code}</span>
                                        {order.debtLevel === 'RECOVERY' && (
                                            <span className="flex items-center gap-1 text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded uppercase tracking-widest">
                                                <Siren size={12} /> THU HỒI NỢ
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div>
                                            <p className="text-[9px] text-[#646d78] uppercase font-black tracking-widest mb-1">TỔNG ĐƠN</p>
                                            <p className="text-sm font-black text-[#1c2126]">{formatCurrency(order.totalAmount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-[#646d78] uppercase font-black tracking-widest mb-1">CÒN NỢ</p>
                                            <p className="text-sm font-black text-red-600">{formatCurrency(order.remaining)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-[#646d78] uppercase font-black tracking-widest mb-1">HẠN TRẢ</p>
                                            <p className="text-sm font-black text-[#1c2126]">{formatDate(order.dueDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-[#646d78] uppercase font-black tracking-widest mb-1">SỐ LẦN KHẤT</p>
                                            <p className="text-sm font-black text-orange-600">{order.dueDateChanges} LẦN</p>
                                        </div>
                                    </div>

                                    {/* Debt History Tags */}
                                    <div className="mt-6 pt-5 border-t border-[#e1e4e8]">
                                        <p className="text-[9px] text-[#646d78] font-black uppercase mb-3 flex items-center gap-1 tracking-widest">
                                            <History size={12} /> Lịch sử liên lạc & Ghi chú:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {dueDateLogs.filter(l => l.orderId === order.id).length === 0 ? (
                                                <span className="text-[10px] text-[#646d78] font-bold uppercase italic opacity-50">CHƯA CÓ LỊCH SỬ GIA HẠN.</span>
                                            ) : (
                                                dueDateLogs.filter(l => l.orderId === order.id).map((log, idx) => (
                                                    <div key={log.id} className="bg-white border border-[#e1e4e8] p-3 rounded-xl shadow-sm flex items-start gap-3 max-w-[250px]">
                                                        <div className="mt-0.5 text-[#0068ff]"><Tag size={12} /></div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-[#1c2126] leading-tight uppercase tracking-tighter">{log.reason}</p>
                                                            <p className="text-[8px] font-bold text-[#646d78] mt-1.5 uppercase tracking-widest">
                                                                {formatDate(log.updatedAt)} • PREV: {formatDate(log.oldDate)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex md:flex-col justify-center gap-2">
                                    <button onClick={() => { setSelectedOrder(order); setNewDueDate(order.dueDate); setIsModalOpen(true); }} className="flex-1 bg-white text-[#0068ff] px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#f4f6f8] border border-[#0068ff]">
                                        <Edit size={14} /> GIA HẠN
                                    </button>
                                    <button className="flex-1 bg-[#0068ff] text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#0056d6] shadow-sm">
                                        <MessageSquare size={14} /> NHẮC NỢ
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                        <h3 className="text-sm font-black mb-6 flex items-center gap-2 text-[#1c2126] uppercase tracking-widest">
                            <Calendar size={18} className="text-[#0068ff]" /> Đăng ký gia hạn nợ
                        </h3>
                        <form onSubmit={handleUpdateSubmit} className="space-y-5">
                            <div>
                                <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">Ngày hẹn thanh toán mới</label>
                                <input type="date" required className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff] uppercase" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">Ghi chú gia hạn (Lý do)</label>
                                <textarea required rows={3} placeholder="Ví dụ: Khách báo kẹt tiền, xin lùi hạn 5 ngày..." className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff]" value={reason} onChange={(e) => setReason(e.target.value)} />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-[#f4f6f8] text-[#646d78] rounded-lg font-black text-[10px] uppercase tracking-widest">HỦY BỎ</button>
                                <button type="submit" className="flex-1 py-2 bg-[#0068ff] text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm">XÁC NHẬN</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
