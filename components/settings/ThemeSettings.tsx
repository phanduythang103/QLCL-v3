import React, { useState, useEffect } from 'react';
import { Upload, Save, Image as ImageIcon, AlertCircle, Check, Loader } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface UISettings {
    id: string;
    anh: string;
    tieu_de_chinh: string;
    tieu_de_phu: string;
    co_chu_chinh: number;
    co_chu_phu: number;
}

export default function ThemeSettings() {
    const [settings, setSettings] = useState<UISettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    // Form state
    const [tieuDeChinh, setTieuDeChinh] = useState('');
    const [tieuDePhu, setTieuDePhu] = useState('');
    const [coChuChinh, setCoChuChinh] = useState(48);
    const [coChuPhu, setCoChuPhu] = useState(24);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Fetch current settings
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('cai_dat_giao_dien')
                .select('*')
                .limit(1)
                .single();

            if (data && !error) {
                setSettings(data);
                setTieuDeChinh(data.tieu_de_chinh);
                setTieuDePhu(data.tieu_de_phu || '');
                setCoChuChinh(data.co_chu_chinh || 48);
                setCoChuPhu(data.co_chu_phu || 24);

                // Get image URL
                if (data.anh) {
                    const { data: urlData } = supabase.storage
                        .from('avatar')
                        .getPublicUrl(data.anh);
                    if (urlData) {
                        setImagePreview(urlData.publicUrl);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            showMessage('error', 'Không thể tải cài đặt giao diện');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showMessage('error', 'Vui lòng chọn file ảnh');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showMessage('error', 'Kích thước ảnh không được vượt quá 5MB');
                return;
            }
            setSelectedFile(file);
            // Preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (): Promise<string | null> => {
        if (!selectedFile) return settings?.anh || null;

        try {
            setUploading(true);
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `login-bg-${Date.now()}.${fileExt}`;
            const filePath = fileName;

            // Upload new image
            const { error: uploadError } = await supabase.storage
                .from('avatar')
                .upload(filePath, selectedFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw uploadError;
            }

            // Delete old image if exists AND upload was successful
            if (settings?.anh) {
                await supabase.storage.from('avatar').remove([settings.anh]);
            }

            return filePath;
        } catch (err) {
            console.error('Error uploading image:', err);
            showMessage('error', 'Không thể upload ảnh: ' + (err as any).message);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!tieuDeChinh.trim()) {
            showMessage('error', 'Vui lòng nhập tiêu đề chính');
            return;
        }

        try {
            setSaving(true);

            // Upload image first if selected
            const imagePath = await uploadImage();

            // If we have a file selected but failed to get an imagePath, don't proceed to update DB
            if (selectedFile && !imagePath) {
                return;
            }

            const updateData = {
                tieu_de_chinh: tieuDeChinh.trim(),
                tieu_de_phu: tieuDePhu.trim(),
                co_chu_chinh: coChuChinh,
                co_chu_phu: coChuPhu,
                anh: imagePath || settings?.anh || '',
                updated_at: new Date().toISOString(),
            };

            let saveError;
            if (settings?.id) {
                // Update existing
                const { error } = await supabase
                    .from('cai_dat_giao_dien')
                    .update(updateData)
                    .eq('id', settings.id);
                saveError = error;
            } else {
                // Insert new
                const { error } = await supabase
                    .from('cai_dat_giao_dien')
                    .insert([updateData]);
                saveError = error;
            }

            if (saveError) throw saveError;

            showMessage('success', 'Lưu cài đặt thành công!');
            setSelectedFile(null);
            await fetchSettings();
        } catch (err) {
            console.error('Error saving settings:', err);
            showMessage('error', 'Không thể lưu cài đặt: ' + (err as any).message);
        } finally {
            setSaving(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="animate-spin text-primary-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Form */}
                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <ImageIcon size={20} className="text-primary-600" />
                            Thông tin giao diện
                        </h3>

                        <div className="space-y-4">
                            {/* Tiêu đề chính */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Tiêu đề chính <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={tieuDeChinh}
                                    onChange={(e) => setTieuDeChinh(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    placeholder="VD: Quản lý Chất lượng Bệnh viện"
                                />
                            </div>

                            {/* Tiêu đề phụ */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Tiêu đề phụ
                                </label>
                                <input
                                    type="text"
                                    value={tieuDePhu}
                                    onChange={(e) => setTieuDePhu(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    placeholder="VD: Đăng nhập"
                                />
                            </div>

                            {/* Cỡ chữ */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Cỡ chữ chính ({coChuChinh}px)
                                    </label>
                                    <input
                                        type="range"
                                        min="24"
                                        max="120"
                                        step="2"
                                        value={coChuChinh}
                                        onChange={(e) => setCoChuChinh(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Cỡ chữ phụ ({coChuPhu}px)
                                    </label>
                                    <input
                                        type="range"
                                        min="12"
                                        max="60"
                                        step="1"
                                        value={coChuPhu}
                                        onChange={(e) => setCoChuPhu(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                    />
                                </div>
                            </div>

                            {/* Upload ảnh */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Ảnh nền đăng nhập
                                </label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label htmlFor="image-upload" className="cursor-pointer">
                                        <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                                        <p className="text-sm text-slate-600 mb-1">
                                            Click để chọn ảnh hoặc kéo thả vào đây
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            PNG, JPG, WEBP (tối đa 5MB)
                                        </p>
                                    </label>
                                </div>
                                {selectedFile && (
                                    <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                                        <Check size={16} />
                                        Đã chọn: {selectedFile.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving || uploading || !tieuDeChinh}
                        className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving || uploading ? (
                            <>
                                <Loader className="animate-spin" size={20} />
                                {uploading ? 'Đang upload ảnh...' : 'Đang lưu...'}
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Lưu cài đặt
                            </>
                        )}
                    </button>
                </div>

                {/* Right Column - Preview */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Xem trước</h3>

                    {imagePreview ? (
                        <div className="space-y-4">
                            <div className="aspect-video rounded-lg overflow-hidden border border-slate-200">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <p
                                    className="font-semibold text-slate-700 mb-1 leading-tight break-words"
                                    style={{ fontSize: `${coChuChinh * 0.4}px` }} // Scale down for preview
                                >
                                    {tieuDeChinh || 'Tiêu đề chính'}
                                </p>
                                <p
                                    className="text-slate-500 break-words"
                                    style={{ fontSize: `${coChuPhu * 0.6}px` }} // Scale down for preview
                                >
                                    {tieuDePhu || 'Tiêu đề phụ'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="aspect-video rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <div className="text-center">
                                <ImageIcon size={48} className="mx-auto mb-2" />
                                <p className="text-sm">Chưa có ảnh nền</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 items-start">
                <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-700">
                    <p className="font-semibold mb-1">Lưu ý:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Ảnh nền sẽ hiển thị ở bên phải trang đăng nhập</li>
                        <li>Tiêu đề chính và phụ sẽ hiển thị ở form đăng nhập</li>
                        <li>Thay đổi sẽ có hiệu lực ngay lập tức</li>
                        <li>Ảnh được lưu trong bucket "avatar" trên Supabase Storage</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
