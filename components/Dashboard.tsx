import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SimPackageWithStats, SaleOrderWithStats, Transaction, CustomerWithStats } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { TrendingUp, TrendingDown, DollarSign, Package, Calendar, Filter, Copy, MessageCircle, AlertTriangle, ShieldAlert, BarChart3 } from 'lucide-react';

interface Props {
    packages: SimPackageWithStats[];
    orders: SaleOrderWithStats[];
    transactions: Transaction[];
    customers: CustomerWithStats[];
}

const Dashboard: React.FC<Props> = ({ packages, orders, transactions, customers }) => {
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const todayStr = new Date().toISOString().split('T')[0];

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

    const totalStock = packages.reduce((acc, p) => acc + p.stock, 0);
    const totalReceivables = filteredOrders.reduce((acc, o) => acc + o.remaining, 0);
    const totalIn = filteredTransactions.filter(t => t.type === 'IN').reduce((acc, t) => acc + t.amount, 0);
    const totalOut = filteredTransactions.filter(t => t.type === 'OUT').reduce((acc, t) => acc + t.amount, 0);
    const cashBalance = totalIn - totalOut;
    const totalEstimatedProfit = filteredOrders.reduce((acc, o) => acc + o.profit, 0);

    // --- TODAY STATS ---
    const todayRevenue = orders.filter(o => o.date === todayStr).reduce((s, o) => s + o.totalAmount, 0);
    const todayProfit = orders.filter(o => o.date === todayStr).reduce((s, o) => s + o.profit, 0);
    const todayOrdersCount = orders.filter(o => o.date === todayStr).length;

    // --- WEEKLY DEBT LOGIC ---
    const nextWeekStr = new Date();
    nextWeekStr.setDate(nextWeekStr.getDate() + 7);
    const nextWeekISO = nextWeekStr.toISOString().split('T')[0];

    const weeklyDebtOrders = orders.filter(o =>
        o.remaining > 0 &&
        o.dueDate &&
        o.dueDate <= nextWeekISO
    ).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

    const zaloDebtMessage = useMemo(() => {
        const header = `📋 THÔNG BÁO THU HỒI NỢ TUẦN NÀY (${formatDate(todayStr)})\n----------------------------\n`;
        const body = weeklyDebtOrders.map(o => {
            const cust = customers.find(c => c.id === o.customerId);
            const statusIcon = o.debtLevel === 'RECOVERY' ? '🚨' : (o.debtLevel === 'WARNING' ? '⚠️' : (o.isOverdue ? '⏰' : '📅'));
            return `${statusIcon} ${o.customerName} - ${cust?.phone || 'N/A'}\n💰 Nợ: ${formatCurrency(o.remaining)}\n📅 Hạn: ${formatDate(o.dueDate)}\n`;
        }).join('\n');

        const footer = `\n----------------------------\n👉 Nhân viên phụ trách vui lòng kiểm tra và đôn đốc!`;
        return header + (weeklyDebtOrders.length > 0 ? body : "✅ Không có nợ đến hạn trong tuần này.") + footer;
    }, [weeklyDebtOrders, customers, todayStr]);

    const handleCopyZalo = () => {
        navigator.clipboard.writeText(zaloDebtMessage);
        alert("Đã copy tin nhắn nhắc nợ!");
    };

    const chartData = useMemo(() => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const data = [];
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                const dailyRevenue = filteredOrders
                    .filter(o => o.date === dateStr)
                    .reduce((sum, o) => sum + o.totalAmount, 0);
                data.push({ name: `${d.getDate()}/${d.getMonth() + 1}`, revenue: dailyRevenue });
            }
            return data;
        }
        const map = new Map<string, number>();
        filteredOrders.forEach(o => { map.set(o.date, (map.get(o.date) || 0) + o.totalAmount); });
        return Array.from(map.keys()).sort().map(dateStr => {
            const d = new Date(dateStr);
            return { name: `${d.getDate()}/${d.getMonth() + 1}`, revenue: map.get(dateStr) || 0 };
        });
    }, [filteredOrders, startDate, endDate]);

    return (
        <div className="space-y-6 pb-12">
            {/* Filter Bar (PetControl Style) */}
            <div className="bg-white px-6 py-4 rounded-xl border border-[#e1e4e8] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e8f2ff] rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-[#0068ff]" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[#1c2126]">Business Overview</h3>
                        <p className="text-xs text-[#646d78]">Performance tracking & analytics</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-[#f4f6f8] px-3 py-1.5 rounded-lg border border-[#e1e4e8]">
                        <span className="text-xs font-bold text-[#646d78]">From</span>
                        <input
                            type="date"
                            className="bg-transparent border-none text-xs font-bold text-[#1c2126] outline-none"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-[#f4f6f8] px-3 py-1.5 rounded-lg border border-[#e1e4e8]">
                        <span className="text-xs font-bold text-[#646d78]">To</span>
                        <input
                            type="date"
                            className="bg-transparent border-none text-xs font-bold text-[#1c2126] outline-none"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'CASH BALANCE', value: cashBalance, icon: DollarSign, color: 'text-[#1c2126]', bg: 'bg-[#0068ff]/10', iconColor: 'text-[#0068ff]' },
                    { label: 'TOTAL RECEIVABLES', value: totalReceivables, icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-50', iconColor: 'text-orange-600' },
                    { label: 'CURRENT STOCK', value: totalStock, icon: Package, color: 'text-[#1c2126]', bg: 'bg-indigo-50', iconColor: 'text-indigo-600', isQty: true },
                    { label: 'EST. GROSS PROFIT', value: totalEstimatedProfit, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', iconColor: 'text-emerald-600' }
                ].map((card, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl border border-[#e1e4e8] shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-[#646d78] uppercase tracking-wider">{card.label}</p>
                                <h3 className={`text-2xl font-black ${card.color}`}>
                                    {card.isQty ? card.value.toLocaleString() : formatCurrency(card.value as number)}
                                </h3>
                            </div>
                            <div className={`p-2 rounded-lg ${card.bg}`}>
                                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-gray-800">Biểu đồ Doanh Thu</h3>
                    <span className="text-xs text-gray-400">VNĐ</span>
                </div>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `${value / 1000000}M`} />
                            <Tooltip
                                cursor={{ fill: '#f9fafb' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(v: any) => formatCurrency(v)}
                            />
                            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* NEW SECTION: TODAY'S STATUS & WEEKLY DEBT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today Stats Card */}
                <div className="bg-white p-6 rounded-xl border border-[#e1e4e8] shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-[#1c2126] uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#0068ff]" />
                                Today's Pulse
                            </h3>
                            <span className="text-[10px] font-bold text-[#646d78] bg-[#f4f6f8] px-2 py-1 rounded uppercase">{formatDate(todayStr)}</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-1">
                                <span className="text-xs font-bold text-[#646d78]">NEW ORDERS</span>
                                <span className="text-sm font-black text-[#1c2126]">{todayOrdersCount}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-xs font-bold text-[#646d78]">REVENUE</span>
                                <span className="text-sm font-black text-[#1c2126]">{formatCurrency(todayRevenue)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-xs font-bold text-[#646d78]">EST. PROFIT</span>
                                <span className="text-sm font-black text-emerald-600">+{formatCurrency(todayProfit)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Weekly Debt & Zalo Copy Card */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#e1e4e8] shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h3 className="text-sm font-black text-[#1c2126] uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                Action Required: Debts Due
                            </h3>
                            <p className="text-[10px] text-[#646d78] mt-1">Pending payments within the next 7 days</p>
                        </div>
                        <button
                            onClick={handleCopyZalo}
                            className="bg-[#0068ff] hover:bg-[#0056d6] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold shadow-sm"
                        >
                            <MessageCircle className="w-4 h-4" /> COPY DEBTOR LIST
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {weeklyDebtOrders.length === 0 ? (
                            <div className="text-center py-10 text-[#646d78] text-xs font-bold bg-[#f4f6f8] rounded-xl border border-dashed border-[#e1e4e8]">
                                CLEAN RECORD: NO DEBTS DUE THIS WEEK
                            </div>
                        ) : (
                            weeklyDebtOrders.map(o => (
                                <div key={o.id} className={`p-4 rounded-xl border flex items-center justify-between ${o.debtLevel === 'RECOVERY' ? 'bg-red-50 border-red-100' : 'bg-[#f4f6f8] border-[#e1e4e8]'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${o.debtLevel === 'RECOVERY' ? 'bg-red-600 text-white' : (o.debtLevel === 'WARNING' ? 'bg-orange-500 text-white' : 'bg-[#0068ff] text-white')}`}>
                                            {o.debtLevel === 'RECOVERY' ? <ShieldAlert className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-black text-[#1c2126] text-sm uppercase">
                                                {o.customerName}
                                            </p>
                                            <p className="text-[10px] font-bold text-[#646d78] flex items-center gap-1 mt-0.5 uppercase">
                                                {customers.find(c => c.id === o.customerId)?.phone || 'N/A'} • DUE: {formatDate(o.dueDate)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-black ${o.debtLevel === 'RECOVERY' ? 'text-red-600' : 'text-[#1c2126]'}`}>
                                            {formatCurrency(o.remaining)}
                                        </p>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${o.debtLevel === 'RECOVERY' ? 'bg-red-100 text-red-700' : (o.debtLevel === 'WARNING' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700')}`}>
                                            {o.debtLevel === 'RECOVERY' ? 'RECOVERY' : (o.debtLevel === 'WARNING' ? 'WARNING' : (o.isOverdue ? 'OVERDUE' : 'PENDING'))}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;