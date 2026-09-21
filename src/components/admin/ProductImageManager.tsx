import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  ImageOff, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  ExternalLink,
  Loader2,
  X
} from 'lucide-react';
import { isValidHttpUrl } from '../../utils/amazon';

export interface ProductImageManagerProps {
  imageUrl: string;
  onChange: (newUrl: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  className?: string;
}

const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  imageUrl,
  onChange,
  label = 'Product Image',
  required = false,
  disabled = false,
  helperText,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null);
  
  // Image loading & broken detection for preview
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [previewLoadedUrl, setPreviewLoadedUrl] = useState<string | null>(null);

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize internal state when external imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setIsLoading(true);
      setHasError(false);
    } else {
      setIsLoading(false);
      setHasError(false);
    }
  }, [imageUrl]);

  const handleOpenModal = () => {
    setUrlInput(imageUrl || '');
    setUrlValidationError(null);
    setSelectedFile(null);
    setUploadError(null);
    setActiveTab('url');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUrlValidationError(null);
    setUploadError(null);
    setSelectedFile(null);
  };

  const handleRemoveImage = () => {
    onChange('');
    setHasError(false);
    setIsLoading(false);
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      if (required) {
        setUrlValidationError('An image URL is required.');
        return;
      }
      onChange('');
      handleCloseModal();
      return;
    }

    if (!isValidHttpUrl(trimmed)) {
      setUrlValidationError('Please enter a valid HTTP or HTTPS image URL.');
      return;
    }

    onChange(trimmed);
    handleCloseModal();
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // 1. Validate MIME type
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      setUploadError('Unsupported file type. Please upload a JPEG, PNG, WEBP, or GIF image.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validate file size (max 5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadError(`File is too large (${sizeMB} MB). Maximum allowed size is 5 MB.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Attempt Firebase Storage upload if available
      const { app } = await import('../../lib/firebase');
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      
      const storage = getStorage(app);
      const fileExt = selectedFile.name.split('.').pop() || 'jpg';
      const cleanFileName = `products/img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
      const storageRef = ref(storage, cleanFileName);

      const snapshot = await uploadBytes(storageRef, selectedFile, {
        contentType: selectedFile.type,
      });

      const downloadUrl = await getDownloadURL(snapshot.ref);
      onChange(downloadUrl);
      handleCloseModal();
    } catch (err: any) {
      console.warn('Firebase Storage upload failed or not enabled:', err);
      setUploadError(
        'Direct file upload is currently unavailable in this environment. Please paste a direct image URL (from Amazon or CDN) instead.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {imageUrl && (
          <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]" title={imageUrl}>
            {(() => {
              try {
                return new URL(imageUrl).hostname;
              } catch {
                return 'External URL';
              }
            })()}
          </span>
        )}
      </div>

      {/* Main Image Display Box */}
      {imageUrl ? (
        <div className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Image Preview Box */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-1.5 group">
              {/* Loading State Spinner */}
              {isLoading && !hasError && (
                <div className="absolute inset-0 bg-slate-50 flex items-center justify-center z-10">
                  <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
              )}

              {/* Error State Fallback */}
              {hasError ? (
                <div className="flex flex-col items-center justify-center text-center p-2">
                  <ImageOff className="w-8 h-8 text-amber-500 mb-1" />
                  <span className="text-[10px] font-bold text-amber-700 leading-tight">Image load failed</span>
                  <span className="text-[9px] text-slate-400">Broken URL</span>
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt="Product preview"
                  className={`w-full h-full object-contain rounded-lg transition-opacity duration-200 ${
                    isLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  onLoad={() => {
                    setIsLoading(false);
                    setHasError(false);
                    setPreviewLoadedUrl(imageUrl);
                  }}
                  onError={() => {
                    setIsLoading(false);
                    setHasError(true);
                  }}
                />
              )}
            </div>

            {/* Information & Action Buttons */}
            <div className="flex-1 w-full space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${hasError ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="text-xs font-semibold text-slate-800">
                    {hasError ? 'Broken Image URL' : 'Image Configured'}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500 break-all line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  {imageUrl}
                </p>
              </div>

              {/* Action Buttons: [ Change Image ] and [ Remove Image ] */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleOpenModal}
                  disabled={disabled}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs active:scale-95 disabled:opacity-50"
                  title="Change image URL or upload replacement"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Change Image</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={disabled}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95 disabled:opacity-50"
                  title="Remove this product image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Image</span>
                </button>

                {!hasError && (
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Open original image in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: No image exists */
        <div 
          onClick={disabled ? undefined : handleOpenModal}
          className={`rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:scale-105 transition-all mb-2">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 mb-0.5">No Product Image Added</h4>
          <p className="text-[11px] text-slate-500 max-w-xs mb-3">
            Add an image URL from Amazon, brand website, or CDN.
          </p>
          <button
            type="button"
            disabled={disabled}
            className="px-3.5 py-1.5 bg-white group-hover:bg-blue-600 text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-blue-600 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            + Add Product Image
          </button>
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      )}

      {/* Change / Replace Image Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Manage Product Image</h3>
                <p className="text-xs text-slate-500">Provide an image URL or upload an asset</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setActiveTab('url'); setUploadError(null); }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'url' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Image URL (Recommended)
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('upload'); setUrlValidationError(null); }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Upload File
              </button>
            </div>

            {/* Tab 1: Image URL Input */}
            {activeTab === 'url' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Direct Image URL
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setUrlValidationError(null);
                    }}
                    placeholder="https://images-na.ssl-images-amazon.com/images/I/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs text-slate-900 font-mono"
                    autoFocus
                  />
                  {urlValidationError && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {urlValidationError}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    Supports high-resolution product URLs from Amazon, brand stores, and CDNs.
                  </p>
                </div>

                {/* Staged URL Mini Preview */}
                {urlInput && isValidHttpUrl(urlInput.trim()) && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                    <img
                      src={urlInput.trim()}
                      alt="URL check"
                      className="w-12 h-12 object-contain bg-white rounded-lg border border-slate-200 p-0.5"
                      onError={(e) => { (e.target as HTMLElement).style.opacity = '0.3'; }}
                    />
                    <div className="text-xs text-slate-600 truncate">
                      <span className="font-semibold block text-slate-900">Valid URL Format</span>
                      <span className="text-[11px] text-slate-400 truncate">{urlInput.trim()}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
                  >
                    Apply Image URL
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: File Upload with Validation */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Choose Local Image File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    onChange={handleFileSelection}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-xl p-1 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <p>Supported: JPEG, PNG, WEBP, GIF (Max 5MB)</p>
                    <p>Images are securely hosted on cloud storage without bloating database records.</p>
                  </div>
                </div>

                {uploadError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {selectedFile && !uploadError && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                    <div className="flex items-center gap-2 truncate">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold truncate">{selectedFile.name}</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-mono shrink-0 ml-2">
                      {(selectedFile.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadFile}
                    disabled={!selectedFile || isUploading}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload & Apply</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
