
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 gap-4">
        <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Sổ Quỹ (Thu/Chi)
            </h2>
            <p className="text-xs text-gray-500 mt-1">Quản lý dòng tiền mặt, tài khoản</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input 
                        type="date" 
                        className="pl-7 pr-2 py-1 bg-gray-900 text-white border border-gray-600 rounded text-xs focus:ring-1 focus:ring-emerald-500 outline-none w-28 placeholder-gray-400"
                        placeholder="Từ ngày"
                        value={filterStart}
                        onChange={(e) => setFilterStart(e.target.value)}
                    />
                </div>
                <span className="text-gray-400">-</span>
                <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input 
                        type="date" 
                        className="pl-7 pr-2 py-1 bg-gray-900 text-white border border-gray-600 rounded text-xs focus:ring-1 focus:ring-emerald-500 outline-none w-28 placeholder-gray-400"
                        placeholder="Đến ngày"
                        value={filterEnd}
                        onChange={(e) => setFilterEnd(e.target.value)}
                    />
                </div>
                {(filterStart || filterEnd) && (
                    <button onClick={() => {setFilterStart(''); setFilterEnd('')}} className="p-1 hover:bg-gray-200 rounded text-gray-500">
                        <Filter className="w-3.5 h-3.5" />
                    </button>
                )}
             </div>

            <div className="flex gap-2">
                <button
                onClick={() => { handleTypeChange('IN'); setIsModalOpen(true); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm font-medium transition-colors"
                >
                <Plus className="w-4 h-4" /> Thu
                </button>
                <button
                onClick={() => { handleTypeChange('OUT'); setIsModalOpen(true); }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm font-medium transition-colors"
                >
                <Plus className="w-4 h-4" /> Chi
                </button>
            </div>
        </div>
      </div>

       {(filterStart || filterEnd) && (
          <div className="flex flex-wrap gap-4 px-2 text-sm">
              <span className="font-semibold text-gray-600">Giao dịch tìm thấy: {filteredTransactions.length}</span>
              <span className="text-gray-400">|</span>
              <span className="text-emerald-600 font-medium">Tổng Thu: {formatCurrency(summary.totalIn)}</span>
              <span className="text-gray-400">|</span>
              <span className="text-rose-600 font-medium">Tổng Chi: {formatCurrency(summary.totalOut)}</span>
              <span className="text-gray-400">|</span>
              <span className={`font-bold ${summary.balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                  Chênh lệch: {formatCurrency(summary.balance)}
              </span>
          </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Mã GD</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3 text-center">Liên kết</th>
                <th className="px-4 py-3">Ghi chú</th>
                <th className="px-4 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400 italic">
                     {filterStart || filterEnd ? 'Không tìm thấy giao dịch nào trong khoảng này.' : 'Chưa có giao dịch nào.'}
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((tx) => {
                    const relatedOrder = orders.find(o => o.id === tx.saleOrderId);
                    return (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">{tx.code}</td>
                            <td className="px-4 py-3 text-gray-900">{formatDate(tx.date)}</td>
                            <td className="px-4 py-3">
                                {tx.type === 'IN' ? (
                                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                        <ArrowUpCircle className="w-4 h-4" /> Thu
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-rose-600 font-medium">
                                        <ArrowDownCircle className="w-4 h-4" /> Chi
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-gray-700">{tx.category}</td>
                            <td className={`px-4 py-3 text-right font-bold ${tx.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {tx.type === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-blue-600">
                                {relatedOrder ? `Đơn ${relatedOrder.code}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={tx.note}>{tx.note}</td>
                            <td className="px-4 py-3 text-center">
                                <button
                                    onClick={() => onDelete(tx.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className={`text-lg font-bold mb-4 ${transactionType === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {transactionType === 'IN' ? 'Lập Phiếu Thu' : 'Lập Phiếu Chi'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày GD</label>
                    <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-900 text-white placeholder-gray-400"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Hình thức</label>
                     <select
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-900 text-white placeholder-gray-400"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Số Tiền</label>
                <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-900 text-white placeholder-gray-400 text-lg font-semibold"
                    value={formatNumberWithCommas(formData.amount)}
                    onChange={(e) => setFormData({ ...formData, amount: parseFormattedNumber(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <select 
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-900 text-white placeholder-gray-400"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link Đơn Bán (Còn nợ)</label>
                      <select
                          className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-900 text-white placeholder-gray-400"
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
                          <option value="">-- Không chọn --</option>
                          {pendingOrders.map(o => (
                              <option key={o.id} value={o.id}>
                                  {o.code} - {o.customerName} (Còn nợ: {formatCurrency(o.remaining)})
                              </option>
                          ))}
                      </select>
                      {pendingOrders.length === 0 && <p className="text-[10px] text-orange-500 mt-1">Không có đơn hàng nào đang nợ.</p>}
                  </div>
              )}

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-900 text-white placeholder-gray-400"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors ${transactionType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                >
                  Lưu
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
