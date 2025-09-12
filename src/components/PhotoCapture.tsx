import React, { useRef, useState } from 'react';

interface PhotoUploadProps {
  onPhotoTaken: (photoData: string, analysis: string) => void;
  isLoading: boolean;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onPhotoTaken, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = e.target?.result as string;
        setPreviewImage(photoData);
        onPhotoTaken(photoData, 'Photo uploaded for AI analysis');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Main upload area */}
      <div
        onClick={openFileSelector}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${dragOver 
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-green-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {previewImage ? (
          <div className="space-y-4">
            <img 
              src={previewImage} 
              alt="Selected photo" 
              className="max-w-full max-h-48 mx-auto rounded-lg shadow-lg"
            />
            <p className="text-green-600 font-medium">
              ✅ Photo ready for analysis!
            </p>
            <p className="text-sm text-gray-500">
              Click to select a different photo
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl">📸</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Upload Photo of Your Golf Shot
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Take a photo with your phone camera, then upload it here for AI analysis
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>📱 Best on iPhone: Take photo → Photos app → Share → Upload here</p>
                <p>🖱️ On desktop: Drag & drop or click to browse</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">Analyzing your shot...</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick action buttons */}
      <div className="flex space-x-3">
        <button
          onClick={openFileSelector}
          disabled={isLoading}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <span>📁</span>
          <span>Choose Photo</span>
        </button>
        
        <button
          onClick={() => {
            // Create a new file input specifically for camera
            const cameraInput = document.createElement('input');
            cameraInput.type = 'file';
            cameraInput.accept = 'image/*';
            cameraInput.capture = 'environment';
            cameraInput.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                handleFileSelect(file);
              }
            };
            cameraInput.click();
          }}
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <span>📷</span>
          <span>Take Photo</span>
        </button>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">📋 Photo Tips:</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Show the ball's position and lie clearly</li>
          <li>• Include surrounding terrain (rough, fairway, hazards)</li>
          <li>• Capture the distance to pin if visible</li>
          <li>• Good lighting helps AI analysis accuracy</li>
        </ul>
      </div>
    </div>
  );
};

export default PhotoCapture;
