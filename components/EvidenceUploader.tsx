'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { EvidenceUploaderProps } from '@/types';

export function EvidenceUploader({
    textEvidence,
    imageEvidence,
    onTextChange,
    onImageChange,
    maxImages = 5
}: EvidenceUploaderProps) {
    const [newTextEvidence, setNewTextEvidence] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
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
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setUploadError('Only image files are allowed');
                continue;
            }
            
            // Validate file size (max 5MB)
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
                
                // Get public URL
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
        
        // Clear file input
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
                    Evidence <span className="text-steel-grey/50">(optional)</span>
                </label>
                <p className="text-xs text-steel-grey/70 mb-3">
                    Add supporting facts or upload screenshots (max {maxImages} images)
                </p>
            </div>
            
            {/* Text Evidence */}
            <div className="space-y-2">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTextEvidence}
                        onChange={(e) => setNewTextEvidence(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTextEvidence())}
                        placeholder="e.g., 'She agreed to split costs on Jan 5th'"
                        className="flex-1 px-4 py-2 bg-charcoal-layer/50 border border-white/10 rounded-xl text-starlight-white placeholder:text-steel-grey/50 focus:outline-none focus:border-electric-violet/50 text-sm"
                    />
                    <button
                        type="button"
                        onClick={addTextEvidence}
                        disabled={!newTextEvidence.trim()}
                        className="px-4 py-2 bg-charcoal-layer border border-white/10 rounded-xl text-steel-grey hover:text-starlight-white hover:border-electric-violet/50 transition-all disabled:opacity-50"
                    >
                        Add
                    </button>
                </div>
                
                {/* Text Evidence List */}
                {textEvidence.length > 0 && (
                    <div className="space-y-2">
                        {textEvidence.map((evidence, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-charcoal-layer/30 rounded-lg border border-white/5">
                                <span className="text-caution-amber text-xs">📝</span>
                                <span className="flex-1 text-starlight-white text-sm truncate">{evidence}</span>
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
                    className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        isUploading
                            ? 'border-electric-violet/50 bg-electric-violet/10'
                            : 'border-white/10 hover:border-electric-violet/50 hover:bg-charcoal-layer/30'
                    } ${imageEvidence.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isUploading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-electric-violet" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-electric-violet text-sm">Uploading...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-2xl">📷</span>
                            <span className="text-steel-grey text-sm">
                                {imageEvidence.length >= maxImages 
                                    ? 'Max images reached'
                                    : 'Click to upload screenshots'
                                }
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
