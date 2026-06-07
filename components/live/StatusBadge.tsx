import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  isActive: boolean;
  className?: string; // Allows us to pass extra margins or padding if needed
}

export default function StatusBadge({ isActive, className }: StatusBadgeProps) {
  return (
    <div
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-2 border transition-colors w-fit",
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-100 text-slate-600 border-slate-200",
        className,
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400",
        )}
      ></span>
      {isActive ? "Online" : "Offline"}
    </div>
  );
}
