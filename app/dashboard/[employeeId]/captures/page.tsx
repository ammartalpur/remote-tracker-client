"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Screenshot {
  id: string;
  imageUrl: string;
  createdAt: string;
}

export default function HistoryPage() {
  const params = useParams();
  const router = useRouter();
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);

  
  const { employeeId } = useParams();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Fetch the device ID for this employee, then fetch the screenshots.
        // Assuming your backend handles the translation or you pass deviceId directly.
       const url = `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/captures/${employeeId}`;
      const res = await fetch(url, { cache: "no-store" });
        console.log("Response:", res);
       const json = await res.json();
       console.log("Fetched Data:", json);

        if (json.success) {
          setScreenshots(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [employeeId]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-slate-400 hover:text-indigo-600"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Capture History</h1>
      </div>

      {loading ? (
        <div className="text-slate-500 animate-pulse">
          Loading history archive...
        </div>
      ) : screenshots.length === 0 ? (
        <div className="bg-slate-50 p-8 rounded-xl text-center text-slate-500 border border-slate-200">
          No historical captures found for this device.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screenshots.map((shot) => (
            <div
              key={shot.id}
              className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm"
            >
              <img
                src={shot.imageUrl}
                alt="Screen capture"
                className="w-full h-48 object-cover border-b border-slate-100"
              />
              <div className="p-3 text-xs text-slate-500 font-mono text-center">
                {new Date(shot.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
