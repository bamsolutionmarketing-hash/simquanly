import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { User, LogOut, Camera, Save, Loader2, CheckCircle } from 'lucide-react';

const AVATAR_PRESETS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Cookie',
];

export default function AccountSettings() {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<{ full_name: string; avatar_url: string }>({
        full_name: '',
        avatar_url: AVATAR_PRESETS[0],
    });
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadProfile() {
            if (!user) return;
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile({
                    full_name: data.full_name || user.email || '',
                    avatar_url: data.avatar_url || AVATAR_PRESETS[0],
                });
            }
        }
        loadProfile();
    }, [user]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        setError(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user?.id,
                    full_name: profile.full_name,
                    avatar_url: profile.avatar_url,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Thiết lập tài khoản</h2>
                        <p className="text-gray-500">Cập nhật thông tin cá nhân và quản lý tài khoản</p>
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2">
                            <span className="font-bold">Lỗi:</span> {error}
                        </div>
                    )}

                    {/* Avatar Selection */}
                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-gray-700">Ảnh đại diện</label>
                        <div className="flex flex-wrap gap-4">
                            {AVATAR_PRESETS.map((url) => (
                                <button
                                    key={url}
                                    type="button"
                                    onClick={() => setProfile({ ...profile, avatar_url: url })}
                                    className={`relative w-16 h-16 rounded-full border-2 transition-all overflow-hidden ${profile.avatar_url === url ? 'border-blue-500 scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <img src={url} alt="Avatar Preset" className="w-full h-full object-cover" />
                                    {profile.avatar_url === url && (
                                        <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                                            <div className="bg-blue-500 text-white rounded-full p-0.5">
                                                <CheckCircle className="w-3 h-3" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Họ và tên</label>
                        <input
                            type="text"
                            required
                            value={profile.full_name}
                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                            placeholder="Nhập tên của bạn"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Email</label>
                        <input
                            type="email"
                            disabled
                            value={user?.email || ''}
                            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400">Email không thể thay đổi</p>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {success ? 'Đã lưu!' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-red-900 text-lg">Đăng xuất</h3>
                    <p className="text-red-700 text-sm opacity-80">Rời khỏi phiên làm việc hiện tại trên thiết bị này</p>
                </div>
                <button
                    onClick={signOut}
                    className="bg-white hover:bg-red-500 hover:text-white text-red-600 font-bold px-6 py-3 rounded-xl border border-red-200 transition-all flex items-center gap-2 shadow-sm"
                >
                    <LogOut className="w-5 h-5" />
                    Thoát
                </button>
            </div>
        </div>
    );
}
