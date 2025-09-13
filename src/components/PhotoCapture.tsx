 import React, { useRef } from 'react';

interface PhotoCaptureProps {
  onPhotoTaken: (photoData: string, analysis: string) => void;
  isLoading: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoTaken, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const photoData = e.target?.result as string;
      if (photoData) {
        onPhotoTaken(photoData, 'Photo uploaded for analysis');
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input
    event.target.value = '';
  };

  const openPhotoSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <button
        onClick={openPhotoSelector}
        disabled={isLoading}
        className="p-2 text-gray-400 hover:text-white transition-colors mr-2"
        title="Upload Photo"
      >
        📁
      </button>
    </>
  );
};

export default PhotoCapture;
