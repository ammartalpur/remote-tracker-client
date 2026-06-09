"use client"; // Required for using hooks

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { socket } from "@/lib/socket"; 
import PairingModal from "@/components/modals/PairingModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize real-time connection status
  const { isConnected } = useSocket();

  // NEW: State to hold the incoming pairing request
  const [pairingRequest, setPairingRequest] = useState<any>(null);

  useEffect(() => {
    // Listen for the specific pairing event from the Node.js server
    const handlePairingRequest = (data: any) => {
      console.log("RECEIVED PAIRING REQUEST:", data);
      setPairingRequest(data);
    };

    socket.on("owner:new_pairing_request", handlePairingRequest);

    return () => {
      socket.off("owner:new_pairing_request", handlePairingRequest);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* 🛡️ THE FIX: Only render the modal if a request actually exists, and pass the required props! */}
      {pairingRequest && (
        <PairingModal
          request={pairingRequest}
          socket={ socket }
          onClose={() => setPairingRequest(null)}
        />
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <h1 className="text-lg font-bold text-slate-900">Tracker OS</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/dashboard"
            className="block px-4 py-2 rounded-md bg-slate-100 text-slate-900 font-medium"
          >
            Team Roster
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <h2 className="text-sm font-medium text-slate-500">
            Owner Control Room
          </h2>

          {/* Dynamic Status Indicator */}
          <div className="flex items-center space-x-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            <span
              className={`flex h-2.5 w-2.5 rounded-full relative ${isConnected ? "bg-emerald-500" : "bg-red-500"}`}
            >
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
            </span>
            <span className="text-xs font-medium text-slate-600">
              {isConnected ? "System Live" : "Disconnected"}
            </span>
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
