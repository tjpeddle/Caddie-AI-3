 import React, { useRef } from 'react';

interface PhotoCaptureProps {
  onPhotoTaken: (photoData: string, analysis: string) => void;
  isLoading: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoTaken, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File select triggered');
    const file = event.target.files?.[0];
    
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);

    const reader = new FileReader();
    
    reader.onload = (e) => {
      console.log('FileReader onload triggered');
      const photoData = e.target?.result as string;
      
      if (photoData) {
        console.log('Photo data exists, length:', photoData.length);
        console.log('About to call onPhotoTaken...');
        
        try {
          onPhotoTaken(photoData, 'Photo uploaded for analysis');
          console.log('onPhotoTaken called successfully');
        } catch (error) {
          console.error('Error calling onPhotoTaken:', error);
        }
      } else {
        console.log('No photo data');
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
    };
    
    console.log('Starting to read file...');
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
      <button
        onClick={() => {
          // Create camera input dynamically for iOS
          const cameraInput = document.createElement('input');
          cameraInput.type = 'file';
          cameraInput.accept = 'image/*';
          cameraInput.capture = 'environment';
          cameraInput.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              handleFileSelect({ target: { files: [file] } } as any);
            }
          };
          cameraInput.click();
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
