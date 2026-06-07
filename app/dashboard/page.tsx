import EmployeeGrid from "@/components/live/EmployeeGrid";

export default function DashboardHome() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Live Team Overview
        </h1>
        <p className="text-slate-500">
          Monitor active connections and select an employee to view telemetry.
        </p>
      </div>

      {/* Inject the real-time client component */}
      <EmployeeGrid />
    </div>
  );
}
