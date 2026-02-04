import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Lock, Mail, Loader2, UserPlus, LogIn, Cpu, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('Gửi email xác nhận thành công! Vui lòng kiểm tra hộp thư của bạn.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message === 'Invalid login credentials' ? 'Email hoặc mật khẩu không chính xác.' : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/30 rounded-full blur-3xl"></div>

            <div className="max-w-md w-full relative z-10 transition-all duration-500">
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-blue-900/10 p-10 border border-white">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200 rotate-3">
                            <Cpu className="text-white w-8 h-8 -rotate-3" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                            {isSignUp ? 'Tạo tài khoản' : 'Đăng nhập'}
                        </h2>
                        <p className="text-slate-400 mt-3 text-sm font-medium">
                            {isSignUp ? 'Bắt đầu quản lý kho SIM chuyên nghiệp' : 'Hệ thống quản lý SIM nội bộ v2.0'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-red-600 rounded-full"></div>
                                    {error}
                                </div>
                            </div>
                        )}
                        {message && (
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2">
                                    < ShieldCheck className="w-4 h-4" />
                                    {message}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Email liên kết</label>
                            <div className="relative group">
                                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Mật khẩu bảo mật</label>
                            <div className="relative group">
                                <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {!isSignUp && (
                            <div className="flex justify-end">
                                <button type="button" className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                    Quên mật khẩu?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>{isSignUp ? 'Tạo tài khoản ngay' : 'Truy cập hệ thống'} <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-4"
                        >
                            {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 grayscale">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" className="h-4" />
                    <div className="w-[1px] h-4 bg-slate-300"></div>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.png" alt="Mastercard" className="h-6" />
                </div>
            </div>
        </div>
    );
}
