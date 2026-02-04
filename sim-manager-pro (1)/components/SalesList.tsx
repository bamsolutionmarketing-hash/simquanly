import React, { useState, useMemo } from 'react';
import { SaleOrder, InventoryProductStat, SaleOrderWithStats, Customer, DueDateLog, Transaction } from '../types';
import { formatCurrency, generateCode, generateId, formatDate, formatNumberWithCommas, parseFormattedNumber } from '../utils';
import { Plus, Trash2, ShoppingCart, CheckSquare, Square, User, UserPlus } from 'lucide-react';

interface Props {
  orders: SaleOrder[];
  inventoryStats: InventoryProductStat[];
  customers: Customer[];
  getOrderStats: (order: SaleOrder) => SaleOrderWithStats;
  onAdd: (order: SaleOrder) => void;
  onAddTransaction: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onUpdateDueDate: (orderId: string, newDate: string, log: DueDateLog) => void;
}

const SalesList: React.FC<Props> = ({ orders, inventoryStats, customers, getOrderStats, onAdd, onAddTransaction, onDelete, onUpdateDueDate }) => {
  const [activeTab, setActiveTab] = useState<'WHOLESALE' | 'RETAIL'>('WHOLESALE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isPaid, setIsPaid] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'CASH' | 'COD'>('TRANSFER');

  const [formData, setFormData] = useState({
    customerId: '',
    retailCustomerInfo: '', // For 1-time retail customers
    simTypeId: '',
    quantity: 1,
    salePrice: 0,
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    note: ''
  });

  const availableProducts = inventoryStats.filter(p => p.currentStock > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.simTypeId) return;

    const orderId = generateId();
    let resolvedAgentName = 'Khách lẻ';
    let finalNote = formData.note;

    if (activeTab === 'WHOLESALE') {
      const customer = customers.find(c => c.id === formData.customerId);
      resolvedAgentName = customer ? customer.name : 'Đại lý';
    } else {
      resolvedAgentName = formData.retailCustomerInfo || 'Khách lẻ';
      if (formData.retailCustomerInfo) {
        finalNote = `Khách: ${formData.retailCustomerInfo}. ${formData.note}`;
      }
    }

    const totalAmount = Number(formData.quantity) * Number(formData.salePrice);

    const newOrder: SaleOrder = {
      id: orderId,
      code: generateCode('SO'),
      date: formData.date,
      customerId: activeTab === 'WHOLESALE' ? formData.customerId : undefined,
      agentName: resolvedAgentName,
      saleType: activeTab,
      simTypeId: formData.simTypeId,
      quantity: Number(formData.quantity),
      salePrice: Number(formData.salePrice),
      dueDate: isPaid ? '' : formData.dueDate,
      dueDateChanges: 0,
      note: finalNote,
      isFinished: isPaid
    };

    if (isPaid) {
        onAddTransaction({
            id: generateId(),
            code: generateCode('TX'),
            type: 'IN',
            date: formData.date,
            amount: totalAmount,
            category: activeTab === 'WHOLESALE' ? 'Thu bán sỉ' : 'Thu bán lẻ',
            method: paymentMethod,
            saleOrderId: orderId,
            note: `Tự động: ${activeTab === 'WHOLESALE' ? 'Thu bán sỉ' : 'Thu bán lẻ'} đơn ${newOrder.code}`
        });
    }

    onAdd(newOrder);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
        customerId: '',
        retailCustomerInfo: '',
        simTypeId: '',
        quantity: 1,
        salePrice: 0,
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        note: ''
    });
    setIsPaid(true);
    setPaymentMethod('TRANSFER');
  };

  const orderStats = useMemo(() => orders.map(getOrderStats), [orders, getOrderStats]);
  const filteredOrders = orderStats.filter(o => o.saleType === activeTab).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Input styling to prevent white-on-white text issues
  const inputClass = "w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-400";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-indigo-600" /> Bán Hàng
        </h2>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Tạo Đơn Mới
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
          <button onClick={() => setActiveTab('WHOLESALE')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'WHOLESALE' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>Bán Sỉ (B2B)</button>
          <button onClick={() => setActiveTab('RETAIL')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'RETAIL' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>Bán Lẻ (B2C)</button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3 text-right">Tổng tiền</th>
                <th className="px-4 py-3 text-right">Đã thu</th>
                <th className="px-4 py-3 text-right">Còn nợ</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400 italic">Chưa có đơn hàng nào trong mục này.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-indigo-600">{order.code}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(order.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{order.customerName}</span>
                        {order.note && <span className="text-[10px] text-gray-400 truncate max-w-[150px]">{order.note}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatCurrency(order.paidAmount)}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-bold">{order.remaining > 0 ? formatCurrency(order.remaining) : '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {order.remaining <= 0 ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">HOÀN TẤT</span>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${order.isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                          {order.isOverdue ? 'QUÁ HẠN' : 'GHI NỢ'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => onDelete(order.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 my-8 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="text-indigo-600" /> {activeTab === 'WHOLESALE' ? 'Đơn Bán Sỉ (Đại lý)' : 'Đơn Bán Lẻ (1 lần)'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {activeTab === 'WHOLESALE' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Khách Hàng (Đại lý)</label>
                  <select required className={inputClass} value={formData.customerId} onChange={(e) => setFormData({...formData, customerId: e.target.value})}>
                    <option value="">-- Chọn Khách Hàng --</option>
                    {customers.filter(c => c.type === 'WHOLESALE').map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Thông tin khách (Tên & SĐT)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="VD: Anh Tuấn - 0912345678" 
                      className={`${inputClass} pl-10`} 
                      value={formData.retailCustomerInfo} 
                      onChange={(e) => setFormData({...formData, retailCustomerInfo: e.target.value})} 
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 italic">* Không cần lưu vào CRM, thông tin sẽ được ghi vào Sổ Quỹ.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Gói Sim / Sản phẩm</label>
                <select required className={inputClass} value={formData.simTypeId} onChange={(e) => setFormData({...formData, simTypeId: e.target.value})}>
                  <option value="">-- Chọn Gói Sim --</option>
                  {availableProducts.map(p => <option key={p.simTypeId} value={p.simTypeId}>{p.name} (Tồn: {p.currentStock})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Số Lượng</label>
                    <input type="text" required className={inputClass} value={formatNumberWithCommas(formData.quantity)} onChange={(e) => setFormData({...formData, quantity: parseFormattedNumber(e.target.value)})} />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Giá Bán (VNĐ)</label>
                    <input type="text" required className={inputClass} value={formatNumberWithCommas(formData.salePrice)} onChange={(e) => setFormData({...formData, salePrice: parseFormattedNumber(e.target.value)})} />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                 <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        {isPaid ? <CheckSquare className="text-green-600" onClick={() => setIsPaid(false)} /> : <Square className="text-gray-400" onClick={() => setIsPaid(true)} />}
                        <span className="text-sm font-bold text-gray-700">Đã Thu Tiền (Hoàn tất)</span>
                    </label>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {isPaid ? 'AUTO THU' : 'GHI NỢ'}
                    </span>
                 </div>

                 <div>
                    {isPaid ? (
                        <div className="flex gap-2 animate-in slide-in-from-top-1 duration-200">
                            {['TRANSFER', 'CASH', 'COD'].map(m => (
                                <button key={m} type="button" onClick={() => setPaymentMethod(m as any)} className={`flex-1 py-2 text-[10px] font-bold rounded border transition-colors ${paymentMethod === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                                    {m === 'TRANSFER' ? 'C.Khoản' : m === 'CASH' ? 'Tiền mặt' : 'COD'}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-top-1 duration-200">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hạn trả công nợ</label>
                            <input type="date" required={!isPaid} className={inputClass} value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} />
                        </div>
                    )}
                 </div>
              </div>

              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú đơn hàng</label>
                  <textarea rows={2} className={inputClass} placeholder="Nhập ghi chú thêm..." value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors">Hủy</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm">Xác Nhận Đơn</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesList;