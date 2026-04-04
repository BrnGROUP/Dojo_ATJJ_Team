import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

interface PhotoUploadProps {
    url?: string;
    onUpload: (url: string) => void;
    label?: string;
    description?: string;
    className?: string;
    bucketName?: string;
}

export function PhotoUpload({ 
    url, 
    onUpload, 
    label = "Foto do Usuário", 
    description = "PNG, JPG ou WEBP até 2MB",
    className,
    bucketName = 'avatars'
}: PhotoUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(url);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validations
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Arquivo muito grande. Máximo 2MB.');
            return;
        }

        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Tipo de arquivo não suportado. Use PNG, JPG ou WEBP.');
            return;
        }

        try {
            setUploading(true);
            
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError, data } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file, { 
                    upsert: true,
                    contentType: file.type 
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw uploadError;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(data.path);

            setPreviewUrl(publicUrl);
            onUpload(publicUrl);
            toast.success('Foto carregada com sucesso!');

        } catch (error: any) {
            toast.error(`Erro no upload: ${error.message || 'Verifique se o bucket "avatars" existe.'}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">{label}</label>
            
            <div className="flex items-center gap-6">
                <div className="relative group shrink-0">
                    <div className={cn(
                        "w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-border-slate flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-primary/50 bg-main/40",
                        previewUrl && "border-solid border-primary/30"
                    )}>
                        {previewUrl ? (
                            <img 
                                src={previewUrl} 
                                alt="Preview" 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-1 text-muted group-hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                            </div>
                        )}

                        {uploading && (
                            <div className="absolute inset-0 bg-main/80 backdrop-blur-sm flex items-center justify-center z-10">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}

                        {!uploading && (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                                <span className="text-white text-[10px] font-black uppercase tracking-widest bg-primary px-2 py-1 rounded shadow-lg">Mudar Foto</span>
                            </div>
                        )}
                    </div>

                    {/* Badge Overlay */}
                    {previewUrl && !uploading && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-main flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-white text-[14px]">check</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                    <button
                        type="button"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 truncate"
                    >
                        {uploading ? 'Enviando...' : 'Fazer Upload'}
                    </button>
                    <p className="text-[10px] text-muted font-medium italic leading-tight">
                        {description}
                    </p>
                    {previewUrl && (
                        <button
                            type="button"
                            onClick={() => {
                                setPreviewUrl('');
                                onUpload('');
                            }}
                            className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider text-left transition-colors flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                            Remover
                        </button>
                    )}
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*.png, image/*.jpeg, image/*.jpg, image/*.webp"
                onChange={handleFileChange}
                title="Selecionar Foto"
            />
        </div>
    );
}
