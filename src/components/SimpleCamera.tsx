 import React, { useRef, useState } from "react";

interface SimpleCameraProps {
  onPhotoTaken: (base64Photo: string) => void;
  isLoading: boolean;
}

const SimpleCamera: React.FC<SimpleCameraProps> = ({ onPhotoTaken, isLoading }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera access denied or not available:", err);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL("image/png");
    onPhotoTaken(base64Image);
    closeCamera();
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    closeCamera();
    // small delay to ensure stream stops before reopening
    setTimeout(() => openCamera(), 300);
  };

  return (
    <div className="relative">
      {isCameraOpen && (
        <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center">
          <video
            ref={videoRef}
            className="w-full max-w-md rounded-lg"
            playsInline
          />
          <div className="flex space-x-4 mt-4">
            <button
              onClick={capturePhoto}
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              📸 Capture
            </button>
            <button
              onClick={flipCamera}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              🔄 Flip
            </button>
            <button
              onClick={closeCamera}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              ❌ Close
            </button>
          </div>
        </div>
      )}
      {!isCameraOpen && (
        <button
          onClick={openCamera}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold"
        >
          {isLoading ? "⏳ Analyzing..." : "📷 Open Camera"}
        </button>
      )}
    </div>
  );
};

export default SimpleCamera;




