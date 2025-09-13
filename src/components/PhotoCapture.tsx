import React, { useRef, ChangeEvent } from 'react';

interface PhotoCaptureProps {
  onPhotoTaken: (base64Photo: string, description: string) => void;
  isLoading: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoTaken, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to resize the image using a canvas
  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize logic to maintain aspect ratio
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
            // Convert the resized image on the canvas to a base64 string
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // 0.7 is the quality
            resolve(dataUrl);
          } else {
            reject(new Error("Could not get canvas context."));
          }
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Step 1: Resize the image before sending it
      const resizedPhotoData = await resizeImage(file, 1200, 1200);

      // Step 2: Pass the resized base64 string to your parent component
      onPhotoTaken(resizedPhotoData, "A photo of the golf course.");
    } catch (error) {
      console.error('Error processing photo:', error);
      // You can add an error message to the chat here as well
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleClick}
        className="p-2 text-gray-400 hover:text-white transition-colors mr-2"
        title="Take Photo"
        disabled={isLoading}
      >
        📸
      </button>
    </div>
  );
};

export default PhotoCapture;
