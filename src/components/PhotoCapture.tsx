 import React, { useRef } from 'react';

interface PhotoCaptureProps {
  onPhotoTaken: (photoData: string, analysis: string) => void;
  isLoading: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoTaken, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('🔥 File selected:', file.name, file.size, file.type);
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = e.target?.result as string;
        console.log('🔥 Photo data loaded, length:', photoData.length);
        console.log('🔥 Photo data starts with:', photoData.substring(0, 50));
        onPhotoTaken(photoData, 'Photo uploaded for analysis');
      };
      reader.onerror = (error) => {
        console.error('🔥 File reading error:', error);
      };
      reader.readAsDataURL(file);
    } else {
      console.log('🔥 No file selected');
    }
  };

  return (
    <>
      {/* Camera input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      {/* Photo library input */}
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => {
          console.log('📁 Browse photos button clicked');
          libraryInputRef.current?.click();
        }}
        disabled={isLoading}
        className="p-2 text-gray-400 hover:text-white transition-colors mr-2"
        title="Browse Photos"
      >
        📁
      </button>
      <button
        onClick={() => {
          console.log('📷 Take photo button clicked');
          fileInputRef.current?.click();
        }}
        disabled={isLoading}
        className="p-2 text-gray-400 hover:text-white transition-colors mr-2"
        title="Take Photo"
      >
        📷
      </button>
    </>
  );
};

export default PhotoCapture;
