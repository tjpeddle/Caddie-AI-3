 import React, { useRef } from "react";

interface PhotoUploadProps {
  onPhotoTaken: (base64Photo: string, description: string) => void;
  isLoading: boolean;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onPhotoTaken, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      onPhotoTaken(base64, "Uploaded photo for strategic analysis");
    };
    reader.readAsDataURL(file);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button
        onClick={openFilePicker}
        disabled={isLoading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold"
      >
        {isLoading ? "⏳ Analyzing..." : "📤 Upload Photo"}
      </button>
    </div>
  );
};

export default PhotoUpload;


