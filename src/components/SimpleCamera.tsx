 import React, { useRef } from "react";

interface SimpleCameraProps {
  onPhotoTaken: (base64Photo: string) => void;
  isLoading: boolean;
}

const SimpleCamera: React.FC<SimpleCameraProps> = ({ onPhotoTaken, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      onPhotoTaken(base64);
    };
    reader.readAsDataURL(file);
  };

  const openCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button
        onClick={openCamera}
        disabled={isLoading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold"
      >
        {isLoading ? "⏳ Analyzing..." : "📁 Capture Photo"}
      </button>
    </div>
  );
};

export default SimpleCamera;




