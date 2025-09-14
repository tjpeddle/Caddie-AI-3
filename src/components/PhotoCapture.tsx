 import React, { useRef, ChangeEvent, useState } from 'react';

interface PhotoCaptureProps {
  onPhotoTaken: (base64Photo: string, description: string) => void;
  isLoading: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoTaken, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [debugStatus, setDebugStatus] = useState<string>('');

  // Function to resize the image
  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      setDebugStatus('Resizing...');
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target?.result as string;
        
        img.onload = () => {
          setDebugStatus('Processing...');
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setDebugStatus('Complete!');
            setTimeout(() => setDebugStatus(''), 2000);
            resolve(dataUrl);
          } else {
            setDebugStatus('Canvas Error');
            reject(new Error("Could not get canvas context."));
          }
        };

        img.onerror = (error) => {
          setDebugStatus('Image Error');
          reject(error);
        };
      };

      reader.onerror = (error) => {
        setDebugStatus('Reader Error');
        reject(error);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setDebugStatus('File selected');
    
    const file = event.target.files?.[0];
    if (!file) {
      setDebugStatus('No file');
      return;
    }

    setDebugStatus('Starting...');

    try {
      const resizedPhotoData = await resizeImage(file, 1200, 1200);
      setDebugStatus('Calling handler...');
      
      // Call the parent function
      onPhotoTaken(resizedPhotoData, "A photo of the golf course.");
      setDebugStatus('Success!');
      
    } catch (error) {
      setDebugStatus('Error!');
      console.error('Error processing photo:', error);
    }

    // Reset the input
    event.target.value = '';
  };

  const handleClick = () => {
    setDebugStatus('Opening camera...');
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
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="p-2 text-gray-400 hover:text-white transition-colors mr-2"
        title="Take Photo"
      >
        {isLoading ? '⏳' : '📷'}
      </button>
      {debugStatus && (
        <div className="absolute bottom-16 right-0 bg-red-600 text-white px-2 py-1 rounded text-xs">
          {debugStatus}
        </div>
      )}
    </>
  );
};

export default PhotoCapture;
