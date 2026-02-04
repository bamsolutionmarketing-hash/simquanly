
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
      {/* Header (PetControl Style) */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#e1e4e8] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#e8f2ff] rounded-lg flex items-center justify-center">
            <Box className="w-5 h-5 text-[#0068ff]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1c2126] uppercase tracking-wider">Kho hàng (Warehouse)</h2>
            <p className="text-[10px] text-[#646d78] uppercase font-bold">Quản lý tồn kho & giá vốn</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0068ff] hover:bg-[#0056d6] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-black shadow-sm"
        >
          <Plus className="w-4 h-4" /> NHẬP KHO MỚI
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e1e4e8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f4f6f8] text-[#646d78] font-black uppercase tracking-tighter border-b border-[#e1e4e8]">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">SẢN PHẨM / LOẠI SIM</th>
                <th className="px-4 py-3 text-center">TỔNG NHẬP</th>
                <th className="px-4 py-3 text-center">ĐÃ BÁN</th>
                <th className="px-4 py-3 text-center">TỒN KHO</th>
                <th className="px-4 py-3 text-right">GIÁ VỐN TB</th>
                <th className="px-4 py-3 text-center">TRẠNG THÁI</th>
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
                      <td className="px-4 py-3 font-black text-[#1c2126] text-sm">{stat.name.toUpperCase()}</td>
                      <td className="px-4 py-3 text-center text-[11px] font-bold text-[#646d78]">{stat.totalImported.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center text-[11px] font-bold text-[#646d78]">{stat.totalSold.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center font-black text-[#1c2126] text-sm">{stat.currentStock.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-black text-[#0068ff] text-xs">{formatCurrency(stat.weightedAvgCost)}</td>
                      <td className="px-4 py-3 text-center">
                        {stat.status === 'LOW_STOCK' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-red-50 text-red-600 uppercase tracking-widest border border-red-100">
                            HẾT HÀNG
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-emerald-50 text-emerald-600 uppercase tracking-widest border border-emerald-100">
                            CÒN HÀNG
                          </span>
                        )}
                      </td>
                    </tr>

                    {expandedRows.includes(stat.simTypeId) && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="p-0">
                          <div className="px-4 py-3 border-y border-gray-100 shadow-inner">
                            <h4 className="text-[10px] font-black text-[#646d78] uppercase mb-3 flex items-center gap-1 tracking-widest">
                              <History size={12} /> Lịch sử nhập hàng & Lô hàng:
                            </h4>
                            <table className="w-full text-[10px] bg-white rounded-lg border border-[#e1e4e8] overflow-hidden">
                              <thead className="bg-[#f4f6f8] text-[#646d78] font-black uppercase tracking-widest border-b border-[#e1e4e8]">
                                <tr>
                                  <th className="px-3 py-2 text-left">MÃ LÔ</th>
                                  <th className="px-3 py-2 text-left">NGÀY NHẬP</th>
                                  <th className="px-3 py-2 text-right">SL NHẬP</th>
                                  <th className="px-3 py-2 text-right">TỔNG TIỀN</th>
                                  <th className="px-3 py-2 text-right">GIÁ VỐN/SIM</th>
                                  <th className="px-3 py-2 text-center">XÓA</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#f4f6f8]">
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-sm font-black text-[#1c2126] mb-6 uppercase tracking-widest flex items-center gap-2">
              <Box className="w-4 h-4 text-[#0068ff]" /> ĐĂNG KÝ NHẬP LÔ MỚI
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">LOẠI SẢN PHẨM</label>
                {simTypes.length > 0 ? (
                  <select
                    required
                    className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff]"
                    value={formData.simTypeId}
                    onChange={(e) => setFormData({ ...formData, simTypeId: e.target.value })}
                  >
                    <option value="">-- CHỌN DANH MỤC --</option>
                    {simTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-center p-6 bg-[#f4f6f8] rounded-xl border border-[#e1e4e8] border-dashed">
                    <p className="text-[10px] font-bold text-[#646d78] mb-3 uppercase">Chưa có danh mục sản phẩm.</p>
                    <button
                      type="button"
                      onClick={() => { setIsModalOpen(false); onNavigateToProducts(); }}
                      className="text-[#0068ff] font-black text-[10px] uppercase tracking-widest hover:underline"
                    >
                      + TẠO DANH MỤC MỚI
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">NGÀY NHẬP</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff] uppercase"
                    value={formData.importDate}
                    onChange={(e) => setFormData({ ...formData, importDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">SỐ LƯỢNG (UNIT)</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff]"
                    value={formatNumberWithCommas(formData.quantity)}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFormattedNumber(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black text-[#646d78] uppercase tracking-widest mb-1.5">TỔNG CHI PHÍ NHẬP (VNĐ)</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-[#f4f6f8] border border-[#e1e4e8] rounded-lg text-sm font-bold text-[#1c2126] outline-none focus:bg-white focus:ring-1 focus:ring-[#0068ff]"
                  placeholder="50,000,000"
                  value={formatNumberWithCommas(formData.totalImportPrice)}
                  onChange={(e) => setFormData({ ...formData, totalImportPrice: parseFormattedNumber(e.target.value) })}
                />
                <p className="text-[9px] font-bold text-[#646d78] mt-2 uppercase tracking-tight">
                  GIÁ VỐN DỰ KIẾN: {formData.quantity > 0 ? <span className="text-[#0068ff] font-black">{formatCurrency(formData.totalImportPrice / formData.quantity)}</span> : '--'}
                </p>
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
                  disabled={!formData.simTypeId}
                  className="flex-1 py-2 bg-[#0068ff] text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm disabled:opacity-50"
                >
                  XÁC NHẬN NHẬP KHO
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
