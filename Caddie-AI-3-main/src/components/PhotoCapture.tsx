 import React, { useRef } from "react";

interface PhotoCaptureProps {
  onPhotoTaken: (base64Photo: string) => void;
  isLoading: boolean;
}

// ✅ Helper to convert a file to base64 reliably (works on iPhone camera files too)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoTaken, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64Photo = await fileToBase64(file);
      onPhotoTaken(base64Photo); // send to parent
    } catch (err) {
      console.error("Error converting photo to base64:", err);
    }

    // Reset input so the same photo can be chosen again later
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
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


 

