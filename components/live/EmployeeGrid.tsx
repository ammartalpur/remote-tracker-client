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
        // Assume one primary hardware client device per employee structure for the overview grid
        const primaryDevice = employee.devices[0];
        if (!primaryDevice) return null;

        return (
          <div
            key={employee.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:border-indigo-300 flex flex-col justify-between"
          >
            <div>
              {/* Header: Name, Hostname, OS Badge, and Status Beacon */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">
                    {employee.name || "Unassigned Employee"}
                  </h3>

                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-xs text-slate-500 font-mono">
                      {primaryDevice.hostname}
                    </p>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                      {primaryDevice.os}
                    </span>
                  </div>
                </div>

                <StatusBadge isActive={primaryDevice.isActive} />
              </div>

              {/* Active Software Window Telemetry Indicator */}
              <div className="mb-5 text-sm bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/50">
                <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                  Current Focus
                </span>
                <p className="font-medium text-indigo-700 truncate mt-0.5">
                  {primaryDevice.activeApp || "Idle / Desktop"}
                </p>
              </div>
            </div>

            {/* Footer Control Bar: Location metadata & Action Links */}
            <div className="text-sm text-slate-600 flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 mt-auto">
              <span className="truncate pr-4 text-xs font-medium">
                📍 {primaryDevice.location}
              </span>
              <div className="flex gap-4 items-center shrink-0">
                <Link
                  href={`/dashboard/${employee.id}/history`}
                  className="text-slate-500 hover:text-indigo-600 font-semibold text-xs transition-colors"
                >
                  History
                </Link>
                <Link
                  href={`/dashboard/${employee.id}`}
                  className="text-indigo-600 font-bold text-xs hover:text-indigo-800 transition-colors"
                >
                  View Live →
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
