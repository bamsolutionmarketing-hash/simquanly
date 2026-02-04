
import React, { useState } from 'react';
import { SimPackage, SimType, InventoryProductStat } from '../types';
import { formatCurrency, generateCode, generateId, formatDate, formatNumberWithCommas, parseFormattedNumber } from '../utils';
import { Plus, Trash2, Box, ChevronDown, ChevronRight, History } from 'lucide-react';

interface Props {
  inventoryStats: InventoryProductStat[];
  simTypes: SimType[];
  onAdd: (pkg: SimPackage) => void;
  onDeleteBatch: (id: string) => void;
  onNavigateToProducts: () => void;
}

const SimInventory: React.FC<Props> = ({ inventoryStats, simTypes, onAdd, onDeleteBatch, onNavigateToProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    simTypeId: '',
    quantity: 0,
    totalImportPrice: 0,
    importDate: new Date().toISOString().split('T')[0],
  });

  const toggleExpand = (id: string) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedType = simTypes.find(t => t.id === formData.simTypeId);
    if (!selectedType) return;

    const newPackage: SimPackage = {
      id: generateId(),
      code: generateCode('SIM'),
      name: selectedType.name,
      simTypeId: selectedType.id,
      quantity: Number(formData.quantity),
      totalImportPrice: Number(formData.totalImportPrice),
      importDate: formData.importDate,
    };
    onAdd(newPackage);
    setIsModalOpen(false);
    setFormData({ simTypeId: '', quantity: 0, totalImportPrice: 0, importDate: new Date().toISOString().split('T')[0] });
  };

  const inputClass = "w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Box className="w-5 h-5 text-blue-600" />
          Kho Sim (Tổng hợp)
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nhập Lô Mới
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Tên Sản Phẩm (Loại Sim)</th>
                <th className="px-4 py-3 text-right">Tổng Nhập</th>
                <th className="px-4 py-3 text-right">Tổng Bán</th>
                <th className="px-4 py-3 text-right">Tồn Hiện Tại</th>
                <th className="px-4 py-3 text-right">Giá Vốn TB</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventoryStats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 italic">
                    Chưa có gói sim nào. Hãy nhập lô đầu tiên.
                  </td>
                </tr>
              ) : (
                inventoryStats.map((stat) => (
                  <React.Fragment key={stat.simTypeId}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer bg-white"
                      onClick={() => toggleExpand(stat.simTypeId)}
                    >
                      <td className="px-4 py-3 text-gray-400">
                        {expandedRows.includes(stat.simTypeId) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>
                      <td className="px-4 py-3 font-bold text-blue-700">{stat.name}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{stat.totalImported.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{stat.totalSold.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 text-base">{stat.currentStock.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-600 italic">{formatCurrency(stat.weightedAvgCost)}</td>
                      <td className="px-4 py-3 text-center">
                        {stat.status === 'LOW_STOCK' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Sắp hết
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Còn hàng
                          </span>
                        )}
                      </td>
                    </tr>

                    {expandedRows.includes(stat.simTypeId) && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="p-0">
                          <div className="px-4 py-3 border-y border-gray-100 shadow-inner">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                              <History size={12} /> Lịch sử nhập hàng (Lô nhập)
                            </h4>
                            <table className="w-full text-xs bg-white rounded border border-gray-200">
                              <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                  <th className="px-3 py-2 text-left">Mã Lô</th>
                                  <th className="px-3 py-2 text-left">Ngày Nhập</th>
                                  <th className="px-3 py-2 text-right">SL Nhập</th>
                                  <th className="px-3 py-2 text-right">Tổng Tiền</th>
                                  <th className="px-3 py-2 text-right">Giá Vốn Lô</th>
                                  <th className="px-3 py-2 text-center">Xóa</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {stat.batches.map(batch => (
                                  <tr key={batch.id} className="hover:bg-blue-50">
                                    <td className="px-3 py-2 font-mono text-gray-600 font-medium">{batch.code}</td>
                                    <td className="px-3 py-2 text-gray-600">{formatDate(batch.importDate)}</td>
                                    <td className="px-3 py-2 text-right font-bold text-gray-800">{batch.quantity.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(batch.totalImportPrice)}</td>
                                    <td className="px-3 py-2 text-right text-gray-500 italic">
                                      {formatCurrency(batch.quantity > 0 ? batch.totalImportPrice / batch.quantity : 0)}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteBatch(batch.id); }}
                                        className="text-gray-400 hover:text-red-500"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Nhập Lô Sim Mới</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại Sim (Sản Phẩm)</label>
                {simTypes.length > 0 ? (
                  <select
                    required
                    className={inputClass}
                    value={formData.simTypeId}
                    onChange={(e) => setFormData({ ...formData, simTypeId: e.target.value })}
                  >
                    <option value="">-- Chọn Loại Sim --</option>
                    {simTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                    <p className="text-sm text-gray-500 mb-2">Chưa có loại sim nào.</p>
                    <button
                      type="button"
                      onClick={() => { setIsModalOpen(false); onNavigateToProducts(); }}
                      className="text-blue-600 font-medium text-sm hover:underline"
                    >
                      + Tạo Loại Sim ngay
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Nhập</label>
                  <input
                    type="date"
                    required
                    className={inputClass}
                    value={formData.importDate}
                    onChange={(e) => setFormData({ ...formData, importDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số Lượng</label>
                  <input
                    type="text"
                    required
                    className={inputClass}
                    value={formatNumberWithCommas(formData.quantity)}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFormattedNumber(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tổng Tiền Nhập (VNĐ)</label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  placeholder="50,000,000"
                  value={formatNumberWithCommas(formData.totalImportPrice)}
                  onChange={(e) => setFormData({ ...formData, totalImportPrice: parseFormattedNumber(e.target.value) })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Giá vốn/sim dự kiến: {formData.quantity > 0 ? formatCurrency(formData.totalImportPrice / formData.quantity) : '0 ₫'}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!formData.simTypeId}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  Lưu Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimInventory;
