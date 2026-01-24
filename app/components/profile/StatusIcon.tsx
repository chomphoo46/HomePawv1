import { JSX } from "react";

interface StatusIconProps {
  config?: {
    label: string;
    icon: JSX.Element;
  };
}

export default function StatusIcon({ config }: StatusIconProps) {
  return (
    <div className="flex items-center gap-1.5 truncate min-w-0">
      <span className="shrink-0">{config?.icon}</span>
      <span className="truncate">{config?.label || "ไม่ระบุ"}</span>
    </div>
  );
}