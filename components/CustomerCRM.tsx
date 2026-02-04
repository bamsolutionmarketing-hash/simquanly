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
            {/* Header (PetControl Style) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border border-[#e1e4e8] shadow-sm gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e8f2ff] rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#0068ff]" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-[#1c2126] uppercase tracking-wider">Khách hàng (CRM)</h2>
                        <p className="text-[10px] text-[#646d78] uppercase font-bold">Quản lý quan hệ & theo dõi công nợ khách hàng</p>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#646d78]" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, SĐT hoặc mã khách..."
                            className="w-full pl-9 pr-4 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg focus:bg-white focus:ring-1 focus:ring-[#0068ff] outline-none text-sm placeholder-[#646d78] text-[#1c2126]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="bg-[#0068ff] hover:bg-[#0056d6] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-black shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> THÊM KHÁCH HÀNG
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.length === 0 ? (
                    <div className="col-span-full text-center py-10 bg-white rounded-xl border border-dashed border-[#e1e4e8] text-[#646d78] text-xs font-bold font-mono">
                        {searchTerm ? 'NO CLIENTS MATCH SEARCH' : 'DATABASE EMPTY: ADD YOUR FIRST CLIENT'}
                    </div>
                ) : (
                    filteredCustomers.map(c => (
                        <div key={c.id} className={`bg-white p-5 rounded-xl border shadow-sm relative group ${c.worstDebtLevel === 'RECOVERY' ? 'border-red-200 bg-red-50' : 'border-[#e1e4e8]'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-[#646d78] bg-[#f4f6f8] px-1.5 py-0.5 rounded border border-[#e1e4e8] uppercase tracking-tighter">
                                        {c.cid}
                                    </span>
                                    <h3 className="text-base font-black text-[#1c2126] uppercase tracking-tight">{c.name}</h3>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${c.type === 'WHOLESALE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {c.type === 'WHOLESALE' ? 'Wholesale' : 'Retail'}
                                </span>
                            </div>

                            <div className="space-y-2 text-xs font-bold text-[#646d78] mb-5 uppercase tracking-tighter">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-[#646d78]" /> {c.phone || 'N/A'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-[#646d78]" /> <span className="truncate">{c.address || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="border-t border-[#e1e4e8] pt-4 grid grid-cols-2 gap-3">
                                <div className="bg-[#f4f6f8] p-2 rounded-lg text-center border border-[#e1e4e8]">
                                    <p className="text-[9px] font-black text-[#646d78] uppercase mb-1 tracking-tighter">TỔNG MUA</p>
                                    <p className="text-sm font-black text-[#1c2126]">{formatCurrency(c.gmv)}</p>
                                </div>
                                <div className={`p-2 rounded-lg text-center border ${c.currentDebt > 0 ? 'bg-red-100 border-red-200' : 'bg-emerald-50 border-emerald-100'}`}>
                                    <p className="text-[9px] font-black text-[#646d78] uppercase mb-1 tracking-tighter">CÒN NỢ</p>
                                    <p className={`text-sm font-black ${c.currentDebt > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                        {formatCurrency(c.currentDebt)}
                                    </p>
                                </div>
                            </div>

                            {/* Debt Status Indicators in Card */}
                            {c.currentDebt > 0 && (
                                <div className="mt-4">
                                    {c.worstDebtLevel === 'RECOVERY' ? (
                                        <div className="flex items-center justify-center gap-1.5 py-1.5 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                                            <Siren className="w-4 h-4" /> RECOVERY MODE
                                        </div>
                                    ) : c.worstDebtLevel === 'WARNING' ? (
                                        <div className="flex items-center justify-center gap-1.5 py-1.5 bg-orange-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                                            <ShieldAlert className="w-4 h-4" /> WARNING
                                        </div>
                                    ) : c.worstDebtLevel === 'OVERDUE' ? (
                                        <div className="flex items-center justify-center py-1.5 bg-red-100 text-red-700 rounded-lg text-[9px] font-black uppercase border border-red-200 tracking-widest">
                                            OVERDUE
                                        </div>
                                    ) : (
                                        <div className="text-[9px] font-black text-center text-[#646d78] py-1.5 bg-[#f4f6f8] rounded-lg border border-[#e1e4e8] uppercase tracking-tighter italic">
                                            LATEST DUE: {formatDate(c.nextDueDate || '')}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="absolute top-4 right-4 flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100">
                                <button onClick={() => handleOpenEdit(c)} className="p-1.5 bg-white border border-[#e1e4e8] hover:bg-[#f4f6f8] rounded-lg text-[#646d78] shadow-sm">
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onDelete(c.id)} className="p-1.5 bg-white border border-[#e1e4e8] hover:bg-red-100 rounded-lg text-red-500 shadow-sm">
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
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">{editMode ? 'Cập Nhật Khách Hàng' : 'Thêm Khách Hàng Mới'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên (*)</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-[#dee0e3] rounded focus:ring-1 focus:ring-indigo-500 outline-none placeholder-gray-400 bg-white text-[#1f2329]"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số Điện Thoại</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-[#dee0e3] rounded focus:ring-1 focus:ring-indigo-500 outline-none placeholder-gray-400 bg-white text-[#1f2329]"
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
                                        className="w-full px-3 py-2 border border-[#dee0e3] rounded focus:ring-1 focus:ring-indigo-500 outline-none placeholder-gray-400 bg-white text-[#1f2329]"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại Khách</label>
                                    <select
                                        className="w-full px-3 py-2 border border-[#dee0e3] rounded focus:ring-1 focus:ring-indigo-500 outline-none placeholder-gray-400 bg-white text-[#1f2329]"
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
                                    className="w-full px-3 py-2 border border-[#dee0e3] rounded focus:ring-1 focus:ring-indigo-500 outline-none placeholder-gray-400 bg-white text-[#1f2329]"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                <textarea
                                    rows={2}
                                    className="w-full px-3 py-2 border border-[#dee0e3] rounded focus:ring-1 focus:ring-indigo-500 outline-none placeholder-gray-400 bg-white text-[#1f2329]"
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