 import React, { useRef, ChangeEvent } from 'react';

interface PhotoCaptureProps {
  onPhotoTaken: (base64Photo: string, description: string) => void;
  isLoading: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoTaken, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to resize the image
  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log('Starting image resize process');
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        console.log('FileReader loaded image data');
        img.src = e.target?.result as string;
        
        img.onload = () => {
          console.log('Image loaded into img element:', img.width, 'x', img.height);
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

          console.log('Resized dimensions:', width, 'x', height);
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            console.log('Canvas dataURL created, length:', dataUrl.length);
            resolve(dataUrl);
          } else {
            console.error('Could not get canvas context');
            reject(new Error("Could not get canvas context."));
          }
        };

        img.onerror = (error) => {
          console.error('Image failed to load:', error);
          reject(error);
        };
      };

      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(error);
      };

      console.log('Starting FileReader.readAsDataURL');
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    console.log('PhotoCapture: handleFileChange called');
    
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected after camera pop-up.');
      return;
    }

    console.log('File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    try {
      console.log('Starting photo resize...');
      const resizedPhotoData = await resizeImage(file, 1200, 1200);
      console.log('Photo resize completed, calling onPhotoTaken...');
      
      // Call the parent function
      onPhotoTaken(resizedPhotoData, "A photo of the golf course.");
      console.log('onPhotoTaken called successfully');
      
    } catch (error) {
      console.error('Error processing or resizing photo:', error);
    }

    // Reset the input so the same file can be selected again
    event.target.value = '';
    console.log('File input reset');
  };

  const handleClick = () => {
    console.log('PhotoCapture: Camera button clicked');
    if (fileInputRef.current) {
      console.log('Opening camera...');
      fileInputRef.current.click();
    } else {
      console.error('File input ref is null!');
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment" // This attribute tells the browser to prioritize the camera
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
    </>
  );
};

export default PhotoCapture;
