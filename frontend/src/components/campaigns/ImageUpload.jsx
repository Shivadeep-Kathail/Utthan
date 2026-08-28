import { useState, useRef } from 'react';
import { ImagePlus, X, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { uploadImage } from '@/api/campaigns.api';

/**
 * ImageUpload — file input with preview, upload progress, and error handling.
 *
 * Props:
 *   value     — current image URL string (after successful upload)
 *   onChange  — called with the uploaded URL string, or '' to clear
 *   error     — validation error message from the parent form
 */
export function ImageUpload({ value, onChange, error }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side size check (5 MB limit matches backend)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be under 5 MB.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const res = await uploadImage(file);
      onChange(res.data.url);
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please try again.');
      onChange('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setUploadError('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const displayError = uploadError || error;

  return (
    <div className="image-upload">
      <label className="form-label" htmlFor="campaign-cover-image">
        <ImagePlus className="inline size-4 mr-1" aria-hidden="true" />
        Cover Image
      </label>

      {/* Preview or upload zone */}
      {value ? (
        <div className="image-upload-preview-wrap">
          <img
            src={value}
            alt="Campaign cover preview"
            className="image-upload-preview"
          />
          <button
            type="button"
            className="image-upload-remove"
            onClick={handleRemove}
            aria-label="Remove cover image"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor="campaign-cover-image"
          className={`image-upload-zone ${isUploading ? 'is-uploading' : ''}`}
        >
          {isUploading ? (
            <div className="image-upload-loading">
              <Spinner size="md" />
              <span>Uploading…</span>
            </div>
          ) : (
            <div className="image-upload-placeholder">
              <ImagePlus className="size-8 text-muted-foreground" aria-hidden="true" />
              <span className="image-upload-placeholder-text">
                Click to upload a cover image
              </span>
              <span className="image-upload-placeholder-hint">
                JPEG, PNG, or WebP · Max 5 MB
              </span>
            </div>
          )}
        </label>
      )}

      <input
        ref={inputRef}
        id="campaign-cover-image"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {displayError && (
        <p className="form-error" role="alert">
          <AlertCircle className="inline size-3.5 mr-1" aria-hidden="true" />
          {displayError}
        </p>
      )}
    </div>
  );
}
