import React from "react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const norm = (status || "").toLowerCase().trim();

  let styles = "bg-[#ece5da] text-[#20352b] border-[#20352b]/10";

  if (["available", "confirmed", "paid", "ready", "completed", "active", "approved"].includes(norm)) {
    styles = "bg-[#e2edd8] text-[#2c4e25] border-[#2c4e25]/20";
  } else if (["pending", "new", "preparing", "unread"].includes(norm)) {
    styles = "bg-[#faedd8] text-[#7d4e12] border-[#7d4e12]/20";
  } else if (["cancelled", "failed", "unavailable", "inactive", "refunded"].includes(norm)) {
    styles = "bg-[#fce5e5] text-[#8c2525] border-[#8c2525]/20";
  } else if (["read", "replied"].includes(norm)) {
    styles = "bg-[#e5eef7] text-[#1c4870] border-[#1c4870]/20";
  }

  const label = norm.charAt(0).toUpperCase() + norm.slice(1);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border font-mono ${styles} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {label}
    </span>
  );
}
