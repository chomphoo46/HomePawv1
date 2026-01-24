"use client";

interface TabButtonProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  activeColor: string; // เช่น "text-blue-600 border-blue-500 ..."
  hoverColor: string;  // เช่น "hover:text-blue-600 hover:bg-blue-50"
}

export default function TabButton({ label, count, isActive, onClick, activeColor, hoverColor }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-4 px-6 text-center font-semibold rounded-t-2xl transition-all duration-200 flex justify-center items-center gap-2 ${
        isActive
          ? `${activeColor} shadow-lg border-t-2`
          : `text-gray-500 ${hoverColor}`
      }`}
    >
      <span>{label}</span>
      <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
        {count}
      </span>
    </button>
  );
}