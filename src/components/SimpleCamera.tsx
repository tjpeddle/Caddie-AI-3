 import React, { useRef, useState } from "react";

interface SimpleCameraProps {
  onPhotoTaken: (base64Photo: string, description: string) => void;
  isLoading: boolean;
}

const SimpleCamera: React.FC<SimpleCameraProps> = ({ onPhotoTaken, isLoading }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // ✅ rear camera
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg");
      onPhotoTaken(base64, "Captured photo for strategic analysis");
    }

    stopCamera(); // ✅ turn off after capture
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      {!stream ? (
        <button
          onClick={startCamera}
          disabled={isLoading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg text-lg font-semibold"
        >
          {isLoading ? "⏳ Analyzing..." : "📷 Open Camera"}
        </button>
      ) : (
        <>
          <video ref={videoRef} className="w-full rounded-lg" autoPlay playsInline muted />
          <button
            onClick={takePhoto}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold"
          >
            {isLoading ? "⏳ Analyzing..." : "📸 Take Photo"}
          </button>
          <button
            onClick={stopCamera}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm"
          >
            ❌ Close Camera
          </button>
        </>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default SimpleCamera;


