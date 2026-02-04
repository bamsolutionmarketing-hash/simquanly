import React, { useState } from 'react';
import { SimType } from '../types';
import { generateId } from '../utils';
import { Plus, Trash2, Tags } from 'lucide-react';

interface Props {
  simTypes: SimType[];
  onAdd: (type: SimType) => void;
  onDelete: (id: string) => void;
}

const ProductManager: React.FC<Props> = ({ simTypes, onAdd, onDelete }) => {
  const [newTypeName, setNewTypeName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    const newType: SimType = {
      id: generateId(),
      name: newTypeName.trim(),
    };
    onAdd(newType);
    setNewTypeName('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-[#e1e4e8] shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#e8f2ff] rounded-lg flex items-center justify-center">
            <Tags className="w-5 h-5 text-[#0068ff]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1c2126] uppercase tracking-wider">Danh mục sản phẩm</h2>
            <p className="text-[10px] text-[#646d78] uppercase font-bold">Quản lý loại SIM & mã sản phẩm hệ thống</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
          <input
            type="text"
            className="flex-1 px-4 py-2 border border-[#e1e4e8] bg-[#f4f6f8] rounded focus:bg-white focus:ring-1 focus:ring-[#0068ff] outline-none text-[#1c2126] placeholder-[#646d78] text-sm font-bold"
            placeholder="Nhập tên loại SIM mới (Ví dụ: SIM5G-90N, C90N...)"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newTypeName.trim()}
            className="bg-[#0068ff] hover:bg-[#0056d6] text-white px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> THÊM DANH MỤC
          </button>
        </form>

        <div className="border-t border-[#e1e4e8] pt-6">
          <h3 className="text-[10px] font-black text-[#646d78] mb-4 uppercase tracking-widest">Phân loại đang hoạt động</h3>
          {simTypes.length === 0 ? (
            <div className="text-center py-10 bg-[#f4f6f8] rounded-xl border border-dashed border-[#e1e4e8] text-[#646d78] text-xs font-bold uppercase">
              Chưa có loại sản phẩm nào được đăng ký
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {simTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between px-4 py-3 bg-[#f4f6f8] rounded-xl border border-[#e1e4e8] group">
                  <span className="text-sm font-bold text-[#1c2126] uppercase tracking-tighter">{type.name}</span>
                  <button
                    onClick={() => onDelete(type.id)}
                    className="text-[#646d78] hover:text-red-500 opacity-100 lg:opacity-0 group-hover:opacity-100 p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductManager;