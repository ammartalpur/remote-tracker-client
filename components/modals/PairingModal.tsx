import { useState } from "react";
import { socket } from "@/lib/socket";

interface PairingRequest {
  macAddress: string;
  hostname: string;
  location: string;
  ip: string;
  otp: string;
}

interface PairingModalProps {
  request: PairingRequest | null;
  onClose: () => void;
  socket: any;
}

export default function PairingModal({ request, onClose }: PairingModalProps) {
  const [employeeName, setEmployeeName] = useState("");

  // 🛡️ THE FIX: If there is no request data yet, render absolutely nothing!
  if (!request) return null;

  const handleApprove = () => {
    // Send the approval back to the Node.js server
    socket.emit("owner:approve_device", {
      macAddress: request.macAddress,
      employeeName: employeeName || "Unassigned User",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold mb-4">New Device Detected</h2>

        <div className="bg-slate-50 p-4 rounded-lg mb-4 text-sm font-mono space-y-2">
          <p>🖥️ Hostname: {request.hostname}</p>
          <p>🌍 Location: {request.location}</p>
          <p>🌐 IP: {request.ip}</p>
          <p>
            🔑 OTP Code:{" "}
            <span className="text-indigo-600 font-bold">{request.otp}</span>
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Assign to Employee Name
          </label>
          <input
            type="text"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="e.g., John Doe"
            className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg"
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Approve & Connect
          </button>
        </div>
      </div>
    </div>
  );
}
