"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { socket } from "@/lib/socket";
import { Employee } from "@/types";
import StatusBadge from "./StatusBadge";

export default function EmployeeGrid() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data from REST API on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/stats/employees`,
        );
        const json = await res.json();
        if (json.success) setEmployees(json.data);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Listen for real-time telemetry and presence updates over WebSockets
  useEffect(() => {
    const handleOnline = ({ deviceId }: { deviceId: string }) => {
      setEmployees((prev) =>
        prev.map((emp) => ({
          ...emp,
          devices: emp.devices.map((dev) =>
            dev.id === deviceId ? { ...dev, isActive: true } : dev,
          ),
        })),
      );
    };

    const handleOffline = ({ deviceId }: { deviceId: string }) => {
      setEmployees((prev) =>
        prev.map((emp) => ({
          ...emp,
          devices: emp.devices.map((dev) =>
            dev.id === deviceId ? { ...dev, isActive: false } : dev,
          ),
        })),
      );
    };

    // Updates the specific device matching the incoming payload with its active window title
    const handleAppChange = ({
      deviceId,
      activeApp,
    }: {
      deviceId: string;
      activeApp: string;
    }) => {
      setEmployees((prev) =>
        prev.map((emp) => ({
          ...emp,
          devices: emp.devices.map((dev) =>
            dev.id === deviceId ? { ...dev, activeApp } : dev,
          ),
        })),
      );
    };

    socket.on("employee:online", handleOnline);
    socket.on("employee:offline", handleOffline);
    socket.on("employee:app_changed", handleAppChange);

    // Fetch fresh data if a pairing sequence finishes successfully on the network
    socket.on("owner:pairing_success", () => {
      fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/stats/employees`,
      )
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setEmployees(json.data);
        });
    });

    return () => {
      socket.off("employee:online", handleOnline);
      socket.off("employee:offline", handleOffline);
      socket.off("employee:app_changed", handleAppChange);
      socket.off("owner:pairing_success");
    };
  }, []);

  // Pass the id and name so we can show a nice confirmation warning
  const handleDeleteEmployee = async (
    employeeId: string,
    employeeName: string,
  ) => {
    // 1. Safety confirmation prompt
    const isConfirmed = window.confirm(
      `Are you absolutely sure you want to delete ${employeeName || "this employee"}? \n\nThis will permanently erase their devices, timeline history, and all captured screenshots.`,
    );

    if (!isConfirmed) return;

    try {
      // 2. Call the backend API
      const url = `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/stats/employees/${employeeId}`;
      const res = await fetch(url, { method: "DELETE" });
      const json = await res.json();

      if (json.success) {
        // 3. Update the UI state to remove the card immediately
        // NOTE: Ensure your state variable is actually named `employees` and the setter is `setEmployees`
        setEmployees((prevEmployees) =>
          prevEmployees.filter((emp) => emp.id !== employeeId),
        );
      } else {
        alert("Failed to delete employee from server.");
      }
    } catch (error) {
      console.error("Delete request failed:", error);
      alert("Network error while trying to delete.");
    }
  };

  if (loading)
    return (
      <div className="text-slate-500 animate-pulse">
        Loading secure roster...
      </div>
    );
  if (employees.length === 0)
    return (
      <div className="text-slate-500 bg-slate-100 p-8 rounded-xl text-center border-2 border-dashed border-slate-300">
        No devices connected yet. Awaiting pairing requests.
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {employees.map((employee) => {
        const primaryDevice = employee.devices[0];
        if (!primaryDevice) return null;

        return (
          <div
            key={employee.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 flex flex-col justify-between group"
          >
            <div>
              {/* Header: Name, Hostname, OS Badge, and Status Beacon */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg group-hover:text-indigo-700 transition-colors">
                    {employee.name || "Unassigned Employee"}
                  </h3>

                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-xs text-slate-500 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      {primaryDevice.hostname}
                    </p>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      {primaryDevice.os}
                    </span>
                  </div>
                </div>

                <StatusBadge isActive={primaryDevice.isActive} />
              </div>

              {/* Active Software Window Telemetry Indicator */}
              <div className="mb-5 text-sm bg-gradient-to-r from-indigo-50/50 to-slate-50/50 p-3 rounded-lg border border-indigo-100/50">
                <span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold block mb-1">
                  Current Focus
                </span>
                <p className="font-semibold text-indigo-700 truncate">
                  {primaryDevice.activeApp || "Idle / Desktop"}
                </p>
              </div>
            </div>

            {/* Footer Control Bar: Location metadata & Action Links */}
            <div className="pt-4 mt-auto border-t border-slate-100 flex flex-col gap-3">
              <div className="flex justify-between items-center w-full">
                <span className="truncate pr-4 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                  📍 {primaryDevice.location}
                </span>
              </div>

              <div className="flex justify-between items-center w-full pt-1">
                {/* Secondary Actions (Historical & Admin) */}
                <div className="flex gap-2.5 items-center">
                  <Link
                    href={`/dashboard/${employee.id}/history`}
                    className="text-slate-500 hover:text-indigo-600 font-semibold text-xs transition-colors flex items-center"
                  >
                    History
                  </Link>
                  <span className="text-slate-300">•</span>
                  <Link
                    href={`/dashboard/${employee.id}/captures`}
                    className="text-slate-500 hover:text-indigo-600 font-semibold text-xs transition-colors flex items-center"
                  >
                    Captures
                  </Link>
                  <span className="text-slate-300">•</span>
                  {/* 🚀 Restored Rework Button */}
                  <button
                    onClick={() => handleDeleteEmployee(employee.id , employee.name || "Unknown Employee")}
                    className="text-amber-600 hover:text-amber-700 font-semibold text-xs transition-colors flex items-center gap-1"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Rework
                  </button>
                </div>

                {/* Primary Action (Live) */}
                <Link
                  href={`/dashboard/${employee.id}`}
                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 font-bold text-xs px-3 py-1.5 rounded-md transition-all flex items-center gap-1"
                >
                  Live <span className="text-current opacity-70">→</span>
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
