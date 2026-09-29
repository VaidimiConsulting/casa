import React from "react";
import { LucideIcon, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: string;
  highlight?: boolean;
  onClick?: () => void;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  highlight = false,
  onClick,
}: StatCardProps) {
  const isClickable = Boolean(onClick);

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden text-left ${
        isClickable
          ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg active:translate-y-0 select-none"
          : ""
      } ${
        highlight
          ? "bg-[#20352b] text-white border-[#20352b] shadow-md shadow-[#20352b]/15 hover:border-[#f6d79e]"
          : "bg-white text-[#1a2f23] border-[#20352b]/15 shadow-sm hover:border-[#20352b]/30 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={`text-xs uppercase tracking-widest font-mono font-bold ${
              highlight ? "text-[#f6d79e]" : "text-[#50574d]"
            }`}
          >
            {title}
          </p>
          <h3 className={`text-3xl font-serif font-bold mt-2 mb-1 tracking-tight ${highlight ? "text-white" : "text-[#1a2f23]"}`}>
            {value}
          </h3>
          {subtitle && (
            <p className={`text-xs font-normal ${highlight ? "text-white/85" : "text-[#50574d]"}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-center transition-transform duration-300 shrink-0 ${
            isClickable ? "group-hover:scale-110" : ""
          } ${
            highlight
              ? "bg-white/10 text-[#f6d79e] border border-white/15"
              : "bg-[#f5f0e8] text-[#1a2f23] border border-[#20352b]/15 group-hover:bg-[#efe7db]"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#20352b]/10 flex items-center justify-between text-xs">
        {trend ? (
          <span className="font-semibold">{trend}</span>
        ) : (
          <span className={`text-[11px] font-mono font-medium ${highlight ? "text-[#f6d79e]" : "text-[#50574d]"}`}>
            Casa Nest Live
          </span>
        )}
        {isClickable && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold transition-all ${
              highlight
                ? "text-[#f6d79e] group-hover:text-white"
                : "text-[#1a2f23] group-hover:text-[#9e6d27]"
            }`}
          >
            <span>View Details</span>
            <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        )}
      </div>
    </div>
  );
}
