 import React, { useRef } from "react";

interface PhotoCaptureProps {
  onPhotoTaken: (base64Photo: string) => void;
  isLoading: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoTaken, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Photo = reader.result as string;
      onPhotoTaken(base64Photo); // send directly to parent
    };
    reader.readAsDataURL(file);

    // Reset input so the next photo works
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex justify-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button
        disabled={isLoading}
        onClick={() => fileInputRef.current?.click()}
        className="px-4 py-2 bg-green-600 text-white rounded-xl shadow-md"
      >
        {isLoading ? "Analyzing..." : "Take Photo"}
      </button>
    </div>
  );
};

export default PhotoCapture;



 

