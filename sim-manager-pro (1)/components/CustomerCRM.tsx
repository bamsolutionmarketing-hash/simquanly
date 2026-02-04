import React, { useState } from 'react';
import { Customer, CustomerWithStats } from '../types';
import { generateId, generateCID, formatCurrency, formatDate } from '../utils';
import { Plus, Trash2, Edit2, Users, Search, MapPin, Phone, Mail, Tag, DollarSign, Siren, ShieldAlert } from 'lucide-react';

interface Props {
  customers: CustomerWithStats[];
  onAdd: (c: Customer) => void;
  onUpdate: (c: Customer) => void;
  onDelete: (id: string) => void;
}

const CustomerCRM: React.FC<Props> = ({ customers, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState<Customer>({
    id: '',
    cid: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'RETAIL',
    note: ''
  });

  const handleOpenAdd = () => {
      setEditMode(false);
      setFormData({
        id: '',
        cid: '',
        name: '',
        phone: '',
        email: '',
        address: '',
        type: 'RETAIL',
        note: ''
      });
      setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
      setEditMode(true);
      setFormData({ ...customer });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editMode) {
        onUpdate(formData);
    } else {
        const newCustomer: Customer = {
            ...formData,
            id: generateId(),
            cid: generateCID(formData.name, formData.phone, formData.email)
        };
        onAdd(newCustomer);
    }
    setIsModalOpen(false);
  };

  const filteredCustomers = customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.cid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Khách Hàng (CRM)
          </h2>
          <p className="text-xs text-gray-500 mt-1">Quản lý thông tin, GMV và công nợ</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text"
                    placeholder="Tìm tên, SĐT, CID..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-900 text-white border border-gray-600 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button
                onClick={handleOpenAdd}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
             >
                <Plus className="w-4 h-4" /> <span className="hidden md:inline">Thêm KH</span>
             </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.length === 0 ? (
              <div className="col-span-full text-center py-10 bg-white rounded-lg border border-gray-100 text-gray-400">
                  {searchTerm ? 'Không tìm thấy khách hàng nào.' : 'Chưa có khách hàng. Hãy thêm mới.'}
              </div>
          ) : (
            filteredCustomers.map(c => (
                <div key={c.id} className={`bg-white p-5 rounded-lg border shadow-sm hover:shadow-md transition-shadow relative group ${c.worstDebtLevel === 'RECOVERY' ? 'border-red-300 bg-red-50' : 'border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                             <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                 {c.cid}
                             </span>
                             <h3 className="text-lg font-bold text-gray-800 mt-1">{c.name}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${c.type === 'WHOLESALE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {c.type === 'WHOLESALE' ? 'Khách Sỉ' : 'Khách Lẻ'}
                        </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-gray-400" /> {c.phone || '---'}
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> <span className="truncate">{c.address || '---'}</span>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-2">
                         <div className="bg-white/50 p-2 rounded text-center border border-gray-100">
                             <p className="text-[10px] text-gray-500 mb-1">GMV</p>
                             <p className="font-bold text-gray-900">{formatCurrency(c.gmv)}</p>
                         </div>
                         <div className={`p-2 rounded text-center border ${c.currentDebt > 0 ? 'bg-red-100 border-red-200' : 'bg-emerald-50 border-emerald-100'}`}>
                             <p className="text-[10px] text-gray-500 mb-1">Công Nợ</p>
                             <p className={`font-bold ${c.currentDebt > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                 {formatCurrency(c.currentDebt)}
                             </p>
                         </div>
                    </div>
                    
                    {/* NEW: Debt Status Indicators in Card */}
                    {c.currentDebt > 0 && (
                        <div className="mt-3">
                            {c.worstDebtLevel === 'RECOVERY' ? (
                                <div className="flex items-center justify-center gap-1.5 py-1.5 bg-red-600 text-white rounded-lg text-[11px] font-bold animate-pulse">
                                    <Siren className="w-3.5 h-3.5" /> THU HỒI CÔNG NỢ NGAY
                                </div>
                            ) : c.worstDebtLevel === 'WARNING' ? (
                                <div className="flex items-center justify-center gap-1.5 py-1.5 bg-orange-500 text-white rounded-lg text-[11px] font-bold">
                                    <ShieldAlert className="w-3.5 h-3.5" /> CẢNH BÁO NỢ
                                </div>
                            ) : c.worstDebtLevel === 'OVERDUE' ? (
                                <div className="flex items-center justify-center py-1.5 bg-red-100 text-red-700 rounded-lg text-[11px] font-bold border border-red-200">
                                    NỢ QUÁ HẠN
                                </div>
                            ) : (
                                <div className="text-[11px] text-center text-gray-500 py-1 bg-gray-50 rounded border border-gray-100 italic">
                                    Đến hạn: {formatDate(c.nextDueDate || '')}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEdit(c)} className="p-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded text-gray-600 shadow-sm">
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(c.id)} className="p-1.5 bg-white border border-gray-200 hover:bg-red-100 rounded text-red-500 shadow-sm">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            ))
          )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editMode ? 'Cập Nhật Khách Hàng' : 'Thêm Khách Hàng Mới'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên (*)</label>
                    <input
                        type="text"
                        required
                        className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số Điện Thoại</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                          type="email"
                          className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Loại Khách</label>
                      <select 
                          className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400"
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      >
                          <option value="RETAIL">Khách Lẻ (Retail)</option>
                          <option value="WHOLESALE">Khách Sỉ (Wholesale)</option>
                      </select>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                  <input
                      type="text"
                      className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400"
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
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  {editMode ? 'Lưu Thay Đổi' : 'Tạo Khách Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCRM;