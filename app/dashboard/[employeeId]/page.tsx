"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { socket } from "@/lib/socket";

export default function EmployeeFocusView() {
  const params = useParams();
  const employeeId = params.employeeId as string;
  const router = useRouter();

  const [isCapturing, setIsCapturing] = useState(false);
  const [liveImageStr, setLiveImageStr] = useState<string | null>(null);
  const [captureTime, setCaptureTime] = useState<string | null>(null);

  // 🚀 NEW: A reference to hold our timeout so we can cancel it
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Success Listener
    const handleReceiveScreenshot = (payload: {
      deviceId: string;
      image: string;
    }) => {
      setLiveImageStr(payload.image);
      setCaptureTime(new Date().toLocaleTimeString());
      setIsCapturing(false);

      // Clear the timeout since we successfully got the image!
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    // 2. 🚀 NEW: Error Listener (Catches the offline status instantly)
    const handleError = (error: { message: string }) => {
      // Show the popup alert from the server
      alert(error.message);
      setIsCapturing(false);

      // Clear the timeout so it doesn't alert you again 10 seconds later
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    socket.on("owner:capture_result", handleReceiveScreenshot);
    socket.on("owner:error", handleError); // Start listening for errors

    return () => {
      socket.off("owner:capture_result", handleReceiveScreenshot);
      socket.off("owner:error", handleError);
    };
  }, []);

  const triggerLiveCapture = () => {
    setIsCapturing(true);

    socket.emit("owner:request_capture", { deviceId: employeeId });

    // 🚀 Store the timeout ID in our ref
    timeoutRef.current = setTimeout(() => {
      setIsCapturing((prev) => {
        if (prev) {
          alert("Capture timed out. The client network might be too slow.");
        }
        return false;
      });
    }, 10000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-indigo-600 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Live Telemetry</h1>
            <p className="text-sm text-slate-500">
              Ephemeral View Mode (Data is discarded on exit)
            </p>
          </div>
        </div>

        <button
          onClick={triggerLiveCapture}
          disabled={isCapturing}
          className={`px-5 py-2.5 rounded-lg font-medium text-white transition-all shadow-sm ${
            isCapturing
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 hover:shadow active:scale-95"
          }`}
        >
          {isCapturing ? "📡 Requesting..." : "📸 Request Live Screenshot"}
        </button>
      </div>

      {/* Ephemeral Image Display */}
      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800 min-h-125 flex flex-col relative">
        <div className="bg-slate-800 px-4 py-2 flex justify-between items-center text-xs font-mono text-slate-400 border-b border-slate-700 z-10">
          <span>Target: Desktop Monitor 1</span>
          <span>
            {captureTime
              ? `Last Capture: ${captureTime}`
              : "Awaiting manual trigger"}
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          {liveImageStr ? (
            <img
              src={liveImageStr}
              alt="Live Screen"
              className="max-h-150 rounded object-contain animate-in fade-in zoom-in-95 duration-300"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-600">
              <svg
                className="w-12 h-12 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p>No image in memory. Click capture to stream desktop.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
