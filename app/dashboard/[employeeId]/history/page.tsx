"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// Quick TypeScript interfaces for the new data
interface ActivityLog {
  id: string;
  appName: string;
  timestamp: string;
}

interface Session {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationMin: number | null;
  activities: ActivityLog[];
}

export default function EmployeeHistoryView() {
  const { employeeId } = useParams();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000"}/api/stats/employees/${employeeId}/history`,
        );
        const json = await res.json();
        if (json.success) {
          setSessions(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [employeeId]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-indigo-600 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Work History & Logs
            </h1>
            <p className="text-sm text-slate-500">
              Review past sessions and application usage timelines.
            </p>
          </div>
        </div>

        {/* Toggle between Live View and History View */}
        <Link
          href={`/dashboard/${employeeId}`}
          className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
        >
          Switch to Live View
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-10 animate-pulse">
          Loading history logs...
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center bg-white border border-slate-200 rounded-xl py-16 text-slate-500">
          No work history found for this device yet.
        </div>
      ) : (
        <div className="space-y-6">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
            >
              Session Header (Clock In / Out)
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {new Date(session.startedAt).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 font-mono">
                    {new Date(session.startedAt).toLocaleTimeString()} —{" "}
                    {session.endedAt
                      ? new Date(session.endedAt).toLocaleTimeString()
                      : "Current (Live)"}
                  </p>
                </div>
                <div className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg text-sm font-bold">
                  {session.durationMin
                    ? `${session.durationMin} mins logged`
                    : "Session Active"}
                </div>
              </div>

              {/* Activity Timeline (The Apps they used) */}
              <div className="p-4 bg-white">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4 pl-2">
                  Application Timeline
                </h4>
                {session.activities.length === 0 ? (
                  <p className="text-sm text-slate-500 pl-2">
                    No specific application switches recorded.
                  </p>
                ) : (
                  <div className="space-y-3 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {session.activities.map((log) => (
                      <div
                        key={log.id}
                        className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                      >
                        {/* Timeline Dot */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        </div>
                        {/* Data Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-sm flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-700 truncate pr-4">
                            {log.appName}
                          </span>
                          <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
