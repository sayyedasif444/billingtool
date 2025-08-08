'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface LogoUploadProps {
  currentLogo?: string;
  businessId: string;
  onLogoUpload: (logoPath: string) => void;
  onLogoRemove?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function LogoUpload({ 
  currentLogo, 
  businessId,
  onLogoUpload, 
  onLogoRemove, 
  disabled = false,
  className = '' 
}: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadViaServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('businessId', businessId);

    const response = await fetch('/api/upload-logo', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const data = await response.json();
    return data.url;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Create temporary preview URL
      const tempPreview = URL.createObjectURL(file);
      setPreviewUrl(tempPreview);

      // Upload via server (local storage)
      const logoPath = await uploadViaServer(file);
      
      // Update preview with actual path
      setPreviewUrl(logoPath);
      
      // Call the parent component's upload handler with the file path
      onLogoUpload(logoPath);
      
      // Clean up temporary URL
      URL.revokeObjectURL(tempPreview);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo. Please try again.');
      setPreviewUrl(currentLogo || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onLogoRemove?.();
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="text-white">Business Logo</Label>
      
      <div className="flex items-center gap-4">
        {/* Logo Preview */}
        {previewUrl && (
          <div className="relative">
            <Image
              src={previewUrl}
              alt="Business logo"
              width={64}
              height={64}
              className="w-16 h-16 object-cover rounded-lg border border-white/20"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                disabled={isUploading}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={handleClick}
            disabled={disabled || isUploading}
            className="w-full border-white/20 text-white hover:bg-white/10"
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Uploading...
              </div>
            ) : previewUrl ? (
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Change Logo
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Upload Logo
              </div>
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Recommended: Square image, max 5MB. Supported formats: JPG, PNG, GIF
      </p>
    </div>
  );
} 