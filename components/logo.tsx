import { Dumbbell } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-white shadow-sm">
        <Dumbbell size={18} />
      </div>
      {!compact && (
        <div>
          <p className="text-[15px] font-bold leading-tight text-slate-900">Akademia Sportive</p>
          <p className="text-[11px] text-slate-400">Platforma e menaxhimit</p>
        </div>
      )}
    </div>
  );
}
