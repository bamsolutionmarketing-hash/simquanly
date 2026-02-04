import React, { useRef } from 'react';
import { api } from '../api';
import { SimType, SimPackage, SaleOrder, Transaction, Customer, DueDateLog } from '../types';
import { Download, Upload, Database, FileJson, Info, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  fullData: {
    simTypes: SimType[];
    packages: SimPackage[];
    orders: SaleOrder[];
    transactions: Transaction[];
    customers: Customer[];
    dueDateLogs: DueDateLog[];
  };
  onImport: (data: any) => void;
}

const DataManager: React.FC<Props> = ({ fullData, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportAll = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Sim Types
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fullData.simTypes), "SimTypes");
      // 2. Inventory (Packages)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fullData.packages), "Inventory");
      // 3. Orders
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fullData.orders), "Orders");
      // 4. Transactions
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fullData.transactions), "Transactions");
      // 5. Customers
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fullData.customers), "Customers");
      // 6. Due Date Logs
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fullData.dueDateLogs || []), "HistoryLogs");

      const fileName = `SimBasePro_FullBackup_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Export error:", error);
      alert("Lỗi khi xuất dữ liệu: " + (error as Error).message);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("⚠️ CẢNH BÁO QUAN TRỌNG:\nTải lên dữ liệu mới sẽ XÓA TOÀN BỘ dữ liệu hiện tại trên máy này và thay thế bằng dữ liệu từ file Excel.\n\nBạn có chắc chắn muốn tiếp tục?")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'array' });

        // Helper to get sheet data safely
        const getSheet = (name: string) => {
          const sheet = wb.Sheets[name];
          return sheet ? XLSX.utils.sheet_to_json(sheet) : [];
        };

        // Strict Type Casting & Normalization
        // This ensures numbers stay numbers even if Excel formatted them as strings
        const newData = {
          simTypes: (getSheet("SimTypes") as any[]).map(t => ({
            id: String(t.id || ''),
            name: String(t.name || '')
          })),
          packages: (getSheet("Inventory") as any[]).map(p => ({
            ...p,
            quantity: Number(p.quantity || 0),
            totalImportPrice: Number(p.totalImportPrice || 0)
          })),
          orders: (getSheet("Orders") as any[]).map(o => ({
            ...o,
            quantity: Number(o.quantity || 0),
            salePrice: Number(o.salePrice || 0),
            dueDateChanges: Number(o.dueDateChanges || 0),
            isFinished: o.isFinished === true || o.isFinished === 'true'
          })),
          transactions: (getSheet("Transactions") as any[]).map(t => ({
            ...t,
            amount: Number(t.amount || 0)
          })),
          customers: (getSheet("Customers") as any[]).map(c => ({
            ...c
          })),
          dueDateLogs: (getSheet("HistoryLogs") as any[]).map(l => ({
            ...l
          })),
        };

        if (newData.simTypes.length === 0 && newData.orders.length === 0 && newData.packages.length === 0) {
          throw new Error("File không chứa dữ liệu hợp lệ hoặc các Sheet bị sai tên.");
        }

        // Call API to Import Data
        await api.post('/import', newData);

        // Refresh Data via Store Import (triggers fetch)
        onImport(newData);

        // Reset input to allow selecting same file again if needed
        e.target.value = '';

        // Success message
        alert("✅ Khôi phục thành công!\nToàn bộ báo cáo và dữ liệu đã được cập nhật.");

        // Force a page reload to ensure all hooks/states are fresh (optional but safer)
        // window.location.reload(); 
      } catch (err) {
        console.error("Import error details:", err);
        alert("❌ LỖI KHÔNG THỂ NHẬP DỮ LIỆU:\n" + (err as Error).message + "\n\nVui lòng đảm bảo bạn sử dụng đúng file .xlsx đã được xuất từ ứng dụng này.");
        e.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Quản trị Dữ liệu & Hệ thống</h2>
            <p className="text-sm text-gray-500">Sao lưu toàn bộ database và khôi phục trạng thái làm việc</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Export Card */}
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <Download className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Sao lưu toàn bộ (Export)</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Tải về toàn bộ danh mục sim, đơn hàng, sổ quỹ và khách hàng vào một file Excel duy nhất để lưu trữ lâu dài.
            </p>
            <button
              onClick={handleExportAll}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <FileJson className="w-4 h-4" /> Xuất file Excel dự phòng
            </button>
          </div>

          {/* Import Card */}
          <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <Upload className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Khôi phục dữ liệu (Import)</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Tải lên file backup đã xuất trước đó để tiếp tục hiển thị báo cáo và dữ liệu trên trình duyệt này.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            <button
              onClick={handleImportClick}
              className="w-full py-3 bg-white border-2 border-amber-500 text-amber-600 rounded-lg font-bold hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" /> Chọn file Excel khôi phục
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-4">
            <Info className="w-6 h-6 text-blue-600 shrink-0" />
            <div className="text-sm text-blue-800 leading-relaxed">
              <p className="font-bold mb-1">Quy trình vận hành an toàn:</p>
              1. Trước khi xóa lịch sử trình duyệt, hãy <strong>Sao lưu toàn bộ</strong>.<br />
              2. Lưu file Excel này vào Google Drive hoặc ổ cứng cá nhân.<br />
              3. Khi cần xem lại báo cáo hoặc đổi thiết bị, dùng tính năng <strong>Khôi phục</strong>.
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            <div className="text-sm text-amber-800 leading-relaxed">
              <p className="font-bold mb-1">Lưu ý khi Import:</p>
              • Ứng dụng sẽ tự động chuyển đổi định dạng để biểu đồ hoạt động.<br />
              • File phải có các sheet: SimTypes, Inventory, Orders, Transactions, Customers.<br />
              • Không nên sửa tên các Sheet hoặc tiêu đề cột trong file Excel.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManager;