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
  const inputClass = "w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder-gray-400";

  return (
    <div className="space-y-4">
      {/* Header (PetControl Style) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border border-[#e1e4e8] shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#e8f2ff] rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-[#0068ff]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1c2126] uppercase tracking-wider">Đơn hàng (Sales)</h2>
            <p className="text-[10px] text-[#646d78] uppercase font-bold">Quản lý bán sỉ & lẻ hệ thống</p>
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-[#f4f6f8] rounded-xl">
          <button
            onClick={() => setActiveTab('WHOLESALE')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg ${activeTab === 'WHOLESALE' ? 'bg-white text-[#0068ff] shadow-sm' : 'text-[#646d78] hover:text-[#1c2126]'}`}
          >
            Bán Sỉ (Đại lý)
          </button>
          <button
            onClick={() => setActiveTab('RETAIL')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg ${activeTab === 'RETAIL' ? 'bg-white text-[#0068ff] shadow-sm' : 'text-[#646d78] hover:text-[#1c2126]'}`}
          >
            Bán Lẻ
          </button>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0068ff] hover:bg-[#0056d6] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-black shadow-sm w-full md:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> TẠO ĐƠN HÀNG
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e1e4e8] shadow-sm overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#f4f6f8] text-[#646d78] font-black uppercase tracking-tighter border-b border-[#e1e4e8]">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">DATE</th>
              <th className="px-4 py-3">CLIENT INFO</th>
              <th className="px-4 py-3 text-right">TOTAL</th>
              <th className="px-4 py-3 text-right">COLLECTED</th>
              <th className="px-4 py-3 text-right">REMAINING</th>
              <th className="px-4 py-3 text-center">STATUS</th>
              <th className="px-4 py-3 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[#646d78] font-black uppercase text-[10px] tracking-widest opacity-50">
                  CHƯA CÓ ĐƠN HÀNG NÀO ĐƯỢC GHI NHẬN.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#f4f6f8] group">
                  <td className="px-4 py-3">
                    <div className="text-[10px] font-mono font-black text-[#1c2126]">{order.code}</div>
                    <div className="text-[9px] text-[#646d78] font-bold uppercase">{formatDate(order.date)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[11px] font-black text-[#1c2126] uppercase">{order.agentName}</div>
                    {order.saleType === 'WHOLESALE' && <div className="text-[8px] font-black text-[#0068ff] uppercase tracking-tighter">ĐẠI LÝ</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[11px] font-bold text-[#1c2126]">{order.simTypeName?.toUpperCase()}</div>
                    <div className="text-[9px] text-[#646d78] font-bold">{formatCurrency(order.salePrice)} / SIM</div>
                  </td>
                  <td className="px-4 py-3 text-center text-[11px] font-black text-[#1c2126]">{order.quantity}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-sm font-black text-[#1c2126]">{formatCurrency(order.totalAmount)}</div>
                    {order.remaining > 0 && <div className="text-[9px] font-black text-red-600 uppercase tracking-tighter">CÒN NỢ {formatCurrency(order.remaining)}</div>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {order.isFinished ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-emerald-50 text-emerald-600 uppercase tracking-widest border border-emerald-100">HOÀN TẤT</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-orange-50 text-orange-600 uppercase tracking-widest border border-orange-100">CHỜ THANH TOÁN</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(order.id); }}
                      className="p-1.5 text-[#646d78] hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-sm font-black text-[#1c2126] mb-6 uppercase tracking-widest flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#0068ff]" /> {activeTab === 'WHOLESALE' ? 'TẠO ĐƠN HÀNG ĐẠI LÝ' : 'TẠO ĐƠN BÁN LẺ'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">NGÀY BÁN</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff] uppercase"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">LOẠI SẢN PHẨM</label>
                  <select
                    required
                    className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff]"
                    value={formData.simTypeId}
                    onChange={(e) => setFormData({ ...formData, simTypeId: e.target.value })}
                  >
                    <option value="">-- CHỌN LOẠI SIM --</option>
                    {availableProducts.map(p => (
                      <option key={p.simTypeId} value={p.simTypeId}>
                        {p.name.toUpperCase()} (TỒN: {p.currentStock})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {activeTab === 'WHOLESALE' ? (
                <div>
                  <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">CHỌN ĐẠI LÝ</label>
                  <select
                    required
                    className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff]"
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  >
                    <option value="">-- CHỌN KHÁCH HÀNG --</option>
                    {customers.filter(c => c.type === 'WHOLESALE').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">THÔNG TIN KHÁCH LẺ (TÊN/SĐT)</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#646d78]" />
                    <input
                      type="text"
                      className="w-full pl-9 pr-4 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff]"
                      placeholder="Nguyễn Văn A - 09xx..."
                      value={formData.retailCustomerInfo}
                      onChange={(e) => setFormData({ ...formData, retailCustomerInfo: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">SỐ LƯỢNG</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff]"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">ĐƠN GIÁ BÁN</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff]"
                    value={formatNumberWithCommas(formData.salePrice)}
                    onChange={(e) => setFormData({ ...formData, salePrice: parseFormattedNumber(e.target.value) })}
                  />
                </div>
              </div>

              <div className="bg-[#f4f6f8] p-4 rounded-xl border border-[#e1e4e8]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-[#646d78] uppercase tracking-widest">THANH TOÁN NGAY?</span>
                  <button
                    type="button"
                    onClick={() => setIsPaid(!isPaid)}
                    className="flex items-center gap-2 group"
                  >
                    {isPaid ? <CheckSquare className="w-5 h-5 text-[#0068ff]" /> : <Square className="w-5 h-5 text-[#646d78]" />}
                    <span className={`text-[10px] font-black uppercase tracking-tight ${isPaid ? 'text-[#0068ff]' : 'text-[#646d78]'}`}>
                      {isPaid ? 'DA THANH TOÁN' : 'GHI NỢ (PENDING)'}
                    </span>
                  </button>
                </div>

                {isPaid ? (
                  <div>
                    <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">HÌNH THỨC NHẬN TIỀN</label>
                    <div className="flex gap-2">
                      {['TRANSFER', 'CASH', 'COD'].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m as any)}
                          className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-tighter rounded border ${paymentMethod === m ? 'bg-[#0068ff] text-white border-[#0068ff]' : 'bg-white text-[#646d78] border-[#e1e4e8]'}`}
                        >
                          {m === 'TRANSFER' ? 'Chuyển khoản' : m === 'CASH' ? 'Tiền mặt' : 'COD'}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">HẠN THANH TOÁN (DEADLINE)</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm font-bold text-red-600 outline-none focus:ring-1 focus:ring-red-500 uppercase"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">GHI CHÚ ĐƠN HÀNG</label>
                <textarea rows={2} className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff]" placeholder="Nhập ghi chú thêm..." value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
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
                  XÁC NHẬN CHỐT ĐƠN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesList;