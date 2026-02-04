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
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Tags className="w-5 h-5 text-purple-600" />
          Danh mục Loại Sim (Sản phẩm)
        </h2>
        
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            type="text"
            className="flex-1 px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-gray-900 text-white placeholder-gray-400"
            placeholder="Nhập tên loại sim mới (VD: SIM5G-90N, C90N...)"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newTypeName.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Thêm
          </button>
        </form>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase">Danh sách hiện có</h3>
          {simTypes.length === 0 ? (
            <p className="text-gray-400 italic text-center py-4">Chưa có loại sim nào. Hãy thêm mới.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {simTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 group">
                  <span className="font-medium text-gray-800">{type.name}</span>
                  <button
                    onClick={() => onDelete(type.id)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                    title="Xóa"
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