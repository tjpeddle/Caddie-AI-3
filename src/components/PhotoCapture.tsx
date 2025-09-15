 import React, { useRef, ChangeEvent, useState } from 'react';

interface PhotoCaptureProps {
  onPhotoTaken: (base64Photo: string, description: string) => void;
  isLoading: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoTaken, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [debugStatus, setDebugStatus] = useState<string>('');

  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      setDebugStatus('Reading file...');
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setDebugStatus('File read complete');
        resolve(result);
      };

      reader.onerror = (error) => {
        setDebugStatus('Read error');
        reject(error);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setDebugStatus('File selected');
    
    const file = event.target.files?.[0];
    if (!file) {
      setDebugStatus('No file selected');
      setTimeout(() => setDebugStatus(''), 2000);
      return;
    }

    setDebugStatus(`File: ${file.name}`);

    try {
      const imageData = await processImage(file);
      setDebugStatus('Sending to chat...');
      
      onPhotoTaken(imageData, "Golf hole photo from camera roll");
      setDebugStatus('Success!');
      setTimeout(() => setDebugStatus(''), 2000);
      
    } catch (error) {
      setDebugStatus('Processing failed');
      setTimeout(() => setDebugStatus(''), 2000);
      console.error('Error processing photo:', error);
    }

    event.target.value = '';
  };

  const handleClick = () => {
    setDebugStatus('Opening photos...');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      setDebugStatus('Button error');
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
      />
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="p-2 text-gray-400 hover:text-white transition-colors mr-2"
        title="Upload Golf Hole Photo"
      >
        {isLoading ? '⏳' : '📷'}
      </button>
      {debugStatus && (
        <div className="absolute bottom-16 right-0 bg-blue-600 text-white px-2 py-1 rounded text-xs z-50">
          {debugStatus}
        </div>
      )}
    </>
  );
};

export default PhotoCapture;
