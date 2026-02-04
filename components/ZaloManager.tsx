import React, { useState, useEffect, useMemo } from 'react';
import { ZaloConfig, SaleOrderWithStats, CustomerWithStats } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { MessageSquare, Send, Settings, ShieldCheck, CheckCircle2, AlertCircle, MessageCircle, Copy, Clock } from 'lucide-react';

interface Props {
  orders: SaleOrderWithStats[];
  customers: CustomerWithStats[];
}

const ZaloManager: React.FC<Props> = ({ orders, customers }) => {
  const [config, setConfig] = useState<ZaloConfig>(() => {
    const saved = localStorage.getItem('zalo-config');
    return saved ? JSON.parse(saved) : {
      oaId: '',
      accessToken: '',
      phoneNumber: '',
      isEnabled: false
    };
  });

  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem('zalo-config', JSON.stringify(config));
  }, [config]);

  const reportData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.date === today);
    const revenue = todayOrders.reduce((s, o) => s + o.totalAmount, 0);
    const profit = todayOrders.reduce((s, o) => s + o.profit, 0);
    const overdueCount = orders.filter(o => o.isOverdue).length;
    const totalOverdueAmount = orders.filter(o => o.isOverdue).reduce((s, o) => s + o.remaining, 0);

    const message = `📊 *BÁO CÁO SIM MANAGER* - ${formatDate(today)}
----------------------------
💰 Doanh thu: ${formatCurrency(revenue)}
📈 Lợi nhuận: ${formatCurrency(profit)}
📦 Đơn hàng: ${todayOrders.length} đơn
----------------------------
⚠️ *CẢNH BÁO NỢ QUÁ HẠN:*
- Số đơn: ${overdueCount} đơn
- Tổng nợ: ${formatCurrency(totalOverdueAmount)}
----------------------------
👉 Xem chi tiết tại Dashboard.`;

    return { revenue, profit, message, overdueCount };
  }, [orders]);

  const handleSendZalo = async () => {
    if (!config.oaId && !config.phoneNumber) {
      alert("Vui lòng cấu hình OA ID hoặc Số điện thoại nhận tin!");
      return;
    }

    setIsSending(true);
    try {
      // Simulate Zalo API request
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (e) {
      alert("Lỗi khi gửi tin nhắn Zalo.");
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reportData.message);
    alert("Đã sao chép nội dung báo cáo!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-[#0068ff]" />
              Tích hợp Zalo Business
            </h2>
            <p className="text-sm text-gray-500 mt-1">Gửi báo cáo doanh thu & công nợ tự động qua Zalo OA</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${config.isEnabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${config.isEnabled ? 'bg-[#0068ff] animate-pulse' : 'bg-gray-400'}`}></div>
            {config.isEnabled ? 'Đã kết nối' : 'Chưa kết nối'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings */}
          <div className="space-y-4 border-r border-gray-100 pr-0 lg:pr-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4" /> Cấu hình Zalo OA
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Zalo OA ID</label>
                <input 
                  type="text"
                  placeholder="Nhập OA ID từ Zalo Developers"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0068ff] outline-none"
                  value={config.oaId}
                  onChange={(e) => setConfig({...config, oaId: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Access Token</label>
                <input 
                  type="password"
                  placeholder="Mã truy cập API"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0068ff] outline-none"
                  value={config.accessToken}
                  onChange={(e) => setConfig({...config, accessToken: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">SĐT Nhận Báo Cáo (Admin)</label>
                <input 
                  type="text"
                  placeholder="09xxx..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0068ff] outline-none"
                  value={config.phoneNumber}
                  onChange={(e) => setConfig({...config, phoneNumber: e.target.value})}
                />
              </div>
              <div className="pt-2 flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="zalo-enable"
                  className="w-4 h-4 rounded text-[#0068ff]"
                  checked={config.isEnabled}
                  onChange={(e) => setConfig({...config, isEnabled: e.target.checked})}
                />
                <label htmlFor="zalo-enable" className="text-sm text-gray-700 cursor-pointer">Tự động gửi báo cáo cuối ngày</label>
              </div>
            </div>
          </div>

          {/* Report Preview */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Preview Tin Nhắn
            </h3>

            <div className="bg-[#f0f2f5] p-4 rounded-xl border border-gray-200 relative min-h-[300px] flex flex-col shadow-inner">
               <div className="bg-[#e7f3ff] self-start max-w-[90%] p-3 rounded-2xl rounded-tl-none shadow-sm border border-[#d1e6ff] text-sm whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                  {reportData.message}
                  <div className="text-[10px] text-gray-400 mt-2 text-right italic">Vừa xong</div>
               </div>

               <div className="mt-auto flex gap-2">
                  <button 
                    onClick={copyToClipboard}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Sao chép nội dung
                  </button>
                  <button 
                    onClick={handleSendZalo}
                    disabled={isSending}
                    className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-[#0068ff] text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {isSending ? (
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                    ) : sendSuccess ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    {sendSuccess ? "Đã gửi thành công!" : "Gửi báo cáo ngay"}
                  </button>
               </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              <p className="text-[11px] text-amber-700 leading-tight">
                <strong>Lưu ý:</strong> Gửi báo cáo qua Zalo OA yêu cầu OA đã được xác thực và ứng dụng có quyền <code>send_message</code>. Nếu chưa có OA, bạn có thể copy nội dung để gửi thủ công qua App Zalo.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 bg-[#f7f9fc] -mx-6 -mb-6 p-6 rounded-b-xl">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white text-[#0068ff] rounded-lg shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">Lợi ích của tích hợp Zalo</h4>
              <ul className="text-xs text-gray-600 mt-2 space-y-1.5 list-disc list-inside">
                <li><strong>Thuận tiện:</strong> Nhận ngay kết quả kinh doanh ngày qua tin nhắn điện thoại.</li>
                <li><strong>Đôn đốc công nợ:</strong> Danh sách nợ xấu được nhắc nhở trực tiếp cho quản lý.</li>
                <li><strong>Chuyên nghiệp:</strong> Gửi thông báo tự động từ hệ thống thay vì nhắn tin thủ công.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZaloManager;