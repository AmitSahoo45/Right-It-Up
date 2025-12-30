'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { EvidenceUploaderProps } from '@/types';

const EVIDENCE_TIPS = [
    { icon: '💬', label: 'Chat screenshots', desc: 'WhatsApp, iMessage, SMS' },
    { icon: '🧾', label: 'Receipts', desc: 'Proof of purchases' },
    { icon: '📄', label: 'Documents', desc: 'Contracts, agreements' },
    { icon: '📸', label: 'Photos', desc: 'Physical evidence' },
];

interface ExtendedEvidenceUploaderProps extends Omit<EvidenceUploaderProps, 'maxImages'> {
    minImages?: number;
    maxImages?: number;
}

export function EvidenceUploader({
    textEvidence,
    imageEvidence,
    onTextChange,
    onImageChange,
    minImages = 3,
    maxImages = 5
}: ExtendedEvidenceUploaderProps) {
    const [newTextEvidence, setNewTextEvidence] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const imagesNeeded = Math.max(0, minImages - imageEvidence.length);
    const hasMinimumImages = imageEvidence.length >= minImages;
    
    const addTextEvidence = () => {
        if (newTextEvidence.trim()) {
            onTextChange([...textEvidence, newTextEvidence.trim()]);
            setNewTextEvidence('');
        }
    };
    
    const removeTextEvidence = (index: number) => {
        onTextChange(textEvidence.filter((_, i) => i !== index));
    };
    
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        if (imageEvidence.length + files.length > maxImages) {
            setUploadError(`Maximum ${maxImages} images allowed`);
            return;
        }
        
        setIsUploading(true);
        setUploadError(null);
        
        const supabase = createClient();
        const newUrls: string[] = [];
        
        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) {
                setUploadError('Only image files are allowed');
                continue;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                setUploadError('Images must be under 5MB');
                continue;
            }
            
            try {
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
                
                const { data, error } = await supabase.storage
                    .from('evidence')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    });
                
                if (error) {
                    console.error('Upload error:', error);
                    setUploadError('Failed to upload image');
                    continue;
                }
                
                const { data: urlData } = supabase.storage
                    .from('evidence')
                    .getPublicUrl(data.path);
                
                newUrls.push(urlData.publicUrl);
            } catch (err) {
                console.error('Upload error:', err);
                setUploadError('Failed to upload image');
            }
        }
        
        if (newUrls.length > 0) {
            onImageChange([...imageEvidence, ...newUrls]);
        }
        
        setIsUploading(false);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const removeImage = (index: number) => {
        onImageChange(imageEvidence.filter((_, i) => i !== index));
    };
    
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-steel-grey mb-2">
                    Evidence <span className="text-objection-red">*</span>
                    <span className="text-steel-grey/70 ml-1">(minimum {minImages} screenshots required)</span>
                </label>
                <p className="text-xs text-steel-grey/70 mb-3">
                    Upload screenshots of conversations and the AI will extract & analyze the text automatically. 
                    <span className="text-caution-amber"> Text alone can be fabricated, but images are real evidence!</span>
                </p>
            </div>
            
            {/* Progress indicator */}
            <div className={`p-3 rounded-xl border ${hasMinimumImages ? 'bg-verdict-green/10 border-verdict-green/30' : 'bg-caution-amber/10 border-caution-amber/30'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${hasMinimumImages ? 'text-verdict-green' : 'text-caution-amber'}`}>
                        {hasMinimumImages ? '✓ Minimum evidence uploaded' : `⚠️ ${imagesNeeded} more image${imagesNeeded !== 1 ? 's' : ''} required`}
                    </span>
                    <span className="text-xs text-steel-grey">
                        {imageEvidence.length}/{maxImages}
                    </span>
                </div>
                <div className="w-full h-2 bg-charcoal-layer rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-300 ${hasMinimumImages ? 'bg-verdict-green' : 'bg-caution-amber'}`}
                        style={{ width: `${Math.min(100, (imageEvidence.length / minImages) * 100)}%` }}
                    />
                </div>
            </div>
            
            {/* 🆕 OCR Tips Banner */}
            <div className="p-3 bg-cyber-blue/10 border border-cyber-blue/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-cyber-blue text-sm font-medium">📸 Pro tip: Screenshots speak louder than words</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {EVIDENCE_TIPS.map((tip, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-charcoal-layer/50 rounded-lg text-xs text-steel-grey">
                            <span>{tip.icon}</span>
                            <span>{tip.label}</span>
                        </span>
                    ))}
                </div>
                <p className="text-xs text-steel-grey/60 mt-2">
                    Our AI reads text from images - chat screenshots, receipts, and documents are powerful evidence!
                </p>
            </div>
            
            {/* Text Evidence */}
            <div className="space-y-2">
                <label className="block text-xs font-medium text-steel-grey/70">
                    Additional text context <span className="text-steel-grey/50">(optional)</span>
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTextEvidence}
                        onChange={(e) => setNewTextEvidence(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTextEvidence())}
                        placeholder="e.g., 'She agreed to split costs on Jan 5th'"
                        className="flex-1 px-3 py-2 bg-charcoal-layer/50 border border-white/10 rounded-lg text-starlight-white text-sm placeholder:text-steel-grey/50 focus:outline-none focus:border-electric-violet/50"
                    />
                    <button
                        type="button"
                        onClick={addTextEvidence}
                        disabled={!newTextEvidence.trim()}
                        className="px-4 py-2 bg-charcoal-layer border border-white/10 rounded-lg text-steel-grey text-sm hover:border-electric-violet/50 hover:text-starlight-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add
                    </button>
                </div>
                
                {textEvidence.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {textEvidence.map((text, index) => (
                            <div key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-charcoal-layer/50 border border-white/10 rounded-lg">
                                <span className="text-sm text-steel-grey max-w-xs truncate">{text}</span>
                                <button
                                    type="button"
                                    onClick={() => removeTextEvidence(index)}
                                    className="text-steel-grey hover:text-objection-red transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Image Upload */}
            <div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="evidence-images"
                />
                <label
                    htmlFor="evidence-images"
                    className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        isUploading
                            ? 'border-electric-violet/50 bg-electric-violet/10'
                            : hasMinimumImages
                                ? 'border-verdict-green/30 hover:border-verdict-green/50 hover:bg-verdict-green/5'
                                : 'border-caution-amber/50 hover:border-electric-violet/50 hover:bg-charcoal-layer/30'
                    } ${imageEvidence.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isUploading ? (
                        <>
                            <svg className="animate-spin h-8 w-8 text-electric-violet" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-electric-violet text-sm">Uploading...</span>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 text-3xl">
                                <span>💬</span>
                                <span>🧾</span>
                                <span>📄</span>
                            </div>
                            <span className={`font-medium ${hasMinimumImages ? 'text-verdict-green' : 'text-caution-amber'}`}>
                                {imageEvidence.length >= maxImages 
                                    ? 'Max images reached'
                                    : hasMinimumImages
                                        ? 'Add more evidence (optional)'
                                        : `Upload ${imagesNeeded} more screenshot${imagesNeeded !== 1 ? 's' : ''}`
                                }
                            </span>
                            <span className="text-steel-grey text-xs">
                                Chat screenshots, receipts, documents • Min {minImages} • Max {maxImages} images • 5MB each
                            </span>
                        </>
                    )}
                </label>
                
                {uploadError && (
                    <p className="text-objection-red text-xs mt-2">{uploadError}</p>
                )}
            </div>
            
            {/* Image Preview Grid */}
            {imageEvidence.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {imageEvidence.map((url, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10">
                            <img
                                src={url}
                                alt={`Evidence ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="absolute bottom-1 left-1 text-xs text-white/80">📸 OCR Ready</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 w-6 h-6 bg-objection-red rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}