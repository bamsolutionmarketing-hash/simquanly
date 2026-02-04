
import React, { useState, useMemo } from 'react';
import { Transaction, SaleOrderWithStats, SimPackage } from '../types';
import { formatCurrency, generateCode, generateId, formatDate, formatNumberWithCommas, parseFormattedNumber } from '../utils';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Wallet, Calendar, Filter } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  orders: SaleOrderWithStats[];
  packages: SimPackage[];
  onAdd: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

const CashFlow: React.FC<Props> = ({ transactions, orders, packages, onAdd, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('IN');

  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: 'Thu bán sỉ',
    method: 'TRANSFER',
    saleOrderId: '',
    note: ''
  });

  const pendingOrders = useMemo(() => {
    return orders.filter(o => o.remaining > 0);
  }, [orders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: Transaction = {
      id: generateId(),
      code: generateCode('TX'),
      type: transactionType,
      date: formData.date,
      amount: Number(formData.amount),
      category: formData.category,
      method: formData.method as any,
      saleOrderId: formData.saleOrderId || undefined,
      note: formData.note
    };
    onAdd(newTx);
    setIsModalOpen(false);
    setFormData(prev => ({ ...prev, amount: 0, saleOrderId: '', note: '' }));
  };

  const handleTypeChange = (type: 'IN' | 'OUT') => {
    setTransactionType(type);
    setFormData(prev => ({
      ...prev,
      category: type === 'IN' ? 'Thu bán sỉ' : 'Chi nhập SIM',
      saleOrderId: ''
    }));
  };

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (filterStart) {
      result = result.filter(t => t.date >= filterStart);
    }
    if (filterEnd) {
      result = result.filter(t => t.date <= filterEnd);
    }
    return result;
  }, [transactions, filterStart, filterEnd]);

  const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const summary = useMemo(() => {
    const totalIn = filteredTransactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.amount, 0);
    const totalOut = filteredTransactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.amount, 0);
    return { totalIn, totalOut, balance: totalIn - totalOut };
  }, [filteredTransactions]);

  return (
    <div className="space-y-4">
      {/* Header & Filters (PetControl Style) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border border-[#e1e4e8] shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1c2126] uppercase tracking-wider">Treasury Journal</h2>
            <p className="text-[10px] text-[#646d78] uppercase font-bold">Cashflow & ledger tracking</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#f4f6f8] px-3 py-1.5 rounded-lg border border-[#e1e4e8]">
            <Filter size={14} className="text-[#646d78]" />
            <input type="date" className="bg-transparent border-none text-[10px] font-black text-[#1c2126] outline-none uppercase" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
            <span className="text-[#e1e4e8]">-</span>
            <input type="date" className="bg-transparent border-none text-[10px] font-black text-[#1c2126] outline-none uppercase" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
            {(filterStart || filterEnd) && (
              <button onClick={() => { setFilterStart(''); setFilterEnd('') }} className="text-[10px] font-black text-red-600 uppercase ml-2 px-1 hover:bg-red-50 rounded">
                RESET
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { handleTypeChange('IN'); setIsModalOpen(true); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-black shadow-sm"
            >
              <Plus className="w-4 h-4" /> REVENUE
            </button>
            <button
              onClick={() => { handleTypeChange('OUT'); setIsModalOpen(true); }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-black shadow-sm"
            >
              <Plus className="w-4 h-4" /> EXPENSE
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'NET IN (REVENUE)', value: summary.totalIn, color: 'text-emerald-600', icon: ArrowUpCircle, bg: 'bg-emerald-50' },
          { label: 'NET OUT (PAYMENT)', value: summary.totalOut, color: 'text-red-600', icon: ArrowDownCircle, bg: 'bg-red-50' },
          { label: 'LEDGER BALANCE', value: summary.balance, color: 'text-[#1c2126]', icon: Wallet, bg: 'bg-[#f4f6f8]' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-[#e1e4e8] shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-[#646d78] uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className={`text-xl font-black ${stat.color}`}>{formatCurrency(stat.value)}</h3>
              </div>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#e1e4e8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f4f6f8] text-[#646d78] font-black uppercase tracking-tighter border-b border-[#e1e4e8]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">CODE</th>
                <th className="px-4 py-3">DATE</th>
                <th className="px-4 py-3">TYPE</th>
                <th className="px-4 py-3">CATEGORY</th>
                <th className="px-4 py-3 text-right">AMOUNT</th>
                <th className="px-4 py-3 text-center">REFERENCE</th>
                <th className="px-4 py-3">NOTE</th>
                <th className="px-4 py-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e4e8]">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[#646d78] font-black uppercase text-[10px] tracking-widest opacity-50">
                    {filterStart || filterEnd ? 'KHÔNG TÌM THẤY GIAO DỊCH NÀO TRONG KHOẢNG NÀY.' : 'CHƯA CÓ GIAO DỊCH NÀO ĐƯỢC GHI NHẬN.'}
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((tx) => {
                  const relatedOrder = orders.find(o => o.id === tx.saleOrderId);
                  return (
                    <tr key={tx.id} className="hover:bg-[#f4f6f8] group">
                      <td className="px-4 py-3 text-[#1c2126] font-mono text-[10px] font-black">{tx.code}</td>
                      <td className="px-4 py-3 text-[11px] font-bold text-[#1c2126]">{formatDate(tx.date)}</td>
                      <td className="px-4 py-3">
                        {tx.type === 'IN' ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-black text-[9px] uppercase tracking-widest">
                            <ArrowUpCircle className="w-3.5 h-3.5" /> THU
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 font-black text-[9px] uppercase tracking-widest">
                            <ArrowDownCircle className="w-3.5 h-3.5" /> CHI
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-bold text-[#646d78] uppercase">{tx.category}</td>
                      <td className={`px-4 py-3 text-right font-black text-sm ${tx.type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {relatedOrder ? (
                          <span className="text-[10px] font-black text-[#0068ff] bg-[#e8f2ff] px-2 py-0.5 rounded border border-[#0068ff]/20 uppercase">
                            {relatedOrder.code}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#646d78] font-bold uppercase opacity-30">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#646d78] italic truncate max-w-[200px]">{tx.note || '--'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(tx.id); }}
                          className="p-1.5 text-[#646d78] hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-sm font-black text-[#1c2126] mb-6 uppercase tracking-widest flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#0068ff]" /> {transactionType === 'IN' ? 'LẬP PHIẾU THU TIỀN' : 'LẬP PHIẾU CHI TIỀN'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">NGÀY GIAO DỊCH</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff] uppercase"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">HÌNH THỨC</label>
                  <select
                    className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff]"
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}
                  >
                    <option value="CASH">Tiền mặt</option>
                    <option value="TRANSFER">Chuyển khoản</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">SỐ TIỀN (VNĐ)</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-lg font-black text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff]"
                  placeholder="0"
                  value={formatNumberWithCommas(formData.amount)}
                  onChange={(e) => setFormData({ ...formData, amount: parseFormattedNumber(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">DANH MỤC</label>
                <select
                  className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff]"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {transactionType === 'IN' ? (
                    <>
                      <option value="Thu bán sỉ">Thu bán sỉ</option>
                      <option value="Thu khác">Thu khác</option>
                    </>
                  ) : (
                    <>
                      <option value="Chi nhập SIM">Chi nhập SIM</option>
                      <option value="Chi ship">Chi ship</option>
                      <option value="Chi khác">Chi khác</option>
                    </>
                  )}
                </select>
              </div>

              {transactionType === 'IN' && formData.category === 'Thu bán sỉ' && (
                <div>
                  <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">LIÊN KẾT ĐƠN HÀNG (CÒN NỢ)</label>
                  <select
                    className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff]"
                    value={formData.saleOrderId}
                    onChange={(e) => {
                      const orderId = e.target.value;
                      const order = orders.find(o => o.id === orderId);
                      if (order && formData.amount === 0) {
                        setFormData({ ...formData, saleOrderId: orderId, amount: order.remaining });
                      } else {
                        setFormData({ ...formData, saleOrderId: orderId });
                      }
                    }}
                  >
                    <option value="">-- KHÔNG CHỌN --</option>
                    {pendingOrders.map(o => (
                      <option key={o.id} value={o.id}>
                        [{o.code}] {o.customerName} - {formatCurrency(o.remaining)}
                      </option>
                    ))}
                  </select>
                  {pendingOrders.length === 0 && <p className="text-[9px] text-red-500 mt-1 font-bold uppercase tracking-tight">Không có đơn hàng nào đang nợ.</p>}
                </div>
              )}

              <div>
                <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">GHI CHÚ</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff]"
                  placeholder="Nhập ghi chú thêm..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-[#f4f6f8] text-[#646d78] rounded-lg font-black text-[10px] uppercase tracking-widest"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0068ff] text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm"
                >
                  XÁC NHẬN GIAO DỊCH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlow;
