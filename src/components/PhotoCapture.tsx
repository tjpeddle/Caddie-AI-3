 import React, { useRef } from 'react';

interface PhotoCaptureProps {
  onPhotoTaken: (photoData: string, analysis: string) => void;
  isLoading: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoTaken, isLoading }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileSelect called');
    const file = event.target.files?.[0];
    
    if (file) {
      console.log('File found:', file.name, file.size, file.type);
      
      // iOS Safari sometimes needs a delay
      setTimeout(() => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const photoData = e.target?.result as string;
          console.log('Photo loaded, calling onPhotoTaken');
          
          // Another small delay for iOS
          setTimeout(() => {
            onPhotoTaken(photoData, 'Photo uploaded for analysis');
          }, 100);
        };
        
        reader.onerror = (error) => {
          console.error('File reading error:', error);
        };
        
        reader.readAsDataURL(file);
      }, 200);
    } else {
      console.log('No file found');
    }
    
    // Clear input
    event.target.value = '';
  };

  return (
    <>
      {/* Camera input with capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Library input without capture */}
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <button
        onClick={() => {
          console.log('Library button clicked');
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
          console.log('Camera button clicked');
          cameraInputRef.current?.click();
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
