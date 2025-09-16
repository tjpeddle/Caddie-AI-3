 import React, { useRef, useState, useCallback } from "react";

interface SimpleCameraProps {
  onPhotoTaken: (base64Photo: string, description: string) => void;
  isLoading: boolean;
}

const SimpleCamera: React.FC<SimpleCameraProps> = ({ onPhotoTaken, isLoading }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
      setStream(newStream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error starting camera:", err);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setIsCameraOpen(false);
  }, [stream]);

  // Capture photo
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Photo = canvas.toDataURL("image/jpeg", 0.9);

    // Send photo up
    onPhotoTaken(base64Photo, "Captured photo for analysis");

    // 🔒 Auto-close camera right after capture
    stopCamera();
  }, [onPhotoTaken, stopCamera]);

  return (
    <div>
      {!isCameraOpen ? (
        <button
          onClick={startCamera}
          disabled={isLoading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg text-lg font-semibold"
        >
          {isLoading ? "⏳ Analyzing..." : "📸 Open Camera"}
        </button>
      ) : (
        <div className="flex flex-col items-center">
          <video ref={videoRef} className="w-full max-w-sm rounded-lg" playsInline />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <button
            onClick={takePhoto}
            disabled={isLoading}
            className="mt-3 px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold"
          >
            {isLoading ? "⏳ Analyzing..." : "📷 Capture Photo"}
          </button>
        </div>
      )}
    </div>
  );
};

export default SimpleCamera;


